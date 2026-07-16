import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';
import {
  normalizeQuotationCollection,
  normalizeQuotationRecord
} from '../adapters/quotationDocumentAdapter';

const PLATFORM = 'ELANVISUAL';
const DEFAULT_LIMIT = 200;

const REQUIRED_HEADERS = Object.freeze({
  Accept: 'application/json',
  'X-Elankav-Platform': PLATFORM,
  'X-Elankav-Actor-Type': 'user'
});

const hasValue = (value) => value !== undefined && value !== null && value !== '';

function buildUrl(path, params = {}) {
  const url = new URL(`${resolveBaseUrl()}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (hasValue(value)) url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function request(path, params = {}) {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: REQUIRED_HEADERS
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || 'No fue posible consultar las cotizaciones.');
    error.status = response.status;
    error.code = payload?.code || 'QUOTATION_VIEWER_REQUEST_FAILED';
    throw error;
  }

  return payload;
}

function extractRecord(payload = {}) {
  if (Array.isArray(payload?.data)) return payload.data[0] || {};
  if (payload?.data && typeof payload.data === 'object') return payload.data;
  if (payload?.project && typeof payload.project === 'object') return payload.project;
  if (payload?.quotation && typeof payload.quotation === 'object') return payload.quotation;
  if (payload?.document && typeof payload.document === 'object') return payload.document;
  return payload || {};
}

function assertRecord(record) {
  if (!record || (typeof record === 'object' && !Array.isArray(record) && Object.keys(record).length === 0)) {
    throw new Error('No se encontro la cotizacion solicitada.');
  }
  return record;
}

export async function listQuotations({ limit = DEFAULT_LIMIT } = {}) {
  const payload = await request('/api/vqs/projects', { platform: PLATFORM, limit });
  const quotations = normalizeQuotationCollection(payload);

  return {
    quotations,
    count: Number(payload?.count ?? payload?.total ?? quotations.length)
  };
}

export async function getQuotationDetail(id) {
  const requestedId = String(id || '').trim();
  if (!requestedId) throw new Error('No se recibio el identificador de la cotizacion.');

  let directError = null;

  try {
    const payload = await request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, { platform: PLATFORM });
    return normalizeQuotationRecord(assertRecord(extractRecord(payload)));
  } catch (error) {
    directError = error;
  }

  const { quotations } = await listQuotations({ limit: DEFAULT_LIMIT });
  const decodedId = decodeURIComponent(requestedId);
  const found = quotations.find((quotation) =>
    quotation.id === decodedId || quotation.quotationNumber === decodedId
  );

  if (found) return found;

  if (directError) throw directError;
  throw new Error('No se encontro la cotizacion solicitada.');
}

export const quotationViewerService = Object.freeze({
  listQuotations,
  getQuotationDetail
});
