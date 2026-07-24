import { requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';
const ACTIONS_PATH = '/api/v1/ai/actions';

export async function executeAiActionConnect({ action, contexto = {}, actor = {}, confirmacion = null } = {}) {
  if (!action) throw new Error('Accion AI requerida.');

  return requestConnect(`${ACTIONS_PATH}/${encodeURIComponent(action)}`, {
    method: 'POST',
    body: JSON.stringify({
      platform: PLATFORM,
      action,
      actor,
      confirmacion,
      context: contexto
    })
  });
}

export async function listAiCapabilitiesConnect() {
  const result = await requestConnect(ACTIONS_PATH, { method: 'GET' });
  return Array.isArray(result) ? result : result?.actions || result?.capabilities || [];
}

export const aiOperatorConnectClient = Object.freeze({
  executeAiActionConnect,
  listAiCapabilitiesConnect
});

