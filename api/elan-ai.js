/* eslint-disable no-console */

import {
  continueDesignRequest,
  createDesignRequest,
  getDesignRequestStatus,
  getPublicDesignGallery
} from './services/design/designPortalService.js';

export const config = {
  api: { bodyParser: { sizeLimit: '25mb' } }
};

const ALLOWED_ORIGINS = new Set([
  'https://visual.elankav.com',
  'https://connect.elankav.com',
  'http://localhost:5173',
  'http://localhost:3000'
]);

function isAllowedOrigin(origin = '') {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:'
      && url.hostname.startsWith('elanvisual-platform-')
      && url.hostname.endsWith('-elanpetvercelapp.vercel.app');
  } catch {
    return false;
  }
}

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
}

function send(res, status, payload) {
  return res.status(status).json(payload);
}

function safeDiagnostic(error) {
  return {
    code: String(error?.code || 'DESIGN_UNKNOWN_ERROR').slice(0, 120),
    message: String(error?.message || 'Error sin mensaje').slice(0, 500)
  };
}

async function handleChat(payload = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY no configurada en ELANVISUAL.' };

  const mensaje = String(payload.mensaje || payload.message || payload.prompt || '').trim();
  if (!mensaje) return { ok: false, error: 'Mensaje vacío.' };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ELAN_AI_MODEL || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'Eres ELAN AI, asistente operativo de ELANVISUAL. Responde de forma clara, comercial y útil.' },
        { role: 'user', content: mensaje }
      ]
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: data?.error?.message || 'Error consultando OpenAI.' };
  return { ok: true, tipo: 'elan-ai-chat', respuesta: data.output_text || '' };
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    if (String(req.query?.resource || '') === 'design-gallery') {
      try {
        const items = await getPublicDesignGallery();
        return send(res, 200, { ok: true, items });
      } catch (error) {
        console.error('ERROR design-gallery:', error);
        return send(res, 503, {
          ok: false,
          error: 'La galería de diseños no está disponible temporalmente.',
          debug: safeDiagnostic(error)
        });
      }
    }

    return send(res, 200, {
      ok: true,
      endpoint: '/api/elan-ai',
      version: 'DESIGN-PORTAL-SERVER-RESTORE-01',
      status: 'ready'
    });
  }

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Método no permitido.' });

  try {
    const payload = req.body || {};
    const tipo = String(payload.tipo || payload.type || 'chat').trim();

    if (tipo === 'design-request-action') {
      try {
        const result = await continueDesignRequest(payload);
        return send(res, 202, { ok: true, result, message: result.action === 'render' ? 'Estamos preparando el render hiperrealista.' : 'Estamos preparando una nueva versión con los cambios.' });
      } catch (error) {
        const invalid = [
          'DESIGN_STATUS_ACCESS_INVALID', 'DESIGN_STATUS_NOT_FOUND',
          'DESIGN_FOLLOWUP_ACTION_INVALID', 'DESIGN_FOLLOWUP_INSTRUCTIONS_REQUIRED',
          'DESIGN_FOLLOWUP_RENDER_TYPE_REQUIRED', 'DESIGN_FOLLOWUP_ENVIRONMENT_REQUIRED',
          'DESIGN_FOLLOWUP_NOT_READY', 'DESIGN_FOLLOWUP_CONFLICT'
        ].includes(error?.code);
        return send(res, invalid ? 400 : 503, {
          ok: false,
          error: invalid ? error.message : 'No fue posible continuar la solicitud.',
          debug: invalid ? undefined : safeDiagnostic(error)
        });
      }
    }

    if (tipo === 'design-request-status') {
      try {
        const result = await getDesignRequestStatus({ requestCode: payload.requestCode, accessToken: payload.accessToken });
        return send(res, 200, { ok: true, result });
      } catch (error) {
        const notFound = ['DESIGN_STATUS_ACCESS_INVALID', 'DESIGN_STATUS_NOT_FOUND'].includes(error?.code);
        return send(res, notFound ? 404 : 503, {
          ok: false,
          error: notFound ? 'Solicitud no encontrada.' : 'No fue posible consultar la propuesta.',
          debug: notFound ? undefined : safeDiagnostic(error)
        });
      }
    }

    if (tipo === 'design-request') {
      try {
        const result = await createDesignRequest(payload);
        return send(res, 201, { ok: true, result, message: 'Solicitud recibida. La propuesta continuará por WhatsApp.' });
      } catch (error) {
        console.error('ERROR design-request:', error);
        const invalid = String(error?.code || '').startsWith('DESIGN_')
          && !['DESIGN_SUPABASE_NOT_CONFIGURED', 'DESIGN_FILE_UPLOAD_FAILED', 'DESIGN_REQUEST_INSERT_FAILED'].includes(error.code);
        return send(res, invalid ? 400 : 503, {
          ok: false,
          error: invalid ? error.message : 'No fue posible registrar la solicitud. Intentá nuevamente.',
          debug: invalid ? undefined : safeDiagnostic(error)
        });
      }
    }

    if (tipo === 'chat' || tipo === 'elan-ai' || tipo === 'mensaje') {
      const result = await handleChat(payload);
      return send(res, result.ok ? 200 : 400, result);
    }

    return send(res, 400, {
      ok: false,
      error: 'Tipo no soportado por /api/elan-ai.',
      tipo,
      tipos_soportados: ['chat', 'elan-ai', 'mensaje', 'design-request', 'design-request-status', 'design-request-action']
    });
  } catch (error) {
    console.error('ERROR /api/elan-ai:', error);
    return send(res, 500, {
      ok: false,
      endpoint: '/api/elan-ai',
      error: error.message || 'Error interno en ELAN AI.',
      debug: safeDiagnostic(error)
    });
  }
}
