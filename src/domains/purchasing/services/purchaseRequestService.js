import { createPurchaseRequestModel } from '../models/purchaseRequestModel';
import { PurchaseRequestRepository } from './purchaseRequestRepository';

export const PurchaseRequestService = Object.freeze({
  list() {
    return PurchaseRequestRepository.list();
  },

  getByReservation(reservationId) {
    return PurchaseRequestRepository.getByReservation(reservationId);
  },

  createFromReservation(reservation) {
    if (!reservation?.reservationId) {
      throw new Error('Inventory Reservation is required');
    }

    return PurchaseRequestRepository.save(
      createPurchaseRequestModel({
        reservationId: reservation.reservationId,
        workOrderId: reservation.workOrderId,
        orderId: reservation.orderId,
        projectId: reservation.projectId,
        lineas: reservation.lineas,
      })
    );
  },
});
