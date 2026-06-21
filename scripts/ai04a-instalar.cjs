const fs = require("fs");
const path = require("path");

const root = process.cwd();
const aiStudioPath = path.join(root, "src", "pages", "AIStudio.jsx");
const servicePath = path.join(root, "src", "services", "aiArchivosService.js");
const sqlPath = path.join(root, "sql", "AI-04A_archivos_ai_storage.sql");

if (!fs.existsSync(aiStudioPath)) {
  throw new Error("No existe src/pages/AIStudio.jsx");
}

const currentAIStudio = fs.readFileSync(aiStudioPath, "utf8");

const supabaseImport =
  currentAIStudio.match(/import\s+\{\s*supabase\s*\}\s+from\s+["'][^"']+["'];?/) ||
  currentAIStudio.match(/import\s+supabase\s+from\s+["'][^"']+["'];?/);

if (!supabaseImport) {
  throw new Error("No encontré el import de supabase en AIStudio.jsx. Revisar archivo actual.");
}

const supabaseImportLine = supabaseImport[0];

const sql = `
-- AI-04A — RECEPCIÓN COMPLETA DE ARCHIVOS ELANVISUAL

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-archivos',
  'ai-archivos',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'application/dwg',
    'application/x-dwg',
    'application/dxf',
    'application/x-dxf',
    'image/vnd.dwg',
    'image/vnd.dxf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.archivos_ai (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid null references public.proyectos_ai(id) on delete cascade,
  mensaje_id uuid null references public.mensajes_ai(id) on delete set null,
  usuario_id uuid null,
  nombre_original text not null,
  nombre_storage text not null,
  bucket text not null default 'ai-archivos',
  ruta_storage text not null,
  url_publica text null,
  mime_type text null,
  extension text null,
  tamano_bytes bigint null,
  tipo_archivo text not null default 'referencias',
  estado_procesamiento text not null default 'subido',
  contenido_extraido text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archivos_ai_estado_chk check (
    estado_procesamiento in (
      'subido',
      'procesando',
      'procesado',
      'error',
      'no_soportado_directo'
    )
  ),
  constraint archivos_ai_tipo_chk check (
    tipo_archivo in (
      'imagenes',
      'pdf',
      'documentos',
      'excel',
      'planos',
      'referencias'
    )
  )
);

create index if not exists idx_archivos_ai_proyecto_id on public.archivos_ai(proyecto_id);
create index if not exists idx_archivos_ai_mensaje_id on public.archivos_ai(mensaje_id);
create index if not exists idx_archivos_ai_usuario_id on public.archivos_ai(usuario_id);
create index if not exists idx_archivos_ai_tipo_archivo on public.archivos_ai(tipo_archivo);
create index if not exists idx_archivos_ai_estado on public.archivos_ai(estado_procesamiento);
create index if not exists idx_archivos_ai_created_at on public.archivos_ai(created_at desc);

create or replace function public.set_updated_at_archivos_ai()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_archivos_ai_updated_at on public.archivos_ai;

create trigger trg_archivos_ai_updated_at
before update on public.archivos_ai
for each row
execute function public.set_updated_at_archivos_ai();

alter table public.archivos_ai enable row level security;

drop policy if exists "archivos_ai_select_authenticated" on public.archivos_ai;
drop policy if exists "archivos_ai_insert_authenticated" on public.archivos_ai;
drop policy if exists "archivos_ai_update_authenticated" on public.archivos_ai;
drop policy if exists "archivos_ai_delete_authenticated" on public.archivos_ai;

create policy "archivos_ai_select_authenticated"
on public.archivos_ai
for select
to authenticated
using (true);

create policy "archivos_ai_insert_authenticated"
on public.archivos_ai
for insert
to authenticated
with check (true);

create policy "archivos_ai_update_authenticated"
on public.archivos_ai
for update
to authenticated
using (true)
with check (true);

create policy "archivos_ai_delete_authenticated"
on public.archivos_ai
for delete
to authenticated
using (true);

drop policy if exists "ai_archivos_storage_select_authenticated" on storage.objects;
drop policy if exists "ai_archivos_storage_insert_authenticated" on storage.objects;
drop policy if exists "ai_archivos_storage_update_authenticated" on storage.objects;
drop policy if exists "ai_archivos_storage_delete_authenticated" on storage.objects;

create policy "ai_archivos_storage_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'ai-archivos');

create policy "ai_archivos_storage_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ai-archivos');

create policy "ai_archivos_storage_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'ai-archivos')
with check (bucket_id = 'ai-archivos');

create policy "ai_archivos_storage_delete_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ai-archivos');
`;

