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

test('renderiza el logo y la identidad de la plataforma generadora', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.match(html, /https:\/\/cdn\.example\/elanhome-logo\.svg/);
  assert.match(html, /alt="ELANHOME"/);
  assert.match(html, /home\.elankav\.com/);
  assert.doesNotMatch(html, /ELANVISUAL · ELANKAV/);
});

test('no aplica fondo oscuro cuando existe logo específico para fondo claro', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.match(html, /class="brand-logo-box"/);
  assert.doesNotMatch(html, /class="brand-logo-box is-dark"/);
});

test('aplica recuadro oscuro al logo blanco o genérico de la plataforma', () => {
  const html = buildReceiptDocument(payment, {
    ...quotation,
    brand: {
      platformId: 'ELANVISUAL',
      name: 'ELANVISUAL',
      logoLightUrl: '/assets/branding/elanvisual.svg'
    }
  });

  assert.match(html, /class="brand-logo-box is-dark"/);
  assert.match(html, /background:#111/);
  assert.match(html, /print-color-adjust:exact/);
});

test('muestra siempre el número oficial en encabezado y título', () => {
  const html = buildReceiptDocument(payment, quotation);

  assert.equal(officialReceiptNumber(payment), 'REC-20260720-0001');
  assert.match(html, /<title>REC-20260720-0001<\/title>/);
  assert.match(html, /Número oficial<\/span><strong>REC-20260720-0001<\/strong>/);
});

test('usa fallback visible cuando un recibo histórico no trae receipt_number', () => {
  assert.equal(officialReceiptNumber({ officialNumber: 'REC-HIST-9' }), 'REC-HIST-9');
  assert.equal(officialReceiptNumber({}), 'RECIBO SIN NÚMERO');
});
