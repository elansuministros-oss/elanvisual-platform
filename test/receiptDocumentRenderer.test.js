import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReceiptDocument,
  loadEmbeddedReceiptLogo,
  officialReceiptNumber
} from '../src/modules/quotation-viewer/renderers/receiptDocumentRenderer.js';

const payment = {
  receipt_number: 'REC-20260720-0001',
  payment_method: 'deposit',
  amount: 100,
  total_paid: 100,
  pending_balance: 200,
  quotation_total: 300,
  paid_at: '2026-07-20T12:00:00.000Z',
  metadata: {
    banking: {
      bankName: 'BAC',
      operationType: 'USD_TO_USD',
      customerPayment: { amount: 100, currency: 'USD' },
      bankCredit: { amount: 100, currency: 'USD' },
      bankFee: 0
    }
  }
};

const quotation = {
  quotationNumber: 'COT-20260720-0001',
  project: { title: 'Fachada principal' },
  brand: {
    platformId: 'ELANHOME',
    name: 'ELANHOME',
    logoForLightBackground: 'https://cdn.example/elanhome-logo.svg',
    website: 'home.elankav.com',
    whatsapp: '+505 7000 0000'
  }
};

const EMBEDDED_LOGO = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';

test('incrusta el logo dentro del HTML sin depender de una URL externa', () => {
  const html = buildReceiptDocument(payment, quotation, {
    brand: quotation.brand,
    logoDataUrl: EMBEDDED_LOGO
  });

  assert.match(html, /data:image\/svg\+xml;base64,PHN2Zz48L3N2Zz4=/);
  assert.doesNotMatch(html, /https:\/\/cdn\.example\/elanhome-logo\.svg/);
  assert.match(html, /alt="ELANHOME"/);
});

test('carga el mismo asset de la cotización y lo convierte a data URL', async () => {
  let requestedUrl = '';
  class FakeFileReader {
    readAsDataURL() {
      this.result = EMBEDDED_LOGO;
      queueMicrotask(() => this.onload?.());
    }
  }

  const result = await loadEmbeddedReceiptLogo(quotation, {
    baseUrl: 'https://preview.example',
    fetchFn: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        blob: async () => new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
      };
    },
    FileReaderClass: FakeFileReader
  });

  assert.equal(requestedUrl, 'https://cdn.example/elanhome-logo.svg');
  assert.equal(result.logoDataUrl, EMBEDDED_LOGO);
  assert.equal(result.brand.name, 'ELANHOME');
});

test('resuelve el fallback oficial contra el origen antes de incrustarlo', async () => {
  let requestedUrl = '';
  class FakeFileReader {
    readAsDataURL() {
      this.result = EMBEDDED_LOGO;
      queueMicrotask(() => this.onload?.());
    }
  }

  await loadEmbeddedReceiptLogo({
    ...quotation,
    brand: { platformId: 'ELANVISUAL', name: 'ELANVISUAL' }
  }, {
    baseUrl: 'https://preview.example',
    fetchFn: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        blob: async () => new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
      };
    },
    FileReaderClass: FakeFileReader
  });

  assert.equal(requestedUrl, 'https://preview.example/assets/branding/elanvisual.svg');
});

test('mantiene el logo dentro del recuadro negro', () => {
  const html = buildReceiptDocument(payment, quotation, {
    brand: quotation.brand,
    logoDataUrl: EMBEDDED_LOGO
  });

  assert.match(html, /class="brand-logo-box is-dark"/);
  assert.match(html, /background:#11151b/);
  assert.match(html, /print-color-adjust:exact/);
});

test('elimina Fecha y Tipo de pago únicamente del encabezado', () => {
  const html = buildReceiptDocument(payment, quotation, {
    brand: quotation.brand,
    logoDataUrl: EMBEDDED_LOGO
  });
  const header = html.match(/<header class="head">([\s\S]*?)<\/header>/)?.[1] || '';

  assert.doesNotMatch(header, />Fecha</);
  assert.doesNotMatch(header, />Tipo de pago</);
  assert.match(html, />Fecha de pago</);
  assert.match(html, />Forma de pago</);
});

test('muestra siempre el número oficial en encabezado y título', () => {
  const html = buildReceiptDocument(payment, quotation, {
    brand: quotation.brand,
    logoDataUrl: EMBEDDED_LOGO
  });

  assert.equal(officialReceiptNumber(payment), 'REC-20260720-0001');
  assert.match(html, /<title>REC-20260720-0001<\/title>/);
  assert.match(html, /class="document-number">REC-20260720-0001<\/h1>/);
});

test('usa fallback visible cuando un recibo histórico no trae receipt_number', () => {
  assert.equal(officialReceiptNumber({ officialNumber: 'REC-HIST-9' }), 'REC-HIST-9');
  assert.equal(officialReceiptNumber({}), 'RECIBO SIN NÚMERO');
});
