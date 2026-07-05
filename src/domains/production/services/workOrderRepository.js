import { createWorkOrderModel } from '../models/workOrderModel';

const STORAGE_KEY = 'elanvisual_v2_work_orders';

function readWorkOrders() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createWorkOrderModel) : [];
  } catch {
    return [];
  }
}

function writeWorkOrders(workOrders) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workOrders));
}

export const WorkOrderRepository = Object.freeze({
  list() {
    return readWorkOrders();
  },

  getByOrder(orderId) {
    return readWorkOrders().find((workOrder) => workOrder.orderId === orderId) || null;
  },

  save(workOrder) {
    const nextWorkOrder = createWorkOrderModel(workOrder);
    const workOrders = [
      nextWorkOrder,
      ...readWorkOrders().filter((item) => item.orderId !== nextWorkOrder.orderId),
    ];
    writeWorkOrders(workOrders);
    return nextWorkOrder;
  },

  update(workOrderId, updates) {
    let updatedWorkOrder = null;
    const workOrders = readWorkOrders().map((workOrder) => {
      if (workOrder.workOrderId !== workOrderId) return workOrder;
      updatedWorkOrder = createWorkOrderModel({ ...workOrder, ...updates, workOrderId });
      return updatedWorkOrder;
    });

    writeWorkOrders(workOrders);
    return updatedWorkOrder;
  },
});
