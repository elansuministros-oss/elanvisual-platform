import { createOrderModel } from '../models/orderModel';

const STORAGE_KEY = 'elanvisual_v2_orders';

function readOrders() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createOrderModel) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export const OrderRepository = Object.freeze({
  list() {
    return readOrders();
  },

  getByQuote(quoteId) {
    return readOrders().find((order) => order.quoteId === quoteId) || null;
  },

  save(order) {
    const nextOrder = createOrderModel(order);
    const orders = [nextOrder, ...readOrders().filter((item) => item.quoteId !== nextOrder.quoteId)];
    writeOrders(orders);
    return nextOrder;
  },

  updateByQuote(quoteId, updates) {
    let updatedOrder = null;
    const orders = readOrders().map((order) => {
      if (order.quoteId !== quoteId) return order;
      updatedOrder = createOrderModel({ ...order, ...updates, quoteId });
      return updatedOrder;
    });

    writeOrders(orders);
    return updatedOrder;
  },
});
