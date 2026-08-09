export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } },
  maxDuration: 30
};

const CONNECT_VQS_PATH = '/api/v1/business/vqs';
const DEFAULT_CONNECT_URL = 'https://connect.elankav.com';
const DEFAULT_LEGACY_URL = 'https://orchestrator.elankav.com';
const TIMEOUT_MS = 12_000;
const MAX_ASSET_BYTES = 8 * 1024 * 1024;
const DEFAULT_ASSET_BUCKET = 'elanvisual';
const ASSET_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function text(value) {
  return String(value || '').trim();
}

function storageHeaders(serviceKey, extra = {}) {
  return {
    apikey: serviceKey,
    ...(serviceKey.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${serviceKey}` }),
    ...extra
  };
}

function sanitizeAssetName(value) {
  const name = text(value || 'imagen').slice(0, 120).replace(/[^a-zA-Z0-9._-]+/g, '-');
  return name || 'imagen';
}

function isTrustedAssetRequest(req) {
  if (text(req.headers['sec-fetch-site']).toLowerCase() === 'same-origin') return true;
  const origin = text(req.headers.origin);
  if (!origin) return process.env.VERCEL_ENV !== 'production';
  try {
    const url = new URL(origin);
    return origin === 'https://visual.elankav.com'
      || ['localhost', '127.0.0.1'].includes(url.hostname)
      || (url.protocol === 'https:'
        && url.hostname.startsWith('elanvisual-platform-')
        && url.hostname.endsWith('.vercel.app'));
  } catch {
    return false;
  }
}

export function parseQuotationAsset(body = {}) {
  const match = text(body.dataUrl).match(/^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    const error = new Error('La fotografía debe ser JPG, PNG o WEBP.');
    error.code = 'VQS_ASSET_INVALID';
    error.status = 400;
    throw error;
  }
  const mimeType = match[1].toLowerCase();
  if (!ASSET_MIME_TYPES.has(mimeType)) {
    const error = new Error('Formato de fotografía no permitido.');
    error.code = 'VQS_ASSET_MIME_NOT_ALLOWED';
    error.status = 400;
    throw error;
  }
  const bytes = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (!bytes.length || bytes.length > MAX_ASSET_BYTES) {
    const error = new Error('Cada fotografía debe pesar menos de 8 MB.');
    error.code = 'VQS_ASSET_SIZE_INVALID';
    error.status = 400;
    throw error;
  }
  return {
    bytes,
    mimeType,
    name: sanitizeAssetName(body.name),
    itemId: sanitizeAssetName(body.itemId || 'item')
  };
}

async function uploadQuotationAsset(req, res, requestId) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.', code: 'METHOD_NOT_ALLOWED', requestId });
  }
  if (!isTrustedAssetRequest(req)) {
    return res.status(403).json({ error: 'Origen no permitido.', code: 'VQS_ASSET_ORIGIN_FORBIDDEN', requestId });
  }

  const supabaseUrl = text(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const serviceKey = text(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  const bucket = text(process.env.VQS_ASSET_BUCKET || process.env.VITE_SUPABASE_BUCKET || DEFAULT_ASSET_BUCKET);
  if (!supabaseUrl || !serviceKey || !bucket) {
    return res.status(503).json({
      error: 'El almacenamiento de fotografías no está configurado.',
      code: 'VQS_ASSET_STORAGE_NOT_CONFIGURED',
      requestId
    });
  }

  const asset = parseQuotationAsset(req.body || {});
  const day = new Date().toISOString().slice(0, 10);
  const objectPath = `quotations/${day}/${asset.itemId}-${crypto.randomUUID()}-${asset.name}`;
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'POST',
      headers: storageHeaders(serviceKey, {
        'Content-Type': asset.mimeType,
        'x-upsert': 'false'
      }),
      body: asset.bytes
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(502).json({
      error: payload?.message || payload?.error || 'No fue posible almacenar la fotografía.',
      code: 'VQS_ASSET_STORAGE_FAILED',
      requestId
    });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
  return res.status(201).json({
    data: {
      kind: 'existing-product-photo',
      name: asset.name,
      mimeType: asset.mimeType,
      sizeBytes: asset.bytes.length,
      bucket,
      path: objectPath,
      objectPath,
      publicUrl,
      signedUrl: publicUrl,
      url: publicUrl
    },
    requestId
  });
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
  if (path === '/assets') return '/assets';
  if (path === '/customers/search') return '/customers/directory-search';
  // Context is an ELANVISUAL aggregate: it must include both DESIGN requests
  // and Store products.  It is handled by the proxy below, not reduced to the
  // DESIGN endpoint.
  if (path === '/context/search') return null;

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

function payloadItems(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ['results', 'items', 'products', 'catalogItems', 'data']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

export function mapCatalogItemToContextResult(item = {}) {
  const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const prices = Array.isArray(item.prices) ? item.prices : [];
  const activePrice = prices.find((price) => price?.active !== false) || {};
  const unitPrice = Number(item.salePrice ?? activePrice.salePrice ?? activePrice.price ?? metadata.salePrice ?? metadata.price ?? 0);
  const productId = text(item.id || item.code || metadata.sku);
  const title = text(item.name || item.title || item.code || 'Producto ELANVISUAL');
  return {
    type: 'store',
    sourceId: productId,
    label: title,
    project: { title },
    source: { type: 'store', sourceId: productId, storeProductId: productId },
    items: [{
      itemId: productId,
      productId,
      title,
      description: text(item.description),
      quantity: 1,
      unit: text(item.unit || 'unidad'),
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      imageUrl: text(metadata.imageUrl || metadata.image_url || metadata.image)
    }]
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`CONNECT respondió ${response.status}.`);
  return payload?.data ?? payload;
}

async function searchContextConnect({ upstream, query, type, limit, headers, signal }) {
  const connectBaseUrl = upstream.baseUrl.replace(/\/api\/v1\/business\/vqs$/, '');
  const params = new URLSearchParams({ q: query, limit: String(limit), platform: 'ELANVISUAL' });
  const wantsDesign = type !== 'store';
  const wantsStore = type !== 'design';
  const requests = [];
  if (wantsDesign) requests.push(fetchJson(`${upstream.baseUrl}/design/search?${params}`, { headers, signal }));
  if (wantsStore) requests.push(fetchJson(`${connectBaseUrl}/api/v1/catalog/items?${params}&active=true`, { headers, signal }));
  const settled = await Promise.allSettled(requests);
  const successful = settled.filter((entry) => entry.status === 'fulfilled');
  if (!successful.length) throw settled[0]?.reason || new Error('CONNECT no pudo consultar el contexto.');
  let position = 0;
  const results = [];
  if (wantsDesign) {
    const design = settled[position++];
    if (design?.status === 'fulfilled') results.push(...payloadItems(design.value));
  }
  if (wantsStore) {
    const store = settled[position++];
    if (store?.status === 'fulfilled') results.push(...payloadItems(store.value).map(mapCatalogItemToContextResult));
  }
  return { query, type: type || 'all', count: results.length, results: results.slice(0, limit) };
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
    const localPath = safePath(req);
    if (localPath.replace(/^\/+/, '') === 'assets') {
      return await uploadQuotationAsset(req, res, requestId);
    }

    const upstream = resolveUpstream();
    const isContextSearch = upstream.mode === 'connect' && localPath.replace(/^\/+/, '') === 'context/search';
    const upstreamPath = mapVqsPath(localPath, upstream.mode);
    if (!upstreamPath && !isContextSearch) {
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

    if (isContextSearch) {
      const query = text(req.query?.q);
      const type = text(req.query?.type || 'all').toLowerCase();
      const limit = Math.min(Math.max(Number(req.query?.limit) || 30, 1), 100);
      if (!query) return res.status(400).json({ error: 'El texto de búsqueda es obligatorio.', code: 'VQS_CONTEXT_QUERY_REQUIRED', requestId });
      const payload = await searchContextConnect({ upstream, query, type, limit, headers, signal: controller.signal });
      clearTimeout(timer);
      return res.status(200).json(payload);
    }
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
