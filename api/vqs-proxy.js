const DEFAULT_CONNECT_BASE_URL = 'https://connect.elankav.com';
const CONNECT_VQS_BASE = '/api/v1/business/vqs';

function text(value) {
  return String(value ?? '').trim();
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getPath(req) {
  const raw = req.query?.path;

  if (Array.isArray(raw)) {
    return raw.map(text).filter(Boolean).join('/');
  }

  return text(raw);
}

function resolveConfig() {
  const baseUrl = text(process.env.CONNECT_BASE_URL || DEFAULT_CONNECT_BASE_URL)
    .replace(/\/+$/, '');

  const token = text(process.env.VQS_API_TOKEN);

  if (!token) {
    const error = new Error('VQS_API_TOKEN_REQUIRED');
    error.code = 'VQS_API_TOKEN_REQUIRED';
    error.status = 503;
    throw error;
  }

  return { baseUrl, token };
}

function isPublicPath(path) {
  const clean = text(path).replace(/^\/+|\/+$/g, '');
  return /^public\/quotations\/[^/]+$/.test(clean);
}

function resolveSupabaseAuthConfig() {
  const url = text(
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL
  ).replace(/\/+$/, '');

  const key = text(
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
  );

  if (!url || !key) {
    const error = new Error('SUPABASE_AUTH_CONFIG_REQUIRED');
    error.code = 'SUPABASE_AUTH_CONFIG_REQUIRED';
    error.status = 503;
    throw error;
  }

  return { url, key };
}

async function requireAuthenticatedUser(req) {
  const authorization = text(req.headers.authorization);

  if (!authorization.startsWith('Bearer ')) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    error.status = 401;
    throw error;
  }

  const jwt = authorization.slice(7).trim();

  if (!jwt) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    error.status = 401;
    throw error;
  }

  const { url, key } = resolveSupabaseAuthConfig();

  const response = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${jwt}`
    }
  });

  const user = await response.json().catch(() => ({}));

  if (!response.ok || !user?.id) {
    const error = new Error('AUTH_INVALID');
    error.code = 'AUTH_INVALID';
    error.status = 401;
    throw error;
  }

  return user;
}
function mapLegacyPath(path, query = {}) {
  const clean = text(path).replace(/^\/+|\/+$/g, '');

  if (!clean || clean === 'projects') {
    return { upstreamPath: '/quotations' };
  }

  if (clean === 'customers/search') {
    return { upstreamPath: '/customers/directory-search' };
  }

  if (clean === 'context/search') {
    const type = text(query.type || 'all');

    if (type === 'design' || type === 'all') {
      return { upstreamPath: '/design/search' };
    }

    const error = new Error(`VQS_CONTEXT_TYPE_NOT_MAPPED:${type}`);
    error.code = 'VQS_CONTEXT_TYPE_NOT_MAPPED';
    error.status = 501;
    throw error;
  }

  let match = clean.match(/^projects\/([^/]+)$/);
  if (match) {
    return {
      upstreamPath: `/quotations/${encodeURIComponent(match[1])}`
    };
  }

  match = clean.match(/^projects\/([^/]+)\/status$/);
  if (match) {
    return {
      upstreamPath: `/quotations/${encodeURIComponent(match[1])}`,
      transform: 'status'
    };
  }

  match = clean.match(/^projects\/([^/]+)\/payments(?:\/([^/]+))?$/);
  if (match) {
    return {
      upstreamPath:
        `/quotations/${encodeURIComponent(match[1])}/payments` +
        (match[2] ? `/${encodeURIComponent(match[2])}` : '')
    };
  }

  match = clean.match(/^projects\/([^/]+)\/send-whatsapp$/);
  if (match) {
    return {
      upstreamPath:
        `/quotations/${encodeURIComponent(match[1])}/send-whatsapp`
    };
  }

  match = clean.match(/^public\/quotations\/([^/]+)$/);
  if (match) {
    return {
      upstreamPath: `/quotations/${encodeURIComponent(match[1])}`,
      transform: 'public'
    };
  }

  if (clean === 'assets') {
    const error = new Error('VQS_ASSETS_NOT_MIGRATED');
    error.code = 'VQS_ASSETS_NOT_MIGRATED';
    error.status = 501;
    throw error;
  }

  const error = new Error(`VQS_ROUTE_NOT_MAPPED:${clean}`);
  error.code = 'VQS_ROUTE_NOT_MAPPED';
  error.status = 404;
  throw error;
}

function buildQuery(req) {
  const params = new URLSearchParams();

  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === 'path') return;

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function transformPayload(transform, payload) {
  if (!transform) return payload;

  const record = payload?.data || payload || {};

  if (transform === 'status') {
    return {
      data: {
        projectId: record.projectId || record.project_id || '',
        quotationId: record.quotationId || record.quotation_id || '',
        status: record.status || ''
      }
    };
  }

  if (transform === 'public') {
    const document =
      record?.quotation_document ||
      record?.quotationDocument ||
      {};

    const publicDocument =
      document?.publicDocument ||
      {};

    return {
      data: publicDocument
    };
  }

  return payload;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const requestId =
    text(req.headers['x-request-id']) ||
    `vqs-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    const { baseUrl, token } = resolveConfig();
    const path = getPath(req);

    if (!isPublicPath(path)) {
      await requireAuthenticatedUser(req);
    }

    const mapping = mapLegacyPath(path, req.query || {});
    const query = buildQuery(req);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let upstream;

    try {
      upstream = await fetch(
        `${baseUrl}${CONNECT_VQS_BASE}${mapping.upstreamPath}${query}`,
        {
          method: req.method,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Elankav-Platform': 'ELANVISUAL',
            'X-Elankav-Actor-Type': 'server-proxy',
            'X-Request-Id': requestId,
            ...(req.body !== undefined && req.method !== 'GET'
              ? { 'Content-Type': 'application/json' }
              : {}),
            ...(text(req.headers['idempotency-key'])
              ? { 'Idempotency-Key': text(req.headers['idempotency-key']) }
              : {})
          },
          body:
            req.body !== undefined &&
            req.method !== 'GET' &&
            req.method !== 'HEAD'
              ? JSON.stringify(req.body)
              : undefined,
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      sendJson(res, upstream.status, payload);
      return;
    }

    sendJson(
      res,
      upstream.status,
      transformPayload(mapping.transform, payload)
    );
  } catch (error) {
    if (error?.name === 'AbortError') {
      sendJson(res, 504, {
        error: 'CONNECT no respondió dentro del tiempo permitido.',
        code: 'VQS_UPSTREAM_TIMEOUT',
        requestId
      });
      return;
    }

    sendJson(res, Number(error?.status || 500), {
      error: error?.message || 'No fue posible procesar VQS.',
      code: error?.code || 'VQS_PROXY_ERROR',
      requestId
    });
  }
}