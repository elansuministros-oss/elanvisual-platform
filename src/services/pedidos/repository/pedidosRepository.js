import { supabase } from '../../../lib/supabase';
import { mapPedidoToDb } from '../pedidosMapper';

const TABLA_PEDIDOS = 'pedidos_elanvisual';

export async function listarPedidosElanvisualDb() {
  if (!supabase) return { ok: false, data: [], error: 'Supabase no disponible' };

  const { data, error } = await supabase
    .from(TABLA_PEDIDOS)
    .select('*')
    .eq('unidad_negocio', 'ELANVISUAL')
    .order('creado_en', { ascending: false });

  if (error) return { ok: false, data: [], error };

  return { ok: true, data: data || [], error: null };
}

export async function insertarPedidoElanvisualDb(pedido) {
  if (!supabase) return { ok: false, data: null, error: 'Supabase no disponible' };

  const { data, error } = await supabase
    .from(TABLA_PEDIDOS)
    .insert(mapPedidoToDb(pedido))
    .select('*')
    .single();

  if (error) return { ok: false, data: null, error };

  return { ok: true, data, error: null };
}

export async function actualizarPedidoElanvisualDb(pedido) {
  if (!supabase) return { ok: false, error: 'Supabase no disponible' };

  const { error } = await supabase
    .from(TABLA_PEDIDOS)
    .update(mapPedidoToDb(pedido))
    .eq('id', pedido.id);

  if (error) return { ok: false, error };

  return { ok: true, error: null };
}

export async function eliminarPedidoElanvisualDb(id) {
  if (!supabase) return { ok: false, error: 'Supabase no disponible' };

  const { error } = await supabase
    .from(TABLA_PEDIDOS)
    .delete()
    .eq('id', id);

  if (error) return { ok: false, error };

  return { ok: true, error: null };
}
