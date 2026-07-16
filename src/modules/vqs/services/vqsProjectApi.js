const DEFAULT_ORCHESTRATOR_URL = 'https://orchestrator.elankav.com';

function baseUrl() {
  return String(import.meta.env.VITE_ELANKAV_ORCHESTRATOR_URL || DEFAULT_ORCHESTRATOR_URL).replace(/\/$/, '');
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || 'No fue posible procesar la solicitud VQS.');
    error.code = payload?.code || 'VQS_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.details || [];
    throw error;
  }

  return payload;
}

export function createProject(contract) {
  return request('/api/vqs/projects', {
    method: 'POST',
    body: JSON.stringify(contract),
  });
}

export function getProject(projectId) {
  return request(`/api/vqs/projects/${encodeURIComponent(projectId)}`);
}

export function getProjectStatus(projectId) {
  return request(`/api/vqs/projects/${encodeURIComponent(projectId)}/status`);
}

export function updateProject(projectId, patch) {
  return request(`/api/vqs/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export const vqsProjectApi = { createProject, getProject, getProjectStatus, updateProject };
