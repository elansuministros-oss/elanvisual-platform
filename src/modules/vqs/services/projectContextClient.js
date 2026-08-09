import { DEFAULT_VQS_PROXY_URL, resolveBaseUrl } from './projectCoreClient';

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

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      const error = new Error('El proxy VQS no respondió JSON. Revisá el enrutamiento de /api/vqs en producción.');
      error.code = 'VQS_PROXY_NON_JSON';
      error.status = response.status;
      throw error;
    }

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

function normalizeSearchResult(result, { query, type }) {
  if (Array.isArray(result)) {
    return { query, type, count: result.length, results: result };
  }

  const results = Array.isArray(result?.results) ? result.results : [];
  return {
    ...(result || {}),
    query: result?.query || query,
    type: result?.type || type,
    count: Number.isFinite(Number(result?.count)) ? Number(result.count) : results.length,
    results
  };
}

function resultIdentity(result = {}, index = 0) {
  return [
    result.type,
    result.sourceId,
    result.source?.sourceId,
    result.customer?.customerId,
    result.customer?.phone,
    result.label,
    index
  ].filter(Boolean).join(':');
}

async function searchCustomers(normalizedQuery, limit) {
  const params = new URLSearchParams({
    q: normalizedQuery,
    platform: 'elanvisual',
    limit: String(limit)
  });
  const result = await request(`/api/vqs/customers/search?${params.toString()}`, { method: 'GET' });
  return normalizeSearchResult(result, { query: normalizedQuery, type: 'customer' });
}

async function searchDesignAndStore(normalizedQuery, type, limit) {
  const effectiveType = type === 'store' ? 'all' : type;
  const params = new URLSearchParams({ q: normalizedQuery, type: effectiveType, limit: String(limit) });
  const result = await request(`/api/vqs/context/search?${params.toString()}`, { method: 'GET' });
  return normalizeSearchResult(result, { query: normalizedQuery, type: effectiveType });
}

export async function searchContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();

  if (type === 'customer') {
    return searchCustomers(normalizedQuery, limit);
  }

  if (type !== 'all') {
    return searchDesignAndStore(normalizedQuery, type, limit);
  }

  const [customers, context] = await Promise.allSettled([
    searchCustomers(normalizedQuery, limit),
    searchDesignAndStore(normalizedQuery, 'all', limit)
  ]);

  if (customers.status === 'rejected' && context.status === 'rejected') {
    throw customers.reason || context.reason;
  }

  const combined = [
    ...(customers.status === 'fulfilled' ? customers.value.results : []),
    ...(context.status === 'fulfilled' ? context.value.results : [])
  ];
  const seen = new Set();
  const results = combined.filter((result, index) => {
    const key = resultIdentity(result, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);

  return {
    query: normalizedQuery,
    type: 'all',
    count: results.length,
    results
  };
}

export async function searchDesignContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();
  return searchDesignAndStore(normalizedQuery, type, limit);
}

export const projectContextClient = Object.freeze({ searchContext, searchDesignContext });
export { DEFAULT_VQS_PROXY_URL };
