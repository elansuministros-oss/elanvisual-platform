import { construirFinanzasDesdePedido } from '../finanzas';

export function mapPedidoFromDb(row) {
  const dataOriginal = row.data_original || {};
  const form = dataOriginal.form || {};
  const resumenOriginal = dataOriginal.total || {};
  const total = Number(row.total || resumenOriginal.totalCliente || 0);
  const anticipoPorcentaje = Number(row.anticipo_porcentaje || form.p1 || 60);
  const tipoCambioBase = Number(
    dataOriginal.tipoCambioCongelado ||
      dataOriginal.pagos?.tipoCambioCongelado ||
      dataOriginal.pedido?.tipoCambioCongelado ||
      36.8
  );

  const historialPagosBase = Array.isArray(dataOriginal.pagos?.historial)
    ? dataOriginal.pagos.historial
    : Array.isArray(dataOriginal.pedido?.pagos?.historial)
      ? dataOriginal.pedido.pagos.historial
      : [];

  const cliente = {
    nombre: row.cliente_nombre || form.cliente || '',
    empresa: row.cliente_empresa || form.empresa || '',
    telefono: row.cliente_telefono || form.whatsapp || '',
    whatsapp: row.cliente_telefono || form.whatsapp || '',
    correo: row.cliente_correo || form.correo || '',
    direccion: row.cliente_direccion || form.direccion || '',
    ciudad: row.ciudad || form.ciudad || '',
  };

  const resumen = {
    subtotal: Number(row.subtotal || resumenOriginal.subtotal || 0),
    descuentoPorcentaje: 0,
    descuentoMonto: Number(row.descuento || resumenOriginal.descuento || 0),
    total,
    comision: 0,
  };

  const pagosBase = dataOriginal.pagos || dataOriginal.pedido?.pagos || {};

  const basePedido = {
    ...(dataOriginal.pedido || {}),
    resumen,
    total,
    totalUSDReferencia: dataOriginal.totalUSDReferencia || pagosBase.totalUSDReferencia || total,
    totalCordobas: dataOriginal.totalCordobas || pagosBase.totalCordobas || 0,
    tipoCambioCongelado: tipoCambioBase,
    anticipoPorcentaje,
    pagos: {
      ...pagosBase,
      historial: historialPagosBase,
    },
    dataOriginal,
  };

  const finanzas = construirFinanzasDesdePedido(basePedido);

  return {
    id: row.id || row.numero || `pedido-${Date.now()}`,
    numero: row.numero || '',
    codigoSeguimiento: row.numero || '',
    cliente,
    origenComercial: null,
    vendedor: null,
    veterinaria: null,
    items: Array.isArray(row.items) ? row.items : [],
    origenComercialId: '',
    vendedorId: '',
    veterinariaId: '',
    origenComercialCodigo: '',
    vendedorCodigo: '',
    veterinariaCodigo: '',
    resumen,
    pagoTipo: 'anticipo',
    anticipoPorcentaje,

    totalCordobas: finanzas.totalCordobas,
    totalUSDReferencia: finanzas.totalUSDReferencia,
    tipoCambioCongelado: finanzas.tipoCambioCongelado,

    anticipoRequerido: finanzas.anticipoRequeridoUSDReferencia,
    anticipoRequeridoCordobas: finanzas.anticipoRequeridoCordobas,
    anticipoRequeridoUSDReferencia: finanzas.anticipoRequeridoUSDReferencia,
    montoSolicitado: finanzas.anticipoRequeridoUSDReferencia,
    saldoContraEntregaCordobas: finanzas.saldoContraEntregaCordobas,

    pagos: {
      ...pagosBase,
      historial: finanzas.historialPagos,
      totalCordobas: finanzas.totalCordobas,
      totalUSDReferencia: finanzas.totalUSDReferencia,
      tipoCambioCongelado: finanzas.tipoCambioCongelado,
      pagadoUSD: finanzas.pagadoUSD,
      pagadoCordobas: finanzas.pagadoCordobas,
      pagadoRealUSD: finanzas.pagadoRealUSD,
      pagadoRealCordobas: finanzas.pagadoRealCordobas,
      saldoUSD: finanzas.saldoUSD,
      saldoCordobas: finanzas.saldoCordobas,
      saldoRealUSD: finanzas.saldoRealUSD,
      saldoRealCordobas: finanzas.saldoRealCordobas,
      estadoPago: finanzas.estadoPago,
    },

    anticipoRecibido: finanzas.pagadoUSD,
    saldoPendiente: finanzas.saldoUSD,

    estado: row.estado || 'cotizacion_guardada',
    estadoProduccion: row.estado_produccion || 'pendiente',
    pagoEstado: finanzas.estadoPago,
    seguimientoEstado: row.seguimiento_estado || row.estado || 'cotizacion_guardada',
    comisionEstado: 'no_generada',
    ordenTrabajo: row.orden_trabajo || {},
    historial: Array.isArray(row.historial) ? row.historial : [],
    createdAt: row.creado_en || row.created_at || new Date().toISOString(),
    fechaEstimada: '',
    dataOriginal,
  };
}

