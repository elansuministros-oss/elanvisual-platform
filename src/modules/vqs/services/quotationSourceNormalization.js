export function normalizeQuotationSource(contract = {}) {
  const source = contract?.source;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return contract;

  const sourceType = String(source.type || '').trim().toLowerCase();

  if (sourceType === 'design-request') {
    return {
      ...contract,
      source: {
        ...source,
        type: 'design'
      }
    };
  }

  if (sourceType !== 'customer') return contract;

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
