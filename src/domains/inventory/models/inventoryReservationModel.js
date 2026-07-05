export const INVENTORY_RESERVATION_STATUS = Object.freeze({
  RESERVED: 'RESERVED',
});

function createReservationLineSnapshot(line = {}) {
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

export function createInventoryReservationModel(reservation = {}) {
  return {
    reservationId: reservation.reservationId || `inventory-reservation-${Date.now()}`,
    workOrderId: String(reservation.workOrderId || '').trim(),
    orderId: String(reservation.orderId || '').trim(),
    projectId: String(reservation.projectId || '').trim(),
    estado: INVENTORY_RESERVATION_STATUS.RESERVED,
    lineas: Array.isArray(reservation.lineas) ? reservation.lineas.map(createReservationLineSnapshot) : [],
    fechaCreacion: reservation.fechaCreacion || new Date().toISOString().slice(0, 10),
  };
}
