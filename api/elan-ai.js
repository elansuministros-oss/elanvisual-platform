const CORE_URL = 'https://elankav-core.vercel.app/api/elan-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  },
  maxDuration: 120
};

function buildTargetUrl(req) {
  const target = new URL(CORE_URL);

  for (const [key, value] of Object.entries(req.query || {})) {
    if (Array.isArray(value)) {
      for (const item of value) target.searchParams.append(key, String(item));
    } else if (value !== undefined && value !== null) {
      target.searchParams.set(key, String(value));
    }
  }

  return target.toString();
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const upstream = await fetch(buildTargetUrl(req), {
      method: req.method,
      headers: {
        Accept: 'application/json',
        ...(req.method === 'POST' ? { 'Content-Type': 'application/json' } : {})
      },
      body: req.method === 'POST' ? JSON.stringify(req.body || {}) : undefined,
      signal: AbortSignal.timeout(115000)
    });

    const payload = await upstream.text();
    const contentType = upstream.headers.get('content-type');

    res.setHeader('Cache-Control', 'no-store');
    if (contentType) res.setHeader('Content-Type', contentType);

    return res.status(upstream.status).send(payload);
  } catch (error) {
    console.error('ELAN_AI_PROXY_ERROR', error);
    return res.status(502).json({
      ok: false,
      error: 'ELAN_AI_PROXY_FAILED',
      message: String(error?.message || error)
    });
  }
}
