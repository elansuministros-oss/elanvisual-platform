export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
});

export const ORDER_STATUS = Object.freeze({
  CREATED: 'CREATED',
});

export function normalizePaymentStatus(status) {
  return Object.values(PAYMENT_STATUS).includes(status) ? status : PAYMENT_STATUS.PENDING;
}

function createOrderLineSnapshot(line = {}) {
  return {
    id: line.id || '',
    producto: {
      id: line.producto?.id || '',
      nombre: line.producto?.nombre || 'Producto registrado',
      categoria: line.producto?.categoria || '',
    },
    cantidad: Number(line.cantidad || 0),
    medidas: {
      ancho: line.medidas?.ancho ?? '',
      alto: line.medidas?.alto ?? '',
    },
    unidad: line.unidad || '',
    observaciones: line.observaciones || '',
    precioVentaUnitario: Number(line.precioVentaUnitario || 0),
    lineSubtotal: Number(line.lineSubtotal || 0),
    currency: line.currency || '',
  };
}

export function createOrderModel(order = {}) {
  return {
    orderId: order.orderId || `order-${Date.now()}`,
    quoteId: String(order.quoteId || '').trim(),
    projectId: String(order.projectId || '').trim(),
    cliente: String(order.cliente || '').trim(),
    totalGeneral: Number(order.totalGeneral || 0),
    anticipoRequerido: Number(order.anticipoRequerido || 0),
    saldoPendiente: Number(order.saldoPendiente || 0),
    paymentMethod: String(order.paymentMethod || '').trim(),
    paymentStatus: normalizePaymentStatus(order.paymentStatus),
    orderStatus: ORDER_STATUS.CREATED,
    lineas: Array.isArray(order.lineas) ? order.lineas.map(createOrderLineSnapshot) : [],
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  };
}
