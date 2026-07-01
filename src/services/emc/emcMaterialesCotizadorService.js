import { supabase } from "../../lib/supabase";

const TABLE = "elankav_catalogo_proveedor_items";

function n(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function texto(value, fallback = "") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

export async function listarMaterialesCotizadorDesdeEMC({ limite = 1000 } = {}) {
  if (!supabase) {
    throw new Error("Supabase no configurado.");
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("activo", true)
    .order("nombre_catalogo", { ascending: true })
    .limit(limite);

  if (error) {
    throw new Error(`No se pudo cargar Catálogo EMC: ${error.message}`);
  }

  return (Array.isArray(data) ? data : []).map((item) => {
    const precio = n(item.precio_lista || item.costo_unitario);

    return {
      id: item.id,
      nombre: texto(item.nombre_catalogo, "Material EMC"),
      categoria: texto(item.presentacion || item.estado_informacion, "EMC"),
      descripcion: texto(item.observaciones || item.nombre_catalogo, ""),
      unidad: texto(item.presentacion, "unidad"),

      costo_real: precio,
      costo: precio,
      precio,
      precio_unitario: precio,
      costo_unitario: precio,
      costo_m2: precio,

      proveedor_id: item.proveedor_id,
      codigo_catalogo: item.codigo_catalogo,
      origen: "EMC",
      activo: item.activo !== false,
      raw: item,
    };
  });
}
