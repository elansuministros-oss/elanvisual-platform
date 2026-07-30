import assert from 'node:assert/strict';
import {
  buildBulkIntakeContract,
  parseBulkQuotationPayload
} from '../src/modules/vqs/services/bulkQuotationImport.js';

const payload = {
  fecha: '2026-07-30',
  moneda_cliente: 'USD',
  tipo_cambio_referencia: 36.6243,
  tratamiento_fiscal: { iva_trasladado_cliente: 0 },
  sucursales: [
    {
      nombre: 'Estelí',
      modulos: [
        {
          codigo: 'M01',
          partida: 'Desmontaje y preparación',
          tipo: 'Autónoma',
          descripcion: 'Retiro selectivo y preparación inicial.',
          precio_comercial_usd: 107.76
        },
        {
          codigo: 'C01',
          partida: 'Movilización',
          tipo: 'Común',
          descripcion: 'Transporte y acceso.',
          precio_comercial_usd: 250
        }
      ]
    },
    {
      nombre: 'León',
      modulos: [
        {
          codigo: 'M06',
          partida: 'Imagen corporativa principal',
          tipo: 'Autónoma',
          descripcion: 'Fabricación del logotipo.',
          precio_comercial_usd: 1500
        }
      ]
    }
  ],
  total_general_usd: 1857.76
};

const batch = parseBulkQuotationPayload(payload, { companyName: 'COMEX' });
assert.equal(batch.quotations.length, 2);
assert.equal(batch.totalUsd, 1857.76);
assert.equal(batch.quotations[0].items[0].code, 'M01');
assert.equal(batch.quotations[0].customerName, 'COMEX - Estelí');

const contract = buildBulkIntakeContract(batch.quotations[0], batch, {
  executive: { executiveId: 'EXEC-1', name: 'Erick Cano', role: 'Director Comercial' },
  paymentType: '60_40',
  phone: '+505 0000 0000'
});
assert.equal(contract.customer.name, 'COMEX - Estelí');
assert.equal(contract.items.length, 2);
assert.equal(contract.items[0].title, 'M01 · Desmontaje y preparación');
assert.equal(contract.pricing.totalUsd, 357.76);
assert.equal(contract.pricing.taxRate, 0);
assert.equal(contract.payments.installments.reduce((sum, item) => sum + item.percentage, 0), 100);
assert.equal(contract.metadata.bulkImportId, batch.batchId);

assert.throws(
  () => parseBulkQuotationPayload({ ...payload, total_general_usd: 10 }),
  /datos inválidos/
);
assert.throws(
  () => parseBulkQuotationPayload({ ...payload, moneda_cliente: 'NIO' }),
  /solo acepta precios comerciales en USD/
);

console.log('VQS bulk import check: OK');
