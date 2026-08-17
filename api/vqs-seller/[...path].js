export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30
};

const CONNECT_VQS_PATH = '/api/v1/business/vqs';
const DEFAULT_CONNECT_URL = 'https://connect.elankav.com';
const TIMEOUT_MS = 12_000;

const text = (value) => String(value || '').trim();

function jsonError(res, status, code, message, requestId) {
  return res.status(status).json({ error: message, code, requestId });
}

function safePath(req) {
  const dynamic = req.query?.path;
  if (Array.isArray(dynamic)) return dynamic.join('/');
  if (dynamic) return String(dynamic);
  return String(req.url || '').split('?')[0].replace(/^\/api\/vqs-seller\/?/, '');
}

function mapReadPath(localPath) {
  const path = `/${String(localPath || '').replace(/^\/+/, '')}`;
  if (path === '/projects') return '/quotations';
  const project = path.match(/^\/projects\/([^/]+)$/);
  return project ? `/quotations/${encodeURIComponent(project[1])}` : null;
}

function queryString(req) {
  const raw = String(req.url || '');
  const index = raw.indexOf('?');
  return index >= 0 ? raw.slice(index) : '';
}

function supabaseConfig() {
  const url = text(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const serviceKey = text(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = text(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  return { url, serviceKey, anonKey };
}

async function resolveSeller(req) {
  const authorization = text(req.headers.authorization);
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    const error = new Error('Iniciá sesión nuevamente para consultar tus cotizaciones.');
    error.code = 'SELLER_SESSION_REQUIRED';
    error.status = 401;
    throw error;
  }

  const { url, serviceKey, anonKey } = supabaseConfig();
  const apiKey = anonKey || serviceKey;
  if (!url || !apiKey || !serviceKey) {
    const error = new Error('La validación segura de vendedores no está configurada.');
    error.code = 'SELLER_AUTH_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }

  const authResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: apiKey, Authorization: authorization, Accept: 'application/json' }
  });
  const authUser = await authResponse.json().catch(() => ({}));
  if (!authResponse.ok || !authUser?.id) {
    const error = new Error('La sesión del vendedor no es válida.');
    error.code = 'SELLER_SESSION_INVALID';
    error.status = 401;
    throw error;
  }

  const profileHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json'
  };
  const select = 'id,auth_user_id,rol,activo,vendedor_id,nombre,email';
  let profileResponse = await fetch(
    `${url}/rest/v1/usuarios?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=${encodeURIComponent(select)}&limit=1`,
    { headers: profileHeaders }
  );
  let profiles = await profileResponse.json().catch(() => []);

  if (profileResponse.ok && (!Array.isArray(profiles) || !profiles[0])) {
    profileResponse = await fetch(
      `${url}/rest/v1/usuarios?id=eq.${encodeURIComponent(authUser.id)}&select=${encodeURIComponent(select)}&limit=1`,
      { headers: profileHeaders }
    );
    profiles = await profileResponse.json().catch(() => []);
  }

  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profileResponse.ok || !profile || profile.activo === false) {
    const error = new Error('El perfil operativo del vendedor no está autorizado.');
    error.code = 'SELLER_PROFILE_NOT_AUTHORIZED';
    error.status = 403;
    throw error;
  }

  if (text(profile.rol).toLowerCase() !== 'ventas') {
    const error = new Error('Esta ruta es exclusiva para vendedores.');
    error.code = 'SELLER_ROLE_REQUIRED';
    error.status = 403;
    throw error;
  }

  const sellerId = text(profile.vendedor_id);
  if (!sellerId) {
    const error = new Error('La cuenta no tiene vendedor oficial vinculado.');
    error.code = 'SELLER_IDENTITY_MISSING';
    error.status = 409;
    throw error;
  }

  return { sellerId, profile };
}

function recordExecutiveId(record) {
  return text(
    record?.executiveId ||
    record?.executive_id ||
    record?.quotation_document?.executiveSnapshot?.executiveId ||
    record?.quotation_document?.publicDocument?.advisor?.executiveId
  );
}

export default async function handler(req, res) {
  const requestId = text(req.headers['x-request-id']) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Cache-Control', 'no-store');

  if (String(req.method || '').toUpperCase() !== 'GET') {
    return jsonError(res, 405, 'SELLER_QUOTATION_WRITE_FORBIDDEN', 'El vendedor no puede modificar cotizaciones por esta ruta.', requestId);
  }

  try {
    const { sellerId } = await resolveSeller(req);
    const upstreamPath = mapReadPath(safePath(req));
    if (!upstreamPath) {
      return jsonError(res, 404, 'SELLER_QUOTATION_ROUTE_NOT_SUPPORTED', 'Ruta de cotización no disponible para vendedor.', requestId);
    }

    const token = text(process.env.VQS_API_TOKEN);
    if (!token) {
      return jsonError(res, 503, 'VQS_CONNECT_NOT_CONFIGURED', 'La conexión segura con CONNECT no está configurada.', requestId);
    }

    const baseUrl = `${text(process.env.CONNECT_BASE_URL || DEFAULT_CONNECT_URL).replace(/\/+$/, '')}${CONNECT_VQS_PATH}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response;
    try {
      response = await fetch(`${baseUrl}${upstreamPath}${queryString(req)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Elankav-Platform': 'ELANVISUAL',
          'X-Elankav-Actor-Type': 'user',
          'X-Elankav-Role': 'ventas',
          'X-Elankav-User-Id': sellerId,
          'X-Request-Id': requestId
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(payload);

    if (upstreamPath === '/quotations') {
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const own = rows.filter((record) => recordExecutiveId(record) === sellerId);
      return res.status(200).json({ data: own, count: own.length });
    }

    const record = payload?.data || payload;
    if (!record || recordExecutiveId(record) !== sellerId) {
      return jsonError(res, 404, 'SELLER_QUOTATION_NOT_FOUND', 'La cotización no existe o no pertenece a tu cuenta de ventas.', requestId);
    }

    return res.status(200).json(payload);
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    const status = Number(error?.status) || (timedOut ? 504 : 502);
    return jsonError(
      res,
      status,
      error?.code || (timedOut ? 'SELLER_CONNECT_TIMEOUT' : 'SELLER_QUOTATION_GATEWAY_FAILED'),
      timedOut ? 'CONNECT no respondió dentro del tiempo permitido.' : (error?.message || 'No fue posible validar la consulta del vendedor.'),
      requestId
    );
  }
}
