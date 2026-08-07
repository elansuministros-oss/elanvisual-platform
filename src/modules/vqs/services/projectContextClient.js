import { DEFAULT_ORCHESTRATOR_URL } from './projectCoreClient';

const pendingRequests = new Map();

async function request(path, params = {}) {
  const query = new URLSearchParams({ path, ...params });
  const requestKey = query.toString();
  if (pendingRequests.has(requestKey)) return pendingRequests.get(requestKey);

  const operation = (async () => {
    const response = await fetch(`/api/vqs?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Elankav-Platform': 'ELANVISUAL',
        'X-Elankav-Actor-Type': 'user'
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error || 'No fue posible consultar el contexto VQS en CONNECT.');
      error.code = payload?.code || 'VQS_CONTEXT_REQUEST_FAILED';
      error.status = response.status;
      throw error;
    }
    return payload?.data || payload;
  })();

  pendingRequests.set(requestKey, operation);
  try {
    return await operation;
  } finally {
    if (pendingRequests.get(requestKey) === operation) pendingRequests.delete(requestKey);
  }
}

function normalizeSearchResult(result, { query, type }) {
  if (Array.isArray(result)) return { query, type, count: result.length, results: result };
  const results = Array.isArray(result?.results) ? result.results : [];
  return {
    ...(result || {}),
    query: result?.query || query,
    type: result?.type || type,
    count: Number.isFinite(Number(result?.count)) ? Number(result.count) : results.length,
    results
  };
}

async function searchCustomers(normalizedQuery, limit) {
  const result = await request('customers/search', {
    q: normalizedQuery,
    platform: 'elanvisual',
    limit: String(limit)
  });
  return normalizeSearchResult(result, { query: normalizedQuery, type: 'customer' });
}

export async function searchContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();
  if (type === 'customer' || type === 'all') return searchCustomers(normalizedQuery, limit);
  return { query: normalizedQuery, type, count: 0, results: [] };
}

export const projectContextClient = Object.freeze({ searchContext });
export { DEFAULT_ORCHESTRATOR_URL };
