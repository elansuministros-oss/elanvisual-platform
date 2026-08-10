const LOCAL_CONNECT_URL = 'http://localhost:4300';
const OFFICIAL_CONNECT_URL = 'https://connect.elankav.com';
const PLATFORM = 'ELANVISUAL';

export function resolveConnectBaseUrl() {
  const configured = typeof import.meta.env === 'object'
    ? import.meta.env.VITE_ELANKAV_CONNECT_URL
    : '';

  if (String(configured || '').trim()) {
    return String(configured).trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return LOCAL_CONNECT_URL;
  }

  return OFFICIAL_CONNECT_URL;
}

export function isConnectConfigured() {
  return Boolean(resolveConnectBaseUrl());
}

export function isConnectUnavailableError(error) {
  return error?.code === 'ELANKAV_CONNECT_URL_NOT_CONFIGURED'
    || error?.name === 'TypeError'
    || error?.status === 404
    || error?.status === 501
    || error?.status === 503;
}

function isFormDataBody(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export async function requestConnect(path, options = {}) {
  const baseUrl = resolveConnectBaseUrl();
  if (!baseUrl) {
    const error = new Error('ELANKAV CONNECT no configurado.');
    error.code = 'ELANKAV_CONNECT_URL_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'X-Elankav-Platform': PLATFORM,
      'X-Elankav-Actor-Type': 'user',
      ...(options.body !== undefined && !isFormDataBody(options.body) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || 'No fue posible conectar con ELANKAV CONNECT.');
    error.code = payload?.error?.code || payload?.code || 'ELANKAV_CONNECT_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.details || payload?.error?.details || [];
    throw error;
  }

  return payload?.data ?? payload;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}
