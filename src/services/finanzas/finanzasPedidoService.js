const TC_DEFAULT = 36.8;

export const n = (valor) => Number(valor || 0);

export function normalizarMoneda(moneda) {
  const valor = String(moneda || '').trim().toUpperCase();

  if (valor === 'USD' || valor === '$') return 'USD';
  if (valor === 'NIO' || valor === 'C$' || valor === 'CORDOBAS' || valor === 'CÓRDOBAS') return 'C$';

  return valor || 'C$';
}

export function normalizarTipoCambio(tipoCambio) {
  const tc = n(tipoCambio);
  return tc > 0 ? tc : TC_DEFAULT;
}

export function convertirPago({ monedaOriginal = 'C$', montoOriginal = 0, tipoCambio = TC_DEFAULT } = {}) {
  const moneda = normalizarMoneda(monedaOriginal);
  const monto = n(montoOriginal);
  const tc = normalizarTipoCambio(tipoCambio);

  if (moneda === 'USD') {
    return {
      monedaOriginal: 'USD',
      montoOriginal: monto,
      tipoCambio: tc,
      montoUSD: monto,
      montoCordobas: monto * tc,
    };
  }

  return {
    monedaOriginal: 'C$',
    montoOriginal: monto,
    tipoCambio: tc,
    montoUSD: tc > 0 ? monto / tc : 0,
    montoCordobas: monto,
  };
}

export function crearPagoCliente({
  monedaOriginal = 'C$',
  montoOriginal = 0,
  tipoCambio = TC_DEFAULT,
  formaPago = 'Transferencia',
  banco = '',
  referencia = '',
  fechaDeposito = '',
  observaciones = '',
  recibo = '',
} = {}) {
  const convertido = convertirPago({ monedaOriginal, montoOriginal, tipoCambio });

  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `pago-${Date.now()}`,
    recibo: recibo || `RC-${Date.now()}`,
    fechaDeposito: fechaDeposito || new Date().toISOString().slice(0, 10),
    fechaRegistro: new Date().toISOString(),

    monedaOriginal: convertido.monedaOriginal,
    montoOriginal: convertido.montoOriginal,
    tipoCambio: convertido.tipoCambio,
    montoCordobas: convertido.montoCordobas,
    montoUSD: convertido.montoUSD,

    formaPago,
    banco,
    referencia,
    observaciones,
  };
}

export function normalizarPagoCliente(pago = {}, tipoCambioFallback = TC_DEFAULT) {
  const convertido = convertirPago({
    monedaOriginal: pago.monedaOriginal || pago.moneda || 'C$',
    montoOriginal: pago.montoOriginal ?? pago.monto ?? 0,
    tipoCambio: pago.tipoCambio || tipoCambioFallback,
  });

  return {
    ...pago,
    id: pago.id || `pago-${Date.now()}`,
    recibo: pago.recibo || '',
    fechaDeposito: pago.fechaDeposito || pago.fecha || '',
    fechaRegistro: pago.fechaRegistro || pago.registradoEn || '',

    monedaOriginal: convertido.monedaOriginal,
    montoOriginal: convertido.montoOriginal,
    tipoCambio: convertido.tipoCambio,
    montoCordobas: n(pago.montoCordobas ?? convertido.montoCordobas),
    montoUSD: n(pago.montoUSD ?? convertido.montoUSD),

    formaPago: pago.formaPago || pago.forma || '',
    banco: pago.banco || '',
    referencia: pago.referencia || '',
    observaciones: pago.observaciones || '',
  };
}

export function normalizarHistorialPagos(historial = [], tipoCambioFallback = TC_DEFAULT) {
  return Array.isArray(historial)
    ? historial.map((pago) => normalizarPagoCliente(pago, tipoCambioFallback))
    : [];
}

export function calcularResumenFinancieroPedido({
  totalUSDReferencia = 0,
  totalCordobas = 0,
  tipoCambio = TC_DEFAULT,
  anticipoPorcentaje = 60,
  historialPagos = [],
} = {}) {
  const tc = normalizarTipoCambio(tipoCambio);
  const totalUSD = n(totalUSDReferencia || (totalCordobas ? totalCordobas / tc : 0));
  const totalC$ = n(totalCordobas || totalUSD * tc);
  const porcentaje = n(anticipoPorcentaje || 60);

  const historial = normalizarHistorialPagos(historialPagos, tc);

  const pagadoUSD = historial.reduce((acc, pago) => acc + n(pago.montoUSD), 0);
  const pagadoCordobas = historial.reduce((acc, pago) => acc + n(pago.montoCordobas), 0);

  const anticipoRequeridoUSDReferencia = totalUSD * (porcentaje / 100);
  const anticipoRequeridoCordobas = totalC$ * (porcentaje / 100);

  const saldoUSD = Math.max(totalUSD - pagadoUSD, 0);
  const saldoCordobas = Math.max(totalC$ - pagadoCordobas, 0);

  return {
    totalUSDReferencia: totalUSD,
    totalCordobas: totalC$,
    tipoCambioCongelado: tc,

    anticipoPorcentaje: porcentaje,
    anticipoRequeridoUSDReferencia,
    anticipoRequeridoCordobas,
    saldoContraEntregaCordobas: Math.max(totalC$ - anticipoRequeridoCordobas, 0),

    historialPagos: historial,
    pagadoUSD,
    pagadoCordobas,
    pagadoRealUSD: pagadoUSD,
    pagadoRealCordobas: pagadoCordobas,

    saldoUSD,
    saldoCordobas,
    saldoRealUSD: saldoUSD,
    saldoRealCordobas: saldoCordobas,

    estadoPago:
      saldoUSD <= 0 && totalUSD > 0
        ? 'Pagado'
        : pagadoUSD > 0
          ? 'Pago parcial'
          : 'Pendiente',
  };
}

export function construirPagosPedido({
  pedido = {},
  totalUSDReferencia = 0,
  totalCordobas = 0,
  tipoCambio = TC_DEFAULT,
  anticipoPorcentaje = 60,
  historialPagos = [],
} = {}) {
  const resumen = calcularResumenFinancieroPedido({
    totalUSDReferencia,
    totalCordobas,
    tipoCambio,
    anticipoPorcentaje,
    historialPagos,
  });

  return {
    ...(pedido.pagos || {}),
    historial: resumen.historialPagos,

    totalUSDReferencia: resumen.totalUSDReferencia,
    totalCordobas: resumen.totalCordobas,
    tipoCambioCongelado: resumen.tipoCambioCongelado,

    pagadoUSD: resumen.pagadoUSD,
    pagadoCordobas: resumen.pagadoCordobas,
    pagadoRealUSD: resumen.pagadoRealUSD,
    pagadoRealCordobas: resumen.pagadoRealCordobas,

    saldoUSD: resumen.saldoUSD,
    saldoCordobas: resumen.saldoCordobas,
    saldoRealUSD: resumen.saldoRealUSD,
    saldoRealCordobas: resumen.saldoRealCordobas,

    anticipoRequeridoUSDReferencia: resumen.anticipoRequeridoUSDReferencia,
    anticipoRequeridoCordobas: resumen.anticipoRequeridoCordobas,
    saldoContraEntregaCordobas: resumen.saldoContraEntregaCordobas,

    estadoPago: resumen.estadoPago,
    actualizadoEn: new Date().toISOString(),
  };
}
