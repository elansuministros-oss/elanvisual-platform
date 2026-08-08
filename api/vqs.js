/* eslint-disable no-console */

export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } },
  maxDuration: 60
};

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH']);
const ALLOWED_PATHS = [
  /^customers\/search$/,
  /^customers\/directory-search$/,
  /^design\/search$/,
  /^quotations$/,
  /^quotations\/[0-9a-f-]{36}$/i,
  /^quotations\/[0-9a-f-]{36}\/send-whatsapp$/i
];

function getConfig() {
  const baseUrl = String(process.env.CONNECT_BASE_URL || process.env.ELANKAV_CONNECT_URL || 'https://connect.elankav.com')
    .trim().replace(/\/+$/, '');
  const token = String(
    process.env.CONNECT_VQS_TOKEN ||
    process.env.CONNECT_DESIGN_TOKEN ||
    ''
  ).trim();
  if (!token) {
    const error = new Error('Token interno de CONNECT no configurado en ELANVISUAL.');
    error.code = 'CONNECT_INTERNAL_TOKEN_NOT_CONFIGURED';
    throw error;
  }
  return { baseUrl, token };
}

function normalizePath(req) {
  const raw = Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path || '');
  return raw.split('?')[0].replace(/^\/+|\/+$/g, '');
}

function buildQuery(req) {
  const params = new URLSearchParams();
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === 'path' || value === undefined) return;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSource(source = {}) {
  const rawType = String(source.type || '').trim().toLowerCase();
  const type = rawType === 'design-request' ? 'design' : (rawType || 'manual');
  return {
    ...source,
    type,
    originalType: rawType || source.originalType || ''
  };
}

function normalizeQuotationContract(body, path, method) {
  if (!body || method === 'GET' || !/^quotations(?:\/[0-9a-f-]{36})?$/i.test(path)) return body;

  const source = normalizeSource(object(body.source));
  const customer = object(body.customerSnapshot || body.customer);
  const executive = object(body.executiveSnapshot || body.executive);
  const payments = object(body.paymentTerms || body.payments);
  const existingQuotation = object(body.quotation);
  const existingRelations = object(body.relations);
  const existingQuotationSource = normalizeSource(object(existingQuotation.source));

  return {
    ...body,
    quotation: {
      ...existingQuotation,
      source: Object.keys(object(existingQuotation.source)).length ? existingQuotationSource : source,
      status: existingQuotation.status || 'draft'
    },
    relations: {
      ...existingRelations,
      customerId: existingRelations.customerId || customer.customerId || customer.id || '',
      executiveId: existingRelations.executiveId || executive.executiveId || executive.id || '',
      designRequestId: existingRelations.designRequestId || source.designRequestId || '',
      originalSourceType: existingRelations.originalSourceType || source.originalType || ''
    },
    customerSnapshot: customer,
    executiveSnapshot: executive,
    paymentTerms: payments
  };
}

export default async function handler(req, res) {
  if (!ALLOWED_METHODS.has(req.method)) {
    return res.status(405).json({ error: 'Método no permitido.', code: 'METHOD_NOT_ALLOWED' });
  }

  const path = normalizePath(req);
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
    return res.status(404).json({ error: 'Ruta VQS no permitida.', code: 'VQS_PROXY_ROUTE_NOT_ALLOWED' });
  }

  try {
    const { baseUrl, token } = getConfig();
    const requestBody = normalizeQuotationContract(req.body, path, req.method);
    const response = await fetch(`${baseUrl}/api/v1/business/vqs/${path}${buildQuery(req)}`, {
      method: req.method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Elankav-Platform': 'ELANVISUAL',
        'X-Elankav-Source': 'elanvisual-vqs',
        ...(requestBody !== undefined && req.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        ...(req.headers['idempotency-key'] ? { 'Idempotency-Key': String(req.headers['idempotency-key']) } : {})
      },
      ...(requestBody !== undefined && req.method !== 'GET' ? { body: JSON.stringify(requestBody) } : {})
    });
    const payload = await response.json().catch(() => ({ error: `CONNECT HTTP ${response.status}`, code: 'CONNECT_INVALID_RESPONSE' }));
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error('ERROR proxy VQS ELANVISUAL → CONNECT:', error);
    return res.status(error?.code === 'CONNECT_INTERNAL_TOKEN_NOT_CONFIGURED' ? 503 : 502).json({
      error: error?.message || 'No fue posible comunicar ELANVISUAL con CONNECT.',
      code: error?.code || 'CONNECT_VQS_PROXY_FAILED'
    });
  }
}
