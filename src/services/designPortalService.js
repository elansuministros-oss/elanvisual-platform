export function resolveCoreDesignUrl(value = '') {
  const configured = String(value || '').trim().replace(/\/+$/, '');

  if (!configured) {
    return 'https://elankav-core.vercel.app/api/elan-ai';
  }

  return configured.endsWith('/api/elan-ai')
    ? configured
    : `${configured}/api/elan-ai`;
}

const CORE_DESIGN_URL = resolveCoreDesignUrl(
  typeof import.meta.env === 'object'
    ? import.meta.env.VITE_ELANKAV_CORE_URL
    : ''
);

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function readDesignFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    if (file.size > MAX_FILE_BYTES) {
      return reject(new Error('Cada archivo debe pesar menos de 8 MB.'));
    }

    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      dataUrl: String(reader.result || '')
    });
    reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function parseWhatsAppDesignContext(
  search = window.location.search,
  pathname = typeof window === 'object' ? window.location.pathname : '/'
) {
  const params = new URLSearchParams(search);
  const rawWhatsapp = String(params.get('wa') || '').replace(/\D/g, '');
  const whatsapp = /^505\d{8}$/.test(rawWhatsapp)
    ? rawWhatsapp
    : /^\d{8}$/.test(rawWhatsapp)
      ? `505${rawWhatsapp}`
      : '';

  return {
    source:
      params.get('source') === 'whatsapp' ||
      String(pathname || '').startsWith('/diseno/whatsapp')
        ? 'whatsapp'
        : 'web',
    whatsapp,
    externalUserId: String(params.get('uid') || '').slice(0, 160),
    conversationRef: String(params.get('conversation') || '').slice(0, 300),
    requestType: ['rotulo', 'fachada', 'logo', 'otro'].includes(params.get('type'))
      ? params.get('type')
      : 'rotulo'
  };
}

export async function submitDesignRequest(payload) {
  const response = await fetch(CORE_DESIGN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: 'design-request',
      ...payload
    })
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok !== true) {
    throw new Error(
      data?.error || 'No fue posible enviar la solicitud. Intentá nuevamente.'
    );
  }

  return data;
}

export async function loadDesignGallery() {
  const response = await fetch(`${CORE_DESIGN_URL}?resource=design-gallery`, {
    headers: { Accept: 'application/json' }
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok !== true || !Array.isArray(data.items)) {
    throw new Error('La galería no está disponible temporalmente.');
  }

  return data.items;
}

export async function loadDesignRequestStatus({ requestCode, accessToken }) {
  const response = await fetch(CORE_DESIGN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo: 'design-request-status',
      requestCode: String(requestCode || ''),
      accessToken: String(accessToken || '')
    })
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok !== true || !data?.result) {
    throw new Error('No fue posible consultar la propuesta.');
  }

  return data.result;
}

export { CORE_DESIGN_URL, MAX_FILE_BYTES };
