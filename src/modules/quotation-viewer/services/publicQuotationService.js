import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';
import { normalizeQuotationRecord } from '../adapters/quotationDocumentAdapter';

const HEADERS = Object.freeze({
  Accept: 'application/json',
  'X-Elankav-Platform': 'ELANVISUAL',
  'X-Elankav-Actor-Type': 'public-customer'
});

function buildPublicQuotationUrl(projectId) {
  const url = new URL(
    `${resolveBaseUrl()}/api/vqs/public/quotations/${encodeURIComponent(projectId)}`
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

  const record = payload?.data || {};
  return {
    quotation: normalizeQuotationRecord(record),
    pdfUrl: String(record.pdfUrl || record.pdf_url || '').trim()
  };
}

export const publicQuotationService = Object.freeze({ getPublicQuotation });
