import { resolveBaseUrl } from '../../vqs/services/projectCoreClient';
import { prepareQuotationContractAssets } from '../../vqs/services/quotationAssetUploadRegistry';
import {
  normalizeQuotationCollection,
  normalizeQuotationRecord
} from '../adapters/quotationDocumentAdapter';
import { applyQuotationImageFallback } from '../adapters/quotationImageFallback';

const PLATFORM = 'ELANVISUAL';
const DEFAULT_LIMIT = 200;

const REQUIRED_HEADERS = Object.freeze({
  Accept: 'application/json',
  'X-Elankav-Platform': PLATFORM,
  'X-Elankav-Actor-Type': 'user'
});

const hasValue = (value) => value !== undefined && value !== null && value !== '';
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

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

function extractRows(payload = {}) {
  const candidates = [
    payload,
    payload.data,
    payload.projects,
    payload.items,
    payload.results,
    payload.records,
    payload.quotations,
    payload.data?.projects,
    payload.data?.items,
    payload.data?.results,
    payload.data?.records,
    payload.data?.quotations
  ];
  return candidates.find(Array.isArray) || [];
}

function valueAt(source, path) {
  return path.split('.').reduce((current, key) => {
    if (!isObject(current) && !Array.isArray(current)) return undefined;
    return current?.[key];
  }, source);
}

function firstText(source, paths) {
  for (const path of paths) {
    const value = valueAt(source, path);
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return '';
}

function parsedObject(value) {
  if (isObject(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function snapshotFrom(record, names) {
  for (const name of names) {
    const snapshot = parsedObject(valueAt(record, name));
    if (Object.keys(snapshot).length) return snapshot;
  }
  return {};
}

export function enrichQuotationListRecord(quotation = {}, record = {}) {
  const customerSnapshot = snapshotFrom(record, [
    'customerSnapshot',
    'customer_snapshot',
    'quotation.customerSnapshot',
    'quotation.customer_snapshot',
    'project.customerSnapshot',
    'project.customer_snapshot'
  ]);
  const executiveSnapshot = snapshotFrom(record, [
    'executiveSnapshot',
    'executive_snapshot',
    'quotation.executiveSnapshot',
    'quotation.executive_snapshot',
    'project.executiveSnapshot',
    'project.executive_snapshot'
  ]);

  return {
    ...quotation,
    customer: {
      ...(quotation.customer || {}),
      name: quotation.customer?.name || firstText(record, [
        'customerName',
        'customer_name',
        'clientName',
        'client_name'
      ]) || firstText(customerSnapshot, ['name', 'fullName', 'full_name', 'nombre']),
      companyName: quotation.customer?.companyName || firstText(record, [
        'customerCompanyName',
        'customer_company_name',
        'companyName',
        'company_name'
      ]) || firstText(customerSnapshot, ['companyName', 'company_name', 'company', 'empresa']),
      phone: quotation.customer?.phone || firstText(record, [
        'customerPhone',
        'customer_phone',
        'customerWhatsapp',
        'customer_whatsapp',
        'phone',
        'whatsapp'
      ]) || firstText(customerSnapshot, ['phone', 'whatsapp', 'telefono', 'celular']),
      email: quotation.customer?.email || firstText(customerSnapshot, ['email', 'correo']),
      address: quotation.customer?.address || firstText(customerSnapshot, ['address', 'direccion', 'location', 'ubicacion']),
      taxId: quotation.customer?.taxId || firstText(customerSnapshot, ['taxId', 'tax_id', 'ruc'])
    },
    executive: {
      ...(quotation.executive || {}),
      name: quotation.executive?.name || firstText(record, [
        'executiveName',
        'executive_name',
        'advisorName',
        'advisor_name',
        'sellerName',
        'seller_name'
      ]) || firstText(executiveSnapshot, ['name', 'fullName', 'full_name', 'nombre']),
      role: quotation.executive?.role || firstText(executiveSnapshot, ['role', 'cargo']),
      phone: quotation.executive?.phone || firstText(executiveSnapshot, ['phone', 'telefono', 'celular']),
      email: quotation.executive?.email || firstText(executiveSnapshot, ['email', 'correo'])
    }
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
  const rows = extractRows(payload);
  const quotations = normalizeQuotationCollection(payload)
    .map((quotation, index) => enrichQuotationListRecord(quotation, rows[index] || {}));

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
