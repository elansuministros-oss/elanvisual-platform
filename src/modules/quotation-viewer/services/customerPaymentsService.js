import { supabase } from '../../../lib/supabase';
import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';

const PLATFORM = 'ELANVISUAL';

async function accessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token || '';
  if (!token) {
    const authError = new Error('Sesión administrativa requerida para registrar pagos.');
    authError.code = 'AUTH_REQUIRED';
    authError.status = 401;
    throw authError;
  }
  return token;
}

function projectPath(projectId, paymentId = '') {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('No se recibió el identificador del proyecto.');
  return `/api/vqs/projects/${encodeURIComponent(id)}/payments${paymentId ? `/${encodeURIComponent(paymentId)}` : ''}`;
}

async function request(path, { method = 'GET', body } = {}) {
  const token = await accessToken();
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Elankav-Platform': PLATFORM,
      'X-Elankav-Actor-Type': 'user',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || 'No fue posible procesar el pago.');
    error.code = payload?.code || 'CUSTOMER_PAYMENT_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.details || [];
    throw error;
  }
  return payload?.data ?? payload;
}

export function listCustomerPayments(projectId) {
  return request(projectPath(projectId));
}

export function createCustomerPayment(projectId, payment) {
  return request(projectPath(projectId), {
    method: 'POST',
    body: payment
  });
}

export function getCustomerPayment(projectId, paymentId) {
  return request(projectPath(projectId, paymentId));
}

export const customerPaymentsService = Object.freeze({
  listCustomerPayments,
  createCustomerPayment,
  getCustomerPayment
});
