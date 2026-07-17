import { DEFAULT_ORCHESTRATOR_URL, resolveBaseUrl } from './projectCoreClient';

const pendingRequests = new Map();

async function request(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const requestKey = `${method}:${path}`;
  if (method === 'GET' && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const operation = (async () => {
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
  })();

  if (method === 'GET') pendingRequests.set(requestKey, operation);
  try {
    return await operation;
  } finally {
    if (method === 'GET' && pendingRequests.get(requestKey) === operation) {
      pendingRequests.delete(requestKey);
    }
  }
}

export async function searchContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();

  if (type === 'customer') {
    const params = new URLSearchParams({
      q: normalizedQuery,
      platform: 'elanvisual',
      limit: String(limit)
    });
    const result = await request(`/api/vqs/customers/search?${params.toString()}`, { method: 'GET' });
    return Array.isArray(result)
      ? { query: normalizedQuery, type: 'customer', count: result.length, results: result }
      : result;
  }

  const effectiveType = type === 'store' ? 'all' : type;
  const params = new URLSearchParams({ q: normalizedQuery, type: effectiveType, limit: String(limit) });
  return request(`/api/vqs/context/search?${params.toString()}`, { method: 'GET' });
}

export const projectContextClient = Object.freeze({ searchContext });
export { DEFAULT_ORCHESTRATOR_URL };
