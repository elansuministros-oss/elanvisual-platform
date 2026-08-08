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
const text = (value) => String(value ?? '').trim();

function buildUrl(path, params = {}) {
  const query = new URLSearchParams({ path });
  Object.entries(params).forEach(([key, value]) => {
    if (hasValue(value)) query.set(key, String(value));
  });
  return `/api/vqs?${query.toString()}`;
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
    const error = new Error(payload?.error || payload?.message || 'No fue posible procesar la cotización en CONNECT.');
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

function preserveLineage(normalized = {}, record = {}, requestedProjectId = '') {
  const projectId = text(record.projectId || record.project_id || record.project?.id || record.id || requestedProjectId);
  const quotationId = text(record.quotationId || record.quotation_id || record.quotation?.id || record.quote?.id);
  return {
    ...normalized,
    id: projectId || normalized.id,
    projectId: projectId || normalized.projectId || normalized.id,
    quotationId: quotationId || normalized.quotationId || ''
  };
}

function assertRecord(record) {
  if (!record || (typeof record === 'object' && !Array.isArray(record) && Object.keys(record).length === 0)) {
    throw new Error('No se encontró la cotización solicitada.');
  }
  return record;
}

function assertOfficialDocument(record) {
  const document = record?.quotation_document || record?.quotationDocument;
  if (!document || !document?.publicDocument) {
    const error = new Error('CONNECT no entregó el documento oficial de la cotización.');
    error.code = 'OFFICIAL_QUOTATION_DOCUMENT_MISSING';
    throw error;
  }
  return record;
}

export async function listQuotations({ limit = DEFAULT_LIMIT } = {}) {
  const payload = await request('quotations', { params: { platform: PLATFORM, limit } });
  const quotations = normalizeQuotationCollection(applyQuotationListAliasesToPayload(payload));
  return { quotations, count: Number(payload?.count ?? payload?.total ?? quotations.length) };
}

export async function getQuotationDetail(id) {
  const requestedId = text(id);
  if (!requestedId) throw new Error('No se recibió el identificador del proyecto.');
  const payload = await request(`quotations/${encodeURIComponent(requestedId)}`, { params: { platform: PLATFORM } });
  const record = applyQuotationImageFallback(assertOfficialDocument(assertRecord(extractRecord(payload))));
  return preserveLineage(normalizeQuotationRecord(record), record, requestedId);
}

export async function getQuotationEditData(id) {
  const requestedId = text(id);
  if (!requestedId) throw new Error('No se recibió el identificador del proyecto.');
  const payload = await request(`quotations/${encodeURIComponent(requestedId)}`, { params: { platform: PLATFORM } });
  return assertOfficialDocument(assertRecord(extractRecord(payload)));
}

export async function updateQuotation(id, contract) {
  const requestedId = text(id);
  if (!requestedId) throw new Error('No se recibió el identificador del proyecto.');
  const preparedContract = await prepareQuotationContractAssets(contract);
  return request(`quotations/${encodeURIComponent(requestedId)}`, { method: 'PATCH', body: preparedContract });
}

export const quotationViewerService = Object.freeze({
  listQuotations,
  getQuotationDetail,
  getQuotationEditData,
  updateQuotation
});
