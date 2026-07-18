import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPendingQuotationAssetUploads,
  prepareQuotationContractAssets,
  registerQuotationAssetUpload
} from '../src/modules/vqs/services/quotationAssetUploadRegistry.js';

test('limpia un upload fallido y permite guardar el siguiente contrato', async () => {
  registerQuotationAssetUpload({
    name: 'fallida.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    promise: Promise.reject(Object.assign(new Error('upload fallido'), { code: 'UPLOAD_FAILED' }))
  });

  await assert.rejects(
    () => prepareQuotationContractAssets({ items: [], metadata: { sourceAssets: [] } }),
    (error) => error.code === 'UPLOAD_FAILED'
  );
  assert.equal(hasPendingQuotationAssetUploads(), false);

  const contract = { items: [], metadata: { sourceAssets: [] } };
  const result = await prepareQuotationContractAssets(contract);
  assert.equal(result, contract);
});
