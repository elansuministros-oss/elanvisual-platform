import { resolveBaseUrl } from '../modules/vqs/services/projectCoreClient';

async function request(path, options = {}) {
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Actor-Type': 'user',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || 'No fue posible consultar las cotizaciones.');
    error.code = payload?.code || 'VQS_CENTER_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }
  return payload?.data || payload;
}

export function listQuotations({ status = '', limit = 100 } = {}) {
  const params = new URLSearchParams({ platform: 'ELANVISUAL', limit: String(limit) });
  if (status) params.set('status', status);
  return request(`/api/vqs/projects?${params.toString()}`, { method: 'GET' });
}

export const vqsCenterClient = Object.freeze({ listQuotations });
