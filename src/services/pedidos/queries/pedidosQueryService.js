import { mapPedidoFromDb } from '../pedidosMapper';
import { listarPedidosElanvisualDb } from '../repository/pedidosRepository';

export async function cargarPedidosElanvisual() {
  const result = await listarPedidosElanvisualDb();

  if (!result.ok) {
    return { ok: false, pedidos: [], error: result.error };
  }

  return {
    ok: true,
    pedidos: (result.data || []).map(mapPedidoFromDb),
    error: null,
  };
}
