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

async function getPublishedAiRuntime(baseUrl, internalToken, platform = 'elanvisual') {
  const response = await fetch(`${baseUrl}/console/api/ai-platforms/runtime/${encodeURIComponent(String(platform || 'elanvisual').toLowerCase())}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${internalToken}`,
      'X-Elankav-Internal-Token': internalToken,
      'X-Elankav-Platform': String(platform || 'elanvisual').toUpperCase(),
    },
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.authority !== 'CONNECT_AI_PLATFORMS' || data?.authorityLocked !== true) {
    const error = new Error(data?.error?.message || 'Plataformas IA no devolvió una configuración publicada válida.');
    error.status = response.status || 503;
    error.code = data?.error?.code || 'AI_RUNTIME_AUTHORITY_INVALID';
    throw error;
  }
  return data;
}

function getOrchestratorConfig() {
  const baseUrl = clean(process.env.ORCHESTRATOR_BASE_URL || process.env.ELANKAV_ORCHESTRATOR_URL || 'https://orchestrator.elankav.com').replace(/\/+$/, '');
  const token = clean(
    process.env.ORCHESTRATOR_INTERNAL_TOKEN ||
    process.env.ELANKAV_ORCHESTRATOR_INTERNAL_TOKEN ||
    process.env.VQS_API_TOKEN ||
    process.env.CONNECT_INTERNAL_TOKEN ||
    process.env.CONNECT_INTERNAL_API_TOKEN ||
    process.env.ELANKAV_CONNECT_INTERNAL_TOKEN ||
    ''
  );
  return { baseUrl, token };
}

const PUBLIC_RUNTIME_PLATFORMS=new Set(['ELANVISUAL','ELANHOME','ELANPET']);
function normalizePlatform(value){return String(value||'ELANVISUAL').trim().toUpperCase().replace(/[ -]+/g,'_')}
function requestedPlatform(session={},requested=''){
  const platform=normalizePlatform(requested||session.platform||'ELANVISUAL');
  if(!PUBLIC_RUNTIME_PLATFORMS.has(platform)){
    const error=new Error('La plataforma solicitada no pertenece al runtime público de ELAN.');error.code='LIVE_PLATFORM_NOT_PUBLIC';error.status=403;throw error;
  }
  const role=String(session.role||'unknown').toLowerCase();
  const owner=role==='owner'||String(session.authority||'').toLowerCase()==='owner_identity';
  const allowed=Array.isArray(session.platforms)?session.platforms.map(normalizePlatform):[normalizePlatform(session.platform||'ELANVISUAL')];
  if(owner||allowed.includes('*')||allowed.includes(platform))return platform;
  const error=new Error('Tu usuario no tiene acceso a la plataforma solicitada.');error.code='LIVE_PLATFORM_NOT_AUTHORIZED';error.status=403;throw error;
}
function unifiedActor(session = {}) {
  const role = clean(session.role || 'unknown').toLowerCase();
  const owner = role === 'owner' || clean(session.authority).toLowerCase() === 'owner_identity';
  return {
    role: owner ? 'owner' : role,
    actorId: owner ? 'owner' : (session.sub || session.actorId || null),
    registered: true,
    platformAllowed: true,
    platforms: owner ? ['*'] : (Array.isArray(session.platforms) ? session.platforms : [session.platform || 'ELANVISUAL']).map(normalizePlatform),
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

async function getUnifiedRuntimeManifest(session, platform) {
  const { baseUrl, token } = getOrchestratorConfig();
  if (!token) throw Object.assign(new Error('Token interno no configurado para ELAN Runtime.'), { code: 'ELAN_RUNTIME_NOT_CONFIGURED', status: 503 });
  const response = await fetch(`${baseUrl}/api/v1/elan-runtime/tools`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Elankav-Internal-Token': token,
      'X-Elankav-Platform': platform,
      'X-Elankav-Source': 'ELAN_LIVE_REALTIME_TOKEN',
    },
    body: JSON.stringify({ actor: unifiedActor(session), channel: 'copilot', platform, memoryLimit: 20 }),
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
    const platform = requestedPlatform(session, req.body?.platform);
    const [runtime, publishedRuntime] = await Promise.all([
      getUnifiedRuntimeManifest(session, platform),
      getPublishedAiRuntime(baseUrl, internalToken, platform),
    ]);

    const upstream = await fetch(`${baseUrl}/api/v1/copilot/realtime-token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Elankav-Copilot-Token': copilotToken,
        'X-Elankav-Design-Token': copilotToken,
        'X-Elankav-Platform': platform,
        'X-Elankav-Source': 'elan-live-realtime-token',
      },
      body: JSON.stringify({
        liveSession: { ...unifiedActor(session), activePlatform: platform },
        activePlatform: platform,
        platform,
        runtime: runtime.runtime || 'ELAN_UNIFIED_RUNTIME',
        runtimeVersion: runtime.version || null,
        runtimeTools: runtime.tools,
        runtimeMemory: runtime.memory || { history: [] },
        publishedRuntime,
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
      platform,
      value: data.value,
      expires_at: data.expires_at || null,
      model: data.model || null,
      voice: data.voice || null,
      runtime: runtime.runtime || 'ELAN_UNIFIED_RUNTIME',
      runtimeVersion: runtime.version || null,
      publishedRuntimeVersion: publishedRuntime.version || null,
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
