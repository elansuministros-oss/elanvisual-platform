const n = (valor) => Number(valor || 0);

export function crearIdMovimiento(prefix = 'MOV') {
  return `${prefix}-${Date.now()}`;
}

export function normalizarMovimientoCaja(movimiento = {}) {
  const tipo = movimiento.tipo || 'Ingreso';
  const montoCordobas = n(movimiento.montoCordobas ?? movimiento.monto ?? 0);
  const montoUSD = n(movimiento.montoUSD ?? 0);

  return {
    id: movimiento.id || crearIdMovimiento('MOV'),
    tipo,
    origen: movimiento.origen || 'Manual',
    unidadNegocio: movimiento.unidadNegocio || 'ELANVISUAL',

    pedidoId: movimiento.pedidoId || '',
    pedidoNumero: movimiento.pedidoNumero || '',
    ordenTrabajo: movimiento.ordenTrabajo || '',
    cliente: movimiento.cliente || '',

    recibo: movimiento.recibo || '',
    concepto: movimiento.concepto || '',
    monedaOriginal: movimiento.monedaOriginal || 'C$',
    montoOriginal: n(movimiento.montoOriginal ?? movimiento.monto ?? 0),
    tipoCambio: n(movimiento.tipoCambio || 36.8),
    montoCordobas,
    montoUSD,

    formaPago: movimiento.formaPago || '',
    banco: movimiento.banco || '',
    cuenta: movimiento.cuenta || '',
    referencia: movimiento.referencia || '',

    fechaMovimiento: movimiento.fechaMovimiento || movimiento.fechaDeposito || new Date().toISOString().slice(0, 10),
    fechaRegistro: movimiento.fechaRegistro || new Date().toISOString(),
    usuarioId: movimiento.usuarioId || '',
    usuarioNombre: movimiento.usuarioNombre || '',

    estado: movimiento.estado || 'Confirmado',
    observaciones: movimiento.observaciones || '',
  };
}

export function crearMovimientoIngresoPedido({ pedido = {}, pago = {}, usuario = {} } = {}) {
  const cliente = pedido.cliente?.empresa || pedido.cliente?.nombre || pedido.clienteNombre || '';

  return normalizarMovimientoCaja({
    tipo: 'Ingreso',
    origen: 'Pedido',
    unidadNegocio: pedido.unidadNegocio || 'ELANVISUAL',

    pedidoId: pedido.id || '',
    pedidoNumero: pedido.numero || pedido.numeroPedido || '',
    ordenTrabajo: pedido.ordenTrabajo?.codigoOT || pedido.numeroOT || '',
    cliente,

    recibo: pago.recibo || '',
    concepto: `Pago cliente ${cliente}`.trim(),
    monedaOriginal: pago.monedaOriginal || pago.moneda || 'C$',
    montoOriginal: pago.montoOriginal ?? pago.monto ?? 0,
    tipoCambio: pago.tipoCambio || pedido.tipoCambioCongelado || pedido.pagos?.tipoCambioCongelado || 36.8,
    montoCordobas: pago.montoCordobas ?? pago.montoNIO ?? 0,
    montoUSD: pago.montoUSD ?? 0,

    formaPago: pago.formaPago || pago.forma || '',
    banco: pago.banco || '',
    cuenta: pago.cuenta || '',
    referencia: pago.referencia || '',

    fechaMovimiento: pago.fechaDeposito || pago.fecha || new Date().toISOString().slice(0, 10),
    fechaRegistro: pago.fechaRegistro || new Date().toISOString(),
    usuarioId: usuario.id || '',
    usuarioNombre: usuario.nombre || usuario.usuario || usuario.email || '',

    estado: 'Confirmado',
    observaciones: pago.observaciones || '',
  });
}
