import test from 'node:test';
import assert from 'node:assert/strict';
import { applyQuotationImageFallback } from '../src/modules/quotation-viewer/adapters/quotationImageFallback.js';

test('recupera la imagen persistida desde metadata.sourceAssets', () => {
  const record = {
    metadata: {
      sourceAssets: [{ itemId: 'item-1', signedUrl: 'https://storage.example/image.png' }]
    },
    quotation_document: {
      publicDocument: {
        items: [{ itemId: 'item-1', title: 'Rotulo', imageUrl: '', images: [] }]
      }
    }
  };

  const result = applyQuotationImageFallback(record);
  const item = result.quotation_document.publicDocument.items[0];

  assert.equal(item.imageUrl, 'https://storage.example/image.png');
  assert.deepEqual(item.images, ['https://storage.example/image.png']);
  assert.equal(record.quotation_document.publicDocument.items[0].imageUrl, '');
});

test('no reemplaza una imagen ya presente en el documento oficial', () => {
  const record = {
    metadata: {
      sourceAssets: [{ itemId: 'item-1', signedUrl: 'https://storage.example/fallback.png' }]
    },
    quotation_document: {
      publicDocument: {
        items: [{ itemId: 'item-1', imageUrl: 'https://cdn.example/current.png', images: [] }]
      }
    }
  };

  const result = applyQuotationImageFallback(record);
  assert.equal(result.quotation_document.publicDocument.items[0].imageUrl, 'https://cdn.example/current.png');
});
