import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';
import { normalizeQuotationRecord } from '../adapters/quotationDocumentAdapter';
import { applyQuotationImageFallback } from '../adapters/quotationImageFallback';

const HEADERS = Object.freeze({
  Accept: 'application/json',
  'X-Elankav-Platform': 'ELANVISUAL',
  'X-Elankav-Actor-Type': 'public-customer'
});

function buildVqsFunctionUrl(baseUrl, path) {
  const url = new URL(`${baseUrl}/api/vqs`);
  url.searchParams.set('path', String(path || '').replace(/^\/+/, ''));
  return url;
}

function buildPublicQuotationUrl(projectId) {
  const url = buildVqsFunctionUrl(
    resolveBaseUrl(),
    `public/quotations/${encodeURIComponent(projectId)}`
  );

  // Cada consulta debe obtener un documento público fresco porque contiene
  // Signed URLs temporales de Supabase Storage.
  url.searchParams.set('_refresh', String(Date.now()));
  return url.toString();
}

export async function getPublicQuotation(projectId) {
  const id = String(projectId || '').trim();
  if (!id) throw new Error('No se recibió el identificador de la cotización.');

  const response = await fetch(buildPublicQuotationUrl(id), {
    method: 'GET',
    headers: HEADERS,
    cache: 'no-store'
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || 'No fue posible consultar la cotización.');
    error.status = response.status;
    error.code = payload?.code || 'PUBLIC_QUOTATION_REQUEST_FAILED';
    throw error;
  }

  const record = applyQuotationImageFallback(payload?.data || {});
  return {
    quotation: normalizeQuotationRecord(record),
    pdfUrl: String(record.pdfUrl || record.pdf_url || '').trim(),
    publicUrl: String(
      record.publicUrl ||
      record.public_url ||
      record.quotation_document?.publicDocument?.publicUrl ||
      record.quotationDocument?.publicDocument?.publicUrl ||
      ''
    ).trim()
  };
}

export const publicQuotationService = Object.freeze({ getPublicQuotation });


const CONNECT_PUBLIC_BASE_URL = window.location.origin;

function normalizeCustomerAccessCode(value) {
  const code = String(value || '').trim();

  return /^[A-Za-z0-9_-]{22}$/.test(code)
    ? code
    : '';
}

function normalizeCustomerPortalKey(value) {
  const key = String(value || '').trim();

  return (
    /^[A-Za-z0-9_-]{22}$/.test(key) ||
    /^[a-z0-9][a-z0-9-]{4,94}[a-z0-9]$/.test(key)
  )
    ? key
    : '';
}

function readLocalArray(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function slugifyLocal(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function portalSlug(value) {
  const parts = String(value || '').split('/').filter(Boolean);
  return parts.at(-1) || '';
}

function getLocalCustomerPortal(code) {
  const clients = readLocalArray('elan_admin_clients_v1');
  const quotations = readLocalArray('elan_admin_quotes_v1');
  const customer = clients.find((item) =>
    slugifyLocal(item?.name) === code ||
    portalSlug(item?.portal) === code
  );

  if (!customer) return null;

  const projects = quotations
    .filter((quotation) =>
      quotation?.client_id === customer.id ||
      String(quotation?.client_name || '').trim().toLowerCase() ===
        String(customer.name || '').trim().toLowerCase()
    )
    .map((quotation) => ({
      projectId: quotation.reference || quotation.id,
      projectNumber: quotation.reference || '',
      projectTitle: quotation.project || 'Proyecto ELANVISUAL',
      quotationId: quotation.id,
      quotationNumber: quotation.id,
      issuedAt: quotation.date || quotation.created_at || null,
      totalUsd: Number(quotation.total || 0),
      status: quotation.status || 'draft',
      viewUrl: quotation.published_url || ''
    }));

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.whatsapp || ''
    },
    counts: {
      quotations: projects.length
    },
    projects
  };
}

export async function getPublicCustomerDossier(accessCode) {
  const code = normalizeCustomerAccessCode(accessCode);

  if (!code) {
    const error = new Error(
      'El enlace público no es válido.'
    );
    error.status = 400;
    throw error;
  }

  const url = buildVqsFunctionUrl(
    CONNECT_PUBLIC_BASE_URL,
    `public/customer/${encodeURIComponent(code)}`
  );

  url.searchParams.set(
    '_refresh',
    String(Date.now())
  );

  const response = await fetch(
    url.toString(),
    {
      method: 'GET',
      headers: HEADERS,
      cache: 'no-store'
    }
  );

  const payload =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
      'No fue posible consultar el expediente.'
    );

    error.status = response.status;
    error.code =
      payload?.error?.code ||
      'PUBLIC_CUSTOMER_DOSSIER_FAILED';

    throw error;
  }

  const data = payload?.data || {};

  const record =
    applyQuotationImageFallback(
      data.quotation || {}
    );

  return {
    ...data,
    quotation:
      normalizeQuotationRecord(record)
  };
}


export async function getPublicCustomerPortal(accessCode) {
  const code = normalizeCustomerPortalKey(accessCode);

  if (!code) {
    const error = new Error('El enlace del cliente no es válido.');
    error.status = 400;
    error.code = 'PUBLIC_CUSTOMER_PORTAL_CODE_INVALID';
    throw error;
  }

  const url = buildVqsFunctionUrl(
    CONNECT_PUBLIC_BASE_URL,
    `public/portal/${encodeURIComponent(code)}`
  );

  url.searchParams.set('_refresh', String(Date.now()));

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: HEADERS,
      cache: 'no-store'
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const localPortal = getLocalCustomerPortal(code);
      if (localPortal) return localPortal;

      const error = new Error(
        payload?.error?.message ||
        'No fue posible abrir el espacio del cliente.'
      );
      error.status = response.status;
      error.code =
        payload?.error?.code ||
        'PUBLIC_CUSTOMER_PORTAL_FAILED';
      throw error;
    }

    return payload?.data || {};
  } catch (cause) {
    const localPortal = getLocalCustomerPortal(code);
    if (localPortal) return localPortal;
    throw cause;
  }
}


export async function approvePublicCustomerQuotation(
  accessCode,
  quotationId
) {
  const code = normalizeCustomerPortalKey(accessCode);
  const id = String(quotationId || '').trim();

  if (!code || !id) {
    const error = new Error('No fue posible identificar la cotización.');
    error.status = 400;
    throw error;
  }

  const url = buildVqsFunctionUrl(
    CONNECT_PUBLIC_BASE_URL,
    `public/portal/${encodeURIComponent(code)}/quotations/${encodeURIComponent(id)}/approve`
  );

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: HEADERS,
    cache: 'no-store'
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
      'No fue posible aprobar la cotización.'
    );
    error.status = response.status;
    error.code =
      payload?.error?.code ||
      'PUBLIC_CUSTOMER_APPROVAL_FAILED';
    throw error;
  }

  return payload?.data || {};
}
