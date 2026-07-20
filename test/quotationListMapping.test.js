import test from 'node:test';
import assert from 'node:assert/strict';

import { enrichQuotationListRecord } from '../src/modules/quotation-viewer/services/quotationViewerService.js';

test('recupera cliente y ejecutivo desde snapshots del listado VQS', () => {
  const result = enrichQuotationListRecord({
    id: 'project-1',
    customer: { name: '', companyName: '', phone: '' },
    executive: { name: '' }
  }, {
    customer_snapshot: {
      name: 'Cliente real',
      companyName: 'Empresa real',
      phone: '+505 8888 7777'
    },
    executive_snapshot: {
      name: 'Ejecutivo real',
      role: 'Ventas'
    }
  });

  assert.equal(result.customer.name, 'Cliente real');
  assert.equal(result.customer.companyName, 'Empresa real');
  assert.equal(result.customer.phone, '+505 8888 7777');
  assert.equal(result.executive.name, 'Ejecutivo real');
  assert.equal(result.executive.role, 'Ventas');
});

test('conserva los datos ya normalizados cuando están presentes', () => {
  const result = enrichQuotationListRecord({
    customer: {
      name: 'Cliente normalizado',
      companyName: 'Empresa normalizada',
      phone: '1234'
    },
    executive: { name: 'Ejecutivo normalizado' }
  }, {
    customer_snapshot: { name: 'Cliente snapshot' },
    executive_snapshot: { name: 'Ejecutivo snapshot' }
  });

  assert.equal(result.customer.name, 'Cliente normalizado');
  assert.equal(result.customer.companyName, 'Empresa normalizada');
  assert.equal(result.customer.phone, '1234');
  assert.equal(result.executive.name, 'Ejecutivo normalizado');
});

test('acepta snapshots serializados como JSON', () => {
  const result = enrichQuotationListRecord({ customer: {}, executive: {} }, {
    customerSnapshot: JSON.stringify({ nombre: 'Cliente JSON', empresa: 'Empresa JSON', whatsapp: '7777' }),
    executiveSnapshot: JSON.stringify({ nombre: 'Ejecutivo JSON' })
  });

  assert.equal(result.customer.name, 'Cliente JSON');
  assert.equal(result.customer.companyName, 'Empresa JSON');
  assert.equal(result.customer.phone, '7777');
  assert.equal(result.executive.name, 'Ejecutivo JSON');
});
