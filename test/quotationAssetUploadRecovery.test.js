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

test('reutiliza las URLs resueltas después de un fallo de guardado y nunca reenvía Base64', async () => {
  const firstToken = registerQuotationAssetUpload({
    name: 'frente.png',
    mimeType: 'image/png',
    sizeBytes: 101,
    promise: Promise.resolve({
      name: 'frente.png',
      mimeType: 'image/png',
      sizeBytes: 101,
      bucket: 'elanvisual',
      path: 'quotations/frente.png',
      signedUrl: 'https://storage.test/frente.png'
    })
  });
  const secondToken = registerQuotationAssetUpload({
    name: 'lateral.png',
    mimeType: 'image/png',
    sizeBytes: 102,
    promise: Promise.resolve({
      name: 'lateral.png',
      mimeType: 'image/png',
      sizeBytes: 102,
      bucket: 'elanvisual',
      path: 'quotations/lateral.png',
      signedUrl: 'https://storage.test/lateral.png'
    })
  });
  const rawContract = {
    project: { images: [] },
    items: [{
      itemId: 'item-1',
      imageUrl: 'data:image/png;base64,AAAA',
      images: ['data:image/png;base64,AAAA']
    }],
    metadata: {
      sourceAssets: [
        { itemId: 'item-1', uploadToken: firstToken, name: 'frente.png', mimeType: 'image/png', sizeBytes: 101 },
        { itemId: 'item-1', uploadToken: secondToken, name: 'lateral.png', mimeType: 'image/png', sizeBytes: 102 }
      ]
    }
  };

  const firstAttempt = await prepareQuotationContractAssets(rawContract);
  const secondAttempt = await prepareQuotationContractAssets(rawContract);

  const expectedUrls = [
    'https://storage.test/frente.png',
    'https://storage.test/lateral.png'
  ];
  assert.deepEqual(firstAttempt.items[0].images, expectedUrls);
  assert.deepEqual(secondAttempt.items[0].images, expectedUrls);
  assert.deepEqual(secondAttempt.project.images, expectedUrls);
  assert.equal(secondAttempt.items[0].imageUrl, expectedUrls[0]);
  assert.equal(JSON.stringify(secondAttempt).includes('data:image/'), false);
  assert.equal(hasPendingQuotationAssetUploads(), false);
});
