import { supabase } from '../lib/supabase';

const TABLA_PRECIOS = 'rpi_precios_proveedor';
const TABLA_SOLICITUDES = 'rpi_solicitudes_precio';

export async function rpiListarPreciosProveedor() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLA_PRECIOS)
    .select('*, rpi_proveedores(nombre, razon_social), rpi_catalogo_tecnico(producto, categoria, linea)')
    .order('fecha_precio', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function rpiBuscarPrecioPorProducto(producto) {
  if (!supabase) return [];
  if (!producto || !String(producto).trim()) return [];

  const q = String(producto).trim();

  const { data, error } = await supabase
    .from(TABLA_PRECIOS)
    .select('*, rpi_proveedores(nombre, razon_social), rpi_catalogo_tecnico(producto, categoria, linea)')
    .ilike('producto', `%${q}%`)
    .order('fecha_precio', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function rpiCrearSolicitudPrecio(solicitud) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const payload = {
    proveedor_id: solicitud.proveedor_id || null,
    catalogo_id: solicitud.catalogo_id || null,
    producto: solicitud.producto,
    descripcion_necesidad: solicitud.descripcion_necesidad || '',
    cantidad_requerida: solicitud.cantidad_requerida || null,
    unidad: solicitud.unidad || '',
    solicitado_por: solicitud.solicitado_por || '',
    estado: solicitud.estado || 'pendiente',
    prioridad: solicitud.prioridad || 'normal',
    respuesta: solicitud.respuesta || ''
  };

  const { data, error } = await supabase
    .from(TABLA_SOLICITUDES)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rpiListarSolicitudesPrecio(estado = 'pendiente') {
  if (!supabase) return [];

  let query = supabase
    .from(TABLA_SOLICITUDES)
    .select('*, rpi_proveedores(nombre, razon_social), rpi_catalogo_tecnico(producto, categoria, linea)')
    .order('creado_en', { ascending: false });

  if (estado && estado !== 'todas') {
    query = query.eq('estado', estado);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
