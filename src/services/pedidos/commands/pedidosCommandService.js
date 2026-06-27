import { mapPedidoFromDb } from '../pedidosMapper';
import {
  insertarPedidoElanvisualDb,
  actualizarPedidoElanvisualDb,
  eliminarPedidoElanvisualDb,
} from '../repository/pedidosRepository';

export async function insertarPedidoElanvisual(pedido) {
  const result = await insertarPedidoElanvisualDb(pedido);

  if (!result.ok) {
    return { ok: false, pedido: null, error: result.error };
  }

  return {
    ok: true,
    pedido: mapPedidoFromDb(result.data),
    error: null,
  };
}

export async function actualizarPedidoElanvisual(pedido) {
  return actualizarPedidoElanvisualDb(pedido);
}

export async function eliminarPedidoElanvisual(id) {
  return eliminarPedidoElanvisualDb(id);
}