const service = `
export const AI_ARCHIVOS_BUCKET = "ai-archivos";

export const EXTENSIONES_AI_SOPORTADAS = [
  "jpg",
  "jpeg",
  "png",
  "svg",
  "pdf",
  "docx",
  "xlsx",
  "dwg",
  "dxf",
];

export function obtenerExtensionArchivo(nombre) {
  if (!nombre || !nombre.includes(".")) return "";
  return nombre.split(".").pop().toLowerCase().trim();
}

export function clasificarArchivoAI(file) {
  const extension = obtenerExtensionArchivo(file.name);
  const mime = file.type || "";

  if (["jpg", "jpeg", "png", "svg"].includes(extension)) return "imagenes";
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "documentos";
  if (extension === "xlsx") return "excel";
  if (["dwg", "dxf"].includes(extension)) return "planos";

  if (mime.startsWith("image/")) return "imagenes";

  return "referencias";
}

export function estadoInicialArchivoAI(file) {
  const extension = obtenerExtensionArchivo(file.name);

  if (!EXTENSIONES_AI_SOPORTADAS.includes(extension)) {
    return "no_soportado_directo";
  }

  if (["dwg", "dxf"].includes(extension)) {
    return "no_soportado_directo";
  }

  return "subido";
}

export function limpiarNombreArchivo(nombre) {
  const extension = obtenerExtensionArchivo(nombre);
  const base = nombre
    .replace(/\\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return extension ? base + "." + extension : base;
}

export function construirRutaStorageAI({ proyectoId, file }) {
  const tipoArchivo = clasificarArchivoAI(file);
  const extension = obtenerExtensionArchivo(file.name);
  const nombreLimpio = limpiarNombreArchivo(file.name);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const nombreStorage = timestamp + "-" + random + "-" + nombreLimpio;

  return {
    tipoArchivo,
    extension,
    nombreStorage,
    rutaStorage:
      "proyectos/" +
      proyectoId +
      "/" +
      tipoArchivo +
      "/" +
      nombreStorage,
  };
}

export async function subirArchivoAI({
  supabase,
  proyectoId,
  mensajeId,
  usuarioId,
  file,
}) {
  if (!supabase) throw new Error("Supabase no disponible.");
  if (!proyectoId) throw new Error("proyectoId requerido.");
  if (!file) throw new Error("Archivo requerido.");

  const datosRuta = construirRutaStorageAI({ proyectoId, file });
  const estadoProcesamiento = estadoInicialArchivoAI(file);

  const upload = await supabase.storage
    .from(AI_ARCHIVOS_BUCKET)
    .upload(datosRuta.rutaStorage, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (upload.error) {
    throw upload.error;
  }

  const publicUrlData = supabase.storage
    .from(AI_ARCHIVOS_BUCKET)
    .getPublicUrl(datosRuta.rutaStorage);

  const urlPublica =
    publicUrlData && publicUrlData.data
      ? publicUrlData.data.publicUrl
      : null;

  const registro = {
    proyecto_id: proyectoId,
    mensaje_id: mensajeId || null,
    usuario_id: usuarioId || null,
    nombre_original: file.name,
    nombre_storage: datosRuta.nombreStorage,
    bucket: AI_ARCHIVOS_BUCKET,
    ruta_storage: datosRuta.rutaStorage,
    url_publica: urlPublica,
    mime_type: file.type || null,
    extension: datosRuta.extension || null,
    tamano_bytes: file.size || null,
    tipo_archivo: datosRuta.tipoArchivo,
    estado_procesamiento: estadoProcesamiento,
    contenido_extraido: null,
    metadata: {
      origen: "AIStudio",
      fase: "AI-04A",
      soporte_directo: estadoProcesamiento !== "no_soportado_directo",
    },
  };

  const insert = await supabase
    .from("archivos_ai")
    .insert(registro)
    .select("*")
    .single();

  if (insert.error) {
    throw insert.error;
  }

  return insert.data;
}

export async function subirArchivosAI({
  supabase,
  proyectoId,
  mensajeId,
  usuarioId,
  files,
}) {
  const archivos = Array.from(files || []);
  const resultados = [];

  for (const file of archivos) {
    const resultado = await subirArchivoAI({
      supabase,
      proyectoId,
      mensajeId,
      usuarioId,
      file,
    });

    resultados.push(resultado);
  }

  return resultados;
}

export async function listarArchivosProyectoAI({ supabase, proyectoId }) {
  if (!proyectoId) return [];

  const { data, error } = await supabase
    .from("archivos_ai")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data || [];
}
`;

