import assert from 'node:assert/strict';
import { createQuotationDocument, validateQuotationDocument } from '../src/modules/vqs/contracts/quotationDocument.js';

const document = createQuotationDocument({
  platformId: 'ELANVISUAL',
  quotationNumber: 'COT-TEST-001',
  currency: 'USD',
  customer: { name: 'Cliente de prueba' },
  items: [
    {
      title: 'Producto visual',
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
      images: [{ role: 'primary', url: 'https://example.com/render.jpg' }]
    }
  ],
  totals: { total: 100 },
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

const invalid = createQuotationDocument({
  platformId: 'ELANVISUAL',
  quotationNumber: 'COT-TEST-002',
  customer: { name: 'Cliente de prueba' },
  items: [{ title: 'Producto', subtotal: 100 }],
  paymentTerms: {
    type: 'custom',
    installments: [{ label: 'Anticipo', percentage: 60, amount: 60 }]
  }
});

assert.equal(validateQuotationDocument(invalid).ok, false);
console.log('VQS contract check: OK');
