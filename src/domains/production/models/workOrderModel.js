export const PRODUCTION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  DELIVERED: 'DELIVERED',
});

export function normalizeProductionStatus(status) {
  return Object.values(PRODUCTION_STATUS).includes(status) ? status : PRODUCTION_STATUS.PENDING;
}

function createWorkOrderLineSnapshot(line = {}) {
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
  };
}

export function createWorkOrderModel(workOrder = {}) {
  const fechaCreacion = workOrder.fechaCreacion || new Date().toISOString().slice(0, 10);

  return {
    workOrderId: workOrder.workOrderId || `work-order-${Date.now()}`,
    orderId: String(workOrder.orderId || '').trim(),
    projectId: String(workOrder.projectId || '').trim(),
    cliente: String(workOrder.cliente || '').trim(),
    orderStatus: String(workOrder.orderStatus || '').trim(),
    productionStatus: normalizeProductionStatus(workOrder.productionStatus),
    lineas: Array.isArray(workOrder.lineas) ? workOrder.lineas.map(createWorkOrderLineSnapshot) : [],
    fechaCreacion,
    fechaUltimoCambioEstado: workOrder.fechaUltimoCambioEstado || fechaCreacion,
  };
}
