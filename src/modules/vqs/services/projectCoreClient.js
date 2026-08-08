import { prepareQuotationContractAssets } from './quotationAssetUploadRegistry';
const DEFAULT_VQS_PROXY_URL = '';

function resolveBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return DEFAULT_VQS_PROXY_URL;
}

async function request(path, options = {}) {
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
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
    const error = new Error(payload?.error || 'No fue posible procesar la solicitud en Project Core.');
    error.code = payload?.code || 'PROJECT_CORE_REQUEST_FAILED';
    error.status = response.status;
    error.details = Array.isArray(payload?.details) ? payload.details : [];
    throw error;
  }
  return payload;
}

export const createProject = async (contract) => {
  const preparedContract = await prepareQuotationContractAssets(contract);
  const projectResponse = await request('/api/vqs/projects', {
    method: 'POST',
    body: JSON.stringify(preparedContract)
  });

  return projectResponse;
};

export const getProject = (projectId) => request(`/api/vqs/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
export const updateProject = async (projectId, patch) => {
  const preparedPatch = await prepareQuotationContractAssets(patch);
  return request(`/api/vqs/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(preparedPatch)
  });
};
export const getProjectStatus = (projectId) => request(`/api/vqs/projects/${encodeURIComponent(projectId)}/status`, { method: 'GET' });
export const sendQuotationWhatsApp = (projectId, payload) => request(
  `/api/vqs/projects/${encodeURIComponent(projectId)}/send-whatsapp`,
  { method: 'POST', body: JSON.stringify(payload) }
);

export const projectCoreClient = Object.freeze({
  createProject,
  getProject,
  updateProject,
  getProjectStatus,
  sendQuotationWhatsApp
});
export { DEFAULT_VQS_PROXY_URL, resolveBaseUrl };
