import { requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';

export async function getPlatformStateConnect() {
  return requestConnect(`/api/v1/platforms/${encodeURIComponent(PLATFORM)}/state`, { method: 'GET' });
}

export async function updatePlatformStateConnect(state) {
  return requestConnect(`/api/v1/platforms/${encodeURIComponent(PLATFORM)}/state`, {
    method: 'PUT',
    body: JSON.stringify({ platform: PLATFORM, state })
  });
}

export async function getCoreSnapshotConnect() {
  return requestConnect('/api/v1/core/snapshot', { method: 'GET' });
}

export async function mutateCoreEntityConnect({ entity, action, id = '', data = {} } = {}) {
  return requestConnect(`/api/v1/core/${encodeURIComponent(entity)}${id ? `/${encodeURIComponent(id)}` : ''}`, {
    method: action === 'delete' ? 'DELETE' : action === 'update' ? 'PATCH' : 'POST',
    body: JSON.stringify({
      platform: PLATFORM,
      entity,
      action,
      data
    })
  });
}

export const contextConnectClient = Object.freeze({
  getPlatformStateConnect,
  updatePlatformStateConnect,
  getCoreSnapshotConnect,
  mutateCoreEntityConnect
});