export function mapPedidoToDb(pedido) {
  const cliente = pedido.cliente || {};
  const resumen = pedido.resumen || {};
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const total = Number(resumen.total || pedido.total || pedido.totalUSDReferencia || 0);
  const anticipoPorcentaje = Number(pedido.anticipoPorcentaje || 60);

  const finanzas = construirFinanzasDesdePedido({
    ...pedido,
    resumen: { ...resumen, total },
    total,
    anticipoPorcentaje,
  });

  const pagosNormalizados = {
    ...(pedido.pagos || {}),
    historial: finanzas.historialPagos,
    totalCordobas: finanzas.totalCordobas,
    totalUSDReferencia: finanzas.totalUSDReferencia,
    tipoCambioCongelado: finanzas.tipoCambioCongelado,
    pagadoUSD: finanzas.pagadoUSD,
    pagadoCordobas: finanzas.pagadoCordobas,
    pagadoRealUSD: finanzas.pagadoRealUSD,
    pagadoRealCordobas: finanzas.pagadoRealCordobas,
    saldoUSD: finanzas.saldoUSD,
    saldoCordobas: finanzas.saldoCordobas,
    saldoRealUSD: finanzas.saldoRealUSD,
    saldoRealCordobas: finanzas.saldoRealCordobas,
    anticipoRequeridoUSDReferencia: finanzas.anticipoRequeridoUSDReferencia,
    anticipoRequeridoCordobas: finanzas.anticipoRequeridoCordobas,
    saldoContraEntregaCordobas: finanzas.saldoContraEntregaCordobas,
    estadoPago: finanzas.estadoPago,
    ultimoPago: pedido.ultimoPago || pedido.pagos?.ultimoPago || null,
    actualizadoEn: new Date().toISOString(),
  };

  const pedidoNormalizado = {
    ...pedido,
    totalCordobas: finanzas.totalCordobas,
    totalUSDReferencia: finanzas.totalUSDReferencia,
    tipoCambioCongelado: finanzas.tipoCambioCongelado,
    anticipoRequeridoCordobas: finanzas.anticipoRequeridoCordobas,
    anticipoRequeridoUSDReferencia: finanzas.anticipoRequeridoUSDReferencia,
    saldoContraEntregaCordobas: finanzas.saldoContraEntregaCordobas,
    pagos: pagosNormalizados,
    anticipoRecibido: finanzas.pagadoUSD,
    saldoPendiente: finanzas.saldoUSD,
    pagoEstado: finanzas.estadoPago,
  };

  return {
    numero: pedido.numero || pedido.numeroPedido || '',
    cliente_nombre: cliente.nombre || cliente.empresa || pedido.clienteNombre || '',
    cliente_telefono: cliente.telefono || cliente.whatsapp || pedido.clienteTelefono || '',
    cliente_empresa: cliente.empresa || pedido.clienteEmpresa || '',
    cliente_correo: cliente.correo || cliente.email || pedido.clienteCorreo || '',
    cliente_direccion: cliente.direccion || pedido.clienteDireccion || '',
    ciudad: cliente.ciudad || pedido.ciudad || '',
    estado: pedido.estado || 'cotizacion_guardada',
    estado_pago: finanzas.estadoPago,
    estado_produccion: pedido.estadoProduccion || 'pendiente',
    seguimiento_estado: pedido.seguimientoEstado || pedido.estado || 'cotizacion_guardada',
    unidad_negocio: pedido.unidadNegocio || pedido.unidad_negocio || 'ELANVISUAL',
    subtotal: Number(resumen.subtotal || pedido.subtotal || total || 0),
    descuento: Number(resumen.descuento || resumen.descuentoMonto || pedido.descuento || 0),
    iva: Number(resumen.iva || pedido.iva || 0),
    total,
    anticipo_porcentaje: anticipoPorcentaje,
    anticipo_monto: finanzas.pagadoUSD,
    saldo_monto: finanzas.saldoUSD,
    items,
    orden_trabajo: pedido.ordenTrabajo || {},
    historial: pedido.historial || [],
    data_original: {
      ...(pedido.dataOriginal || pedido.data_original || {}),
      pedido: pedidoNormalizado,
      pagos: pagosNormalizados,
      ultimoPago: pedido.ultimoPago || pedido.pagos?.ultimoPago || null,
      tipoCambioCongelado: finanzas.tipoCambioCongelado,
      totalCordobas: finanzas.totalCordobas,
      totalUSDReferencia: finanzas.totalUSDReferencia,
      anticipoSolicitado: finanzas.anticipoRequeridoUSDReferencia,
      anticipoPagado: finanzas.pagadoUSD,
      anticipoRequeridoCordobas: finanzas.anticipoRequeridoCordobas,
      anticipoRequeridoUSDReferencia: finanzas.anticipoRequeridoUSDReferencia,
      saldoContraEntregaCordobas: finanzas.saldoContraEntregaCordobas,
      saldoReal: finanzas.saldoUSD,
      saldoRealCordobas: finanzas.saldoCordobas,
      actualizado_en: new Date().toISOString(),
    },
    actualizado_en: new Date().toISOString(),
  };
}

export function unirPedidos(locales = [], remotos = []) {
  const mapa = new Map();

  [...locales, ...remotos].forEach((pedido) => {
    const clave = pedido.id || pedido.numero || pedido.codigoSeguimiento;
    if (!clave) return;
    mapa.set(clave, { ...(mapa.get(clave) || {}), ...pedido });
  });

  return Array.from(mapa.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}
