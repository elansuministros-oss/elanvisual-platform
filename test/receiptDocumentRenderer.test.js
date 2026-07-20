import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReceiptDocument,
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

test('reutiliza el mismo asset normalizado de la cotización', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.match(html, /https:\/\/cdn\.example\/elanhome-logo\.svg/);
  assert.match(html, /alt="ELANHOME"/);
  assert.match(html, /home\.elankav\.com/);
  assert.doesNotMatch(html, /PLATFORM_LOGO_FALLBACKS/);
});

test('muestra el logo dentro del recuadro negro sin cambiar el documento', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.match(html, /class="brand-logo-box is-dark"/);
  assert.match(html, /background:#11151b/);
  assert.match(html, /print-color-adjust:exact/);
});

test('resuelve el fallback relativo contra el origen de la ventana de impresión', () => {
  const html = buildReceiptDocument(payment, {
    ...quotation,
    brand: { platformId: 'ELANVISUAL', name: 'ELANVISUAL' }
  }, {
    baseUrl: 'https://preview.example'
  });

  assert.match(html, /https:\/\/preview\.example\/assets\/branding\/elanvisual\.svg/);
});

test('elimina Fecha y Tipo de pago únicamente del encabezado', () => {
  const html = buildReceiptDocument(payment, quotation);
  const header = html.match(/<header class="head">([\s\S]*?)<\/header>/)?.[1] || '';

  assert.doesNotMatch(header, />Fecha</);
  assert.doesNotMatch(header, />Tipo de pago</);
  assert.match(html, />Fecha de pago</);
  assert.match(html, />Forma de pago</);
});

test('bloquea impresión hasta comprobar que el logo cargó', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.match(html, /id="print-receipt" type="button" disabled/);
  assert.match(html, /logo\.naturalWidth>0/);
  assert.match(html, /logo\.addEventListener\('load',enable/);
  assert.match(html, /logo\.addEventListener\('error',fail/);
});

test('muestra siempre el número oficial en encabezado y título', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.equal(officialReceiptNumber(payment), 'REC-20260720-0001');
  assert.match(html, /<title>REC-20260720-0001<\/title>/);
  assert.match(html, /class="document-number">REC-20260720-0001<\/h1>/);
});

test('usa fallback visible cuando un recibo histórico no trae receipt_number', () => {
  assert.equal(officialReceiptNumber({ officialNumber: 'REC-HIST-9' }), 'REC-HIST-9');
  assert.equal(officialReceiptNumber({}), 'RECIBO SIN NÚMERO');
});
