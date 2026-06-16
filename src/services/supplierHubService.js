import { supabase } from '../lib/supabase';

const EMPRESAS = 'elankav_supplier_empresas';
const CONTACTOS = 'elankav_supplier_contactos_unidad';
const CAPACIDADES = 'elankav_supplier_capacidades';
const PRODUCTOS = 'elankav_supplier_productos_servicios';

export async function obtenerProveedores() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(EMPRESAS)
    .select('*')
    .order('nombre_comercial');

  if (error) {
    console.error('Supplier Hub proveedores error:', error);
    return [];
  }

  return data || [];
}

export async function crearProveedor(datos) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { data, error } = await supabase
    .from(EMPRESAS)
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarProveedor(id, datos) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { data, error } = await supabase
    .from(EMPRESAS)
    .update(datos)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function obtenerContactosProveedor(proveedorId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(CONTACTOS)
    .select('*')
    .eq('proveedor_id', proveedorId);

  if (error) {
    console.error('Supplier Hub contactos error:', error);
    return [];
  }

  return data || [];
}

export async function obtenerCapacidadesProveedor(proveedorId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(CAPACIDADES)
    .select('*')
    .eq('proveedor_id', proveedorId);

  if (error) {
    console.error('Supplier Hub capacidades error:', error);
    return [];
  }

  return data || [];
}

export async function obtenerProductosProveedor(proveedorId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(PRODUCTOS)
    .select('*')
    .eq('proveedor_id', proveedorId);

  if (error) {
    console.error('Supplier Hub productos error:', error);
    return [];
  }

  return data || [];
}
