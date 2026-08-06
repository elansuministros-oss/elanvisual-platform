import { supabase } from '../../../lib/supabase';
import {
  createOrderConnect,
  deleteOrderConnect,
  listOrdersConnect,
  updateOrderConnect,
} from '../../../modules/connect/services/operationsConnectClient.js';
import { isConnectUnavailableError } from '../../../modules/connect/services/connectCoreClient.js';
import { mapPedidoToDb } from '../pedidosMapper';

const TABLA_PEDIDOS = 'pedidos_elanvisual';

export async function listarPedidosElanvisualDb() {
  try {
    const data = await listOrdersConnect();
    return { ok: true, data: data || [], error: null, source: 'connect' };
  } catch (error) {
    if (!isConnectUnavailableError(error)) return { ok: false, data: [], error };
  }

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
  try {
    const data = await createOrderConnect(pedido);
    return { ok: true, data, error: null, source: 'connect' };
  } catch (error) {
    if (!isConnectUnavailableError(error)) return { ok: false, data: null, error };
  }

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
  try {
    await updateOrderConnect(pedido.id, pedido);
    return { ok: true, error: null, source: 'connect' };
  } catch (error) {
    if (!isConnectUnavailableError(error)) return { ok: false, error };
  }

  if (!supabase) return { ok: false, error: 'Supabase no disponible' };

  const { error } = await supabase
    .from(TABLA_PEDIDOS)
    .update(mapPedidoToDb(pedido))
    .eq('id', pedido.id);

  if (error) return { ok: false, error };

  return { ok: true, error: null };
}

export async function eliminarPedidoElanvisualDb(id) {
  try {
    await deleteOrderConnect(id);
    return { ok: true, error: null, source: 'connect' };
  } catch (error) {
    if (!isConnectUnavailableError(error)) return { ok: false, error };
  }

  if (!supabase) return { ok: false, error: 'Supabase no disponible' };

  const { error } = await supabase
    .from(TABLA_PEDIDOS)
    .delete()
    .eq('id', id);

  if (error) return { ok: false, error };

  return { ok: true, error: null };
}
