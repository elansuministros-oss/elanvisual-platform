/* eslint-disable no-console */

import {
  createSignedDesignAssetUrl,
  downloadDesignAsset,
  findDesignRequestByCode,
  patchDesignRequest,
  uploadDesignResult
} from './designPortalSupabaseAdapter.js';
import { isWahaConfigured, sendDesignImageToWhatsApp } from './wahaImageDeliveryService.js';

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_DELIVERY_ATTEMPTS = 3;

function normalizeErrorCode(error, fallback = 'DESIGN_PROCESS_FAILED') {
  return String(error?.code || fallback).replace(/[^A-Z0-9_-]/gi, '_').slice(0, 120);
}

function buildDesignPrompt(request = {}) {
  const dimensions = request.width_cm && request.height_cm
    ? `${request.width_cm} cm de ancho por ${request.height_cm} cm de alto, respetando esa proporción real.`
    : 'No alterar arbitrariamente las proporciones indicadas por las referencias.';
  const stage = request.workflow_stage || 'concept';

  return [
    'Genera ahora una única propuesta visual profesional para ELANVISUAL.',
    `Tipo de trabajo: ${request.request_type || 'diseño visual'}.`,
    `Entorno de instalación: ${request.installation_environment || 'no aplica'}.`,
    `Etapa del flujo: ${stage}. Revisión: ${Number(request.revision_number || 1)}.`,
    `Medidas: ${dimensions}`,
    `Indicaciones obligatorias del cliente: ${request.design_notes || 'Desarrollar una propuesta coherente con las referencias.'}`,
    'La solución debe ser técnicamente fabricable: materiales, espesores, uniones, iluminación y montaje deben ser realistas.',
    'Mantén exactamente logotipos, textos, colores y composición presentes en las referencias cuando existan.',
    stage === 'render'
      ? 'Entrega un render comercial hiperrealista en contexto físico, sin cambiar la escala ni el diseño aprobado.'
      : 'Entrega una propuesta limpia, presentable al cliente y visualmente clara.',
    'No agregues marcas de agua, cotas inventadas, números telefónicos ni textos que el cliente no haya solicitado.'
  ].join('\n');
}

function extractGeneratedImage(responseData = {}) {
  const call = Array.isArray(responseData.output)
    ? responseData.output.find(item => item?.type === 'image_generation_call' && item?.result)
    : null;
  if (!call?.result) {
    const error = new Error('OpenAI no devolvió una imagen');
    error.code = 'DESIGN_IMAGE_RESULT_MISSING';
    error.details = { outputTypes: Array.isArray(responseData.output) ? responseData.output.map(item => item?.type) : [] };
    throw error;
  }
  const bytes = Buffer.from(call.result, 'base64');
  if (!bytes.length) {
    const error = new Error('La imagen generada está vacía');
    error.code = 'DESIGN_IMAGE_RESULT_INVALID';
    throw error;
  }
  return bytes;
}

async function generateDesignImage(request, { fetchImpl = globalThis.fetch } = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY no configurada');
    error.code = 'DESIGN_OPENAI_NOT_CONFIGURED';
    throw error;
  }

  const content = [{ type: 'input_text', text: buildDesignPrompt(request) }];
  const files = Array.isArray(request.files) ? request.files : [];
  for (const file of files.slice(0, 3)) {
    const mimeType = String(file?.mimeType || '').toLowerCase();
    if (!IMAGE_MIME_TYPES.has(mimeType) || !file?.bucket || !file?.path) continue;
    const imageUrl = await createSignedDesignAssetUrl({ bucket: file.bucket, path: file.path, expiresIn: 900, fetchImpl });
    content.push({ type: 'input_image', image_url: imageUrl, detail: 'high' });
  }

  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ELAN_DESIGN_MODEL || 'gpt-5',
      input: [{ role: 'user', content }],
      tools: [{
        type: 'image_generation',
        quality: process.env.ELAN_DESIGN_QUALITY || 'high',
        size: process.env.ELAN_DESIGN_SIZE || '1024x1024',
        output_format: 'png'
      }]
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
    error.code = 'DESIGN_OPENAI_FAILED';
    error.details = { status: response.status, type: data?.error?.type || null, code: data?.error?.code || null };
    throw error;
  }
  return extractGeneratedImage(data);
}

