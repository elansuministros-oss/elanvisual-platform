import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeQuotationRecord } from '../src/modules/quotation-viewer/adapters/quotationDocumentAdapter.js';

test('normaliza publicDocument oficial anidado para el visor de cotizaciones', () => {
  const quotation = normalizeQuotationRecord({
    id: 'project-1',
    status: 'draft',
    quotation_document: {
      publicDocument: {
        quotationNumber: 'COT-EV-2026-0001',
        issuedAt: '2026-08-01T00:00:00.000Z',
        validUntil: '2026-08-16T00:00:00.000Z',
        customer: {
          name: 'Cliente demo',
          taxId: 'J0310000000001'
        },
        brandSnapshot: {
          displayName: 'ELANVISUAL',
          logoForLightBackground: '/assets/branding/elanvisual.svg',
          website: 'https://visual.elankav.com',
          whatsapp: '+505 7882 8089',
          taxId: '4012805831001E'
        },
        paymentAccountsSnapshot: [{
          id: 'bac-usd',
          label: 'BAC USD',
          bankName: 'BAC Credomatic',
          currency: 'USD',
          accountNumber: '123456',
          accountHolder: 'ELANVISUAL',
          accountType: 'Cuenta corriente'
        }],
        items: [{
          title: 'Render comercial',
          quantity: 1,
          unit: 'unidad',
          subtotalUsd: 125,
          images: ['https://cdn.example/render.png']
        }],
        totals: {
          total: 125
        }
      }
    }
  });

  assert.equal(quotation.id, 'project-1');
  assert.equal(quotation.quotationNumber, 'COT-EV-2026-0001');
  assert.equal(quotation.date, '2026-08-01T00:00:00.000Z');
  assert.equal(quotation.validUntil, '2026-08-16T00:00:00.000Z');
  assert.equal(quotation.customer.taxId, 'J0310000000001');
  assert.equal(quotation.brand.logoForLightBackground, '/assets/branding/elanvisual.svg');
  assert.equal(quotation.paymentAccounts[0].accountHolder, 'ELANVISUAL');
  assert.equal(quotation.paymentAccounts[0].accountType, 'Cuenta corriente');
  assert.equal(quotation.items[0].images[0].url, 'https://cdn.example/render.png');
  assert.equal(quotation.totals.totalUsd, 125);
});
