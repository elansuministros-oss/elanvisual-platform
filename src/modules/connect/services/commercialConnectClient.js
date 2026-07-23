const LOCAL_CONNECT_URL = 'http://localhost:4300';
const DEFAULT_ELANVISUAL_URL = 'https://visual.elankav.com';

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

function resolveElanvisualBaseUrl() {
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return window.location.origin;
  }

  return DEFAULT_ELANVISUAL_URL;
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
    || projectResponse?.data?.project_id
    || projectResponse?.data?.project?.id
    || projectResponse?.data?.project?.projectId
    || projectResponse?.data?.project?.project_id
    || projectResponse?.projectId
    || projectResponse?.project_id
    || projectResponse?.project?.id
    || projectResponse?.project?.projectId
    || projectResponse?.project?.project_id
    || projectResponse?.id
    || '';
}

function resolveQuotationNumber(projectResponse = {}) {
  return projectResponse?.data?.quotationNumber
    || projectResponse?.data?.quotation_number
    || projectResponse?.quotationNumber
    || projectResponse?.quotation_number
    || '';
}

function resolveEstimatedValue(contract = {}) {
  const pricing = contract?.pricing || {};
  const directValue = Number(
    pricing.totalUsd
    ?? pricing.totalUSD
    ?? pricing.total_usd
    ?? pricing.total
    ?? 0
  );

  if (Number.isFinite(directValue) && directValue > 0) return directValue;

  const calculated = (Array.isArray(contract?.items) ? contract.items : []).reduce((sum, item) => {
    const subtotal = Number(item?.subtotalUsd ?? item?.subtotal_usd);
    if (Number.isFinite(subtotal)) return sum + subtotal;

    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPriceUsd ?? item?.unit_price_usd ?? 0);
    return sum + (Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0);
  }, 0);

  const discount = Number(pricing.discountUsd ?? pricing.discount_usd ?? 0);
  const tax = Number(pricing.taxUsd ?? pricing.tax_usd ?? 0);
  const net = calculated - (Number.isFinite(discount) ? discount : 0) + (Number.isFinite(tax) ? tax : 0);
  return Number.isFinite(net) && net > 0 ? net : 0;
}

function buildCommercialNotes({ quotationNumber, projectId, customer, source }) {
  const quotationUrl = projectId
    ? `${resolveElanvisualBaseUrl()}/cotizaciones/${encodeURIComponent(projectId)}`
    : '';

  return [
    quotationNumber ? `Cotización: ${quotationNumber}` : '',
    projectId ? `Project Core: ${projectId}` : '',
    customer?.name ? `Cliente: ${customer.name}` : '',
    customer?.companyName ? `Empresa: ${customer.companyName}` : '',
    customer?.phone ? `WhatsApp: ${customer.phone}` : '',
    source?.type ? `Origen: ${source.type}` : '',
    quotationUrl ? `URL: ${quotationUrl}` : ''
  ].filter(Boolean).join(' · ') || undefined;
}

export async function syncQuotationCommercialFlow(contract, projectResponse = {}) {
  const customer = contract?.customer || {};
  const project = contract?.project || {};
  const source = contract?.source || {};
  const projectId = resolveProjectId(projectResponse);
  const quotationNumber = resolveQuotationNumber(projectResponse);
  const estimatedValue = resolveEstimatedValue(contract);
  const notes = buildCommercialNotes({ quotationNumber, projectId, customer, source });

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
      notes
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
      estimatedValue,
      currency: 'USD',
      probability: 50,
      expectedCloseDate: project.expectedDeliveryAt || undefined,
      notes
    })
  });

  return { lead, opportunity };
}

export const commercialConnectClient = Object.freeze({
  syncQuotationCommercialFlow
});

export { resolveConnectBaseUrl, resolveEstimatedValue, resolveProjectId };
