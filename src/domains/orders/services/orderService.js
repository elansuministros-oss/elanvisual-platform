import { createOrderModel, normalizePaymentStatus, PAYMENT_STATUS } from '../models/orderModel';
import { OrderRepository } from './orderRepository';

export const OrderService = Object.freeze({
  list() {
    return OrderRepository.list();
  },

  getByQuote(quoteId) {
    return OrderRepository.getByQuote(quoteId);
  },

  createFromQuoteCheckout(quote, paymentAttempt) {
    if (!quote?.id) {
      throw new Error('Quote is required');
    }
    if (!paymentAttempt?.paymentMethod) {
      throw new Error('Payment attempt is required');
    }

    return OrderRepository.save(
      createOrderModel({
        quoteId: quote.id,
        projectId: quote.proyecto?.id || '',
        cliente: quote.cliente,
        totalGeneral: quote.totalGeneral,
        anticipoRequerido: quote.anticipoRequerido,
        saldoPendiente: quote.saldoPendiente,
        paymentMethod: paymentAttempt.paymentMethod,
        lineas: quote.lineas,
      })
    );
  },

  updatePaymentStatusByQuote(quoteId, paymentStatus) {
    const nextStatus = normalizePaymentStatus(paymentStatus);
    if (nextStatus === PAYMENT_STATUS.PENDING) {
      throw new Error('Order payment status transition must be PAID or FAILED');
    }

    const order = OrderRepository.updateByQuote(quoteId, {
      paymentStatus: nextStatus,
      updatedAt: new Date().toISOString(),
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  },
});
