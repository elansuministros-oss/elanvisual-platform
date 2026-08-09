import vqsHandler, { config as vqsConfig } from './vqs/[...path].js';

export const config = vqsConfig;

function text(value) {
  return String(value ?? '').trim();
}

function getLocalPath(req) {
  const dynamic = req.query?.path;
  if (Array.isArray(dynamic)) return dynamic.map(text).filter(Boolean).join('/');
  if (dynamic) return text(dynamic);
  return String(req.url || '').split('?')[0].replace(/^\/api\/vqs\/?/, '');
}

function isPublicQuotationPath(path) {
  const clean = text(path).replace(/^\/+|\/+$/g, '');
  return /^public\/quotations\/[^/]+$/.test(clean);
}

function resolveSupabaseAuthConfig() {
  const url = text(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const key = text(
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
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

function sanitizePublicQuotationPayload(payload) {
  const record = payload?.data || payload || {};
  const document = record?.quotation_document || record?.quotationDocument || {};
  return { data: document?.publicDocument || {} };
}

export default async function handler(req, res) {
  const path = getLocalPath(req);
  const publicQuotation = isPublicQuotationPath(path);

  try {
    if (!publicQuotation) {
      await requireAuthenticatedUser(req);
    }

    if (publicQuotation && typeof res.json === 'function') {
      const originalJson = res.json.bind(res);
      res.json = (payload) => {
        const status = Number(res.statusCode || 200);
        const safePayload = status >= 200 && status < 300
          ? sanitizePublicQuotationPayload(payload)
          : payload;
        return originalJson(safePayload);
      };
    }

    return await vqsHandler(req, res);
  } catch (error) {
    const status = Number(error?.status || 500);
    return res.status(status).json({
      error: error?.message || 'No fue posible autorizar la solicitud VQS.',
      code: error?.code || 'VQS_AUTH_ERROR'
    });
  }
}
