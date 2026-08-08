export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } },
  maxDuration: 30
};

const CONNECT_VQS_PATH = '/api/v1/business/vqs';
const DEFAULT_CONNECT_URL = 'https://connect.elankav.com';
const DEFAULT_LEGACY_URL = 'https://orchestrator.elankav.com';
const TIMEOUT_MS = 12_000;

function text(value) {
  return String(value || '').trim();
}

export function resolveUpstream(env = process.env) {
  const mode = text(env.VQS_UPSTREAM || 'connect').toLowerCase();
  if (mode === 'legacy') {
    return {
      mode,
      baseUrl: text(env.VQS_LEGACY_BASE_URL || DEFAULT_LEGACY_URL).replace(/\/+$/, ''),
      token: ''
    };
  }

  const token = text(env.VQS_API_TOKEN);
  if (!token) {
    const error = new Error('VQS_API_TOKEN no está configurado en ELANVISUAL.');
    error.code = 'VQS_CONNECT_NOT_CONFIGURED';
    throw error;
  }

  return {
    mode: 'connect',
    baseUrl: `${text(env.CONNECT_BASE_URL || DEFAULT_CONNECT_URL).replace(/\/+$/, '')}${CONNECT_VQS_PATH}`,
    token
  };
}

export function mapVqsPath(pathname, mode = 'connect') {
  const path = `/${String(pathname || '').replace(/^\/+/, '')}`;
  if (mode === 'legacy') return `/api/vqs${path}`;

  if (path === '/projects') return '/quotations';
  if (path === '/customers/search') return '/customers/directory-search';
  if (path === '/context/search') return '/design/search';

  const project = path.match(/^\/projects\/([^/]+)(?:\/(status|send-whatsapp))?$/);
  if (project) {
    const [, id, operation] = project;
    if (operation === 'status') return `/quotations/${id}`;
    if (operation === 'send-whatsapp') return `/quotations/${id}/send-whatsapp`;
    return `/quotations/${id}`;
  }

  const publicQuotation = path.match(/^\/public\/quotations\/([^/]+)$/);
  if (publicQuotation) return `/quotations/${publicQuotation[1]}`;

  return null;
}

export function adaptQuotationDocument(body = {}) {
  if (body.quotation && body.customerSnapshot && body.executiveSnapshot && body.paymentTerms) return body;

  const customer = body.customer || {};
  const executive = body.executive || {};
  const pricing = body.pricing || {};
  const payments = body.payments || body.paymentTerms || {};
  const items = Array.isArray(body.items) ? body.items : [];

  return {
    contractVersion: text(body.contractVersion || body.schemaVersion || '1.0.0'),
    quotation: {
      quotationNumber: text(body.quotationNumber),
      status: text(body.status || 'draft'),
      issuedAt: text(body.issuedAt),
      validUntil: text(body.validUntil),
      source: body.source || {}
    },
    project: body.project || {},
    relations: {
      customerId: text(body.customerId || customer.customerId || customer.id),
      executiveId: text(executive.executiveId || executive.id),
      source: body.source || {}
    },
    customerSnapshot: { ...customer, customerId: text(body.customerId || customer.customerId || customer.id) },
    executiveSnapshot: { ...executive, executiveId: text(executive.executiveId || executive.id) },
    items: items.map((item) => ({
      ...item,
      id: item.id || item.itemId,
      commercialDescription: item.commercialDescription || item.description || '',
      unitPrice: Number(item.unitPrice ?? item.unitPriceUsd ?? 0),
      subtotal: Number(item.subtotal ?? item.subtotalUsd ?? 0),
      images: Array.isArray(item.images) ? item.images : (item.imageUrl ? [item.imageUrl] : [])
    })),
    pricing: {
      ...pricing,
      subtotalUsd: Number(pricing.subtotalUsd ?? pricing.subtotal ?? 0),
      discountUsd: Number(pricing.discountUsd ?? pricing.discount ?? 0),
      taxUsd: Number(pricing.taxUsd ?? pricing.tax ?? 0),
      totalUsd: Number(pricing.totalUsd ?? pricing.total ?? 0),
      payableTotalNio: Number(pricing.payableTotalNio ?? pricing.convertedTotal ?? 0)
    },
    paymentTerms: payments,
    brandSnapshot: body.brandSnapshot || {},
    template: body.template || {},
    metadata: body.metadata || {}
  };
}

function safePath(req) {
  const dynamic = req.query?.path;
  if (Array.isArray(dynamic)) return dynamic.join('/');
  if (dynamic) return dynamic;
  return String(req.url || '').split('?')[0].replace(/^\/api\/vqs\/?/, '');
}

function queryString(req) {
  const raw = String(req.url || '');
  const index = raw.indexOf('?');
  return index >= 0 ? raw.slice(index) : '';
}

function isWrite(method) {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(String(method || '').toUpperCase());
}

export default async function handler(req, res) {
  const requestId = text(req.headers['x-request-id']) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);

  try {
    const upstream = resolveUpstream();
    const localPath = safePath(req);
    const upstreamPath = mapVqsPath(localPath, upstream.mode);
    if (!upstreamPath) {
      return res.status(404).json({ error: 'Ruta VQS no disponible en CONNECT.', code: 'VQS_ROUTE_NOT_SUPPORTED', requestId });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const headers = {
      Accept: 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Actor-Type': text(req.headers['x-elankav-actor-type']) || 'user',
      'X-Request-Id': requestId,
      ...(upstream.token ? { Authorization: `Bearer ${upstream.token}` } : {}),
      ...(req.headers['idempotency-key'] ? { 'Idempotency-Key': String(req.headers['idempotency-key']) } : {}),
      ...(isWrite(req.method) ? { 'Content-Type': 'application/json' } : {})
    };
    const body = isWrite(req.method) && req.body !== undefined
      ? JSON.stringify(upstream.mode === 'connect' && /^(\/projects)(\/|$)/.test(`/${localPath}`) && !/\/send-whatsapp$/.test(localPath)
        ? adaptQuotationDocument(req.body)
        : req.body)
      : undefined;

    let response;
    try {
      response = await fetch(`${upstream.baseUrl}${upstreamPath}${queryString(req)}`, {
        method: req.method,
        headers,
        body,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    const payload = await response.json().catch(() => ({}));
    return res.status(response.status).json(payload);
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    const status = error?.code === 'VQS_CONNECT_NOT_CONFIGURED' ? 503 : (timedOut ? 504 : 502);
    return res.status(status).json({
      error: timedOut ? 'CONNECT no respondió dentro del tiempo permitido.' : 'No fue posible comunicar ELANVISUAL con CONNECT.',
      code: error?.code || (timedOut ? 'VQS_CONNECT_TIMEOUT' : 'VQS_CONNECT_PROXY_FAILED'),
      requestId
    });
  }
}
