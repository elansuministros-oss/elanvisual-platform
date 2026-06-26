import {
  calcularResumenFinancieroPedido,
  construirPagosPedido,
  crearPagoCliente,
  normalizarHistorialPagos,
} from './finanzasPedidoService';

const n = (valor) => Number(valor || 0);
const TC_DEFAULT = 36.8;

export function obtenerHistorialPagosPedido(pedido = {}) {
  return normalizarHistorialPagos(
    pedido?.pagos?.historial ||
      pedido?.dataOriginal?.pagos?.historial ||
      pedido?.data_original?.pagos?.historial ||
      []
  );
}

export function obtenerTipoCambioPedido(pedido = {}) {
  const tc = n(
    pedido?.tipoCambioCongelado ||
      pedido?.pagos?.tipoCambioCongelado ||
      pedido?.dataOriginal?.tipoCambioCongelado ||
      pedido?.data_original?.tipoCambioCongelado ||
      TC_DEFAULT
  );

  return tc > 0 ? tc : TC_DEFAULT;
}

export function obtenerTotalUSDReferenciaPedido(pedido = {}) {
  return n(
    pedido?.totalUSDReferencia ||
      pedido?.pagos?.totalUSDReferencia ||
      pedido?.dataOriginal?.totalUSDReferencia ||
      pedido?.data_original?.totalUSDReferencia ||
      pedido?.resumen?.total ||
      pedido?.total ||
      0
  );
}

export function obtenerTotalCordobasPedido(pedido = {}) {
  const tc = obtenerTipoCambioPedido(pedido);
  const totalUSD = obtenerTotalUSDReferenciaPedido(pedido);

  return n(
    pedido?.totalCordobas ||
      pedido?.pagos?.totalCordobas ||
      pedido?.dataOriginal?.totalCordobas ||
      pedido?.data_original?.totalCordobas ||
      totalUSD * tc
  );
}

export function construirFinanzasDesdePedido(pedido = {}) {
  const tipoCambio = obtenerTipoCambioPedido(pedido);
  const totalUSDReferencia = obtenerTotalUSDReferenciaPedido(pedido);
  const totalCordobas = obtenerTotalCordobasPedido(pedido);
  const historialPagos = obtenerHistorialPagosPedido(pedido);

  return calcularResumenFinancieroPedido({
    totalUSDReferencia,
    totalCordobas,
    tipoCambio,
    anticipoPorcentaje: pedido?.anticipoPorcentaje || 60,
    historialPagos,
  });
}

export function construirActualizacionFinancieraPedido(pedido = {}, nuevoPagoForm = null) {
  const finanzasActuales = construirFinanzasDesdePedido(pedido);
  const historialActual = finanzasActuales.historialPagos || [];

  const nuevoPago = nuevoPagoForm
    ? crearPagoCliente({
        ...nuevoPagoForm,
        tipoCambio: nuevoPagoForm.tipoCambio || finanzasActuales.tipoCambioCongelado,
      })
    : null;

  const historialPagos = nuevoPago ? [...historialActual, nuevoPago] : historialActual;

  const pagos = construirPagosPedido({
    pedido,
    totalUSDReferencia: finanzasActuales.totalUSDReferencia,
    totalCordobas: finanzasActuales.totalCordobas,
    tipoCambio: finanzasActuales.tipoCambioCongelado,
    anticipoPorcentaje: finanzasActuales.anticipoPorcentaje,
    historialPagos,
  });

  const finanzas = calcularResumenFinancieroPedido({
    totalUSDReferencia: finanzasActuales.totalUSDReferencia,
    totalCordobas: finanzasActuales.totalCordobas,
    tipoCambio: finanzasActuales.tipoCambioCongelado,
    anticipoPorcentaje: finanzasActuales.anticipoPorcentaje,
    historialPagos,
  });

  return {
    nuevoPago,
    finanzas,
    patchPedido: {
      totalCordobas: pagos.totalCordobas,
      totalUSDReferencia: pagos.totalUSDReferencia,
      tipoCambioCongelado: pagos.tipoCambioCongelado,

      anticipoRequeridoCordobas: pagos.anticipoRequeridoCordobas,
      anticipoRequeridoUSDReferencia: pagos.anticipoRequeridoUSDReferencia,
      saldoContraEntregaCordobas: pagos.saldoContraEntregaCordobas,

      pagos,
      ultimoPago: nuevoPago,

      // Compatibilidad legacy, siempre derivada del historial real.
      anticipoRecibido: pagos.pagadoUSD,
      saldoPendiente: pagos.saldoUSD,
      pagoEstado: pagos.estadoPago,
    },
  };
}

export function construirDataOriginalFinanciera(pedido = {}, patchPedido = {}) {
  const dataOriginalAnterior = pedido.dataOriginal || pedido.data_original || {};

  const pedidoActualizado = {
    ...pedido,
    ...patchPedido,
    pagos: patchPedido.pagos || pedido.pagos || {},
  };

  return {
    ...dataOriginalAnterior,
    pedido: pedidoActualizado,
    pagos: pedidoActualizado.pagos,
    ultimoPago: patchPedido.ultimoPago || pedido.ultimoPago || null,
    tipoCambioCongelado: pedidoActualizado.tipoCambioCongelado || null,
    totalCordobas: pedidoActualizado.totalCordobas || 0,
    totalUSDReferencia: pedidoActualizado.totalUSDReferencia || 0,
    anticipoRequeridoCordobas: pedidoActualizado.anticipoRequeridoCordobas || 0,
    anticipoRequeridoUSDReferencia: pedidoActualizado.anticipoRequeridoUSDReferencia || 0,
    saldoContraEntregaCordobas: pedidoActualizado.saldoContraEntregaCordobas || 0,
    saldoReal: pedidoActualizado.saldoPendiente || 0,
    saldoRealCordobas: pedidoActualizado.pagos?.saldoCordobas || 0,
    actualizado_en: new Date().toISOString(),
  };
}
