const n = (v) => Number(v || 0);

export const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n(v));

export const getTotalOT = (pedido) => n(pedido?.resumen?.total || pedido?.total);

export const getPagadoOT = (pedido) => {
  const historial = Array.isArray(pedido?.pagos?.historial)
    ? pedido.pagos.historial
    : [];

  return historial.reduce(
    (total, pago) => total + n(pago.montoUSD || pago.monto || 0),
    0
  );
};

export const getSaldoOT = (pedido) => Math.max(getTotalOT(pedido) - getPagadoOT(pedido), 0);

export const getCodigoOT = (pedido) =>
  pedido?.numeroOT ||
  pedido?.ordenTrabajo?.codigoOT ||
  `OT-${String(pedido?.id || '').slice(-6)}`;

export const getNumeroPedido = (pedido) =>
  pedido?.numeroPedido || pedido?.numero || `PED-${String(pedido?.id || '').slice(-6)}`;

export const getClienteOT = (pedido) =>
  pedido?.cliente?.empresa ||
  pedido?.cliente?.nombre ||
  pedido?.cliente?.contacto ||
  'Cliente sin nombre';

export const getProyectoOT = (pedido) =>
  pedido?.proyecto?.nombre ||
  pedido?.proyecto?.tipo ||
  pedido?.proyecto?.lugar ||
  pedido?.descripcion ||
  'Proyecto sin descripción';

export const getFechaOT = (pedido) =>
  pedido?.fecha ||
  pedido?.created_at ||
  pedido?.fechaCreacion ||
  pedido?.ordenTrabajo?.fecha ||
  '';

export function construirResumenOT(pedido) {
  const total = getTotalOT(pedido);
  const pagado = getPagadoOT(pedido);
  const saldo = getSaldoOT(pedido);

  return {
    codigoOT: getCodigoOT(pedido),
    numeroPedido: getNumeroPedido(pedido),
    cliente: getClienteOT(pedido),
    proyecto: getProyectoOT(pedido),
    estado: pedido?.estado || 'Sin estado',
    fecha: getFechaOT(pedido),
    total,
    pagado,
    saldo,
    porcentajePagado: total > 0 ? Math.min((pagado / total) * 100, 100) : 0,
  };
}
