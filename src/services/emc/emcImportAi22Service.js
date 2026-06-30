import { supabase } from "../../lib/supabase";

const CORE_URL =
  import.meta.env.VITE_ELANKAV_CORE_URL || "https://elankav-core.vercel.app";

const EMC_STORAGE_BUCKET =
  import.meta.env.VITE_EMC_STORAGE_BUCKET || "emc-importaciones";

function limpiarNombreArchivo(nombre = "archivo") {
  return String(nombre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function crearStoragePath({ proveedor, archivo, index = 0 }) {
  const proveedorId = proveedor?.id || "sin-proveedor";
  const fecha = new Date().toISOString().slice(0, 10);
  const timestamp = Date.now();
  const nombre = limpiarNombreArchivo(archivo?.name || `archivo-${index + 1}`);

  return `emc/ai22/${proveedorId}/${fecha}/${timestamp}-${index}-${nombre}`;
}

async function subirArchivoAI22({ proveedor, archivo, index }) {
  if (!supabase) {
    throw new Error("Supabase no configurado.");
  }

  const storagePath = crearStoragePath({ proveedor, archivo, index });

  const { error } = await supabase.storage
    .from(EMC_STORAGE_BUCKET)
    .upload(storagePath, archivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: archivo.type || "application/octet-stream",
    });

  if (error) {
    throw new Error(`No se pudo subir ${archivo.name}: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(EMC_STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    nombre: archivo.name || `archivo-${index + 1}`,
    name: archivo.name || `archivo-${index + 1}`,
    mime: archivo.type || "",
    type: archivo.type || "",
    size: archivo.size || 0,
    bucket: EMC_STORAGE_BUCKET,
    storage_path: storagePath,
    storagePath,
    public_url: data?.publicUrl || null,
  };
}

export async function subirArchivosEMCAI22({ proveedor, archivos = [] }) {
  const lista = Array.from(archivos || []).filter(Boolean);

  if (!proveedor?.id) {
    throw new Error("Seleccioná un proveedor antes de importar.");
  }

  if (!lista.length) {
    throw new Error("Seleccioná al menos un archivo.");
  }

  const subidos = [];

  for (let index = 0; index < lista.length; index += 1) {
    const archivoSubido = await subirArchivoAI22({
      proveedor,
      archivo: lista[index],
      index,
    });

    subidos.push(archivoSubido);
  }

  return subidos;
}

export async function importarEMCAI22({
  proveedor,
  archivos = [],
  guardarAutomatico = false,
} = {}) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná un proveedor corporativo.");
  }

  const archivosSubidos = await subirArchivosEMCAI22({
    proveedor,
    archivos,
  });

  const payload = {
    proveedor: {
      id: proveedor.id,
      nombre: proveedor.nombre || proveedor.name || proveedor.razonSocial || "",
      razonSocial: proveedor.razonSocial || "",
      ruc: proveedor.ruc || "",
      categoria: proveedor.categoria || "",
      subcategorias: proveedor.subcategorias || "",
      whatsapp: proveedor.whatsapp || "",
      correo: proveedor.correo || "",
    },
    archivos: archivosSubidos,
    guardar_automatico: Boolean(guardarAutomatico),
  };

  const res = await fetch(`${CORE_URL.replace(/\/$/, "")}/api/emc-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!json) {
    throw new Error("CORE respondió sin JSON válido.");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(json.error || json.mensaje || `Error CORE ${res.status}.`);
  }

  return json;
}