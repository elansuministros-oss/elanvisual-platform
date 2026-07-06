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

  createPendingAttemptFromEceQuote(quote, paymentMethod) {
    if (!quote?.quoteId) {
      throw new Error('ECE Quote is required');
    }

    const total = Number(quote.total || 0);
    const amount = total * 0.6;

    return CheckoutRepository.save(
      createPaymentAttemptModel({
        quoteId: quote.quoteId,
        cliente: quote.cliente,
        proyecto: {
          id: quote.projectId,
          nombre: quote.nombreProyecto,
        },
        totalGeneral: total,
        anticipoRequerido: amount,
        saldoPendiente: total * 0.4,
        paymentMethod,
        amount,
        status: PAYMENT_STATUS.PENDING,
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
