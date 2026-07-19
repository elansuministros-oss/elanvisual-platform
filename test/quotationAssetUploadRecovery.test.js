import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPendingQuotationAssetUploads,
  prepareQuotationContractAssets,
  registerQuotationAssetUpload
} from '../src/modules/vqs/services/quotationAssetUploadRegistry.js';

function contractWithSourceAssets(scope, sourceAssets) {
  return {
    project: { images: [] },
    items: [
      { itemId: 'item-1', imageUrl: 'data:image/png;base64,AAAA', images: ['data:image/png;base64,AAAA'] },
      { itemId: 'item-2', imageUrl: 'data:image/png;base64,BBBB', images: ['data:image/png;base64,BBBB'] }
    ],
    metadata: {
      quotationAssetScopeId: scope,
      sourceAssets
    }
  };
}

test('asocia uploads por itemId y uploadToken aunque los archivos se llamen igual', async () => {
  const scope = 'quote-same-name';
  registerQuotationAssetUpload({
    quotationId: scope,
    itemId: 'item-1',
    uploadToken: 'token-1',
    name: 'foto.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    promise: Promise.resolve({
      bucket: 'elanvisual',
      objectPath: 'ELANVISUAL/quotation-assets/item-1/foto.png',
      signedUrl: 'https://storage.example/item-1',
      mimeType: 'image/png',
      sizeBytes: 100
    })
  });
  registerQuotationAssetUpload({
    quotationId: scope,
    itemId: 'item-2',
    uploadToken: 'token-2',
    name: 'foto.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    promise: Promise.resolve({
      bucket: 'elanvisual',
      objectPath: 'ELANVISUAL/quotation-assets/item-2/foto.png',
      signedUrl: 'https://storage.example/item-2',
      mimeType: 'image/png',
      sizeBytes: 100
    })
  });

  const result = await prepareQuotationContractAssets(contractWithSourceAssets(scope, [
    { itemId: 'item-1', uploadToken: 'token-1', name: 'foto.png', mimeType: 'image/png', sizeBytes: 100, pending: true },
    { itemId: 'item-2', uploadToken: 'token-2', name: 'foto.png', mimeType: 'image/png', sizeBytes: 100, pending: true }
  ]));

  assert.equal(result.items[0].imageUrl, 'https://storage.example/item-1');
  assert.equal(result.items[1].imageUrl, 'https://storage.example/item-2');
  assert.equal(result.items[0].images[0].objectPath, 'ELANVISUAL/quotation-assets/item-1/foto.png');
  assert.equal(result.items[1].images[0].objectPath, 'ELANVISUAL/quotation-assets/item-2/foto.png');
  assert.equal(hasPendingQuotationAssetUploads(scope), false);
});

test('limpia un upload fallido sin bloquear otra cotizacion', async () => {
  const failedScope = 'quote-failed';
  const nextScope = 'quote-next';
  registerQuotationAssetUpload({
    quotationId: failedScope,
    itemId: 'item-1',
    uploadToken: 'failed-token',
    name: 'fallida.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    promise: Promise.reject(Object.assign(new Error('upload fallido'), { code: 'UPLOAD_FAILED' }))
  });
  registerQuotationAssetUpload({
    quotationId: nextScope,
    itemId: 'item-1',
    uploadToken: 'next-token',
    name: 'ok.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    promise: Promise.resolve({
      bucket: 'elanvisual',
      objectPath: 'ELANVISUAL/quotation-assets/item-1/ok.png',
      signedUrl: 'https://storage.example/ok'
    })
  });

  await assert.rejects(
    () => prepareQuotationContractAssets(contractWithSourceAssets(failedScope, [
      { itemId: 'item-1', uploadToken: 'failed-token', pending: true }
    ])),
    (error) => error.code === 'UPLOAD_FAILED'
  );
  assert.equal(hasPendingQuotationAssetUploads(failedScope), false);
  assert.equal(hasPendingQuotationAssetUploads(nextScope), true);

  const result = await prepareQuotationContractAssets(contractWithSourceAssets(nextScope, [
    { itemId: 'item-1', uploadToken: 'next-token', pending: true }
  ]));
  assert.equal(result.items[0].imageUrl, 'https://storage.example/ok');
  assert.equal(hasPendingQuotationAssetUploads(nextScope), false);
});
