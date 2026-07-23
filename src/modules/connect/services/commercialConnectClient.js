const LOCAL_CONNECT_URL = 'http://localhost:4300';

function resolveConnectBaseUrl() {
  const configured = typeof import.meta.env === 'object'
    ? import.meta.env.VITE_ELANKAV_CONNECT_URL
    : '';

  if (String(configured || '').trim()) {
    return String(configured).trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return LOCAL_CONNECT_URL;
  }

  return '';
}

async function request(path, options = {}) {
  const baseUrl = resolveConnectBaseUrl();
  if (!baseUrl) {
    return { skipped: true, reason: 'ELANKAV_CONNECT_URL_NOT_CONFIGURED' };
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'No fue posible sincronizar con ELANKAV CONNECT.');
    error.code = payload?.error?.code || 'ELANKAV_CONNECT_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }

  return payload;
}

function resolveProjectId(projectResponse = {}) {
  return projectResponse?.data?.projectId
    || projectResponse?.data?.id
    || projectResponse?.projectId
    || projectResponse?.id
    || '';
}

function resolveQuotationNumber(projectResponse = {}) {
  return projectResponse?.data?.quotationNumber
    || projectResponse?.quotationNumber
    || '';
}

export async function syncQuotationCommercialFlow(contract, projectResponse = {}) {
  const customer = contract?.customer || {};
  const project = contract?.project || {};
  const pricing = contract?.pricing || {};
  const source = contract?.source || {};
  const projectId = resolveProjectId(projectResponse);
  const quotationNumber = resolveQuotationNumber(projectResponse);

  const lead = await request('/api/v1/leads', {
    method: 'POST',
    body: JSON.stringify({
      name: project.title || `Cotización ${quotationNumber || projectId || 'ELANVISUAL'}`,
      company: customer.companyName || undefined,
      contactPerson: customer.name || undefined,
      phone: customer.phone || undefined,
      whatsapp: customer.phone || undefined,
      email: customer.email || undefined,
      source: source.type || 'cotizador',
      platform: 'ELANVISUAL',
      priority: project.priority === 'urgent' ? 'urgent' : 'medium',
      tags: ['cotizacion', source.type || 'manual'],
      notes: [
        quotationNumber ? `Cotización: ${quotationNumber}` : '',
        projectId ? `Project Core: ${projectId}` : ''
      ].filter(Boolean).join(' · ') || undefined
    })
  });

  if (lead?.skipped) return lead;

  const opportunity = await request('/api/v1/opportunities', {
    method: 'POST',
    body: JSON.stringify({
      leadId: lead.id,
      title: project.title || `Cotización ${quotationNumber || projectId || 'ELANVISUAL'}`,
      platform: 'ELANVISUAL',
      stage: 'proposal',
      estimatedValue: Number(pricing.totalUsd || 0),
      currency: 'USD',
      probability: 50,
      expectedCloseDate: project.expectedDeliveryAt || undefined,
      notes: [
        quotationNumber ? `Cotización: ${quotationNumber}` : '',
        projectId ? `Project Core: ${projectId}` : ''
      ].filter(Boolean).join(' · ') || undefined
    })
  });

  return { lead, opportunity };
}

export const commercialConnectClient = Object.freeze({
  syncQuotationCommercialFlow
});

export { resolveConnectBaseUrl };
