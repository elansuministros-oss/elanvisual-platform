import { crearMovimientoIngresoPedido } from './movimientosService';
import { crearReciboCaja } from './recibosService';

export function construirTesoreriaDesdePagoPedido({ pedido = {}, pago = {}, usuario = {} } = {}) {
  const movimiento = crearMovimientoIngresoPedido({ pedido, pago, usuario });
  const recibo = crearReciboCaja({ pedido, pago, movimiento, usuario });

  return {
    movimiento,
    recibo,
    patchPedido: {
      ultimoMovimientoCaja: movimiento,
      ultimoReciboCaja: recibo,
      tesoreria: {
        ...(pedido.tesoreria || {}),
        movimientos: [...(pedido.tesoreria?.movimientos || []), movimiento],
        recibos: [...(pedido.tesoreria?.recibos || []), recibo],
        actualizadoEn: new Date().toISOString(),
      },
    },
  };
}
