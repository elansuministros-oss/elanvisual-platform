import { buildQuery, requestConnect } from './connectCoreClient';

const BASE_PATH = '/api/v1/suppliers';
const PLATFORM = 'ELANVISUAL';

function supplierPath(id = '', suffix = '') {
  const base = id ? `${BASE_PATH}/${encodeURIComponent(id)}` : BASE_PATH;
  return suffix ? `${base}/${suffix.replace(/^\//, '')}` : base;
}

export async function listSuppliersConnect({ platform = PLATFORM, limit = 500 } = {}) {
  const result = await requestConnect(`${BASE_PATH}${buildQuery({ platform, limit })}`, {
    method: 'GET'
  });
  return Array.isArray(result) ? result : result?.suppliers || result?.items || [];
}

export async function createSupplierConnect(supplier) {
  return requestConnect(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify({
      platform: PLATFORM,
      supplier
    })
  });
}

export async function updateSupplierConnect(id, supplier) {
  return requestConnect(supplierPath(id), {
    method: 'PATCH',
    body: JSON.stringify({
      platform: PLATFORM,
      supplier
    })
  });
}

export async function deleteSupplierConnect(id) {
  await requestConnect(supplierPath(id), {
    method: 'DELETE',
    body: JSON.stringify({ platform: PLATFORM })
  });
  return true;
}

export const supplierConnectClient = Object.freeze({
  listSuppliersConnect,
  createSupplierConnect,
  updateSupplierConnect,
  deleteSupplierConnect
});

