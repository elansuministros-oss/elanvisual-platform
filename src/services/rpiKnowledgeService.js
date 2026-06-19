import { supabase } from '../lib/supabase';

const TABLA_CATALOGO = 'rpi_catalogo_tecnico';

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function contiene(item, busqueda) {
  const q = normalizar(busqueda);

  const texto = normalizar([
    item.categoria,
    item.linea,
    item.producto,
    item.descripcion,
    item.materiales,
    item.uso_recomendado,
    item.aplicaciones,
    item.observaciones,
    item.rpi_proveedores?.nombre,
    item.rpi_proveedores?.razon_social
  ].filter(Boolean).join(' '));

  return texto.includes(q);
}

export async function rpiBuscarConocimiento(termino) {
  if (!supabase) return [];
  if (!termino || !String(termino).trim()) return [];

  const { data, error } = await supabase
    .from(TABLA_CATALOGO)
    .select('*, rpi_proveedores(*)')
    .eq('estado', 'activo')
    .order('categoria', { ascending: true });

  if (error) throw error;

  return (data || []).filter((item) => contiene(item, termino));
}

export async function rpiBuscarProveedorPorProducto(producto) {
  return rpiBuscarConocimiento(producto);
}

export async function rpiBuscarProveedorPorCategoria(categoria) {
  return rpiBuscarConocimiento(categoria);
}

export async function rpiBuscarProveedorPorMaterial(material) {
  return rpiBuscarConocimiento(material);
}

export async function rpiSugerirProveedorParaNecesidad(necesidad) {
  const resultados = await rpiBuscarConocimiento(necesidad);

  return resultados.map((item) => ({
    proveedor: item.rpi_proveedores?.nombre || 'Proveedor no asignado',
    razon_social: item.rpi_proveedores?.razon_social || '',
    producto: item.producto,
    categoria: item.categoria,
    linea: item.linea,
    descripcion: item.descripcion,
    uso_recomendado: item.uso_recomendado,
    aplicaciones: item.aplicaciones,
    tiene_precio: item.tiene_precio,
    observaciones: item.observaciones
  }));
}
