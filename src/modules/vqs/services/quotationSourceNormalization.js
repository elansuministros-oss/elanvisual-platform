export function normalizeQuotationSource(contract = {}) {
  const source = contract?.source;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return contract;
  if (String(source.type || '').trim().toLowerCase() !== 'customer') return contract;

  return {
    ...contract,
    source: {
      ...source,
      type: 'manual',
      sourceId: '',
      designRequestId: '',
      storeProductId: '',
      storeCartId: ''
    }
  };
}
