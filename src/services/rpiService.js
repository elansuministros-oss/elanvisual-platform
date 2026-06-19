import { supabase } from '../lib/supabase';

const TABLA_PROVEEDORES = 'rpi_proveedores';
const TABLA_CATALOGO = 'rpi_catalogo_tecnico';
const TABLA_DOCUMENTOS = 'rpi_documentos_proveedor';

export async function rpiListarProveedores() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLA_PROVEEDORES)
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function rpiListarCatalogoTecnico() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLA_CATALOGO)
    .select('*, rpi_proveedores(nombre, razon_social)')
    .order('categoria', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function rpiCrearProveedor(proveedor) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const { data, error } = await supabase
    .from(TABLA_PROVEEDORES)
    .insert([proveedor])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rpiCrearCatalogoTecnico(items) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  if (!Array.isArray(items) || items.length === 0) return [];

  const { data, error } = await supabase
    .from(TABLA_CATALOGO)
    .insert(items)
    .select();

  if (error) throw error;
  return data || [];
}

export async function rpiCrearDocumento(documento) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const { data, error } = await supabase
    .from(TABLA_DOCUMENTOS)
    .insert([documento])
    .select()
    .single();

  if (error) throw error;
  return data;
}
