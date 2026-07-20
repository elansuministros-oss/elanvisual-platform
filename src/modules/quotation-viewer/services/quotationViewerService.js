import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';
import { prepareQuotationContractAssets } from '../../vqs/services/quotationAssetUploadRegistry';
import {
  normalizeQuotationCollection,
  normalizeQuotationRecord
} from '../adapters/quotationDocumentAdapter';
import { applyQuotationImageFallback } from '../adapters/quotationImageFallback';
import { applyQuotationListAliasesToPayload } from '../adapters/quotationListAliases';

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

async function request(path, { method = 'GET', params = {}, body } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      ...REQUIRED_HEADERS,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || 'No fue posible procesar la cotizacion.');
    error.status = response.status;
    error.code = payload?.code || 'QUOTATION_VIEWER_REQUEST_FAILED';
    error.details = payload?.details || [];
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

function assertOfficialDocument(record) {
  const document = record?.quotation_document || record?.quotationDocument;
  const publicDocument = document?.publicDocument;

  if (!document || !publicDocument) {
    const error = new Error('El Orchestrator no entrego el documento oficial de la cotizacion.');
    error.code = 'OFFICIAL_QUOTATION_DOCUMENT_MISSING';
    throw error;
  }

  return record;
}

export async function listQuotations({ limit = DEFAULT_LIMIT } = {}) {
  const payload = await request('/api/vqs/projects', {
    params: { platform: PLATFORM, limit }
  });
  const quotations = normalizeQuotationCollection(applyQuotationListAliasesToPayload(payload));

  return {
    quotations,
    count: Number(payload?.count ?? payload?.total ?? quotations.length)
  };
}

export async function getQuotationDetail(id) {
  const requestedId = String(id || '').trim();
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');

  const payload = await request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    params: { platform: PLATFORM }
  });
  const record = applyQuotationImageFallback(assertOfficialDocument(assertRecord(extractRecord(payload))));
  return normalizeQuotationRecord(record);
}

export async function getQuotationEditData(id) {
  const requestedId = String(id || '').trim();
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');

  const payload = await request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    params: { platform: PLATFORM }
  });
  return assertOfficialDocument(assertRecord(extractRecord(payload)));
}

export async function updateQuotation(id, contract) {
  const requestedId = String(id || '').trim();
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');
  const preparedContract = await prepareQuotationContractAssets(contract);

  return request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    method: 'PATCH',
    body: preparedContract
  });
}

export const quotationViewerService = Object.freeze({
  listQuotations,
  getQuotationDetail,
  getQuotationEditData,
  updateQuotation
});
