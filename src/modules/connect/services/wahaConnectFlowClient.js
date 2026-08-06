const DEFAULT_ORCHESTRATOR_URL = 'https://orchestrator.elankav.com';

function resolveOrchestratorBaseUrl() {
  const configured = typeof import.meta.env === 'object'
    ? import.meta.env.VITE_ELANKAV_ORCHESTRATOR_URL
    : '';
  return String(configured || DEFAULT_ORCHESTRATOR_URL).trim().replace(/\/$/, '');
}

export function isWahaFlowUnavailableError(error) {
  return error?.status === 404 || error?.status === 501 || error?.status === 503 || error?.name === 'TypeError';
}

export async function routeWahaMessageToOrchestrator({ lead, actor = null } = {}) {
  const response = await fetch(`${resolveOrchestratorBaseUrl()}/api/waha/messages/intake`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Elankav-Platform': lead?.unidadNegocio || 'ELANVISUAL',
      'X-Elankav-Actor-Type': actor ? 'user' : 'waha'
    },
    body: JSON.stringify({
      source: 'WAHA',
      route: ['WAHA', 'ORCHESTRATOR', 'CONNECT', 'ELAN_AI'],
      platform: lead?.unidadNegocio || 'ELANVISUAL',
      actor,
      message: {
        customerName: lead?.nombre || '',
        whatsapp: lead?.whatsapp || '',
        text: lead?.mensaje || '',
        service: lead?.servicioSolicitado || '',
        classification: lead?.clasificacion || '',
        status: lead?.estadoLead || 'Nuevo',
        followup: lead?.seguimiento || '',
        responsible: lead?.responsable || ''
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || 'No fue posible enrutar WhatsApp por Orchestrator.');
    error.status = response.status;
    error.code = payload?.code || 'WAHA_ORCHESTRATOR_ROUTE_FAILED';
    throw error;
  }

  return payload?.data ?? payload;
}

