import { buildQuery, requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';
const PROJECTS_PATH = '/api/v1/ai/projects';

function projectPath(id = '', suffix = '') {
  const base = id ? `${PROJECTS_PATH}/${encodeURIComponent(id)}` : PROJECTS_PATH;
  return suffix ? `${base}/${suffix.replace(/^\//, '')}` : base;
}

export async function listAiProjectsConnect({ limit = 200 } = {}) {
  const result = await requestConnect(`${PROJECTS_PATH}${buildQuery({ platform: PLATFORM, limit })}`, {
    method: 'GET'
  });
  return Array.isArray(result) ? result : result?.projects || result?.items || [];
}

export async function createAiProjectConnect(project) {
  return requestConnect(PROJECTS_PATH, {
    method: 'POST',
    body: JSON.stringify({ platform: PLATFORM, project })
  });
}

export async function updateAiProjectConnect(id, patch) {
  return requestConnect(projectPath(id), {
    method: 'PATCH',
    body: JSON.stringify({ platform: PLATFORM, project: patch })
  });
}

export async function deleteAiProjectConnect(id) {
  await requestConnect(projectPath(id), {
    method: 'DELETE',
    body: JSON.stringify({ platform: PLATFORM })
  });
  return true;
}

export async function listAiMessagesConnect(projectId) {
  const result = await requestConnect(projectPath(projectId, 'messages'), { method: 'GET' });
  return Array.isArray(result) ? result : result?.messages || result?.items || [];
}

export async function createAiMessageConnect(projectId, message) {
  return requestConnect(projectPath(projectId, 'messages'), {
    method: 'POST',
    body: JSON.stringify({ platform: PLATFORM, message })
  });
}

export const aiStudioConnectClient = Object.freeze({
  listAiProjectsConnect,
  createAiProjectConnect,
  updateAiProjectConnect,
  deleteAiProjectConnect,
  listAiMessagesConnect,
  createAiMessageConnect
});

