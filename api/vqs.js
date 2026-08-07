/* eslint-disable no-console */

export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } },
  maxDuration: 60
};

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH']);
const ALLOWED_PATHS = [
  /^customers\/search$/,
  /^quotations$/,
  /^quotations\/[0-9a-f-]{36}$/i,
  /^quotations\/[0-9a-f-]{36}\/send-whatsapp$/i
];

function getConfig() {
  const baseUrl = String(process.env.CONNECT_BASE_URL || process.env.ELANKAV_CONNECT_URL || 'https://connect.elankav.com')
    .trim().replace(/\/+$/, '');
  const token = String(process.env.CONNECT_VQS_TOKEN || '').trim();
  if (!token) {
    const error = new Error('CONNECT_VQS_TOKEN no configurado en ELANVISUAL.');
    error.code = 'CONNECT_VQS_NOT_CONFIGURED';
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
    const response = await fetch(`${baseUrl}/api/v1/business/vqs/${path}${buildQuery(req)}`, {
      method: req.method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Elankav-Platform': 'ELANVISUAL',
        'X-Elankav-Source': 'elanvisual-vqs',
        ...(req.body !== undefined && req.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        ...(req.headers['idempotency-key'] ? { 'Idempotency-Key': String(req.headers['idempotency-key']) } : {})
      },
      ...(req.body !== undefined && req.method !== 'GET' ? { body: JSON.stringify(req.body) } : {})
    });
    const payload = await response.json().catch(() => ({ error: `CONNECT HTTP ${response.status}`, code: 'CONNECT_INVALID_RESPONSE' }));
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error('ERROR proxy VQS ELANVISUAL → CONNECT:', error);
    return res.status(error?.code === 'CONNECT_VQS_NOT_CONFIGURED' ? 503 : 502).json({
      error: error?.message || 'No fue posible comunicar ELANVISUAL con CONNECT.',
      code: error?.code || 'CONNECT_VQS_PROXY_FAILED'
    });
  }
}
