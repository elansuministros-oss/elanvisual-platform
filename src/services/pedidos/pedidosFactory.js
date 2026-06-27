function normalizarWhatsAppNicaragua(numero) {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (!limpio) return '';
  if (limpio.length === 8) return `505${limpio}`;
  if (limpio.startsWith('505') && limpio.length === 11) return limpio;
  return limpio;
}

function whatsappValidoNicaragua(numero) {
  const limpio = normalizarWhatsAppNicaragua(numero);
  return limpio.startsWith('505') && limpio.length === 11;
}

function codigoVendedorElanvisual(usuario = {}) {
  if (usuario.codigoVendedor) return usuario.codigoVendedor;
  if (usuario.codigoQR) return usuario.codigoQR;
  if (usuario.usuario === 'admin') return 'ERICK-001';

  if (usuario.rol === 'ventas') {
    return `VEN-${String(usuario.usuario || usuario.id || '001')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')}`;
  }

  return String(usuario.id || 'USR-001').toUpperCase();
}

function obtenerReferenciaVendedorElanvisual(usuarios = [], usuarioActivo = null) {
  if (usuarioActivo?.rol === 'ventas' || usuarioActivo?.usuario === 'admin') {
    return {
      id: usuarioActivo.id,
      nombre: usuarioActivo.nombre || usuarioActivo.usuario || usuarioActivo.email,
      usuario: usuarioActivo.usuario,
      email: usuarioActivo.email,
      codigo: codigoVendedorElanvisual(usuarioActivo),
      rol: usuarioActivo.rol,
    };
  }

  return null;
}

function crearComisionInicialElanvisual({ total = 0, costoProduccion = 0, vendedor = null }) {
  const venta = Number(total || 0);
  const costo = Number(costoProduccion || 0);
  const utilidadRealEstimada = Math.max(venta - costo, 0);
  const fondoComunitario = utilidadRealEstimada * 0.05;
  const direccionGeneral = utilidadRealEstimada * 0.05;
  const baseDistribuible = Math.max(utilidadRealEstimada - fondoComunitario - direccionGeneral, 0);
  const comisionVendedor = vendedor ? baseDistribuible * 0.4 : 0;
  const elanvisual = baseDistribuible - comisionVendedor;
  const fondoIncentivoVendedor = vendedor ? elanvisual * 0.05 : 0;

  return {
    estado: 'en_proceso',
    vendedorId: vendedor?.id || '',
    vendedorCodigo: vendedor?.codigo || '',
    vendedorNombre: vendedor?.nombre || '',
    utilidadRealEstimada,
    fondoComunitario,
    direccionGeneral,
    baseDistribuible,
    comisionVendedor,
    fondoIncentivoVendedor,
    utilidadElanvisual: Math.max(elanvisual - fondoIncentivoVendedor, 0),
    pagada: false,
    pagoSolicitado: false,
    historial: [
      {
        estado: 'en_proceso',
        fecha: new Date().toISOString(),
        nota: 'Comisión creada en proceso. Se valida hasta trabajo finalizado y pago cancelado.',
      },
    ],
  };
}

