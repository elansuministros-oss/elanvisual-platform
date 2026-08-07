import { DEFAULT_ORCHESTRATOR_URL } from './projectCoreClient';

const pendingRequests = new Map();
const SOURCE_KEY = '__ELANVISUAL_VQS_SEARCH_SOURCE__';

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
      const error = new Error(payload?.error || 'No fue posible consultar la información en CONNECT.');
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

function selectedSource() {
  if (typeof window !== 'undefined') return String(window[SOURCE_KEY] || 'customers');
  return 'customers';
}

async function searchCustomers(normalizedQuery, limit) {
  const result = await request('customers/directory-search', {
    q: normalizedQuery,
    platform: 'elanvisual',
    limit: String(limit)
  });
  return normalizeSearchResult(result, { query: normalizedQuery, type: 'customer' });
}

async function searchDesigner(normalizedQuery, limit) {
  const result = await request('design/search', {
    q: normalizedQuery,
    platform: 'elanvisual',
    limit: String(limit)
  });
  return normalizeSearchResult(result, { query: normalizedQuery, type: 'design' });
}

export async function searchContext(query, { limit = 30 } = {}) {
  const normalizedQuery = String(query || '').trim();
  return selectedSource() === 'designer'
    ? searchDesigner(normalizedQuery, limit)
    : searchCustomers(normalizedQuery, limit);
}

export const projectContextClient = Object.freeze({ searchContext });
export { DEFAULT_ORCHESTRATOR_URL };
