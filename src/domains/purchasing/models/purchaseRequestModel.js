export const PURCHASE_REQUEST_STATUS = Object.freeze({
  REQUESTED: 'REQUESTED',
});

function createPurchaseRequestLineSnapshot(line = {}) {
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

export function createPurchaseRequestModel(purchaseRequest = {}) {
  return {
    purchaseRequestId: purchaseRequest.purchaseRequestId || `purchase-request-${Date.now()}`,
    reservationId: String(purchaseRequest.reservationId || '').trim(),
    workOrderId: String(purchaseRequest.workOrderId || '').trim(),
    orderId: String(purchaseRequest.orderId || '').trim(),
    projectId: String(purchaseRequest.projectId || '').trim(),
    estado: PURCHASE_REQUEST_STATUS.REQUESTED,
    lineas: Array.isArray(purchaseRequest.lineas)
      ? purchaseRequest.lineas.map(createPurchaseRequestLineSnapshot)
      : [],
    fechaCreacion: purchaseRequest.fechaCreacion || new Date().toISOString().slice(0, 10),
  };
}
