import { supabase } from "../../lib/supabase";

export const EMC_TABLES = {
  categorias: "elankav_catalogo_categorias",
  subcategorias: "elankav_catalogo_subcategorias",
  marcas: "elankav_catalogo_marcas",
  unidades: "elankav_catalogo_unidades",
  items: "elankav_catalogo_items",
  multimedia: "elankav_catalogo_multimedia",
  listasPrecio: "elankav_catalogo_listas_precio",
  proveedorItems: "elankav_catalogo_proveedor_items",
  proveedores: "elankav_catalogo_proveedores",
};

const CORE_URL =
  import.meta.env.VITE_ELANKAV_CORE_URL || "https://elankav-core.vercel.app";

const EMC_STORAGE_BUCKET =
  import.meta.env.VITE_EMC_STORAGE_BUCKET || "emc-importaciones";

function limpiarNombreArchivo(nombre = "archivo.pdf") {
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
  const nombre = limpiarNombreArchivo(archivo?.name || `archivo-${index}.pdf`);

  return `emc/${proveedorId}/${fecha}/${timestamp}-${index}-${nombre}`;
}

async function postCore(payload) {
  const res = await fetch(`${CORE_URL}/api/elan-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.ok === false) {
    throw new Error(
      json?.error ||
        json?.mensaje ||
        `Error CORE ${res.status}: no se pudo completar la operación EMC.`
    );
  }

  return json;
}

export async function obtenerResumenEMC() {
  if (!supabase) throw new Error("Supabase no configurado");

  const consultas = await Promise.allSettled([
    supabase.from(EMC_TABLES.categorias).select("id", { count: "exact", head: true }),
    supabase.from(EMC_TABLES.subcategorias).select("id", { count: "exact", head: true }),
    supabase.from(EMC_TABLES.marcas).select("id", { count: "exact", head: true }),
    supabase.from(EMC_TABLES.unidades).select("id", { count: "exact", head: true }),
    supabase.from(EMC_TABLES.items).select("id", { count: "exact", head: true }),
    supabase.from(EMC_TABLES.multimedia).select("id", { count: "exact", head: true }),
    supabase.from(EMC_TABLES.listasPrecio).select("id", { count: "exact", head: true }),
  ]);

  const count = (i) => consultas[i]?.value?.count || 0;

  return {
    categorias: count(0),
    subcategorias: count(1),
    marcas: count(2),
    unidades: count(3),
    items: count(4),
    multimedia: count(5),
    listasPrecio: count(6),
  };
}

function mapearPorId(lista = []) {
  return Object.fromEntries((lista || []).map((item) => [String(item.id), item]));
}

export async function listarItemsEMC({ busqueda = "", proveedorId = "", limite = 300 } = {}) {
  if (!supabase) throw new Error("Supabase no configurado");

  let query = supabase
    .from(EMC_TABLES.items)
    .select("*")
    .order("nombre", { ascending: true })
    .limit(limite);

  if (busqueda.trim()) {
    query = query.or(`nombre.ilike.%${busqueda.trim()}%,codigo.ilike.%${busqueda.trim()}%`);
  }

  const { data: items, error } = await query;
  if (error) throw error;

  const ids = (campo) => [...new Set((items || []).map((i) => i[campo]).filter(Boolean))];

  const categoriaIds = ids("categoria_id");
  const subcategoriaIds = ids("subcategoria_id");
  const marcaIds = ids("marca_id");
  const unidadIds = ids("unidad_id");
  const itemIds = ids("id");

  const [categoriasRes, subcategoriasRes, marcasRes, unidadesRes] = await Promise.all([
    categoriaIds.length ? supabase.from(EMC_TABLES.categorias).select("*").in("id", categoriaIds) : { data: [] },
    subcategoriaIds.length ? supabase.from(EMC_TABLES.subcategorias).select("*").in("id", subcategoriaIds) : { data: [] },
    marcaIds.length ? supabase.from(EMC_TABLES.marcas).select("*").in("id", marcaIds) : { data: [] },
    unidadIds.length ? supabase.from(EMC_TABLES.unidades).select("*").in("id", unidadIds) : { data: [] },
  ]);

  const categorias = mapearPorId(categoriasRes.data || []);
  const subcategorias = mapearPorId(subcategoriasRes.data || []);
  const marcas = mapearPorId(marcasRes.data || []);
  const unidades = mapearPorId(unidadesRes.data || []);

  let precios = [];

  if (itemIds.length) {
    let preciosQuery = supabase
      .from(EMC_TABLES.proveedorItems)
      .select("*")
      .in("item_id", itemIds);

    if (proveedorId) {
      preciosQuery = preciosQuery.eq("proveedor_id", proveedorId);
    }

    const { data, error: preciosError } = await preciosQuery;
    if (!preciosError) precios = data || [];
  }

  return (items || []).map((item) => {
    const preciosItem = precios.filter((p) => String(p.item_id) === String(item.id));
    const precioActual = preciosItem[0] || null;

    return {
      ...item,
      categoria_nombre: categorias[String(item.categoria_id)]?.nombre || "Sin categoría",
      subcategoria_nombre: subcategorias[String(item.subcategoria_id)]?.nombre || "Sin subcategoría",
      marca_nombre: marcas[String(item.marca_id)]?.nombre || "Sin marca",
      unidad_nombre: unidades[String(item.unidad_id)]?.nombre || "Unidad",
      precio_actual: precioActual?.precio ?? null,
      moneda_actual: precioActual?.moneda || "",
      proveedor_nombre: precioActual?.proveedor_id || "Sin proveedor",
      proveedor_id: precioActual?.proveedor_id || null,
      precios_proveedor: preciosItem,
    };
  });
}

export async function subirArchivosEMCStorage({ proveedor, archivos = [] }) {
  if (!supabase) throw new Error("Supabase no configurado");

  const lista = Array.from(archivos || []).filter(Boolean);

  if (!lista.length) {
    throw new Error("Seleccioná al menos un archivo para importar.");
  }

  const subidos = [];

  for (let index = 0; index < lista.length; index += 1) {
    const archivo = lista[index];
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

    const { data: publicData } = supabase.storage
      .from(EMC_STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    subidos.push({
      nombre: archivo.name,
      mime: archivo.type || "",
      size: archivo.size || 0,
      bucket: EMC_STORAGE_BUCKET,
      storage_path: storagePath,
      public_url: publicData?.publicUrl || null,
    });
  }

  return subidos;
}

export async function importarEMC({
  proveedor,
  archivos = [],
  unidad = "ELANVISUAL",
  modo_importacion = "catalogo_mas_lista",
  tipo_proveedor = "materiales",
  notas = "",
} = {}) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná un proveedor antes de importar.");
  }

  const archivosSubidos = await subirArchivosEMCStorage({ proveedor, archivos });

  return await postCore({
    tipo: "importar-emc",
    unidad,
    modo_importacion,
    tipo_proveedor,
    notas,
    proveedor,
    archivos: archivosSubidos,
    origen_archivo: "supabase-storage",
  });
}

export async function crearJobImportacionEMC({
  proveedor,
  archivos = [],
  unidad = "ELANVISUAL",
  modo_importacion = "catalogo_mas_lista",
  tipo_proveedor = "materiales",
  notas = "",
} = {}) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná un proveedor antes de crear el Job EMC.");
  }

  const archivosSubidos = await subirArchivosEMCStorage({ proveedor, archivos });

  return await postCore({
    tipo: "crear-job-emc",
    unidad,
    modo_importacion,
    tipo_proveedor,
    notas,
    proveedor,
    archivos: archivosSubidos,
    origen_archivo: "supabase-storage",
  });
}

export async function obtenerEstadoJobEMC(jobId) {
  if (!jobId) throw new Error("Falta job_id.");

  return await postCore({
    tipo: "estado-job-emc",
    job_id: jobId,
  });
}

export async function guardarImportacionEMC({ proveedor, items = [], resultado = null, notas = "" }) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná un proveedor antes de guardar en EMC.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No hay productos detectados para guardar.");
  }

  const json = await postCore({
    tipo: "guardar-emc",
    proveedor,
    items,
    resultado,
    notas,
  });

  if (json?.ok === false) {
    const primerError = Array.isArray(json?.errores) && json.errores.length
      ? json.errores[0]
      : null;

    const detalle = primerError
      ? `${primerError.item || "Item"}: ${primerError.error || "Error sin detalle"}`
      : json?.error || json?.mensaje || "No se pudo guardar en EMC.";

    throw new Error(detalle);
  }

  return json;
}

export const procesarImportacionEMC = importarEMC;
export const importarCatalogoEMC = importarEMC;
export const crearJobEMC = crearJobImportacionEMC;
export const estadoJobEMC = obtenerEstadoJobEMC;