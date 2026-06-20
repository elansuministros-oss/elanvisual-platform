import { supabase } from '../lib/supabase';

const TABLA_FUENTES = 'rpi_fuentes_conocimiento';
const TABLA_CATALOGO = 'rpi_catalogo_tecnico';

export async function rpiListarFuentes() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLA_FUENTES)
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function rpiCrearFuente(fuente) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { data, error } = await supabase
    .from(TABLA_FUENTES)
    .insert([fuente])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rpiProductosPorFuente(fuenteId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLA_CATALOGO)
    .select('*')
    .eq('fuente_id', fuenteId)
    .order('producto', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function rpiAsignarFuente(productoId, fuenteId) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { data, error } = await supabase
    .from(TABLA_CATALOGO)
    .update({ fuente_id: fuenteId })
    .eq('id', productoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
