import { createInventoryReservationModel } from '../models/inventoryReservationModel';
import { InventoryReservationRepository } from './inventoryReservationRepository';
import { PurchaseRequestService } from '../../purchasing';

export const InventoryReservationService = Object.freeze({
  list() {
    return InventoryReservationRepository.list();
  },

  getByWorkOrder(workOrderId) {
    return InventoryReservationRepository.getByWorkOrder(workOrderId);
  },

  createFromWorkOrder(workOrder) {
    if (!workOrder?.workOrderId) {
      throw new Error('Work Order is required');
    }

    return InventoryReservationRepository.save(
      createInventoryReservationModel({
        workOrderId: workOrder.workOrderId,
        orderId: workOrder.orderId,
        projectId: workOrder.projectId,
        lineas: workOrder.lineas,
      })
    );
  },

  createPurchaseRequest(reservationId) {
    const reservation = InventoryReservationRepository.list().find((item) => item.reservationId === reservationId);
    if (!reservation) {
      throw new Error('Inventory Reservation not found');
    }

    return PurchaseRequestService.createFromReservation(reservation);
  },

  getPurchaseRequest(reservationId) {
    return PurchaseRequestService.getByReservation(reservationId);
  },
});
