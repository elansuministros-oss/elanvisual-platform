function createLineId() {
  return `ece-line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function createCommercialLineModel(line = {}) {
  return {
    lineId: line.lineId || createLineId(),
    productId: String(line.productId || '').trim(),
    descripcion: String(line.descripcion || '').trim(),
    cantidad: Math.max(1, Number(line.cantidad || 1)),
    unidad: String(line.unidad || 'unidad').trim(),
    observaciones: String(line.observaciones || '').trim(),
    recipeId: String(line.recipeId || '').trim(),
    bomId: String(line.bomId || '').trim(),
    materialId: String(line.materialId || '').trim(),
    materialName: String(line.materialName || '').trim(),
    tintaId: String(line.tintaId || '').trim(),
    tintaName: String(line.tintaName || '').trim(),
    technologyId: String(line.technologyId || '').trim(),
    technologyName: String(line.technologyName || '').trim(),
    emcItemId: String(line.emcItemId || '').trim(),
    supplierId: String(line.supplierId || '').trim(),
    supplierName: String(line.supplierName || '').trim(),
    emcSource: String(line.emcSource || 'PENDING_EMC_MATCH').trim(),
    costSource: String(line.costSource || '').trim(),
    unitCost: nullableNumber(line.unitCost),
    currency: String(line.currency || '').trim(),
    unit: String(line.unit || '').trim(),
    pricePolicy: String(line.pricePolicy || '').trim(),
    unitPrice: nullableNumber(line.unitPrice),
    subtotal: nullableNumber(line.subtotal),
    pricingStatus: String(line.pricingStatus || 'PENDING_COST').trim(),
    ai23Status: String(line.ai23Status || 'PENDING').trim(),
    ai23Message: String(line.ai23Message || '').trim(),
    ai23Source: String(line.ai23Source || '').trim(),
    resolutionStatus: String(line.resolutionStatus || 'PENDIENTE MATERIAL').trim(),
  };
}
