import { resolveBaseUrl } from '../modules/vqs/services/projectCoreClient';
import { registerQuotationAssetUpload } from '../modules/vqs/services/quotationAssetUploadRegistry';

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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

async function uploadQuotationAsset(file, dataUrl) {
  const response = await fetch(`${resolveBaseUrl()}/api/vqs/assets`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Actor-Type': 'user'
    },
    body: JSON.stringify({
      platform: 'ELANVISUAL',
      itemId: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type,
      dataUrl
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.data?.signedUrl) {
    throw new Error(payload?.error || 'No fue posible subir la fotografía al Orchestrator.');
  }
  return payload.data;
}

export async function readDesignFile(file) {
  if (!file) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Cada archivo debe pesar menos de 8 MB.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const isQuotationUpload = typeof window === 'object' && window.location.pathname.startsWith('/cotizador');
  if (!isQuotationUpload) {
    return {
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      dataUrl
    };
  }

  const uploadPromise = uploadQuotationAsset(file, dataUrl);
  const uploadToken = registerQuotationAssetUpload({
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    promise: uploadPromise
  });

  return {
    id: uploadToken,
    uploadToken,
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    dataUrl,
    url: dataUrl,
    pending: true,
    kind: 'existing-product-photo'
  };
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

export async function submitDesignFollowup({
  requestCode,
  accessToken,
  action,
  instructions,
  project,
  files = []
}) {
  const response = await fetch(CORE_DESIGN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo: 'design-request-action',
      requestCode: String(requestCode || ''),
      accessToken: String(accessToken || ''),
      action: String(action || ''),
      instructions: String(instructions || ''),
      project: project || {},
      files
    })
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok !== true || !data?.result) {
    throw new Error(
      data?.error || 'No fue posible continuar la solicitud.'
    );
  }

  return data;
}

export { CORE_DESIGN_URL, MAX_FILE_BYTES };