const aiStudio = `
import React, { useEffect, useMemo, useRef, useState } from "react";
${supabaseImportLine}
import {
  subirArchivosAI,
  listarArchivosProyectoAI,
  clasificarArchivoAI,
  obtenerExtensionArchivo,
} from "../services/aiArchivosService";

const ESTADOS_ARCHIVO = {
  subido: "Subido",
  procesando: "Procesando",
  procesado: "Procesado",
  error: "Error",
  no_soportado_directo: "Subido / pendiente de conversión",
};

const TIPOS_ARCHIVO = {
  imagenes: "Imagen",
  pdf: "PDF",
  documentos: "Documento",
  excel: "Excel",
  planos: "Plano",
  referencias: "Referencia",
};

function normalizarProyecto(proyecto) {
  return {
    ...proyecto,
    titulo:
      proyecto.titulo ||
      proyecto.nombre ||
      proyecto.nombre_proyecto ||
      "Proyecto AI",
  };
}

function normalizarMensaje(mensaje) {
  return {
    ...mensaje,
    rol: mensaje.rol || mensaje.role || mensaje.tipo || "assistant",
    contenido:
      mensaje.contenido ||
      mensaje.content ||
      mensaje.mensaje ||
      mensaje.texto ||
      "",
  };
}

async function obtenerUsuarioActual() {
  try {
    const { data } = await supabase.auth.getUser();
    return data && data.user ? data.user : null;
  } catch {
    return null;
  }
}

async function insertarMensajeAI({ proyectoId, usuarioId, rol, contenido, metadata }) {
  const payloadCompleto = {
    proyecto_id: proyectoId,
    usuario_id: usuarioId || null,
    rol,
    contenido,
    metadata: metadata || {},
  };

  const intentoCompleto = await supabase
    .from("mensajes_ai")
    .insert(payloadCompleto)
    .select("*")
    .single();

  if (!intentoCompleto.error) return intentoCompleto.data;

  const payloadMinimo = {
    proyecto_id: proyectoId,
    rol,
    contenido,
  };

  const intentoMinimo = await supabase
    .from("mensajes_ai")
    .insert(payloadMinimo)
    .select("*")
    .single();

  if (intentoMinimo.error) throw intentoMinimo.error;

  return intentoMinimo.data;
}

async function crearProyectoAI({ usuarioId }) {
  const titulo = "Proyecto AI " + new Date().toLocaleString("es-NI");

  const payloadCompleto = {
    titulo,
    nombre: titulo,
    usuario_id: usuarioId || null,
    estado: "activo",
    metadata: {
      fase: "AI-04A",
      origen: "AIStudio",
    },
  };

  const intentoCompleto = await supabase
    .from("proyectos_ai")
    .insert(payloadCompleto)
    .select("*")
    .single();

  if (!intentoCompleto.error) return normalizarProyecto(intentoCompleto.data);

  const payloadMinimo = {
    titulo,
  };

  const intentoMinimo = await supabase
    .from("proyectos_ai")
    .insert(payloadMinimo)
    .select("*")
    .single();

  if (intentoMinimo.error) throw intentoMinimo.error;

  return normalizarProyecto(intentoMinimo.data);
}

async function cargarRespuestaCore({ proyecto, mensaje, archivos }) {
  const endpoint =
    import.meta.env.VITE_AI_STUDIO_ENDPOINT ||
    import.meta.env.VITE_ELANKAV_CORE_ENDPOINT ||
    "/api/ai-studio";

  const respuesta = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proyecto_id: proyecto.id,
      mensaje,
      archivos,
      fase: "AI-04A",
    }),
  });

  if (!respuesta.ok) {
    throw new Error("ELANKAV CORE no respondió correctamente.");
  }

  const data = await respuesta.json();

  return (
    data.respuesta ||
    data.message ||
    data.content ||
    data.texto ||
    "Archivo recibido. La capa documental AI-04A quedó registrada para procesamiento posterior."
  );
}

export default function AIStudio() {
  const inputArchivoRef = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [archivosProyecto, setArchivosProyecto] = useState([]);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const archivosPorMensaje = useMemo(() => {
    const mapa = {};

    for (const archivo of archivosProyecto) {
      const key = archivo.mensaje_id || "sin_mensaje";
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(archivo);
    }

    return mapa;
  }, [archivosProyecto]);

  useEffect(() => {
    iniciarAIStudio();
  }, []);

  useEffect(() => {
    if (proyectoActivo) {
      cargarMensajes(proyectoActivo.id);
      cargarArchivos(proyectoActivo.id);
    }
  }, [proyectoActivo]);

  async function iniciarAIStudio() {
    setCargando(true);
    setError("");

    try {
      const user = await obtenerUsuarioActual();
      setUsuario(user);

      const { data, error: errorProyectos } = await supabase
        .from("proyectos_ai")
        .select("*")
        .order("created_at", { ascending: false });

      if (errorProyectos) throw errorProyectos;

      const lista = (data || []).map(normalizarProyecto);
      setProyectos(lista);

      if (lista.length > 0) {
        setProyectoActivo(lista[0]);
      } else {
        const nuevo = await crearProyectoAI({ usuarioId: user ? user.id : null });
        setProyectos([nuevo]);
        setProyectoActivo(nuevo);
      }
    } catch (err) {
      setError(err.message || "Error cargando AI Studio.");
    } finally {
      setCargando(false);
    }
  }

  async function cargarMensajes(proyectoId) {
    try {
      const { data, error: errorMensajes } = await supabase
        .from("mensajes_ai")
        .select("*")
        .eq("proyecto_id", proyectoId)
        .order("created_at", { ascending: true });

      if (errorMensajes) throw errorMensajes;

      setMensajes((data || []).map(normalizarMensaje));
    } catch (err) {
      setError(err.message || "Error cargando mensajes.");
    }
  }

  async function cargarArchivos(proyectoId) {
    try {
      const data = await listarArchivosProyectoAI({
        supabase,
        proyectoId,
      });

      setArchivosProyecto(data);
    } catch (err) {
      setError(err.message || "Error cargando archivos.");
    }
  }

  async function crearNuevoProyecto() {
    setError("");

    try {
      const nuevo = await crearProyectoAI({
        usuarioId: usuario ? usuario.id : null,
      });

      setProyectos((prev) => [nuevo, ...prev]);
      setProyectoActivo(nuevo);
      setMensajes([]);
      setArchivosProyecto([]);
      setArchivosSeleccionados([]);
      setMensaje("");
    } catch (err) {
      setError(err.message || "No se pudo crear el proyecto.");
    }
  }

  function seleccionarArchivos(event) {
    const files = Array.from(event.target.files || []);
    setArchivosSeleccionados((prev) => [...prev, ...files]);

    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }
  }

  function quitarArchivoSeleccionado(index) {
    setArchivosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  }

  async function enviarMensaje() {
    if (!proyectoActivo || enviando) return;

    const texto = mensaje.trim();
    const tieneArchivos = archivosSeleccionados.length > 0;

    if (!texto && !tieneArchivos) return;

    setEnviando(true);
    setError("");

    try {
      const contenidoUsuario =
        texto ||
        "Archivo recibido para análisis posterior en ELAN AI.";

      const mensajeUsuario = await insertarMensajeAI({
        proyectoId: proyectoActivo.id,
        usuarioId: usuario ? usuario.id : null,
        rol: "user",
        contenido: contenidoUsuario,
        metadata: {
          fase: "AI-04A",
          tiene_archivos: tieneArchivos,
          cantidad_archivos: archivosSeleccionados.length,
        },
      });

      let archivosSubidos = [];

      if (tieneArchivos) {
        archivosSubidos = await subirArchivosAI({
          supabase,
          proyectoId: proyectoActivo.id,
          mensajeId: mensajeUsuario.id,
          usuarioId: usuario ? usuario.id : null,
          files: archivosSeleccionados,
        });
      }

      setMensajes((prev) => [
        ...prev,
        normalizarMensaje(mensajeUsuario),
      ]);

      setArchivosProyecto((prev) => [...prev, ...archivosSubidos]);
      setMensaje("");
      setArchivosSeleccionados([]);

      let respuestaCore =
        "Recibido. Los archivos quedaron guardados en Supabase Storage, registrados en archivos_ai y vinculados al proyecto y mensaje. El análisis queda preparado para AI-04B / AI-04C.";

      try {
        respuestaCore = await cargarRespuestaCore({
          proyecto: proyectoActivo,
          mensaje: contenidoUsuario,
          archivos: archivosSubidos,
        });
      } catch {
        respuestaCore =
          "Archivo recibido y trazabilidad AI-04A completada. ELANKAV CORE no respondió en este envío, pero el registro documental quedó guardado.";
      }

      const mensajeAsistente = await insertarMensajeAI({
        proyectoId: proyectoActivo.id,
        usuarioId: usuario ? usuario.id : null,
        rol: "assistant",
        contenido: respuestaCore,
        metadata: {
          fase: "AI-04A",
          respuesta_sistema: true,
        },
      });

      setMensajes((prev) => [
        ...prev,
        normalizarMensaje(mensajeAsistente),
      ]);
    } catch (err) {
      setError(err.message || "Error enviando mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  function renderArchivo(archivo) {
    const tipo = archivo.tipo_archivo || "referencias";
    const estado = archivo.estado_procesamiento || "subido";
    const esImagen = tipo === "imagenes" && archivo.url_publica;

    return (
      <div className="ai-file-card" key={archivo.id}>
        {esImagen ? (
          <img
            src={archivo.url_publica}
            alt={archivo.nombre_original}
            className="ai-file-preview"
          />
        ) : (
          <div className="ai-file-icon">
            {(archivo.extension || "file").toUpperCase()}
          </div>
        )}

        <div className="ai-file-info">
          <strong>{archivo.nombre_original}</strong>
          <span>
            {TIPOS_ARCHIVO[tipo] || "Archivo"} ·{" "}
            {ESTADOS_ARCHIVO[estado] || estado}
          </span>
          {archivo.url_publica && (
            <a href={archivo.url_publica} target="_blank" rel="noreferrer">
              Abrir archivo
            </a>
          )}
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <main className="ai-studio-page">
        <section className="ai-studio-shell">
          <p>Cargando AI Studio...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="ai-studio-page">
      <section className="ai-studio-shell">
        <aside className="ai-studio-sidebar">
          <div className="ai-studio-brand">
            <h1>ELAN AI Studio</h1>
            <p>Base documental AI-04A</p>
          </div>

          <button
            type="button"
            className="ai-primary-button"
            onClick={crearNuevoProyecto}
          >
            Nuevo proyecto AI
          </button>

          <div className="ai-project-list">
            {proyectos.map((proyecto) => (
              <button
                type="button"
                key={proyecto.id}
                className={
                  proyectoActivo && proyectoActivo.id === proyecto.id
                    ? "ai-project-item active"
                    : "ai-project-item"
                }
                onClick={() => setProyectoActivo(proyecto)}
              >
                {proyecto.titulo}
              </button>
            ))}
          </div>
        </aside>

        <section className="ai-chat-panel">
          <header className="ai-chat-header">
            <div>
              <h2>
                {proyectoActivo
                  ? proyectoActivo.titulo
                  : "Proyecto AI"}
              </h2>
              <p>
                Usuario → Archivo → Storage → archivos_ai → mensajes_ai → proyectos_ai
              </p>
            </div>
          </header>

          {error && <div className="ai-error-box">{error}</div>}

          <div className="ai-messages">
            {mensajes.length === 0 && (
              <div className="ai-empty-state">
                <h3>Recepción documental lista</h3>
                <p>
                  Subí imágenes, PDFs, documentos, Excel, DWG o DXF para dejarlos
                  registrados y vinculados al proyecto.
                </p>
              </div>
            )}

            {mensajes.map((item) => {
              const archivosMensaje = archivosPorMensaje[item.id] || [];

              return (
                <article
                  key={item.id}
                  className={
                    item.rol === "user"
                      ? "ai-message user"
                      : "ai-message assistant"
                  }
                >
                  <div className="ai-message-role">
                    {item.rol === "user" ? "Usuario" : "ELANKAV CORE"}
                  </div>

                  <div className="ai-message-content">
                    {item.contenido}
                  </div>

                  {archivosMensaje.length > 0 && (
                    <div className="ai-message-files">
                      {archivosMensaje.map(renderArchivo)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {archivosSeleccionados.length > 0 && (
            <div className="ai-selected-files">
              {archivosSeleccionados.map((file, index) => (
                <div className="ai-selected-file" key={file.name + index}>
                  <div>
                    <strong>{file.name}</strong>
                    <span>
                      {clasificarArchivoAI(file)} ·{" "}
                      {obtenerExtensionArchivo(file).toUpperCase()} ·{" "}
                      {Math.round(file.size / 1024)} KB
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => quitarArchivoSeleccionado(index)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <footer className="ai-composer">
            <input
              ref={inputArchivoRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.svg,.pdf,.docx,.xlsx,.dwg,.dxf"
              onChange={seleccionarArchivos}
              className="ai-file-input"
            />

            <button
              type="button"
              className="ai-secondary-button"
              onClick={() => inputArchivoRef.current?.click()}
            >
              Adjuntar archivo
            </button>

            <textarea
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              placeholder="Escribí una instrucción o subí archivos para el proyecto..."
              rows={2}
            />

            <button
              type="button"
              className="ai-primary-button"
              onClick={enviarMensaje}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </footer>
        </section>
      </section>
    </main>
  );
}
`;

fs.writeFileSync(sqlPath, sql.trim() + "\n", "utf8");
fs.writeFileSync(servicePath, service.trim() + "\n", "utf8");
fs.writeFileSync(aiStudioPath, aiStudio.trim() + "\n", "utf8");

console.log("AI-04A instalado.");
console.log("SQL:", sqlPath);
console.log("Servicio:", servicePath);
console.log("AIStudio:", aiStudioPath);