export function construirPedidoTransferencia({
  cliente,
  pagoTipo = 'anticipo',
  resumen,
  carrito,
  configuracion,
  clienteActual,
}) {
  if (!whatsappValidoNicaragua(cliente?.whatsapp || cliente?.telefono)) {
    throw new Error('whatsapp_invalido');
  }

  const clienteNormalizado = {
    ...cliente,
    whatsapp: normalizarWhatsAppNicaragua(cliente?.whatsapp || cliente?.telefono),
    telefono: normalizarWhatsAppNicaragua(cliente?.telefono || cliente?.whatsapp),
  };

  const numero = `SOL-${String(Date.now()).slice(-6)}`;
  const anticipoPorcentaje = Number(configuracion.anticipoPorcentaje || 60);
  const montoSolicitado =
    pagoTipo === 'total' ? resumen.total : resumen.total * (anticipoPorcentaje / 100);
  const origenComercial = clienteActual ? { ...clienteActual } : null;

  return {
    id: `pedido-${Date.now()}`,
    numero,
    codigoSeguimiento: '',
    cliente: clienteNormalizado,
    origenComercial,
    vendedor: origenComercial,
    veterinaria: null,
    items: carrito,
    origenComercialId: origenComercial?.id || '',
    vendedorId: origenComercial?.id || '',
    veterinariaId: '',
    origenComercialCodigo: origenComercial?.codigo || '',
    vendedorCodigo: origenComercial?.codigo || '',
    veterinariaCodigo: '',
    resumen: { ...resumen, comision: 0 },
    pagoTipo,
    anticipoPorcentaje,
    montoSolicitado,
    anticipoRequerido: resumen.total * (anticipoPorcentaje / 100),
    anticipoRecibido: 0,
    saldoPendiente: resumen.total,
    pagos: { historial: [], pagadoUSD: 0, saldoUSD: resumen.total, estadoPago: 'Pendiente anticipo' },
    estado: 'pendiente_pago',
    estadoProduccion: 'pendiente',
    pagoEstado: 'pendiente_transferencia',
    seguimientoEstado: 'pendiente_pago',
    comisionEstado: 'no_generada',
    ordenTrabajo: {
      codigoOT: `OT-${String(Date.now()).slice(-6)}`,
      responsable: '',
      observaciones: '',
      fecha: new Date().toISOString(),
      estadoProduccion: 'pendiente',
      evidencias: { inicial: '', proceso: '', terminado: '', entrega: '' },
    },
    historial: [
      {
        estado: 'pendiente_pago',
        fecha: new Date().toISOString(),
        nota: 'Solicitud creada desde app ELANVISUAL.',
      },
    ],
    createdAt: new Date().toISOString(),
    fechaEstimada: '',
  };
}

