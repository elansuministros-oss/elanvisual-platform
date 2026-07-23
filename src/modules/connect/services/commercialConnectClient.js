const LOCAL_CONNECT_URL = 'http://localhost:4300';
const DEFAULT_CONNECT_URL = 'https://elankav-connect.vercel.app';
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

  return DEFAULT_CONNECT_URL;
}

function resolveElanvisualBaseUrl() {
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return window.location.origin;
  }

  return DEFAULT_ELANVISUAL_URL;
}

async function request(path, options = {}) {
  const baseUrl = resolveConnectBaseUrl();
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

function resolveCommercialAmounts(contract = {}) {
  const pricing = contract?.pricing || {};
  const itemSubtotal = (Array.isArray(contract?.items) ? contract.items : []).reduce((sum, item) => {
    const subtotal = Number(item?.subtotalUsd ?? item?.subtotal_usd);
    if (Number.isFinite(subtotal)) return sum + subtotal;

    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPriceUsd ?? item?.unit_price_usd ?? 0);
    return sum + (Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0);
  }, 0);

  const subtotal = Number(
    pricing.subtotalUsd
    ?? pricing.subtotalUSD
    ?? pricing.subtotal_usd
    ?? pricing.subtotal
    ?? itemSubtotal
  );
  const discountAmount = Number(pricing.discountUsd ?? pricing.discount_usd ?? pricing.discountAmount ?? 0);
  const taxAmount = Number(pricing.taxUsd ?? pricing.tax_usd ?? pricing.taxAmount ?? 0);
  const directTotal = Number(
    pricing.totalUsd
    ?? pricing.totalUSD
    ?? pricing.total_usd
    ?? pricing.total
    ?? 0
  );
  const calculatedTotal = subtotal - discountAmount + taxAmount;

  return {
    subtotal: Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0,
    discountAmount: Number.isFinite(discountAmount) && discountAmount >= 0 ? discountAmount : 0,
    taxAmount: Number.isFinite(taxAmount) && taxAmount >= 0 ? taxAmount : 0,
    total: Number.isFinite(directTotal) && directTotal > 0
      ? directTotal
      : (Number.isFinite(calculatedTotal) && calculatedTotal > 0 ? calculatedTotal : 0)
  };
}

function resolveEstimatedValue(contract = {}) {
  return resolveCommercialAmounts(contract).total;
}

function resolvePaymentTerms(contract = {}) {
  const terms = contract?.paymentTerms || contract?.payment_terms || contract?.payments || {};
  if (typeof terms === 'string' && terms.trim()) return terms.trim();

  const installments = Array.isArray(terms?.installments)
    ? terms.installments
    : Array.isArray(contract?.paymentPlan)
      ? contract.paymentPlan
      : [];

  const formatted = installments.map((entry) => {
    const percentage = Number(entry?.percentage ?? entry?.percent ?? 0);
    const label = String(entry?.label || entry?.name || entry?.dueCondition || '').trim();
    return [percentage > 0 ? `${percentage}%` : '', label].filter(Boolean).join(' ');
  }).filter(Boolean);

  return formatted.length ? formatted.join(' / ') : undefined;
}

function resolveValidUntil(contract = {}) {
  const value = contract?.validUntil
    || contract?.valid_until
    || contract?.project?.validUntil
    || contract?.project?.valid_until;
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
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
  const amounts = resolveCommercialAmounts(contract);
  const notes = buildCommercialNotes({ quotationNumber, projectId, customer, source });
  const title = project.title || `Cotización ${quotationNumber || projectId || 'ELANVISUAL'}`;

  const lead = await request('/api/v1/leads', {
    method: 'POST',
    body: JSON.stringify({
      name: title,
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

  const opportunity = await request('/api/v1/opportunities', {
    method: 'POST',
    body: JSON.stringify({
      leadId: lead.id,
      title,
      platform: 'ELANVISUAL',
      stage: 'proposal',
      estimatedValue: amounts.total,
      currency: 'USD',
      probability: 50,
      expectedCloseDate: project.expectedDeliveryAt || undefined,
      notes
    })
  });

  const quote = await request(`/api/v1/opportunities/${encodeURIComponent(opportunity.id)}/quotes`, {
    method: 'POST',
    body: JSON.stringify({
      title: quotationNumber ? `${quotationNumber} · ${title}` : title,
      platform: 'ELANVISUAL',
      currency: 'USD',
      subtotal: amounts.subtotal,
      discountAmount: amounts.discountAmount,
      taxAmount: amounts.taxAmount,
      validUntil: resolveValidUntil(contract),
      paymentTerms: resolvePaymentTerms(contract),
      notes,
      createdBy: contract?.executive?.name || contract?.seller?.name || 'ELANVISUAL'
    })
  });

  return { lead, opportunity, quote };
}

export const commercialConnectClient = Object.freeze({
  syncQuotationCommercialFlow
});

export {
  resolveCommercialAmounts,
  resolveConnectBaseUrl,
  resolveEstimatedValue,
  resolveProjectId
};
