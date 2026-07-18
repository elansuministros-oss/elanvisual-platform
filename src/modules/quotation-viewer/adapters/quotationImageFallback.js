const hasText = (value) => typeof value === 'string' && value.trim() !== '';

function imageUrlFromAsset(asset = {}) {
  if (typeof asset === 'string') return asset.trim();
  if (!asset || typeof asset !== 'object') return '';
  return String(
    asset.signedUrl ||
    asset.signed_url ||
    asset.url ||
    asset.publicUrl ||
    asset.public_url ||
    asset.imageUrl ||
    asset.image_url ||
    ''
  ).trim();
}

function itemHasImage(item = {}) {
  if (hasText(item.imageUrl) || hasText(item.image_url)) return true;
  return Array.isArray(item.images) && item.images.some((image) => hasText(imageUrlFromAsset(image)));
}

function sourceAssetsFromRecord(record = {}) {
  const candidates = [
    record?.metadata?.sourceAssets,
    record?.metadata?.source_assets,
    record?.project?.metadata?.sourceAssets,
    record?.project?.metadata?.source_assets,
    record?.quotation?.metadata?.sourceAssets,
    record?.quotation?.metadata?.source_assets
  ];
  return candidates.find(Array.isArray) || [];
}

function publicDocumentFromRecord(record = {}) {
  return record?.quotation_document?.publicDocument ||
    record?.quotationDocument?.publicDocument ||
    record?.publicDocument ||
    null;
}

export function applyQuotationImageFallback(record = {}) {
  const sourceAssets = sourceAssetsFromRecord(record);
  if (!sourceAssets.length) return record;

  const publicDocument = publicDocumentFromRecord(record);
  const items = Array.isArray(publicDocument?.items)
    ? publicDocument.items
    : Array.isArray(record?.items)
      ? record.items
      : [];

  if (!items.length) return record;

  const clone = structuredClone(record);
  const clonedDocument = publicDocumentFromRecord(clone);
  const clonedItems = Array.isArray(clonedDocument?.items)
    ? clonedDocument.items
    : Array.isArray(clone?.items)
      ? clone.items
      : [];

  clonedItems.forEach((item, index) => {
    if (itemHasImage(item)) return;

    const itemId = String(item?.itemId || item?.item_id || item?.id || '').trim();
    const matchingAssets = sourceAssets.filter((asset) => {
      const assetItemId = String(asset?.itemId || asset?.item_id || '').trim();
      return itemId && assetItemId === itemId;
    });
    const candidates = matchingAssets.length ? matchingAssets : [sourceAssets[index]].filter(Boolean);
    const urls = candidates.map(imageUrlFromAsset).filter(Boolean);
    if (!urls.length) return;

    item.imageUrl = urls[0];
    item.images = urls;
  });

  return clone;
}
