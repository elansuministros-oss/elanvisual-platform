import { DEFAULT_ORCHESTRATOR_URL, resolveBaseUrl } from './projectCoreClient';
import { supabase } from '../../../lib/supabase.js';

const pendingRequests = new Map();

async function request(path, options = {}, legacy = false) {
  const method = String(options.method || 'GET').toUpperCase();
  const requestKey = `${legacy ? 'legacy' : 'connect'}:${method}:${path}`;

  if (method === 'GET' && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const operation = (async () => {
    let authorization = '';

    if (!legacy) {
      if (!supabase) {
        throw new Error('SUPABASE_CLIENT_NOT_CONFIGURED');
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const token = data?.session?.access_token || '';
      if (!token) {
        const error = new Error('Sesion administrativa requerida.');
        error.code = 'AUTH_REQUIRED';
        error.status = 401;
        throw error;
      }

      authorization = `Bearer ${token}`;
    }

    const target = legacy ? `${resolveBaseUrl()}${path}` : path;

    const response = await fetch(target, {
      ...options,
      headers: {
        Accept: 'application/json',
        'X-Elankav-Platform': 'ELANVISUAL',
        'X-Elankav-Actor-Type': 'user',
        ...(authorization ? { Authorization: authorization } : {}),
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

  const result = await request(`/api/vqs/customers/search?${params.toString()}`, {
    method: 'GET'
  });

  return normalizeSearchResult(result, {
    query: normalizedQuery,
    type: 'customer'
  });
}

async function searchDesign(normalizedQuery, limit) {
  const params = new URLSearchParams({
    q: normalizedQuery,
    type: 'design',
    limit: String(limit)
  });

  const result = await request(`/api/vqs/context/search?${params.toString()}`, {
    method: 'GET'
  });

  return normalizeSearchResult(result, {
    query: normalizedQuery,
    type: 'design'
  });
}

async function searchStoreLegacy(normalizedQuery, limit) {
  const params = new URLSearchParams({
    q: normalizedQuery,
    type: 'all',
    limit: String(limit)
  });

  const result = await request(
    `/api/vqs/context/search?${params.toString()}`,
    { method: 'GET' },
    true
  );

  const normalized = normalizeSearchResult(result, {
    query: normalizedQuery,
    type: 'store'
  });

  const results = normalized.results.filter((item) => item?.type !== 'design');

  return {
    ...normalized,
    type: 'store',
    count: results.length,
    results
  };
}

export async function searchContext(query, { type = 'all', limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();

  if (type === 'customer') {
    return searchCustomers(normalizedQuery, limit);
  }

  if (type === 'design') {
    return searchDesign(normalizedQuery, limit);
  }

  if (type === 'store') {
    return searchStoreLegacy(normalizedQuery, limit);
  }

  const [customers, design, store] = await Promise.allSettled([
    searchCustomers(normalizedQuery, limit),
    searchDesign(normalizedQuery, limit),
    searchStoreLegacy(normalizedQuery, limit)
  ]);

  if (
    customers.status === 'rejected' &&
    design.status === 'rejected' &&
    store.status === 'rejected'
  ) {
    throw customers.reason || design.reason || store.reason;
  }

  const combined = [
    ...(customers.status === 'fulfilled' ? customers.value.results : []),
    ...(design.status === 'fulfilled' ? design.value.results : []),
    ...(store.status === 'fulfilled' ? store.value.results : [])
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

export const projectContextClient = Object.freeze({ searchContext });
export { DEFAULT_ORCHESTRATOR_URL };
