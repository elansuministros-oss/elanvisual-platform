import { construirFinanzasDesdePedido } from "../../services/finanzas";

const n = (v) => Number(v || 0);

export function normalizarPedidoDesdeDb(row = {}) {
  const dataOriginal = row.data_original || {};
  const pedidoOriginal = dataOriginal.pedido || {};
  const clienteOriginal = pedidoOriginal.cliente || {};

  const total = n(
    row.total ||
    pedidoOriginal.total ||
    pedidoOriginal.resumen?.total ||
    dataOriginal.totalUSDReferencia ||
    0
  );

  const resumen = {
    ...(pedidoOriginal.resumen || {}),
    subtotal: n(row.subtotal || pedidoOriginal.resumen?.subtotal || total),
    descuento: n(row.descuento || pedidoOriginal.resumen?.descuento || 0),
    iva: n(row.iva || pedidoOriginal.resumen?.iva || 0),
    total,
  };

  const pagos = {
    ...(dataOriginal.pagos || pedidoOriginal.pagos || {}),
    historial: Array.isArray(dataOriginal.pagos?.historial)
      ? dataOriginal.pagos.historial
      : Array.isArray(pedidoOriginal.pagos?.historial)
        ? pedidoOriginal.pagos.historial
        : [],
  };

  const pedidoBase = {
    ...pedidoOriginal,
    id: row.id || pedidoOriginal.id,
    numero: row.numero || pedidoOriginal.numero || pedidoOriginal.numeroPedido || "",
    numeroPedido: row.numero || pedidoOriginal.numeroPedido || pedidoOriginal.numero || "",
    numeroOT:
      pedidoOriginal.numeroOT ||
      pedidoOriginal.ordenTrabajo?.codigoOT ||
      `OT-${String(row.id || Date.now()).slice(-6)}`,
    cliente: {
      ...clienteOriginal,
      nombre: row.cliente_nombre || clienteOriginal.nombre || clienteOriginal.empresa || "Cliente",
      empresa: row.cliente_empresa || clienteOriginal.empresa || "",
      telefono: row.cliente_telefono || clienteOriginal.telefono || clienteOriginal.whatsapp || "",
      whatsapp: row.cliente_telefono || clienteOriginal.whatsapp || clienteOriginal.telefono || "",
    },
    items: Array.isArray(row.items) ? row.items : Array.isArray(pedidoOriginal.items) ? pedidoOriginal.items : [],
    resumen,
    total,
    anticipoPorcentaje: n(row.anticipo_porcentaje || pedidoOriginal.anticipoPorcentaje || 60),
    anticipoSolicitado: n(
      dataOriginal.anticipoSolicitado ||
      pedidoOriginal.anticipoSolicitado ||
      total * (n(row.anticipo_porcentaje || pedidoOriginal.anticipoPorcentaje || 60) / 100)
    ),
    pagos,
    estado: row.estado || pedidoOriginal.estado || "cotizacion_guardada",
    estadoProduccion: row.estado_produccion || pedidoOriginal.estadoProduccion || "pendiente",
    seguimientoEstado: row.seguimiento_estado || pedidoOriginal.seguimientoEstado || row.estado || "cotizacion_guardada",
    pagoEstado: row.estado_pago || pedidoOriginal.pagoEstado || "",
    ordenTrabajo: row.orden_trabajo || pedidoOriginal.ordenTrabajo || {},
    historial: Array.isArray(row.historial) ? row.historial : Array.isArray(pedidoOriginal.historial) ? pedidoOriginal.historial : [],
    createdAt: row.creado_en || row.created_at || pedidoOriginal.createdAt || new Date().toISOString(),
    dataOriginal,
  };

  const finanzas = construirFinanzasDesdePedido(pedidoBase);

  return {
    ...pedidoBase,
    pagos: {
      ...pagos,
      historial: finanzas.historialPagos,
      totalUSDReferencia: finanzas.totalUSDReferencia,
      totalCordobas: finanzas.totalCordobas,
      tipoCambioCongelado: finanzas.tipoCambioCongelado,
      pagadoUSD: finanzas.pagadoUSD,
      pagadoCordobas: finanzas.pagadoCordobas,
      saldoUSD: finanzas.saldoUSD,
      saldoCordobas: finanzas.saldoCordobas,
      estadoPago: finanzas.estadoPago,
    },
    finanzas,
    pagoEstado: finanzas.estadoPago,
  };
}

export function normalizarPedidoParaDb(pedido = {}) {
  const cliente = pedido.cliente || {};
  const resumen = pedido.resumen || {};
  const total = n(resumen.total || pedido.total || pedido.finanzas?.totalUSDReferencia || 0);
  const anticipoPorcentaje = n(pedido.anticipoPorcentaje || 60);

  const finanzas = construirFinanzasDesdePedido({
    ...pedido,
    resumen: { ...resumen, total },
    total,
    anticipoPorcentaje,
  });

  const pagos = {
    ...(pedido.pagos || {}),
    historial: finanzas.historialPagos,
    totalUSDReferencia: finanzas.totalUSDReferencia,
    totalCordobas: finanzas.totalCordobas,
    tipoCambioCongelado: finanzas.tipoCambioCongelado,
    pagadoUSD: finanzas.pagadoUSD,
    pagadoCordobas: finanzas.pagadoCordobas,
    saldoUSD: finanzas.saldoUSD,
    saldoCordobas: finanzas.saldoCordobas,
    estadoPago: finanzas.estadoPago,
  };

  return {
    numero: pedido.numero || pedido.numeroPedido || "",
    cliente_nombre: cliente.nombre || cliente.empresa || "",
    cliente_telefono: cliente.telefono || cliente.whatsapp || "",
    cliente_empresa: cliente.empresa || "",
    estado: pedido.estado || "cotizacion_guardada",
    estado_pago: finanzas.estadoPago,
    estado_produccion: pedido.estadoProduccion || "pendiente",
    seguimiento_estado: pedido.seguimientoEstado || pedido.estado || "cotizacion_guardada",
    unidad_negocio: pedido.unidadNegocio || pedido.unidad_negocio || "ELANVISUAL",
    subtotal: n(resumen.subtotal || pedido.subtotal || total),
    descuento: n(resumen.descuento || pedido.descuento || 0),
    iva: n(resumen.iva || pedido.iva || 0),
    total,
    anticipo_porcentaje: anticipoPorcentaje,
    saldo_monto: finanzas.saldoUSD,
    items: Array.isArray(pedido.items) ? pedido.items : [],
    orden_trabajo: pedido.ordenTrabajo || {},
    historial: Array.isArray(pedido.historial) ? pedido.historial : [],
    data_original: {
      ...(pedido.dataOriginal || pedido.data_original || {}),
      pedido: {
        ...pedido,
        resumen: { ...resumen, total },
        total,
        pagos,
        finanzas,
      },
      pagos,
      anticipoSolicitado: finanzas.anticipoRequeridoUSDReferencia,
      actualizado_en: new Date().toISOString(),
    },
    actualizado_en: new Date().toISOString(),
  };
}

export function unirPedidosNuevo(prev = [], remotos = []) {
  const mapa = new Map();

  [...remotos, ...prev].forEach((pedido) => {
    if (!pedido) return;
    const key = String(pedido.id || pedido.numero || pedido.numeroPedido || Date.now());
    if (!mapa.has(key)) mapa.set(key, pedido);
  });

  return Array.from(mapa.values());
}
