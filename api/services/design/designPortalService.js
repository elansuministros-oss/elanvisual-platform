import { createHash, randomBytes } from 'node:crypto';
import {
  createSignedDesignAssetUrl,
  findDesignRequestByAccess,
  insertDesignRequest,
  listPublishedDesigns,
  updateDesignRequestByAccess,
  uploadDesignAsset
} from './designPortalSupabaseAdapter.js';

const REQUEST_TYPES = new Set(['rotulo', 'fachada', 'logo', 'otro']);
const ENVIRONMENTS = new Set(['interior', 'exterior']);
const FILE_KINDS = new Set(['logo', 'place', 'reference']);

function normalizeText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 8 ? `505${digits}` : digits;
}

function normalizeDimension(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= 100000 ? number : null;
}

function generateRequestCode(now = Date.now(), uuid = crypto.randomUUID()) {
  return `DESIGN-${now.toString(36).toUpperCase()}-${uuid.slice(0, 4).toUpperCase()}`;
}

function generateAccessToken() {
  return randomBytes(32).toString('base64url');
}

function hashAccessToken(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

function validateRequest(payload = {}) {
  const customer = payload.customer || {};
  const project = payload.project || {};
  const customerName = normalizeText(customer.name, 160);
  const businessName = normalizeText(customer.businessName, 200);
  const whatsapp = normalizePhone(customer.whatsapp);
  const requestType = normalizeText(project.requestType, 30).toLowerCase();
  const environment = normalizeText(project.installationEnvironment, 30).toLowerCase();
  const designNotes = normalizeText(project.designNotes, 6000);
  const files = Array.isArray(payload.files)
    ? payload.files.slice(0, 3).filter(file => FILE_KINDS.has(String(file?.kind || '').toLowerCase()) && file?.dataUrl)
    : [];

  if (!customerName || !businessName) {
    const error = new Error('Nombre del cliente y negocio son obligatorios');
    error.code = 'DESIGN_CUSTOMER_REQUIRED';
    throw error;
  }
  if (whatsapp.length < 8 || whatsapp.length > 15) {
    const error = new Error('WhatsApp inválido');
    error.code = 'DESIGN_WHATSAPP_INVALID';
    throw error;
  }
  if (!REQUEST_TYPES.has(requestType)) {
    const error = new Error('Tipo de solicitud inválido');
    error.code = 'DESIGN_REQUEST_TYPE_INVALID';
    throw error;
  }
  if (requestType !== 'logo' && !ENVIRONMENTS.has(environment)) {
    const error = new Error('Ubicación interior o exterior es obligatoria');
    error.code = 'DESIGN_ENVIRONMENT_REQUIRED';
    throw error;
  }
  if (!designNotes && files.length === 0) {
    const error = new Error('Agregá indicaciones o una referencia visual');
    error.code = 'DESIGN_CONTENT_REQUIRED';
    throw error;
  }

  return {
    source: normalizeText(payload.source || 'web', 40),
    externalUserId: normalizeText(payload.externalUserId, 160) || null,
    conversationRef: normalizeText(payload.conversationRef, 300) || null,
    customerName,
    businessName,
    whatsapp,
    requestType,
    environment: requestType === 'logo' ? null : environment,
    widthCm: normalizeDimension(project.widthCm),
    heightCm: normalizeDimension(project.heightCm),
    hasLogo: project.hasLogo === true,
    needsLogoDesign: project.needsLogoDesign === true || requestType === 'logo',
    designNotes,
    files
  };
}

async function createDesignRequest(payload = {}) {
  const normalized = validateRequest(payload);
  const requestCode = generateRequestCode();
  const accessToken = generateAccessToken();
  const uploadedFiles = [];

  for (const file of normalized.files) {
    uploadedFiles.push(await uploadDesignAsset({
      requestCode,
      kind: String(file.kind).toLowerCase(),
      file
    }));
  }

  const stored = await insertDesignRequest({
    request_code: requestCode,
    source: normalized.source,
    external_user_id: normalized.externalUserId,
    conversation_ref: normalized.conversationRef,
    customer_name: normalized.customerName,
    business_name: normalized.businessName,
    whatsapp: normalized.whatsapp,
    request_type: normalized.requestType,
    installation_environment: normalized.environment,
    width_cm: normalized.widthCm,
    height_cm: normalized.heightCm,
    has_logo: normalized.hasLogo,
    needs_logo_design: normalized.needsLogoDesign,
    design_notes: normalized.designNotes,
    files: uploadedFiles,
    access_token_hash: hashAccessToken(accessToken),
    status: 'ai_pending'
  });

  return {
    id: stored.id,
    requestCode: stored.request_code || requestCode,
    accessToken,
    status: stored.status || 'ai_pending',
    whatsapp: normalized.whatsapp,
    filesReceived: uploadedFiles.length
  };
}

function validateAccess(requestCode, accessToken) {
  const code = normalizeText(requestCode, 80).toUpperCase();
  const token = normalizeText(accessToken, 200);
  if (!/^DESIGN-[A-Z0-9]+-[A-Z0-9]{4}$/.test(code) || !token) {
    const error = new Error('Acceso de solicitud inválido');
    error.code = 'DESIGN_STATUS_ACCESS_INVALID';
    throw error;
  }
  return { code, token };
}

async function getDesignRequestStatus({ requestCode, accessToken } = {}) {
  const { code, token } = validateAccess(requestCode, accessToken);
  const stored = await findDesignRequestByAccess({ requestCode: code, accessTokenHash: hashAccessToken(token) });
  if (!stored) {
    const error = new Error('Solicitud de diseño no encontrada');
    error.code = 'DESIGN_STATUS_NOT_FOUND';
    throw error;
  }

  const resultFiles = Array.isArray(stored.result_files) ? stored.result_files : [];
  const primary = resultFiles[0] || null;
  const imageUrl = primary?.bucket && primary?.path
    ? await createSignedDesignAssetUrl({ bucket: primary.bucket, path: primary.path })
    : null;
  const ready = ['review', 'approved', 'quoted', 'closed'].includes(stored.status) && Boolean(imageUrl);

  return {
    requestCode: stored.request_code,
    status: stored.status,
    ready,
    imageUrl,
    completedAt: stored.completed_at || null,
    retryable: stored.status === 'failed',
    deliveryStatus: 'not-managed-here',
    deliveredToWhatsApp: false,
    deliveryPending: false,
    workflowStage: stored.workflow_stage || 'concept',
    revisionNumber: Number(stored.revision_number || 1),
    lastErrorCode: stored.last_error_code || null
  };
}

async function continueDesignRequest(payload = {}) {
  const { code, token } = validateAccess(payload.requestCode, payload.accessToken);
  const action = normalizeText(payload.action, 30).toLowerCase();
  const instructions = normalizeText(payload.instructions, 4000);
  if (!['revision', 'render'].includes(action)) {
    const error = new Error('Acción de seguimiento inválida');
    error.code = 'DESIGN_FOLLOWUP_ACTION_INVALID';
    throw error;
  }
  if (!instructions) {
    const error = new Error('Describí los cambios que necesitás');
    error.code = 'DESIGN_FOLLOWUP_INSTRUCTIONS_REQUIRED';
    throw error;
  }

  const accessTokenHash = hashAccessToken(token);
  const stored = await findDesignRequestByAccess({ requestCode: code, accessTokenHash });
  if (!stored) {
    const error = new Error('Solicitud de diseño no encontrada');
    error.code = 'DESIGN_STATUS_NOT_FOUND';
    throw error;
  }
  if (!['review', 'approved', 'quoted', 'closed', 'failed'].includes(stored.status)) {
    const error = new Error('La solicitud todavía está en proceso');
    error.code = 'DESIGN_FOLLOWUP_NOT_READY';
    throw error;
  }

  const project = payload.project || {};
  const values = {
    status: 'ai_pending',
    workflow_stage: action === 'render' ? 'render' : 'revision',
    revision_number: Number(stored.revision_number || 1) + 1,
    design_notes: action === 'render'
      ? `Crear un render comercial hiperrealista. Indicaciones del cliente: ${instructions}`
      : `Modificar la propuesta existente. Cambios solicitados por el cliente: ${instructions}`,
    updated_at: new Date().toISOString(),
    completed_at: null,
    last_error_code: null
  };

  if (action === 'render') {
    const requestType = normalizeText(project.requestType, 30).toLowerCase();
    const environment = normalizeText(project.installationEnvironment, 30).toLowerCase();
    if (!['rotulo', 'fachada'].includes(requestType)) {
      const error = new Error('Elegí si el render será de rótulo o fachada');
      error.code = 'DESIGN_FOLLOWUP_RENDER_TYPE_REQUIRED';
      throw error;
    }
    if (!ENVIRONMENTS.has(environment)) {
      const error = new Error('Elegí si el render será para interior o exterior');
      error.code = 'DESIGN_FOLLOWUP_ENVIRONMENT_REQUIRED';
      throw error;
    }
    values.request_type = requestType;
    values.installation_environment = environment;
    values.width_cm = normalizeDimension(project.widthCm);
    values.height_cm = normalizeDimension(project.heightCm);
    values.has_logo = true;
    values.needs_logo_design = false;
  }

  const updated = await updateDesignRequestByAccess({ requestCode: code, accessTokenHash, values });
  if (!updated) {
    const error = new Error('La solicitud cambió antes de poder actualizarla');
    error.code = 'DESIGN_FOLLOWUP_CONFLICT';
    throw error;
  }

  return {
    requestCode: code,
    status: updated.status || 'ai_pending',
    action,
    workflowStage: values.workflow_stage,
    revisionNumber: values.revision_number,
    whatsapp: stored.whatsapp
  };
}

async function getPublicDesignGallery() {
  return listPublishedDesigns();
}

export {
  continueDesignRequest,
  createDesignRequest,
  getDesignRequestStatus,
  getPublicDesignGallery
};
