import { DEFAULT_CONNECT_URL, resolveBaseUrl } from './projectCoreClient';

const pendingRequests = new Map();

async function request(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const requestKey = `${method}:${path}`;
  if (method === 'GET' && pendingRequests.has(requestKey)) return pendingRequests.get(requestKey);

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
      const error = new Error(payload?.error?.message || payload?.error || 'No fue posible consultar clientes en CONNECT.');
      error.code = payload?.error?.code || payload?.code || 'CONNECT_CUSTOMER_SEARCH_FAILED';
      error.status = response.status;
      throw error;
    }
    return payload?.data || payload;
  })();

  if (method === 'GET') pendingRequests.set(requestKey, operation);
  try {
    return await operation;
  } finally {
    if (method === 'GET' && pendingRequests.get(requestKey) === operation) pendingRequests.delete(requestKey);
  }
}

async function searchCustomers(normalizedQuery, limit) {
  const params = new URLSearchParams({ q: normalizedQuery, limit: String(limit) });
  const result = await request(`/api/v1/business/vqs/customers/search?${params.toString()}`, { method: 'GET' });
  const results = Array.isArray(result?.results) ? result.results : [];
  return {
    ...(result || {}),
    query: result?.query || normalizedQuery,
    type: 'customer',
    count: Number.isFinite(Number(result?.count)) ? Number(result.count) : results.length,
    results
  };
}

export async function searchContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return { query: '', type, count: 0, results: [] };

  // El flujo VQS ya no consulta Orchestrator. CONNECT es la fuente oficial de clientes.
  // Diseños y productos se mantienen como carga manual hasta conectarlos a sus APIs modernas.
  if (type === 'design' || type === 'store') {
    return { query: normalizedQuery, type, count: 0, results: [] };
  }

  return searchCustomers(normalizedQuery, limit);
}

export const projectContextClient = Object.freeze({ searchContext });
export { DEFAULT_CONNECT_URL };
