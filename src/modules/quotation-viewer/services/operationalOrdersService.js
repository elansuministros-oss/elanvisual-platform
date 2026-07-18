import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';

const PLATFORM = 'ELANVISUAL';

function buildUrl(path) {
  return `${resolveBaseUrl()}${path}`;
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      'X-Elankav-Platform': PLATFORM,
      'X-Elankav-Actor-Type': 'user',
      'X-Elankav-Role': 'ventas',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || 'No fue posible procesar la operación.');
    error.code = payload?.code || 'OPERATIONAL_ORDER_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }
  return payload?.data ?? null;
}

function projectPath(projectId, resource, itemId = '') {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('No se recibió el identificador del proyecto.');
  return `/api/vqs/projects/${encodeURIComponent(id)}/${resource}${itemId ? `/${encodeURIComponent(itemId)}` : ''}`;
}

export function listWorkOrders(projectId) {
  return request(projectPath(projectId, 'work-orders'));
}

export function createWorkOrder(projectId, quotationId) {
  return request(projectPath(projectId, 'work-orders'), {
    method: 'POST',
    body: { quotationId }
  });
}

export function getWorkOrder(projectId, workOrderId) {
  return request(projectPath(projectId, 'work-orders', workOrderId));
}

export function updateWorkOrder(projectId, workOrderId, patch) {
  return request(projectPath(projectId, 'work-orders', workOrderId), {
    method: 'PATCH',
    body: patch
  });
}

export function listPurchaseOrders(projectId) {
  return request(projectPath(projectId, 'purchase-orders'));
}

export function createPurchaseOrder(projectId, supplierId) {
  return request(projectPath(projectId, 'purchase-orders'), {
    method: 'POST',
    body: { supplierId }
  });
}

export function getPurchaseOrder(projectId, purchaseOrderId) {
  return request(projectPath(projectId, 'purchase-orders', purchaseOrderId));
}

export function updatePurchaseOrder(projectId, purchaseOrderId, patch) {
  return request(projectPath(projectId, 'purchase-orders', purchaseOrderId), {
    method: 'PATCH',
    body: patch
  });
}

export const operationalOrdersService = Object.freeze({
  listWorkOrders,
  createWorkOrder,
  getWorkOrder,
  updateWorkOrder,
  listPurchaseOrders,
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder
});
