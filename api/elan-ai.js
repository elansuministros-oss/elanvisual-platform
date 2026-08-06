/* eslint-disable no-console */

export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } },
  maxDuration: 60
};

const ALLOWED_ORIGINS = new Set([
  'https://visual.elankav.com',
  'https://connect.elankav.com',
  'http://localhost:5173',
  'http://localhost:3000'
]);

function isAllowedOrigin(origin = '') {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:'
      && url.hostname.startsWith('elanvisual-platform-')
      && url.hostname.endsWith('-elanpetvercelapp.vercel.app');
  } catch {
    return false;
  }
}

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
}

function getConnectConfig() {
  const baseUrl = String(
    process.env.CONNECT_BASE_URL ||
    process.env.ELANKAV_CONNECT_URL ||
    'https://connect.elankav.com'
  ).trim().replace(/\/+$/, '');
  const token = String(process.env.CONNECT_DESIGN_TOKEN || '').trim();
  if (!token) {
    const error = new Error('CONNECT_DESIGN_TOKEN no configurado en ELANVISUAL');
    error.code = 'CONNECT_DESIGN_NOT_CONFIGURED';
    throw error;
  }
  return { baseUrl, token };
}

async function callConnect({ method = 'POST', path = '', body } = {}) {
  const { baseUrl, token } = getConnectConfig();
  const response = await fetch(`${baseUrl}/api/v1/design${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Elankav-Design-Token': token,
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Source': 'design-portal'
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({ ok: false, error: `CONNECT HTTP ${response.status}` }));
  return { status: response.status, data };
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      if (String(req.query?.resource || '') === 'design-gallery') {
        const result = await callConnect({ method: 'GET', path: '/gallery' });
        return res.status(result.status).json(result.data);
      }
      return res.status(200).json({
        ok: true,
        endpoint: '/api/elan-ai',
        version: 'DESIGN-PORTAL-CONNECT-CLEAN-01',
        status: 'ready',
        operationsCenter: 'CONNECT',
        designProcessing: 'delegated'
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Método no permitido.' });
    }

    const payload = req.body || {};
    const tipo = String(payload.tipo || payload.type || '').trim();
    if (!['design-request', 'design-request-status', 'design-request-action'].includes(tipo)) {
      return res.status(400).json({
        ok: false,
        error: 'Este endpoint solo delega operaciones del Portal de Diseño a CONNECT.',
        tipo
      });
    }

    const result = await callConnect({ method: 'POST', body: payload });
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('ERROR proxy ELANVISUAL → CONNECT:', error);
    return res.status(error?.code === 'CONNECT_DESIGN_NOT_CONFIGURED' ? 503 : 502).json({
      ok: false,
      error: error?.message || 'No fue posible comunicar ELANVISUAL con CONNECT.',
      code: error?.code || 'CONNECT_DESIGN_PROXY_FAILED'
    });
  }
}
