import assert from 'node:assert/strict';
import { getQuotationSaveIssues } from '../src/modules/vqs/services/quotationSaveValidation.js';

const valid = getQuotationSaveIssues({
  customerName: 'Cliente real',
  projectTitle: 'Rótulo exterior',
  exchangeRate: 36.8,
  items: [{ title: 'Letras 3D', quantity: 1, unitPriceUsd: 450 }],
  paymentPercentTotal: 100
});
assert.deepEqual(valid, []);

const invalid = getQuotationSaveIssues({
  customerName: '',
  projectTitle: '',
  exchangeRate: 0,
  items: [{ title: '', quantity: 0, unitPriceUsd: -1 }],
  paymentPercentTotal: 80
});
assert.deepEqual(invalid, [
  'nombre del cliente',
  'nombre del proyecto',
  'tipo de cambio válido',
  'producto del ítem 1',
  'cantidad del ítem 1',
  'precio del ítem 1',
  'cuotas de pago que sumen 100%'
]);

console.log('VQS save validation check passed.');
