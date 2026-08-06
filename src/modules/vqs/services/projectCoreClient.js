const DEFAULT_CONNECT_URL = 'https://connect.elankav.com';

function resolveBaseUrl() {
  const configured = typeof import.meta.env === 'object'
    ? import.meta.env.VITE_ELANKAV_CONNECT_URL
    : '';
  return String(configured || DEFAULT_CONNECT_URL).trim().replace(/\/$/, '');
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
    const error = new Error(payload?.error?.message || payload?.error || 'No fue posible procesar la solicitud en CONNECT.');
    error.code = payload?.error?.code || payload?.code || 'CONNECT_VQS_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.error?.details || payload?.details || [];
    throw error;
  }
  return payload;
}

export const createProject = (contract) => request('/api/v1/business/vqs/quotations', {
  method: 'POST',
  body: JSON.stringify(contract)
});

export const getProject = (projectId) => request(
  `/api/v1/business/vqs/quotations/${encodeURIComponent(projectId)}`,
  { method: 'GET' }
);

export const updateProject = (projectId, contract) => request(
  `/api/v1/business/vqs/quotations/${encodeURIComponent(projectId)}`,
  { method: 'PATCH', body: JSON.stringify(contract) }
);

export const getProjectStatus = async (projectId) => {
  const payload = await getProject(projectId);
  const record = payload?.data || payload;
  return { projectId, status: record?.status || 'quoted' };
};

export const sendQuotationWhatsApp = (projectId, payload = {}) => request(
  `/api/v1/business/vqs/quotations/${encodeURIComponent(projectId)}/send-whatsapp`,
  {
    method: 'POST',
    body: JSON.stringify({
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.chatId ? { chatId: payload.chatId } : {}),
      ...(payload.text ? { text: payload.text } : {})
    })
  }
);

export const projectCoreClient = Object.freeze({
  createProject,
  getProject,
  updateProject,
  getProjectStatus,
  sendQuotationWhatsApp
});

export { DEFAULT_CONNECT_URL, resolveBaseUrl };
