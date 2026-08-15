export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } },
  maxDuration: 30
};

const DEFAULT_CONNECT_URL = 'https://connect.elankav.com';
const CONNECT_VQS_PATH = '/api/v1/business/vqs';
const TIMEOUT_MS = 25_000;

const text = (value) => String(value || '').trim();

function isTrustedRequest(req) {
  const origin = text(req.headers.origin);
  const fetchSite = text(req.headers['sec-fetch-site']).toLowerCase();
  if (fetchSite === 'same-origin') return true;
  if (!origin) return process.env.VERCEL_ENV !== 'production';
  try {
    const url = new URL(origin);
    return origin === 'https://visual.elankav.com'
      || ['localhost', '127.0.0.1'].includes(url.hostname)
      || (url.protocol === 'https:' && url.hostname.startsWith('elanvisual-platform-') && url.hostname.endsWith('.vercel.app'));
  } catch {
    return false;
  }
}

export function localPath(req) {
  const parts = Array.isArray(req.query?.path) ? req.query.path : [req.query?.path].filter(Boolean);
  return parts
    .flatMap((part) => String(part).split('/'))
    .filter(Boolean)
    .map((part) => encodeURIComponent(decodeURIComponent(part)))
    .join('/');
}

export default async function handler(req, res) {
  const requestId = text(req.headers['x-request-id']) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  if (!isTrustedRequest(req)) {
    return res.status(403).json({ error: { code: 'OPS_ORIGIN_FORBIDDEN', message: 'Origen no permitido.' }, requestId });
  }

  const token = text(process.env.VQS_API_TOKEN);
  const connectUrl = text(process.env.VQS_CONNECT_BASE_URL || DEFAULT_CONNECT_URL).replace(/\/+$/, '');
  if (!token) {
    return res.status(503).json({ error: { code: 'OPS_TOKEN_NOT_CONFIGURED', message: 'El proxy operativo no está configurado.' }, requestId });
  }

  const path = localPath(req);
  if (!path || path.includes('..')) {
    return res.status(400).json({ error: { code: 'OPS_PATH_INVALID', message: 'Ruta operativa inválida.' }, requestId });
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path') continue;
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) if (entry !== undefined && entry !== null) query.append(key, String(entry));
  }
  const url = `${connectUrl}${CONNECT_VQS_PATH}/${path}${query.size ? `?${query}` : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const body = ['GET', 'HEAD'].includes(String(req.method || 'GET').toUpperCase()) ? undefined : JSON.stringify(req.body ?? {});
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Elankav-Platform': 'ELANVISUAL',
        'X-Elankav-Actor-Type': 'user',
        'X-Elankav-Role': text(req.headers['x-elankav-role'] || 'operaciones'),
        ...(text(req.headers['x-elankav-user-id']) ? { 'X-Elankav-User-Id': text(req.headers['x-elankav-user-id']) } : {}),
        'X-Request-Id': requestId
      },
      body,
      signal: controller.signal
    });
    const payload = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(payload);
  } catch (error) {
    return res.status(error?.name === 'AbortError' ? 504 : 502).json({
      error: { code: error?.name === 'AbortError' ? 'OPS_TIMEOUT' : 'OPS_UPSTREAM_FAILED', message: 'No fue posible comunicarse con CONNECT.' },
      requestId
    });
  } finally {
    clearTimeout(timer);
  }
}
