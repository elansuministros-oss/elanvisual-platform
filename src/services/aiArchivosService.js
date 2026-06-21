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
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
