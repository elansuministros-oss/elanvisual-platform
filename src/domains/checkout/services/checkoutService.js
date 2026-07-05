import {
  createPaymentAttemptModel,
  normalizePaymentStatus,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from '../models/paymentAttemptModel';
import { CheckoutRepository } from './checkoutRepository';

export const CheckoutService = Object.freeze({
  paymentMethods: PAYMENT_METHODS,
  paymentStatus: PAYMENT_STATUS,

  listAttempts() {
    return CheckoutRepository.list();
  },

  getAttemptByQuote(quoteId) {
    return CheckoutRepository.getByQuote(quoteId);
  },

  createPendingAttempt(quote, paymentMethod) {
    if (!quote?.id) {
      throw new Error('Quote is required');
    }

    return CheckoutRepository.save(
      createPaymentAttemptModel({
        quoteId: quote.id,
        cliente: quote.cliente,
        proyecto: quote.proyecto,
        totalGeneral: quote.totalGeneral,
        anticipoRequerido: quote.anticipoRequerido,
        saldoPendiente: quote.saldoPendiente,
        paymentMethod,
        amount: quote.anticipoRequerido,
      })
    );
  },

  updateAttemptStatus(quoteId, status) {
    const nextStatus = normalizePaymentStatus(status);
    if (nextStatus === PAYMENT_STATUS.PENDING) {
      throw new Error('Payment status transition must be PAID or FAILED');
    }

    const attempt = CheckoutRepository.updateByQuote(quoteId, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    return attempt;
  },
});
