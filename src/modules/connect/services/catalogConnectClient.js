import { buildQuery, requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';
const CATALOG_PATH = '/api/v1/catalog';

function listFromPayload(result, keys = []) {
  if (Array.isArray(result)) return result;
  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  return result?.items || result?.data || [];
}

export async function getCatalogSummaryConnect({ platform = PLATFORM } = {}) {
  return requestConnect(`${CATALOG_PATH}/summary${buildQuery({ platform })}`, { method: 'GET' });
}

export async function listCatalogItemsConnect({ query = '', supplierId = '', limit = 300, platform = PLATFORM } = {}) {
  const result = await requestConnect(`${CATALOG_PATH}/items${buildQuery({
    q: query,
    supplierId,
    platform,
    limit
  })}`, { method: 'GET' });
  return listFromPayload(result, ['catalogItems', 'materials', 'products', 'services']);
}

export async function listCatalogMaterialsConnect({ query = '', supplierId = '', limit = 5000, platform = PLATFORM } = {}) {
  const result = await requestConnect(`${CATALOG_PATH}/materials${buildQuery({
    q: query,
    supplierId,
    platform,
    limit
  })}`, { method: 'GET' });
  return listFromPayload(result, ['materials', 'catalogItems', 'items']);
}

export async function listSupplierCatalogItemsConnect({ supplierId, limit = 50, platform = PLATFORM } = {}) {
  const result = await requestConnect(`${CATALOG_PATH}/supplier-items${buildQuery({
    supplierId,
    platform,
    limit
  })}`, { method: 'GET' });
  return listFromPayload(result, ['supplierItems', 'items']);
}

export const catalogConnectClient = Object.freeze({
  getCatalogSummaryConnect,
  listCatalogItemsConnect,
  listCatalogMaterialsConnect,
  listSupplierCatalogItemsConnect
});

