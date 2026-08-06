import { buildQuery, requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';

export async function searchCustomersConnect({ query = '', vendedorId = '', limit = 20 } = {}) {
  const result = await requestConnect(`/api/v1/customers${buildQuery({
    q: query,
    vendedorId,
    platform: PLATFORM,
    limit
  })}`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.customers || result?.items || [];
}

export async function listQuotesConnect({ vendedorId = '', limit = 100 } = {}) {
  const result = await requestConnect(`/api/v1/quotes${buildQuery({
    vendedorId,
    platform: PLATFORM,
    limit
  })}`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.quotes || result?.items || [];
}

export async function listCrmOrdersConnect({ vendedorId = '', limit = 100 } = {}) {
  const result = await requestConnect(`/api/v1/orders${buildQuery({
    vendedorId,
    platform: PLATFORM,
    limit
  })}`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.orders || result?.items || [];
}

export async function createCustomerDraftConnect(data) {
  return requestConnect('/api/v1/customers/drafts', {
    method: 'POST',
    body: JSON.stringify({
      platform: PLATFORM,
      customer: data
    })
  });
}

export const crmConnectClient = Object.freeze({
  searchCustomersConnect,
  listQuotesConnect,
  listCrmOrdersConnect,
  createCustomerDraftConnect
});

