import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyQuotationListAliases,
  applyQuotationListAliasesToPayload
} from '../src/modules/quotation-viewer/adapters/quotationListAliases.js';
import { normalizeQuotationCollection } from '../src/modules/quotation-viewer/adapters/quotationDocumentAdapter.js';

test('mapea campos planos del listado VQS al contrato esperado por el visor', () => {
  const record = applyQuotationListAliases({
    id: 'project-1',
    quotationNumber: 'COT-20260718-00014',
    customerName: 'Cliente real',
    customerCompanyName: 'Empresa real',
    customerPhone: '+505 8888 8888',
    executiveName: 'Erick Cano'
  });

  assert.equal(record.customer.name, 'Cliente real');
  assert.equal(record.customer.companyName, 'Empresa real');
  assert.equal(record.customer.phone, '+505 8888 8888');
  assert.equal(record.executive.name, 'Erick Cano');
});

test('conserva aliases dentro de payload data antes de normalizar la colección', () => {
  const payload = applyQuotationListAliasesToPayload({
    data: [{
      id: 'project-1',
      quotationNumber: 'COT-20260718-00014',
      customerName: 'Cliente real',
      customerCompanyName: 'Empresa real',
      totalUsd: 130
    }]
  });

  const rows = normalizeQuotationCollection(payload);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].customer.name, 'Cliente real');
  assert.equal(rows[0].customer.companyName, 'Empresa real');
  assert.equal(rows[0].totals.totalUsd, 130);
});
