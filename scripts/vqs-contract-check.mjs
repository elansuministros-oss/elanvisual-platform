import assert from 'node:assert/strict';
import { createQuotationDocument, validateQuotationDocument } from '../src/modules/vqs/contracts/quotationDocument.js';

const document = createQuotationDocument({
  platformId: 'ELANVISUAL',
  quotationNumber: 'COT-TEST-001',
  currency: 'USD',
  settlementCurrency: 'NIO',
  customer: { name: 'Cliente de prueba' },
  executive: {
    executiveId: 'exec-test-001',
    name: 'Ejecutivo de prueba',
    role: 'Ejecutivo Comercial'
  },
  items: [
    {
      title: 'Producto visual',
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
      images: [{ role: 'primary', url: 'https://example.com/render.jpg' }]
    }
  ],
  totals: {
    total: 100,
    exchangeRate: 36.8,
    exchangeRateDate: '2026-07-15',
    payableTotalNio: 3680
  },
  paymentTerms: {
    type: 'custom',
    installments: [
      { label: 'Anticipo', percentage: 60, amount: 60 },
      { label: 'Entrega', percentage: 40, amount: 40 }
    ]
  }
});

const result = validateQuotationDocument(document);
assert.equal(result.ok, true, result.errors.join('\n'));
assert.equal(document.items[0].images.length, 1);
assert.equal(document.paymentTerms.installments.reduce((sum, item) => sum + item.percentage, 0), 100);
assert.equal(document.totals.total, 100);
assert.equal(document.totals.payableTotalNio, 3680);
assert.equal(document.currency, 'USD');
assert.equal(document.settlementCurrency, 'NIO');

const invalid = createQuotationDocument({
  platformId: 'ELANVISUAL',
  quotationNumber: 'COT-TEST-002',
  customer: { name: 'Cliente de prueba' },
  executive: {
    executiveId: 'exec-test-002',
    name: 'Ejecutivo de prueba'
  },
  items: [{ title: 'Producto', subtotal: 100 }],
  totals: { total: 100, exchangeRate: 36.8, payableTotalNio: 3680 },
  paymentTerms: {
    type: 'custom',
    installments: [{ label: 'Anticipo', percentage: 60, amount: 60 }]
  }
});

assert.equal(validateQuotationDocument(invalid).ok, false);
console.log('VQS contract check: OK');
