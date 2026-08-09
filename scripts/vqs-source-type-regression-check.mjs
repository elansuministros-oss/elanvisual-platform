import assert from 'node:assert/strict';
import { normalizeQuotationSource } from '../src/modules/vqs/services/quotationSourceNormalization.js';

const customerContract = {
  source: {
    type: 'customer',
    sourceId: 'customer-123',
    designRequestId: 'design-should-clear',
    storeProductId: 'store-should-clear',
    storeCartId: 'cart-should-clear',
    designMode: 'optional'
  },
  customer: { customerId: 'customer-123', name: 'Cliente real' }
};
const normalizedCustomer = normalizeQuotationSource(customerContract);
assert.equal(normalizedCustomer.source.type, 'manual');
assert.equal(normalizedCustomer.source.sourceId, '');
assert.equal(normalizedCustomer.source.designRequestId, '');
assert.equal(normalizedCustomer.source.storeProductId, '');
assert.equal(normalizedCustomer.source.storeCartId, '');
assert.equal(normalizedCustomer.customer.customerId, 'customer-123');
assert.equal(normalizedCustomer.source.designMode, 'optional');

const designContract = {
  source: { type: 'design', sourceId: 'DESIGN-001', designRequestId: 'DESIGN-001' }
};
assert.deepEqual(normalizeQuotationSource(designContract), designContract);

const storeContract = {
  source: { type: 'store', sourceId: 'SKU-001', storeProductId: 'SKU-001' }
};
assert.deepEqual(normalizeQuotationSource(storeContract), storeContract);

const manualContract = {
  source: { type: 'manual', sourceId: '' }
};
assert.deepEqual(normalizeQuotationSource(manualContract), manualContract);

console.log('VQS source type regression check passed.');
