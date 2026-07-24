import { supabase } from "../../lib/supabase";
import { subirArchivosEMCStorage } from "./emcService.js";

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

  return `emc/${proveedorId}/${fecha}/${timestamp}-${index}-${nombre}`;
}

async function subirArchivoEMC({ proveedor, archivo, index }) {
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
    originalFilename: archivo.name || `archivo-${index + 1}`,
    mime: archivo.type || "",
    mimetype: archivo.type || "",
    size: archivo.size || 0,
    bucket: EMC_STORAGE_BUCKET,
    storage_path: storagePath,
    public_url: data?.publicUrl || null,
  };
}

export async function analizarImportacionEMC({
  proveedor,
  tipoProveedor = "materiales",
  modo = "catalogo_mas_lista",
  archivos = [],
  catalogoArchivo = null,
  listaPrecioArchivo = null,
  imagenes = [],
  notas = "",
}) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná primero un proveedor corporativo del Supplier Hub.");
  }

  const archivosFinales = [
    ...archivos,
    catalogoArchivo,
    listaPrecioArchivo,
    ...imagenes,
  ].filter(Boolean);

  if (!archivosFinales.length) {
    throw new Error("Subí al menos un archivo PDF, Excel, CSV, TXT o imagen.");
  }

  const archivosSubidos = await subirArchivosEMCStorage({
    proveedor,
    archivos: archivosFinales,
  });

  const payload = {
    tipo: "importar-emc",
    unidad: "ELANVISUAL",
    modo_importacion: modo,
    tipo_proveedor: tipoProveedor,
    notas: notas || "",
    origen_archivo: "supabase-storage",
    proveedor: {
      id: proveedor.id,
      nombre: proveedor.nombre || "",
      razonSocial: proveedor.razonSocial || "",
      ruc: proveedor.ruc || "",
      categoria: proveedor.categoria || "",
      subcategorias: proveedor.subcategorias || "",
      whatsapp: proveedor.whatsapp || "",
      correo: proveedor.correo || "",
    },
    archivos: archivosSubidos,
  };

  const res = await fetch(`${CORE_URL.replace(/\/$/, "")}/api/elan-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!json) {
    throw new Error("CORE respondió sin JSON válido.");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.mensaje ||
        json.error ||
        `No se pudo analizar la importación EMC. HTTP ${res.status}`
    );
  }

  return json;
}

export const importarEMC = analizarImportacionEMC;
export const procesarImportacionEMC = analizarImportacionEMC;
export const importarCatalogoEMC = analizarImportacionEMC;
