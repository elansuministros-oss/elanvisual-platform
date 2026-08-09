function projectPath(projectId, paymentId = '') {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('No se recibió el identificador del proyecto.');
  return `/api/ops/quotations/${encodeURIComponent(id)}/payments${paymentId ? `/${encodeURIComponent(paymentId)}` : ''}`;
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Actor-Type': 'user',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.error || 'No fue posible procesar el pago.');
    error.code = payload?.error?.code || payload?.code || 'CUSTOMER_PAYMENT_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.error?.details || payload?.details || [];
    throw error;
  }
  return payload?.data ?? payload;
}

function normalizePayment(payment) {
  return {
    ...payment,
    status: payment.status === 'applied' ? 'confirmed' : payment.status,
    amount: Number(payment.amountUsd ?? payment.amount ?? 0),
    currency: 'USD',
    paid_at: payment.paidAt ?? payment.paid_at,
    created_at: payment.createdAt ?? payment.created_at,
    payment_method: payment.method ?? payment.payment_method,
    payment_reference: payment.reference ?? payment.payment_reference,
    deposit_completed: payment.paymentType === 'deposit' && payment.status !== 'void'
  };
}

export async function listCustomerPayments(projectId) {
  const result = await request(projectPath(projectId));
  const rows = Array.isArray(result?.payments) ? result.payments : Array.isArray(result) ? result : [];
  return rows.map(normalizePayment);
}

export async function createCustomerPayment(projectId, payment) {
  const concept = String(payment?.concept || '').toLowerCase();
  const paymentType = concept.includes('anticipo') ? 'deposit' : concept.includes('cancel') ? 'balance' : 'payment';
  const metadata = payment?.metadata || {};
  const banking = metadata?.banking || {};
  const cheque = metadata?.cheque || {};
  const originalCurrency = cheque.currency || banking?.customerPayment?.currency || payment.currency || 'USD';
  const originalAmount = Number(cheque.amount || banking?.customerPayment?.amount || payment.amount || 0);
  const exchangeRate = originalCurrency === 'NIO'
    ? Number(cheque.effectiveExchangeRate || banking.effectiveExchangeRate || 0)
    : undefined;
  const method = payment.paymentMethod === 'transfer' ? 'bank_transfer' : payment.paymentMethod || 'cash';
  const result = await request(projectPath(projectId), {
    method: 'POST',
    body: {
      paymentType,
      amount: originalAmount,
      currency: originalCurrency,
      ...(exchangeRate ? { exchangeRate } : {}),
      method,
      bank: cheque.bankName || banking.bankName || null,
      reference: payment.paymentReference || cheque.number || null,
      paidAt: payment.paidAt,
      notes: payment.notes,
      receipt: metadata
    }
  });
  const normalized = normalizePayment(result);
  return {
    ...normalized,
    balance: { depositCompleted: normalized.deposit_completed }
  };
}

export async function getCustomerPayment(projectId, paymentId) {
  return normalizePayment(await request(projectPath(projectId, paymentId)));
}

export const customerPaymentsService = Object.freeze({
  listCustomerPayments,
  createCustomerPayment,
  getCustomerPayment
});
