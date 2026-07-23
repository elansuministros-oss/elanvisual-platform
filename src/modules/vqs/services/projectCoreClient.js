import { prepareQuotationContractAssets } from './quotationAssetUploadRegistry';
import { syncQuotationCommercialFlow } from '../../connect/services/commercialConnectClient';

const DEFAULT_ORCHESTRATOR_URL = 'https://orchestrator.elankav.com';

function resolveBaseUrl() {
  const configured = typeof import.meta.env === 'object'
    ? import.meta.env.VITE_ELANKAV_ORCHESTRATOR_URL
    : '';
  return String(configured || DEFAULT_ORCHESTRATOR_URL).trim().replace(/\/$/, '');
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

  try {
    const commercialSync = await syncQuotationCommercialFlow(preparedContract, projectResponse);
    return { ...projectResponse, commercialSync };
  } catch (error) {
    console.error('ELANKAV_CONNECT_SYNC_FAILED', error);
    return {
      ...projectResponse,
      commercialSync: {
        status: 'failed',
        code: error?.code || 'ELANKAV_CONNECT_SYNC_FAILED',
        message: error?.message || 'No fue posible sincronizar la cotización con ELANKAV CONNECT.'
      }
    };
  }
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
export { DEFAULT_ORCHESTRATOR_URL, resolveBaseUrl };
