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

export async function listarItemsEMC({ busqueda = "", proveedorId = "", limite = 300 } = {}) {
  if (!supabase) throw new Error("Supabase no configurado");

  let query = supabase
    .from(EMC_TABLES.items)
    .select(`
      *,
      categoria:elankav_catalogo_categorias(*),
      subcategoria:elankav_catalogo_subcategorias(*),
      marca:elankav_catalogo_marcas(*),
      unidad:elankav_catalogo_unidades(*)
    `)
    .order("nombre", { ascending: true })
    .limit(limite);

  if (busqueda.trim()) {
    query = query.or(`nombre.ilike.%${busqueda.trim()}%,codigo.ilike.%${busqueda.trim()}%`);
  }

  const { data: items, error } = await query;
  if (error) throw error;

  const itemIds = (items || []).map((i) => i.id);

  let precios = [];
  if (itemIds.length) {
    let preciosQuery = supabase
      .from(EMC_TABLES.proveedorItems)
      .select(`
        *,
        proveedor:elankav_catalogo_proveedores(*)
      `)
      .in("item_id", itemIds);

    if (proveedorId) {
      preciosQuery = preciosQuery.eq("proveedor_id", proveedorId);
    }

    const { data, error: preciosError } = await preciosQuery;
    if (!preciosError) precios = data || [];
  }

  return (items || []).map((item) => {
    const preciosItem = precios.filter((p) => p.item_id === item.id);
    const precioActual = preciosItem[0] || null;

    return {
      ...item,
      categoria_nombre: item.categoria?.nombre || "Sin categoría",
      subcategoria_nombre: item.subcategoria?.nombre || "Sin subcategoría",
      marca_nombre: item.marca?.nombre || "Sin marca",
      unidad_nombre: item.unidad?.nombre || "Unidad",
      precio_actual: precioActual?.precio ?? null,
      moneda_actual: precioActual?.moneda || "",
      proveedor_nombre: precioActual?.proveedor?.nombre || "Sin proveedor",
      proveedor_id: precioActual?.proveedor_id || null,
      precios_proveedor: preciosItem,
    };
  });
}

export async function guardarImportacionEMC({ proveedor, items = [], resultado = null, notas = "" }) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná un proveedor antes de guardar en EMC.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No hay productos detectados para guardar.");
  }

  const res = await fetch(`${CORE_URL}/api/elan-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "guardar-emc",
      proveedor,
      items,
      resultado,
      notas,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || json?.mensaje || "No se pudo guardar en EMC.");
  }

  return json;
}
