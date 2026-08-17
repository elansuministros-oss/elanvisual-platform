/* eslint-disable no-console */
// deployment trigger: realtime ephemeral-token flow

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

function getOrchestratorConfig() {
  const baseUrl = clean(process.env.ORCHESTRATOR_BASE_URL || process.env.ELANKAV_ORCHESTRATOR_URL || 'https://orchestrator.elankav.com').replace(/\/+$/, '');
  const token = clean(process.env.ORCHESTRATOR_INTERNAL_TOKEN || process.env.ELANKAV_ORCHESTRATOR_INTERNAL_TOKEN || '');
  return { baseUrl, token };
}

function unifiedActor(session = {}) {
  const role = clean(session.role || 'unknown').toLowerCase();
  const owner = role === 'owner' || clean(session.authority).toLowerCase() === 'owner_identity';
  return {
    role: owner ? 'owner' : role,
    actorId: owner ? 'owner' : (session.sub || session.actorId || null),
    registered: true,
    platformAllowed: true,
    platforms: owner ? ['*'] : ['ELANVISUAL'],
    scopes: Array.isArray(session.scopes) ? session.scopes : [],
    authority: owner ? 'owner_identity' : (session.authority || null),
    phone: session.phone || null,
    canonicalPhone: session.phone || null,
  };
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

async function getUnifiedRuntimeManifest(session) {
  const { baseUrl, token } = getOrchestratorConfig();
  if (!token) throw Object.assign(new Error('ORCHESTRATOR_INTERNAL_TOKEN no configurado para ELAN Runtime.'), { code: 'ELAN_RUNTIME_NOT_CONFIGURED', status: 503 });
  const response = await fetch(`${baseUrl}/api/v1/elan-runtime/tools`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Elankav-Internal-Token': token,
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Source': 'ELAN_LIVE_REALTIME_TOKEN',
    },
    body: JSON.stringify({ actor: unifiedActor(session), channel: 'copilot', platform: 'ELANVISUAL', memoryLimit: 20 }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false || !Array.isArray(data?.tools)) {
    const error = new Error(data?.error || 'ELAN Unified Runtime no devolvió un manifiesto válido.');
    error.status = response.status || 502;
    error.code = data?.code || 'ELAN_RUNTIME_MANIFEST_FAILED';
    throw error;
  }
  return data;
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
    const runtime = await getUnifiedRuntimeManifest(session);

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
        liveSession: unifiedActor(session),
        runtime: runtime.runtime || 'ELAN_UNIFIED_RUNTIME',
        runtimeVersion: runtime.version || null,
        runtimeTools: runtime.tools,
        runtimeMemory: runtime.memory || { history: [] },
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
      runtime: runtime.runtime || 'ELAN_UNIFIED_RUNTIME',
      runtimeVersion: runtime.version || null,
      tools: Array.isArray(data.tools) ? data.tools : runtime.tools.map((tool) => tool.name),
      memoryMessages: Array.isArray(runtime.memory?.history) ? runtime.memory.history.length : 0,
    });
  } catch (error) {
    console.error('ERROR ELAN REALTIME TOKEN:', error);
    const status = [401, 403, 503].includes(error?.status) ? error.status : error?.name === 'TimeoutError' ? 504 : 502;
    return res.status(status).json({
      ok: false,
      error: error?.name === 'TimeoutError' ? 'ELAN Realtime tardó demasiado en autorizar.' : (error?.message || 'No fue posible autorizar ELAN Realtime.'),
      code: error?.code || 'ELAN_REALTIME_TOKEN_FAILED',
    });
  }
}