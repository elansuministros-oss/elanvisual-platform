import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReceiptDocument,
  loadEmbeddedReceiptLogo,
  officialReceiptNumber,
  paymentLabel
} from '../src/modules/quotation-viewer/renderers/receiptDocumentRenderer.js';

const payment = {
  receipt_number: 'REC-20260720-0001',
  payment_method: 'deposit',
  amount: 100,
  total_paid: 100,
  pending_balance: 200,
  quotation_total: 300,
  paid_at: '2026-07-20T12:00:00.000Z',
  metadata: { banking: { bankName: 'BAC', operationType: 'USD_TO_USD', customerPayment: { amount: 100, currency: 'USD' }, bankCredit: { amount: 100, currency: 'USD' }, bankFee: 0 } }
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

const INLINE_LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path fill="#fff" d="M0 0h100v20H0z"/></svg>';

test('incrusta el SVG directamente dentro del HTML sin elemento img', () => {
  const html = buildReceiptDocument(payment, quotation, { brand: quotation.brand, logoSvg: INLINE_LOGO });
  assert.match(html, /<span class="brand-logo-box is-dark"[^>]*><svg/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /https:\/\/cdn\.example\/elanhome-logo\.svg/);
});

test('carga el mismo asset de la cotización como texto SVG', async () => {
  let requestedUrl = '';
  const result = await loadEmbeddedReceiptLogo(quotation, {
    baseUrl: 'https://preview.example',
    fetchFn: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        headers: { get: () => 'image/svg+xml' },
        text: async () => `<?xml version="1.0"?>${INLINE_LOGO}`
      };
    }
  });
  assert.equal(requestedUrl, 'https://cdn.example/elanhome-logo.svg');
  assert.match(result.logoSvg, /^<svg/);
  assert.equal(result.brand.name, 'ELANHOME');
});

test('resuelve el fallback oficial contra el origen antes de cargarlo', async () => {
  let requestedUrl = '';
  await loadEmbeddedReceiptLogo({ ...quotation, brand: { platformId: 'ELANVISUAL', name: 'ELANVISUAL' } }, {
    baseUrl: 'https://preview.example',
    fetchFn: async (url) => {
      requestedUrl = url;
      return { ok: true, headers: { get: () => 'image/svg+xml' }, text: async () => INLINE_LOGO };
    }
  });
  assert.equal(requestedUrl, 'https://preview.example/assets/branding/elanvisual.svg');
});

test('mantiene el logo dentro del recuadro negro', () => {
  const html = buildReceiptDocument(payment, quotation, { brand: quotation.brand, logoSvg: INLINE_LOGO });
  assert.match(html, /class="brand-logo-box is-dark"/);
  assert.match(html, /background:#11151b/);
  assert.match(html, /brand-logo-box svg\{display:block;width:205px/);
});

test('elimina Fecha pero conserva la clasificación del pago en el encabezado', () => {
  const html = buildReceiptDocument(payment, quotation, { brand: quotation.brand, logoSvg: INLINE_LOGO });
  const header = html.match(/<header class="head">([\s\S]*?)<\/header>/)?.[1] || '';
  assert.doesNotMatch(header, />Fecha</);
  assert.match(header, />Tipo de pago</);
  assert.match(header, />Anticipo</);
  assert.match(html, />Fecha de pago</);
  assert.match(html, />Forma de pago</);
});

test('clasifica Anticipo, Abono y Cancelación', () => {
  assert.equal(paymentLabel({ pending_balance: 200, previous_paid: 0 }), 'Anticipo');
  assert.equal(paymentLabel({ pending_balance: 100, previous_paid: 50 }), 'Abono');
  assert.equal(paymentLabel({ pending_balance: 0, previous_paid: 50 }), 'Cancelación');
});

test('muestra siempre el número oficial en encabezado y título', () => {
  const html = buildReceiptDocument(payment, quotation, { brand: quotation.brand, logoSvg: INLINE_LOGO });
  assert.equal(officialReceiptNumber(payment), 'REC-20260720-0001');
  assert.match(html, /<title>REC-20260720-0001<\/title>/);
  assert.match(html, /class="document-number">REC-20260720-0001<\/h1>/);
});

test('usa fallback visible cuando un recibo histórico no trae receipt_number', () => {
  assert.equal(officialReceiptNumber({ officialNumber: 'REC-HIST-9' }), 'REC-HIST-9');
  assert.equal(officialReceiptNumber({}), 'RECIBO SIN NÚMERO');
});
