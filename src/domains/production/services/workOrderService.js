import { createWorkOrderModel, normalizeProductionStatus } from '../models/workOrderModel';
import { WorkOrderRepository } from './workOrderRepository';
import { InventoryReservationService } from '../../inventory';

export const WorkOrderService = Object.freeze({
  list() {
    return WorkOrderRepository.list();
  },

  getByOrder(orderId) {
    return WorkOrderRepository.getByOrder(orderId);
  },

  createFromOrder(order) {
    if (!order?.orderId) {
      throw new Error('Order is required');
    }

    return WorkOrderRepository.save(
      createWorkOrderModel({
        orderId: order.orderId,
        projectId: order.projectId,
        cliente: order.cliente,
        orderStatus: order.orderStatus,
        lineas: order.lineas,
      })
    );
  },

  updateProductionStatus(workOrderId, productionStatus) {
    const nextStatus = normalizeProductionStatus(productionStatus);
    const current = WorkOrderRepository.list().find((workOrder) => workOrder.workOrderId === workOrderId);
    if (!current) {
      throw new Error('Work Order not found');
    }

    return WorkOrderRepository.update(workOrderId, {
      productionStatus: nextStatus,
      fechaUltimoCambioEstado: new Date().toISOString(),
    });
  },

  createInventoryReservation(workOrderId) {
    const workOrder = WorkOrderRepository.list().find((item) => item.workOrderId === workOrderId);
    if (!workOrder) {
      throw new Error('Work Order not found');
    }

    return InventoryReservationService.createFromWorkOrder(workOrder);
  },

  getInventoryReservation(workOrderId) {
    return InventoryReservationService.getByWorkOrder(workOrderId);
  },
});