async function processPendingDesignRequest({ requestCode, fetchImpl = globalThis.fetch } = {}) {
  const code = String(requestCode || '').trim().toUpperCase();
  const stored = await findDesignRequestByCode({ requestCode: code, fetchImpl });
  if (!stored || stored.status !== 'ai_pending') return { processed: false, status: stored?.status || 'not_found' };

  const claimed = await patchDesignRequest({
    requestCode: code,
    expectedStatus: 'ai_pending',
    values: { status: 'ai_processing', last_error_code: null, updated_at: new Date().toISOString() },
    fetchImpl
  });
  if (!claimed) return { processed: false, status: 'already_claimed' };

  try {
    const bytes = await generateDesignImage(claimed, { fetchImpl });
    let result = await uploadDesignResult({
      requestCode: code,
      revisionNumber: claimed.revision_number || 1,
      bytes,
      mimeType: 'image/png',
      fetchImpl
    });

    let delivery = { deliveredToWhatsApp: false, deliveryAttempts: 0, deliveryErrorCode: null, deliveredAt: null };
    if (isWahaConfigured()) {
      try {
        await sendDesignImageToWhatsApp({
          whatsapp: claimed.whatsapp,
          requestCode: code,
          bytes,
          mimeType: 'image/png',
          fetchImpl
        });
        delivery = { deliveredToWhatsApp: true, deliveryAttempts: 1, deliveryErrorCode: null, deliveredAt: new Date().toISOString() };
      } catch (error) {
        delivery = {
          deliveredToWhatsApp: false,
          deliveryAttempts: 1,
          deliveryErrorCode: normalizeErrorCode(error, 'DESIGN_DELIVERY_FAILED'),
          deliveredAt: null
        };
      }
    } else {
      delivery.deliveryErrorCode = 'DESIGN_DELIVERY_WAHA_NOT_CONFIGURED';
    }
    result = { ...result, ...delivery };

    const completedAt = new Date().toISOString();
    const completed = await patchDesignRequest({
      requestCode: code,
      expectedStatus: 'ai_processing',
      values: {
        status: 'review',
        result_files: [result],
        completed_at: completedAt,
        last_error_code: null,
        updated_at: completedAt
      },
      fetchImpl
    });
    if (!completed) {
      const error = new Error('La solicitud perdió el bloqueo de procesamiento');
      error.code = 'DESIGN_PROCESS_CLAIM_LOST';
      throw error;
    }
    return { processed: true, status: 'review', deliveredToWhatsApp: result.deliveredToWhatsApp };
  } catch (error) {
    console.error('ERROR procesando diseño:', code, error);
    await patchDesignRequest({
      requestCode: code,
      expectedStatus: 'ai_processing',
      values: {
        status: 'failed',
        completed_at: null,
        last_error_code: normalizeErrorCode(error),
        updated_at: new Date().toISOString()
      },
      fetchImpl
    }).catch(patchError => console.error('ERROR registrando fallo de diseño:', patchError));
    throw error;
  }
}

async function retryDesignDelivery({ requestCode, fetchImpl = globalThis.fetch } = {}) {
  if (!isWahaConfigured()) return { attempted: false, reason: 'not_configured' };
  const code = String(requestCode || '').trim().toUpperCase();
  const stored = await findDesignRequestByCode({ requestCode: code, fetchImpl });
  const results = Array.isArray(stored?.result_files) ? stored.result_files : [];
  const primary = results[0];
  if (!stored || !['review', 'approved', 'quoted', 'closed'].includes(stored.status) || !primary?.bucket || !primary?.path) {
    return { attempted: false, reason: 'not_ready' };
  }
  if (primary.deliveredToWhatsApp === true) return { attempted: false, reason: 'already_delivered' };
  const attempts = Number(primary.deliveryAttempts || 0);
  if (attempts >= MAX_DELIVERY_ATTEMPTS) return { attempted: false, reason: 'attempt_limit' };

  const next = { ...primary, deliveryAttempts: attempts + 1 };
  try {
    const asset = await downloadDesignAsset({ bucket: primary.bucket, path: primary.path, fetchImpl });
    await sendDesignImageToWhatsApp({
      whatsapp: stored.whatsapp,
      requestCode: code,
      bytes: asset.bytes,
      mimeType: asset.mimeType,
      fetchImpl
    });
    next.deliveredToWhatsApp = true;
    next.deliveryErrorCode = null;
    next.deliveredAt = new Date().toISOString();
  } catch (error) {
    next.deliveredToWhatsApp = false;
    next.deliveryErrorCode = normalizeErrorCode(error, 'DESIGN_DELIVERY_FAILED');
  }
  await patchDesignRequest({
    requestCode: code,
    values: { result_files: [next, ...results.slice(1)], updated_at: new Date().toISOString() },
    fetchImpl
  });
  return { attempted: true, deliveredToWhatsApp: next.deliveredToWhatsApp };
}

export {
  buildDesignPrompt,
  extractGeneratedImage,
  generateDesignImage,
  processPendingDesignRequest,
  retryDesignDelivery
};
