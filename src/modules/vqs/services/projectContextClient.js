import { DEFAULT_ORCHESTRATOR_URL, resolveBaseUrl } from './projectCoreClient';

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
    const error = new Error(payload?.error || 'No fue posible consultar el contexto VQS.');
    error.code = payload?.code || 'VQS_CONTEXT_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }
  return payload?.data || payload;
}

export function searchContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();
  const effectiveType = type === 'store' ? 'all' : type;
  const params = new URLSearchParams({ q: normalizedQuery, type: effectiveType, limit: String(limit) });
  return request(`/api/vqs/context/search?${params.toString()}`, { method: 'GET' });
}

export const projectContextClient = Object.freeze({ searchContext });
export { DEFAULT_ORCHESTRATOR_URL };
