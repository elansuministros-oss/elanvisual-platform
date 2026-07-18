const pendingUploads = new Map();

function assetKey(asset = {}) {
  return [
    String(asset.name || '').trim(),
    String(asset.mimeType || '').trim(),
    Number(asset.sizeBytes || 0)
  ].join('::');
}

function isDataImage(value = '') {
  return /^data:image\//i.test(String(value || '').trim());
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

export function registerQuotationAssetUpload({ name, mimeType, sizeBytes, promise }) {
  const token = crypto.randomUUID();
  const record = {
    token,
    name: String(name || ''),
    mimeType: String(mimeType || ''),
    sizeBytes: Number(sizeBytes || 0),
    promise: Promise.resolve(promise)
  };
  pendingUploads.set(token, record);
  return token;
}

async function resolvePendingUploads() {
  const records = [...pendingUploads.values()];
  if (!records.length) return [];

  try {
    return await Promise.all(records.map(async (record) => {
      try {
        const asset = await record.promise;
        return {
          ...record,
          asset: {
            ...asset,
            name: asset?.name || record.name,
            mimeType: asset?.mimeType || record.mimeType,
            sizeBytes: Number(asset?.sizeBytes || record.sizeBytes)
          }
        };
      } catch (error) {
        const uploadError = new Error(error?.message || 'No fue posible subir la fotografía al Orchestrator.');
        uploadError.code = error?.code || 'QUOTATION_ASSET_UPLOAD_FAILED';
        throw uploadError;
      }
    }));
  } finally {
    records.forEach((record) => pendingUploads.delete(record.token));
  }
}

export async function prepareQuotationContractAssets(contract = {}) {
  const resolvedUploads = await resolvePendingUploads();
  if (!resolvedUploads.length) return contract;

  const prepared = structuredClone(contract);
  const uploadsByKey = new Map(resolvedUploads.map((entry) => [assetKey(entry.asset), entry.asset]));
  const sourceAssets = Array.isArray(prepared?.metadata?.sourceAssets)
    ? prepared.metadata.sourceAssets
    : [];

  sourceAssets.forEach((sourceAsset) => {
    const uploaded = uploadsByKey.get(assetKey(sourceAsset));
    if (!uploaded) return;
    Object.assign(sourceAsset, {
      bucket: uploaded.bucket || '',
      path: uploaded.path || uploaded.objectPath || '',
      objectPath: uploaded.objectPath || uploaded.path || '',
      signedUrl: uploaded.signedUrl || uploaded.url || '',
      url: uploaded.signedUrl || uploaded.url || '',
      pending: false
    });
  });

  const itemImages = [];
  (Array.isArray(prepared.items) ? prepared.items : []).forEach((item) => {
    const relatedAssets = sourceAssets.filter((asset) => String(asset.itemId || '') === String(item.itemId || ''));
    const uploadedUrls = relatedAssets
      .map((asset) => asset.signedUrl || asset.url)
      .filter(Boolean);
    if (!uploadedUrls.length) return;

    const existingImages = Array.isArray(item.images) ? item.images.filter((url) => !isDataImage(url)) : [];
    item.images = unique([...uploadedUrls, ...existingImages]);
    if (!item.imageUrl || isDataImage(item.imageUrl)) item.imageUrl = item.images[0] || '';
    itemImages.push(...item.images);
  });

  if (!prepared.project || typeof prepared.project !== 'object') prepared.project = {};
  prepared.project.images = unique([
    ...itemImages,
    ...(Array.isArray(prepared.project.images) ? prepared.project.images.filter((url) => !isDataImage(url)) : [])
  ]);

  return prepared;
}

export function hasPendingQuotationAssetUploads() {
  return pendingUploads.size > 0;
}
