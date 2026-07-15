import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadDesignGallery,
  parseWhatsAppDesignContext,
  submitDesignRequest
} from '../src/services/designPortalService.js';

test('DESIGN-PORTAL-01 recupera contexto desde enlace de WhatsApp', () => {
  const result = parseWhatsAppDesignContext(
    '?source=whatsapp&wa=%2B505%208841-5436&uid=cliente-1&conversation=crm-22&type=fachada'
  );

  assert.deepEqual(result, {
    source: 'whatsapp',
    whatsapp: '50588415436',
    externalUserId: 'cliente-1',
    conversationRef: 'crm-22',
    requestType: 'fachada'
  });
});

test('DESIGN-PORTAL-01 no bloquea un identificador LID como teléfono', () => {
  const result = parseWhatsAppDesignContext(
    '?source=whatsapp&wa=168534952960065&uid=168534952960065&type=rotulo'
  );

  assert.equal(result.whatsapp, '');
  assert.equal(result.externalUserId, '168534952960065');
  assert.equal(result.requestType, 'rotulo');
});

test('DESIGN-PORTAL-01 reconoce la ruta corta oficial de WhatsApp', () => {
  const result = parseWhatsAppDesignContext('', '/diseno/whatsapp');

  assert.equal(result.source, 'whatsapp');
  assert.equal(result.whatsapp, '');
});

test('DESIGN-PORTAL-01 envía el contrato al Core', async () => {
  const previousFetch = globalThis.fetch;
  let request = null;

  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: { requestCode: 'DESIGN-TEST-01' }
        };
      }
    };
  };

  try {
    const result = await submitDesignRequest({
      source: 'whatsapp',
      customer: { name: 'Reyna' }
    });

    assert.equal(request.tipo, 'design-request');
    assert.equal(request.source, 'whatsapp');
    assert.equal(result.result.requestCode, 'DESIGN-TEST-01');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('DESIGN-PORTAL-01 consume únicamente la galería pública', async () => {
  const previousFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        items: [{ id: 'design-1', title: 'Fachada' }]
      };
    }
  });

  try {
    const result = await loadDesignGallery();
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'design-1');
  } finally {
    globalThis.fetch = previousFetch;
  }
});
