import { prepareQuotationContractAssets } from './quotationAssetUploadRegistry';

const DEFAULT_ORCHESTRATOR_URL = '';
const VQS_PROXY = '/api/vqs';

function resolveBaseUrl() {
  return '';
}

function proxyUrl(path) {
  const params = new URLSearchParams({ path });
  return `${VQS_PROXY}?${params.toString()}`;
}

async function request(path, options = {}) {
  const response = await fetch(proxyUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Actor-Type': 'user',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || 'No fue posible procesar la solicitud en CONNECT.');
    error.code = payload?.code || 'CONNECT_VQS_REQUEST_FAILED';
    error.status = response.status;
    error.details = Array.isArray(payload?.details) ? payload.details : [];
    throw error;
  }
  return payload?.data || payload;
}

export const createProject = async (contract) => {
  const preparedContract = await prepareQuotationContractAssets(contract);
  const idempotencyKey = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return request('quotations', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(preparedContract)
  });
};

export const getProject = (projectId) => request(`quotations/${encodeURIComponent(projectId)}`, { method: 'GET' });
export const updateProject = async (projectId, patch) => {
  const preparedPatch = await prepareQuotationContractAssets(patch);
  return request(`quotations/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(preparedPatch)
  });
};
export const getProjectStatus = async (projectId) => {
  const project = await getProject(projectId);
  return { projectId, status: project?.status || project?.quotation_document?.publicDocument?.status || 'draft' };
};
export const sendQuotationWhatsApp = (projectId, payload) => request(
  `quotations/${encodeURIComponent(projectId)}/send-whatsapp`,
  { method: 'POST', body: JSON.stringify(payload) }
);

export const projectCoreClient = Object.freeze({
  createProject,
  getProject,
  updateProject,
  getProjectStatus,
  sendQuotationWhatsApp
});
export { DEFAULT_ORCHESTRATOR_URL, resolveBaseUrl };
