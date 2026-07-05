export const PAYMENT_METHODS = Object.freeze({
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
});

export function normalizePaymentStatus(status) {
  return Object.values(PAYMENT_STATUS).includes(status) ? status : PAYMENT_STATUS.PENDING;
}

export function createPaymentAttemptModel(attempt = {}) {
  const paymentMethod = Object.values(PAYMENT_METHODS).includes(attempt.paymentMethod)
    ? attempt.paymentMethod
    : PAYMENT_METHODS.BANK_TRANSFER;

  return {
    id: attempt.id || `payment-attempt-${Date.now()}`,
    quoteId: String(attempt.quoteId || '').trim(),
    cliente: String(attempt.cliente || '').trim(),
    proyecto: {
      id: attempt.proyecto?.id || '',
      nombre: String(attempt.proyecto?.nombre || '').trim(),
    },
    totalGeneral: Number(attempt.totalGeneral || 0),
    anticipoRequerido: Number(attempt.anticipoRequerido || 0),
    saldoPendiente: Number(attempt.saldoPendiente || 0),
    paymentMethod,
    amount: Number(attempt.amount || attempt.anticipoRequerido || 0),
    status: normalizePaymentStatus(attempt.status),
    createdAt: attempt.createdAt || new Date().toISOString(),
    updatedAt: attempt.updatedAt || attempt.createdAt || new Date().toISOString(),
  };
}
