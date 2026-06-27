import { supabase } from '../../lib/supabase';
import { mapPedidoFromDb, mapPedidoToDb } from './pedidosMapper';

export async function cargarPedidosElanvisual() {
  if (!supabase) return { ok: false, pedidos: [], error: 'Supabase no disponible' };

  const { data, error } = await supabase
    .from('pedidos_elanvisual')
    .select('*')
    .eq('unidad_negocio', 'ELANVISUAL')
    .order('creado_en', { ascending: false });

  if (error) return { ok: false, pedidos: [], error };

  return {
    ok: true,
    pedidos: (data || []).map(mapPedidoFromDb),
    error: null,
  };
}

export async function insertarPedidoElanvisual(pedido) {
  if (!supabase) return { ok: false, pedido: null, error: 'Supabase no disponible' };

  const { data, error } = await supabase
    .from('pedidos_elanvisual')
    .insert(mapPedidoToDb(pedido))
    .select('*')
    .single();

  if (error) return { ok: false, pedido: null, error };

  return { ok: true, pedido: mapPedidoFromDb(data), error: null };
}

export async function actualizarPedidoElanvisual(pedido) {
  if (!supabase) return { ok: false, error: 'Supabase no disponible' };

  const { error } = await supabase
    .from('pedidos_elanvisual')
    .update(mapPedidoToDb(pedido))
    .eq('id', pedido.id);

  if (error) return { ok: false, error };

  return { ok: true, error: null };
}

export async function eliminarPedidoElanvisual(id) {
  if (!supabase) return { ok: false, error: 'Supabase no disponible' };

  const { error } = await supabase
    .from('pedidos_elanvisual')
    .delete()
    .eq('id', id);

  if (error) return { ok: false, error };

  return { ok: true, error: null };
}
