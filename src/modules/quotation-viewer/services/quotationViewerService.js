import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';
import { prepareQuotationContractAssets } from '../../vqs/services/quotationAssetUploadRegistry';
import { supabase } from '../../../lib/supabase';
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
  const url = new URL(`${resolveBaseUrl()}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (hasValue(value)) url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function authenticatedHeaders(role, userId) {
  const session = supabase ? await supabase.auth.getSession() : { data: {} };
  const accessToken = session?.data?.session?.access_token || '';
  return {
    ...REQUIRED_HEADERS,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(role ? { 'X-Elankav-Role': role } : {}),
    ...(userId ? { 'X-Elankav-User-Id': userId } : {})
  };
}

async function request(path, { method = 'GET', params = {}, body, role, userId } = {}) {
  const headers = await authenticatedHeaders(role, userId);
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : payload?.error?.message || payload?.message || 'No fue posible procesar la cotizacion.'
    );
    error.status = response.status;
    error.code = payload?.code || payload?.error?.code || 'QUOTATION_VIEWER_REQUEST_FAILED';
    error.details = payload?.details || payload?.error?.details || [];
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
  const projectId = text(
    record.projectId || record.project_id || record.project?.id || record.id || requestedProjectId
  );
  const quotationId = text(
    record.quotationId || record.quotation_id || record.quotation?.id || record.quote?.id
  );

  return {
    ...normalized,
    id: projectId || normalized.id,
    projectId: projectId || normalized.projectId || normalized.id,
    quotationId: quotationId || normalized.quotationId || '',
    executiveId: text(record.executiveId || record.executive_id || normalized.executiveId),
    publicUrl: text(
      record.publicUrl ||
      record.public_url ||
      record.quotation_document?.publicDocument?.publicUrl ||
      record.quotationDocument?.publicDocument?.publicUrl ||
      normalized.publicUrl
    )
  };
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
    const error = new Error('CONNECT no entrego el documento oficial de la cotizacion.');
    error.code = 'OFFICIAL_QUOTATION_DOCUMENT_MISSING';
    throw error;
  }

  return record;
}

export async function listQuotations({ limit = DEFAULT_LIMIT, role, userId } = {}) {
  const payload = await request('/api/vqs/projects', {
    params: { platform: PLATFORM, limit },
    role,
    userId
  });
  const raw = applyQuotationListAliasesToPayload(payload);
  const quotations = normalizeQuotationCollection(raw).map((quotation, index) => {
    const records = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    return preserveLineage(quotation, records[index] || {});
  });

  return {
    quotations,
    count: Number(payload?.count ?? payload?.total ?? quotations.length)
  };
}

export async function getQuotationDetail(id, { role, userId } = {}) {
  const requestedId = text(id);
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');

  const payload = await request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    params: { platform: PLATFORM },
    role,
    userId
  });
  const record = applyQuotationImageFallback(assertOfficialDocument(assertRecord(extractRecord(payload))));
  return preserveLineage(normalizeQuotationRecord(record), record, requestedId);
}

export async function getQuotationEditData(id, { role, userId } = {}) {
  const requestedId = text(id);
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');

  const payload = await request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    params: { platform: PLATFORM },
    role,
    userId
  });
  return assertOfficialDocument(assertRecord(extractRecord(payload)));
}

export async function updateQuotation(id, contract, { role, userId } = {}) {
  const requestedId = text(id);
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');
  const preparedContract = await prepareQuotationContractAssets(contract);

  return request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    method: 'PATCH',
    body: preparedContract,
    role,
    userId
  });
}

export async function deleteQuotation(id, { confirmation, role = 'admin', userId = '' } = {}) {
  const requestedId = text(id);
  const confirmedNumber = text(confirmation);
  if (!requestedId) throw new Error('No se recibio el identificador del proyecto.');
  if (!confirmedNumber) throw new Error('Debes confirmar el numero exacto de la cotizacion.');

  return request(`/api/vqs/projects/${encodeURIComponent(requestedId)}`, {
    method: 'DELETE',
    body: { confirmation: confirmedNumber },
    role,
    userId
  });
}

export const quotationViewerService = Object.freeze({
  listQuotations,
  getQuotationDetail,
  getQuotationEditData,
  updateQuotation,
  deleteQuotation
});