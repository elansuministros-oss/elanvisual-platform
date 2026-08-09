const DESIGN_REQUESTS_TABLE = 'design_requests';
const DESIGN_GALLERY_TABLE = 'design_gallery_items';
const DESIGN_ASSETS_BUCKET = 'design-request-assets';
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const DESIGN_SELECT = 'id,request_code,customer_name,business_name,whatsapp,status,request_type,installation_environment,width_cm,height_cm,has_logo,needs_logo_design,design_notes,files,result_files,completed_at,last_error_code,workflow_stage,revision_number,version_history,updated_at';

function resolveDesignSupabaseConfig() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim().replace(/\/+$/, '');
  const key = String(
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY || ''
  ).trim();

  if (!url || !key) {
    const error = new Error('Design Portal Supabase no configurado');
    error.code = 'DESIGN_SUPABASE_NOT_CONFIGURED';
    throw error;
  }
  return { url, key };
}

function createHeaders(key, extra = {}) {
  const headers = { apikey: key, ...extra };
  if (key.split('.').length === 3) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function sanitizeFileName(value) {
  return String(value || 'archivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 120) || 'archivo';
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(
    /^data:(image\/png|image\/jpeg|image\/webp|image\/svg\+xml|application\/pdf);base64,([a-z0-9+/=\r\n]+)$/i
  );
  if (!match) {
    const error = new Error('Archivo de diseño inválido');
    error.code = 'DESIGN_FILE_INVALID';
    throw error;
  }
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) {
    const error = new Error('Archivo de diseño excede el límite permitido');
    error.code = 'DESIGN_FILE_SIZE_INVALID';
    throw error;
  }
  return { mimeType: match[1].toLowerCase(), bytes };
}

async function uploadObject({ path, bytes, mimeType, upsert = false, fetchImpl = globalThis.fetch }) {
  const { url, key } = resolveDesignSupabaseConfig();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetchImpl(`${url}/storage/v1/object/${DESIGN_ASSETS_BUCKET}/${encodedPath}`, {
    method: 'POST',
    headers: createHeaders(key, { 'Content-Type': mimeType, 'x-upsert': String(upsert) }),
    body: bytes
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error('No fue posible guardar el archivo de diseño');
    error.code = 'DESIGN_FILE_UPLOAD_FAILED';
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
}

async function uploadDesignAsset({ requestCode, kind, file, fetchImpl = globalThis.fetch } = {}) {
  const decoded = decodeDataUrl(file?.dataUrl);
  const fileName = sanitizeFileName(file?.name);
  const path = `${requestCode}/${kind}-${crypto.randomUUID()}-${fileName}`;
  await uploadObject({ path, bytes: decoded.bytes, mimeType: decoded.mimeType, fetchImpl });
  return { kind, name: fileName, mimeType: decoded.mimeType, sizeBytes: decoded.bytes.length, bucket: DESIGN_ASSETS_BUCKET, path };
}

async function uploadDesignResult({ requestCode, revisionNumber = 1, bytes, mimeType = 'image/png', fetchImpl = globalThis.fetch } = {}) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_FILE_BYTES) {
    const error = new Error('Resultado de diseño inválido');
    error.code = 'DESIGN_RESULT_FILE_INVALID';
    throw error;
  }
  const path = `${requestCode}/results/revision-${Number(revisionNumber || 1)}.png`;
  await uploadObject({ path, bytes, mimeType, upsert: true, fetchImpl });
  return {
    kind: 'result',
    name: `${requestCode}-revision-${Number(revisionNumber || 1)}.png`,
    mimeType,
    sizeBytes: bytes.length,
    bucket: DESIGN_ASSETS_BUCKET,
    path
  };
}

async function insertDesignRequest(row, { fetchImpl = globalThis.fetch } = {}) {
  const { url, key } = resolveDesignSupabaseConfig();
  const response = await fetchImpl(`${url}/rest/v1/${DESIGN_REQUESTS_TABLE}`, {
    method: 'POST',
    headers: createHeaders(key, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(row)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data) || !data[0]) {
    const error = new Error('No fue posible registrar la solicitud de diseño');
    error.code = 'DESIGN_REQUEST_INSERT_FAILED';
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
  return data[0];
}

async function readDesignRequest(query, errorCode, fetchImpl = globalThis.fetch) {
  const { url, key } = resolveDesignSupabaseConfig();
  const response = await fetchImpl(`${url}/rest/v1/${DESIGN_REQUESTS_TABLE}?${query}`, { headers: createHeaders(key) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    const error = new Error('No fue posible consultar la solicitud de diseño');
    error.code = errorCode;
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
  return data[0] || null;
}

async function findDesignRequestByAccess({ requestCode, accessTokenHash, fetchImpl = globalThis.fetch } = {}) {
  const query = new URLSearchParams({
    select: DESIGN_SELECT,
    request_code: `eq.${requestCode}`,
    access_token_hash: `eq.${accessTokenHash}`,
    limit: '1'
  });
  return readDesignRequest(query, 'DESIGN_REQUEST_READ_FAILED', fetchImpl);
}

async function findDesignRequestByCode({ requestCode, fetchImpl = globalThis.fetch } = {}) {
  const query = new URLSearchParams({ select: DESIGN_SELECT, request_code: `eq.${requestCode}`, limit: '1' });
  return readDesignRequest(query, 'DESIGN_PROCESS_READ_FAILED', fetchImpl);
}

async function patchDesignRequest({ requestCode, values, expectedStatus, fetchImpl = globalThis.fetch } = {}) {
  const { url, key } = resolveDesignSupabaseConfig();
  const query = new URLSearchParams({ request_code: `eq.${requestCode}` });
  if (expectedStatus) query.set('status', `eq.${expectedStatus}`);
  const response = await fetchImpl(`${url}/rest/v1/${DESIGN_REQUESTS_TABLE}?${query}`, {
    method: 'PATCH',
    headers: createHeaders(key, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(values)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    const error = new Error('No fue posible actualizar la solicitud de diseño');
    error.code = 'DESIGN_PROCESS_UPDATE_FAILED';
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
  return data[0] || null;
}

async function updateDesignRequestByAccess({ requestCode, accessTokenHash, values, fetchImpl = globalThis.fetch } = {}) {
  const { url, key } = resolveDesignSupabaseConfig();
  const query = new URLSearchParams({ request_code: `eq.${requestCode}`, access_token_hash: `eq.${accessTokenHash}` });
  const response = await fetchImpl(`${url}/rest/v1/${DESIGN_REQUESTS_TABLE}?${query}`, {
    method: 'PATCH',
    headers: createHeaders(key, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(values)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    const error = new Error('No fue posible actualizar la solicitud de diseño');
    error.code = 'DESIGN_FOLLOWUP_UPDATE_FAILED';
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
  return data[0] || null;
}

async function createSignedDesignAssetUrl({ bucket, path, expiresIn = 3600, fetchImpl = globalThis.fetch } = {}) {
  const { url, key } = resolveDesignSupabaseConfig();
  const encodedPath = String(path || '').split('/').map(encodeURIComponent).join('/');
  const response = await fetchImpl(`${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`, {
    method: 'POST',
    headers: createHeaders(key, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn })
  });
  const data = await response.json().catch(() => null);
  const signedPath = data?.signedURL || data?.signedUrl || data?.signed_url;
  if (!response.ok || !signedPath) {
    const error = new Error('No fue posible preparar el resultado de diseño');
    error.code = 'DESIGN_RESULT_SIGN_FAILED';
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
  return String(signedPath).startsWith('http') ? String(signedPath) : `${url}/storage/v1${signedPath}`;
}

async function downloadDesignAsset({ bucket, path, fetchImpl = globalThis.fetch } = {}) {
  const { url, key } = resolveDesignSupabaseConfig();
  const encodedPath = String(path || '').split('/').map(encodeURIComponent).join('/');
  const response = await fetchImpl(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
    headers: createHeaders(key)
  });
  if (!response.ok) {
    const error = new Error('No fue posible leer el resultado de diseño');
    error.code = 'DESIGN_RESULT_DOWNLOAD_FAILED';
    throw error;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) {
    const error = new Error('Resultado de diseño inválido');
    error.code = 'DESIGN_RESULT_FILE_INVALID';
    throw error;
  }
  return { bytes, mimeType: String(response.headers.get('content-type') || 'image/png').split(';')[0].trim() };
}

async function listPublishedDesigns({ fetchImpl = globalThis.fetch } = {}) {
  const { url, key } = resolveDesignSupabaseConfig();
  const query = new URLSearchParams({
    select: 'id,title,category,description,image_url,thumbnail_url,published_at',
    status: 'eq.published', order: 'sort_order.asc,published_at.desc', limit: '60'
  });
  const response = await fetchImpl(`${url}/rest/v1/${DESIGN_GALLERY_TABLE}?${query}`, { headers: createHeaders(key) });
  const data = await response.json().catch(() => null);
  if (response.status === 404 && data?.code === 'PGRST205') return [];
  if (!response.ok || !Array.isArray(data)) {
    const error = new Error('No fue posible consultar la galería de diseños');
    error.code = 'DESIGN_GALLERY_READ_FAILED';
    error.details = { status: response.status, statusText: response.statusText, response: data };
    throw error;
  }
  return data;
}

export {
  DESIGN_ASSETS_BUCKET,
  MAX_FILE_BYTES,
  createSignedDesignAssetUrl,
  downloadDesignAsset,
  findDesignRequestByAccess,
  findDesignRequestByCode,
  insertDesignRequest,
  listPublishedDesigns,
  patchDesignRequest,
  updateDesignRequestByAccess,
  uploadDesignAsset,
  uploadDesignResult
};