export function construirPedidoOperativo(pedidoBase, { usuarios = [], usuario = null } = {}) {
  const fecha = pedidoBase.fecha || pedidoBase.createdAt || new Date().toISOString();
  const numero = pedidoBase.numero || pedidoBase.numeroPedido || `PED-${String(Date.now()).slice(-6)}`;
  const numeroOT = pedidoBase.numeroOT || pedidoBase.ordenTrabajo?.codigoOT || `OT-${String(Date.now()).slice(-6)}`;

  const clienteNormalizado = {
    nombre:
      pedidoBase.cliente?.nombre ||
      pedidoBase.cliente?.empresa ||
      pedidoBase.cliente?.contacto ||
      'Cliente',
    empresa: pedidoBase.cliente?.empresa || pedidoBase.cliente?.nombre || '',
    contacto: pedidoBase.cliente?.contacto || '',
    whatsapp: pedidoBase.cliente?.whatsapp || pedidoBase.cliente?.telefono || '',
    telefono: pedidoBase.cliente?.telefono || pedidoBase.cliente?.whatsapp || '',
    correo: pedidoBase.cliente?.correo || pedidoBase.cliente?.email || '',
    email: pedidoBase.cliente?.email || pedidoBase.cliente?.correo || '',
  };

  const items = Array.isArray(pedidoBase.items) ? pedidoBase.items : [];
  const total = Number(pedidoBase.resumen?.total || pedidoBase.total || 0);
  const costoProduccionEstimado = items.reduce(
    (acc, item) =>
      acc +
      Number(item.costoProduccion || 0) +
      (Array.isArray(item.accesoriosProduccion)
        ? item.accesoriosProduccion.reduce(
            (suma, accItem) => suma + Number(accItem.total || accItem.precio || 0),
            0
          )
        : 0),
    0
  );

  const vendedorReferencia =
    pedidoBase.vendedor ||
    pedidoBase.origenComercial ||
    obtenerReferenciaVendedorElanvisual(usuarios, usuario);

  const comisionInicial = crearComisionInicialElanvisual({
    total,
    costoProduccion: costoProduccionEstimado,
    vendedor: vendedorReferencia,
  });

  const anticipo = Number(pedidoBase.resumen?.anticipo || total * 0.6);
  const saldo = total;

  return {
    ...pedidoBase,
    vendedor: vendedorReferencia || pedidoBase.vendedor || null,
    vendedorId: vendedorReferencia?.id || pedidoBase.vendedorId || '',
    vendedorNombre: vendedorReferencia?.nombre || pedidoBase.vendedorNombre || '',
    codigoVendedor: vendedorReferencia?.codigo || pedidoBase.codigoVendedor || '',
    costos: {
      ...(pedidoBase.costos || {}),
      produccionEstimada: costoProduccionEstimado,
    },
    comisiones: pedidoBase.comisiones || comisionInicial,
    utilidad: pedidoBase.utilidad || {
      utilidadRealEstimada: comisionInicial.utilidadRealEstimada,
      fondoComunitario: comisionInicial.fondoComunitario,
      direccionGeneral: comisionInicial.direccionGeneral,
      comisionVendedor: comisionInicial.comisionVendedor,
      fondoIncentivoVendedor: comisionInicial.fondoIncentivoVendedor,
      utilidadElanvisual: comisionInicial.utilidadElanvisual,
    },
    id: pedidoBase.id || `pedido-${Date.now()}`,
    numero,
    numeroPedido: pedidoBase.numeroPedido || numero,
    numeroOT,
    codigoSeguimiento: pedidoBase.codigoSeguimiento || '',
    fecha,
    createdAt: pedidoBase.createdAt || fecha,
    cliente: clienteNormalizado,
    items,
    resumen: {
      subtotal: Number(pedidoBase.resumen?.subtotal || 0),
      descuento: Number(pedidoBase.resumen?.descuento || 0),
      total,
      anticipo,
      saldo,
      comision: Number(pedidoBase.resumen?.comision || 0),
    },
    estado: pedidoBase.estado || 'Pedido creado',
    estadoProduccion:
      pedidoBase.estadoProduccion ||
      pedidoBase.produccion?.estado ||
      pedidoBase.ordenTrabajo?.estadoProduccion ||
      'pendiente',
    pagoEstado: pedidoBase.pagoEstado || 'Pendiente anticipo',
    seguimientoEstado: pedidoBase.seguimientoEstado || 'pendiente',
    comisionEstado: pedidoBase.comisionEstado || 'no_generada',
    anticipoRequerido: anticipo,
    anticipoRecibido: 0,
    saldoPendiente: total,
    pagos: {
      ...(pedidoBase.pagos || {}),
      historial: Array.isArray(pedidoBase.pagos?.historial) ? pedidoBase.pagos.historial : [],
      pagadoUSD: 0,
      pagadoCordobas: 0,
      saldoUSD: total,
      estadoPago: 'Pendiente anticipo',
    },
    ordenTrabajo: {
      codigoOT: numeroOT,
      pedido: numero,
      cliente: clienteNormalizado.nombre,
      origenComercial: pedidoBase.vendedor?.nombre || '',
      producto: items.map((item) => item.descripcion || item.nombre).join(', '),
      cantidad: items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
      responsable: pedidoBase.ordenTrabajo?.responsable || '',
      observaciones: pedidoBase.ordenTrabajo?.observaciones || pedidoBase.produccion?.observaciones || '',
      fecha,
      estadoProduccion: pedidoBase.estadoProduccion || pedidoBase.produccion?.estado || 'pendiente',
      evidencias: {
        inicial: '',
        diseno: '',
        proceso: '',
        instalacion: '',
        entrega: '',
        ...(pedidoBase.ordenTrabajo?.evidencias || {}),
      },
    },
    historial: Array.isArray(pedidoBase.historial)
      ? pedidoBase.historial
      : [
          {
            estado: pedidoBase.estado || 'Pedido creado',
            fecha,
            nota: 'Pedido operativo creado desde Cotizador Visual.',
          },
        ],
  };
}
