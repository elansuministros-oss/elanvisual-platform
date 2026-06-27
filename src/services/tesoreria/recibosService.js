export function generarNumeroRecibo(prefix = 'RC') {
  return `${prefix}-${String(Date.now()).slice(-8)}`;
}

export function crearReciboCaja({ pedido = {}, pago = {}, movimiento = {}, usuario = {} } = {}) {
  const numero = pago.recibo || movimiento.recibo || generarNumeroRecibo();

  return {
    id: `recibo-${Date.now()}`,
    numero,
    tipo: 'Recibo de Caja',
    origen: 'Pedido',
    unidadNegocio: pedido.unidadNegocio || 'ELANVISUAL',

    pedidoId: pedido.id || '',
    pedidoNumero: pedido.numero || pedido.numeroPedido || '',
    ordenTrabajo: pedido.ordenTrabajo?.codigoOT || pedido.numeroOT || '',
    cliente: pedido.cliente?.empresa || pedido.cliente?.nombre || pedido.clienteNombre || '',

    monedaOriginal: pago.monedaOriginal || pago.moneda || 'C$',
    montoOriginal: Number(pago.montoOriginal ?? pago.monto ?? 0),
    tipoCambio: Number(pago.tipoCambio || pedido.tipoCambioCongelado || 36.8),
    montoCordobas: Number(pago.montoCordobas ?? pago.montoNIO ?? 0),
    montoUSD: Number(pago.montoUSD || 0),

    formaPago: pago.formaPago || pago.forma || '',
    banco: pago.banco || '',
    cuenta: pago.cuenta || '',
    referencia: pago.referencia || '',
    fechaDeposito: pago.fechaDeposito || pago.fecha || '',
    fechaRegistro: new Date().toISOString(),

    usuarioId: usuario.id || '',
    usuarioNombre: usuario.nombre || usuario.usuario || usuario.email || '',

    estado: 'Emitido',
    observaciones: pago.observaciones || '',
  };
}
