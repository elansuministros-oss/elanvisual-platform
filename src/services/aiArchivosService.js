import {
  indexFileConnect,
  listFilesConnect,
  moveFileConnect,
  organizeFilesConnect,
  renameFileConnect,
  uploadFileConnect,
} from "../modules/connect/services/fileConnectClient.js";
import { isConnectUnavailableError } from "../modules/connect/services/connectCoreClient.js";

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
  if (!proyectoId) throw new Error("proyectoId requerido.");
  if (!file) throw new Error("Archivo requerido.");

  const datosRuta = construirRutaStorageAI({ proyectoId, file });
  const estadoProcesamiento = estadoInicialArchivoAI(file);

  try {
    const data = await uploadFileConnect({
      file,
      library: AI_ARCHIVOS_BUCKET,
      projectId: proyectoId,
      messageId: mensajeId,
      userId: usuarioId,
      folder: `proyectos/${proyectoId}/${datosRuta.tipoArchivo}`,
      metadata: {
        ruta_storage: datosRuta.rutaStorage,
        tipo_archivo: datosRuta.tipoArchivo,
        extension: datosRuta.extension,
        estado_procesamiento: estadoProcesamiento,
        origen: "AIStudio",
      },
    });

    return {
      ...data,
      proyecto_id: data?.proyecto_id || data?.projectId || proyectoId,
      mensaje_id: data?.mensaje_id || data?.messageId || mensajeId || null,
      usuario_id: data?.usuario_id || data?.userId || usuarioId || null,
      nombre_original: data?.nombre_original || data?.name || file.name,
      nombre_storage: data?.nombre_storage || data?.storageName || datosRuta.nombreStorage,
      bucket: data?.bucket || AI_ARCHIVOS_BUCKET,
      ruta_storage: data?.ruta_storage || data?.storage_path || data?.path || datosRuta.rutaStorage,
      url_publica: data?.url_publica || data?.public_url || data?.publicUrl || data?.url || null,
      mime_type: data?.mime_type || data?.mimeType || file.type || null,
      extension: data?.extension || datosRuta.extension || null,
      tamano_bytes: data?.tamano_bytes || data?.sizeBytes || file.size || null,
      tipo_archivo: data?.tipo_archivo || datosRuta.tipoArchivo,
      estado_procesamiento: data?.estado_procesamiento || estadoProcesamiento,
    };
  } catch (error) {
    if (!isConnectUnavailableError(error)) throw error;
  }

  if (!supabase) throw new Error("Supabase no disponible.");

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

  try {
    const data = await listFilesConnect({
      library: AI_ARCHIVOS_BUCKET,
      projectId: proyectoId,
    });
    if (Array.isArray(data)) return data;
  } catch (error) {
    if (!isConnectUnavailableError(error)) throw error;
  }

  const { data, error } = await supabase
    .from("archivos_ai")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function moverArchivoAI({ archivoId, folder, path }) {
  return moveFileConnect(archivoId, { folder, path });
}

export async function renombrarArchivoAI({ archivoId, nombre }) {
  return renameFileConnect(archivoId, nombre);
}

export async function organizarArchivosAI({ operaciones = [] } = {}) {
  return organizeFilesConnect({ library: AI_ARCHIVOS_BUCKET, operations: operaciones });
}

export async function indexarArchivoAI({ archivoId, metadata = {} }) {
  return indexFileConnect(archivoId, metadata);
}
