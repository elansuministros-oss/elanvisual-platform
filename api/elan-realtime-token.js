/* eslint-disable no-console */

export const config = { api: { bodyParser: { sizeLimit: '256kb' } }, maxDuration: 20 };

function clean(value) { return String(value || '').trim(); }

function getConnectBaseUrl() {
  return clean(process.env.CONNECT_BASE_URL || process.env.ELANKAV_CONNECT_URL || 'https://connect.elankav.com').replace(/\/+$/, '');
}

function getInternalToken() {
  return clean(
    process.env.CONNECT_INTERNAL_TOKEN ||
    process.env.CONNECT_INTERNAL_API_TOKEN ||
    process.env.ELANKAV_CONNECT_INTERNAL_TOKEN ||
    process.env.ORCHESTRATOR_INTERNAL_TOKEN ||
    process.env.VQS_API_TOKEN
  );
}

function getCopilotToken() {
  return clean(process.env.CONNECT_DESIGN_TOKEN || process.env.CONNECT_COPILOT_TOKEN || '');
}

async function verifyLiveSession(baseUrl, internalToken, token) {
  const response = await fetch(`${baseUrl}/api/v1/live-access/verify`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${internalToken}`,
      'X-Elankav-Internal-Token': internalToken,
      'X-Elankav-Platform': 'ELANVISUAL',
    },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.data?.valid || !data?.data?.session) {
    const error = new Error(data?.error?.message || 'Sesión ELAN Live inválida.');
    error.status = response.status || 401;
    error.code = data?.error?.code || 'LIVE_SESSION_INVALID';
    throw error;
  }
  return data.data.session;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido.' });

  try {
    const baseUrl = getConnectBaseUrl();
    const internalToken = getInternalToken();
    const copilotToken = getCopilotToken();
    if (!internalToken) return res.status(503).json({ ok: false, error: 'Token interno de ELAN Live no configurado.' });
    if (!copilotToken) return res.status(503).json({ ok: false, error: 'Token Copilot de CONNECT no configurado.' });

    const liveSessionToken = clean(req.body?.live_session_token);
    if (!liveSessionToken) return res.status(401).json({ ok: false, error: 'Sesión ELAN Live requerida.' });

    const session = await verifyLiveSession(baseUrl, internalToken, liveSessionToken);

    const upstream = await fetch(`${baseUrl}/api/v1/copilot/realtime-token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Elankav-Copilot-Token': copilotToken,
        'X-Elankav-Design-Token': copilotToken,
        'X-Elankav-Platform': 'ELANVISUAL',
        'X-Elankav-Source': 'elan-live-realtime-token',
      },
      body: JSON.stringify({
        liveSession: {
          role: session.role,
          actorId: session.sub,
          sellerId: session.sellerId || null,
          phone: session.phone,
          scopes: session.scopes,
          authority: session.authority,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data?.value) {
      return res.status(upstream.status || 502).json({
        ok: false,
        error: data?.error || 'No fue posible crear la sesión Realtime.',
        code: data?.code || 'ELAN_REALTIME_TOKEN_FAILED',
      });
    }

    return res.status(201).json({
      ok: true,
      value: data.value,
      expires_at: data.expires_at || null,
      model: data.model || null,
      voice: data.voice || null,
    });
  } catch (error) {
    console.error('ERROR ELAN REALTIME TOKEN:', error);
    const status = error?.status === 401 || error?.status === 403 ? error.status : error?.name === 'TimeoutError' ? 504 : 502;
    return res.status(status).json({
      ok: false,
      error: error?.name === 'TimeoutError' ? 'ELAN Realtime tardó demasiado en autorizar.' : (error?.message || 'No fue posible autorizar ELAN Realtime.'),
      code: error?.code || 'ELAN_REALTIME_TOKEN_FAILED',
    });
  }
}
