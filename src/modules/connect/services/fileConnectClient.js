import { buildQuery, requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';
const FILES_PATH = '/api/v1/files';

function filePath(id = '', suffix = '') {
  const base = id ? `${FILES_PATH}/${encodeURIComponent(id)}` : FILES_PATH;
  return suffix ? `${base}/${suffix.replace(/^\//, '')}` : base;
}

export async function uploadFileConnect({
  file,
  library = 'ai-archivos',
  projectId = '',
  messageId = '',
  userId = '',
  folder = '',
  metadata = {},
} = {}) {
  if (!file) throw new Error('Archivo requerido.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('platform', PLATFORM);
  formData.append('library', library);
  if (projectId) formData.append('projectId', projectId);
  if (messageId) formData.append('messageId', messageId);
  if (userId) formData.append('userId', userId);
  if (folder) formData.append('folder', folder);
  formData.append('metadata', JSON.stringify(metadata || {}));

  return requestConnect(FILES_PATH, {
    method: 'POST',
    body: formData
  });
}

export async function listFilesConnect({ library = 'ai-archivos', projectId = '', folder = '', limit = 500 } = {}) {
  const result = await requestConnect(`${FILES_PATH}${buildQuery({
    platform: PLATFORM,
    library,
    projectId,
    folder,
    limit
  })}`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.files || result?.items || [];
}

export async function downloadFileConnect(id) {
  return requestConnect(filePath(id, 'download'), { method: 'POST' });
}

export async function moveFileConnect(id, { folder = '', path = '' } = {}) {
  return requestConnect(filePath(id, 'move'), {
    method: 'POST',
    body: JSON.stringify({ platform: PLATFORM, folder, path })
  });
}

export async function renameFileConnect(id, name) {
  return requestConnect(filePath(id, 'rename'), {
    method: 'POST',
    body: JSON.stringify({ platform: PLATFORM, name })
  });
}

export async function organizeFilesConnect({ library = 'ai-archivos', operations = [] } = {}) {
  return requestConnect(`${FILES_PATH}/organize`, {
    method: 'POST',
    body: JSON.stringify({ platform: PLATFORM, library, operations })
  });
}

export async function indexFileConnect(id, metadata = {}) {
  return requestConnect(filePath(id, 'index'), {
    method: 'POST',
    body: JSON.stringify({ platform: PLATFORM, metadata })
  });
}

export const fileConnectClient = Object.freeze({
  uploadFileConnect,
  listFilesConnect,
  downloadFileConnect,
  moveFileConnect,
  renameFileConnect,
  organizeFilesConnect,
  indexFileConnect
});

