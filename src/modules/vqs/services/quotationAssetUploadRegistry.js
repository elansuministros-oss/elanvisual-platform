const DEFAULT_SCOPE = 'current-quotation';
const pendingUploads = new Map();

function text(value = '') {
  return String(value || '').trim();
}

function normalizeScope(value = '') {
  return text(value) || DEFAULT_SCOPE;
}

function isDataImage(value = '') {
  return /^data:image\//i.test(text(value));
}

function storageKey(asset = {}) {
  if (!asset || typeof asset !== 'object') return '';
  const bucket = text(asset.bucket || asset.storageBucket || asset.storage_bucket);
  const objectPath = text(asset.objectPath || asset.object_path || asset.path || asset.storagePath || asset.storage_path);
  return bucket && objectPath ? `${bucket}/${objectPath}` : '';
}

function deliveryUrl(asset = {}) {
  if (typeof asset === 'string') return isDataImage(asset) ? '' : text(asset);
  if (!asset || typeof asset !== 'object') return '';
  return text(asset.signedUrl || asset.signed_url || asset.url || asset.publicUrl || asset.public_url || asset.imageUrl || asset.image_url || asset.src);
}

function uniqueAssetReferences(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const key = typeof value === 'string'
      ? text(value)
      : storageKey(value) || deliveryUrl(value) || text(value?.uploadToken || value?.assetId);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stableAssetFrom(value = {}, fallback = {}) {
  const asset = value && typeof value === 'object' ? value : {};
  const path = text(asset.objectPath || asset.object_path || asset.path || fallback.objectPath || fallback.path);
  const bucket = text(asset.bucket || fallback.bucket);
  const uploadToken = text(asset.uploadToken || fallback.uploadToken);
  const normalized = {
    kind: text(asset.kind) || 'quotation-image',
    itemId: text(asset.itemId || asset.item_id || fallback.itemId),
    uploadToken,
    name: text(asset.name || fallback.name),
    mimeType: text(asset.mimeType || asset.mime_type || fallback.mimeType),
    sizeBytes: Number(asset.sizeBytes || asset.size_bytes || fallback.sizeBytes || 0),
    pending: false
  };

  const assetId = text(asset.assetId || asset.asset_id || fallback.assetId || uploadToken);
  if (assetId) normalized.assetId = assetId;
  if (bucket) normalized.bucket = bucket;
  if (path) {
    normalized.path = path;
    normalized.objectPath = path;
  }

  const signedUrl = deliveryUrl(asset);
  if (signedUrl) {
    normalized.signedUrl = signedUrl;
    normalized.url = signedUrl;
  }

  return normalized;
}

function uploadErrorFrom(error) {
  const uploadError = new Error(error?.message || 'No fue posible subir la fotografia al Orchestrator.');
  uploadError.code = error?.code || 'QUOTATION_ASSET_UPLOAD_FAILED';
  return uploadError;
}

export function registerQuotationAssetUpload({
  quotationId,
  itemId,
  uploadToken = crypto.randomUUID(),
  name,
  mimeType,
  sizeBytes,
  promise
}) {
  const token = text(uploadToken) || crypto.randomUUID();
  const record = {
    quotationId: normalizeScope(quotationId),
    itemId: text(itemId),
    uploadToken: token,
    name: text(name),
    mimeType: text(mimeType),
    sizeBytes: Number(sizeBytes || 0),
    promise: Promise.resolve(promise)
  };
  record.promise.catch(() => {});
  pendingUploads.set(token, record);
  return token;
}

export function unregisterQuotationAssetUpload(uploadToken) {
  const token = text(uploadToken);
  if (token) pendingUploads.delete(token);
}

export function watchQuotationAssetUpload(uploadToken, { onFulfilled, onRejected } = {}) {
  const token = text(uploadToken);
  const record = pendingUploads.get(token);
  if (!record) return false;

  record.promise
    .then((asset) => onFulfilled?.(stableAssetFrom(asset, record)))
    .catch((error) => onRejected?.(uploadErrorFrom(error), record));
  return true;
}

function recordsForScope(quotationId) {
  const scope = normalizeScope(quotationId);
  return [...pendingUploads.values()].filter((record) => record.quotationId === scope);
}

export function hasPendingQuotationAssetUploads(quotationId) {
  if (quotationId === undefined) return pendingUploads.size > 0;
  return recordsForScope(quotationId).length > 0;
}

function sourceAssetsFrom(prepared = {}) {
  if (!prepared.metadata || typeof prepared.metadata !== 'object') prepared.metadata = {};
  if (!Array.isArray(prepared.metadata.sourceAssets)) prepared.metadata.sourceAssets = [];
  return prepared.metadata.sourceAssets;
}

function assertNoFailedSourceAssets(sourceAssets = []) {
  const failed = sourceAssets.find((asset) => text(asset?.uploadError) || asset?.failed === true);
  if (!failed) return;

  const error = new Error(text(failed.uploadError) || 'La fotografia no se pudo subir. Quitala o intenta cargarla nuevamente.');
  error.code = 'QUOTATION_ASSET_UPLOAD_FAILED';
  throw error;
}

function assetHasStableReference(asset = {}) {
  return Boolean(text(asset.assetId || asset.asset_id) || storageKey(asset));
}

async function resolveContractSourceAssets(prepared, quotationId) {
  const sourceAssets = sourceAssetsFrom(prepared);
  assertNoFailedSourceAssets(sourceAssets);

  const scope = normalizeScope(quotationId || prepared.metadata.quotationAssetScopeId || prepared.metadata.quotationId);
  const consumedTokens = new Set();

  try {
    for (const sourceAsset of sourceAssets) {
      const token = text(sourceAsset?.uploadToken);
      if (assetHasStableReference(sourceAsset)) {
        Object.assign(sourceAsset, stableAssetFrom(sourceAsset, sourceAsset));
        continue;
      }

      if (!token) continue;
      const record = pendingUploads.get(token);
      if (!record || record.quotationId !== scope) {
        if (sourceAsset.pending === true) {
          const error = new Error('La fotografia sigue pendiente o ya no tiene registro de upload. Cargala nuevamente.');
          error.code = 'QUOTATION_ASSET_UPLOAD_MISSING';
          throw error;
        }
        continue;
      }

      consumedTokens.add(token);
      try {
        const uploaded = await record.promise;
        Object.assign(sourceAsset, stableAssetFrom(uploaded, record));
      } catch (error) {
        throw uploadErrorFrom(error);
      }
    }
  } finally {
    consumedTokens.forEach((token) => pendingUploads.delete(token));
  }
}

function sourceAssetsForItem(sourceAssets = [], itemId = '') {
  const id = text(itemId);
  return sourceAssets
    .filter((asset) => id && text(asset?.itemId || asset?.item_id) === id)
    .filter((asset) => assetHasStableReference(asset) || deliveryUrl(asset));
}

function existingImagesWithoutDataUrls(images = []) {
  return (Array.isArray(images) ? images : [])
    .filter((asset) => {
      if (typeof asset === 'string') return !isDataImage(asset);
      if (!asset || typeof asset !== 'object') return false;
      return !isDataImage(asset.dataUrl || asset.data_url || asset.url || asset.imageUrl);
    });
}

function applySourceAssetsToItems(prepared = {}) {
  const sourceAssets = sourceAssetsFrom(prepared);
  const itemImages = [];

  (Array.isArray(prepared.items) ? prepared.items : []).forEach((item) => {
    const relatedAssets = sourceAssetsForItem(sourceAssets, item.itemId);
    const stableAssets = relatedAssets.map((asset) => stableAssetFrom(asset, asset));
    if (!stableAssets.length) {
      item.images = existingImagesWithoutDataUrls(item.images);
      if (isDataImage(item.imageUrl)) item.imageUrl = '';
      return;
    }

    const existingImages = existingImagesWithoutDataUrls(item.images);
    item.images = uniqueAssetReferences([...stableAssets, ...existingImages]);
    const firstDeliveryUrl = stableAssets.map(deliveryUrl).find(Boolean);
    if (!item.imageUrl || isDataImage(item.imageUrl)) item.imageUrl = firstDeliveryUrl || '';
    itemImages.push(...item.images);
  });

  if (!prepared.project || typeof prepared.project !== 'object') prepared.project = {};
  prepared.project.images = uniqueAssetReferences([
    ...itemImages,
    ...existingImagesWithoutDataUrls(prepared.project.images)
  ]);
}

export async function prepareQuotationContractAssets(contract = {}, options = {}) {
  const sourceAssets = contract?.metadata?.sourceAssets;
  const hasSourceAssets = Array.isArray(sourceAssets) && sourceAssets.length > 0;
  const scope = options.quotationId || contract?.metadata?.quotationAssetScopeId || contract?.metadata?.quotationId;

  if (!hasSourceAssets) return contract;

  const prepared = structuredClone(contract);
  await resolveContractSourceAssets(prepared, scope);
  applySourceAssetsToItems(prepared);
  return prepared;
}
