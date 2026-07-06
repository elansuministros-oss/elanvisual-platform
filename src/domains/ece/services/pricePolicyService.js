export const ECE_PRICE_POLICY = Object.freeze({
  BASIC_DOUBLE_COST: 'BASIC_DOUBLE_COST',
});

function hasRealCost(unitCost) {
  return unitCost !== null && unitCost !== undefined && Number.isFinite(Number(unitCost)) && Number(unitCost) > 0;
}

export const PricePolicyService = Object.freeze({
  priceLine({ cantidad = 1, unitCost = null } = {}) {
    if (!hasRealCost(unitCost)) {
      return {
        unitCost: null,
        pricePolicy: ECE_PRICE_POLICY.BASIC_DOUBLE_COST,
        unitPrice: null,
        subtotal: null,
        pricingStatus: 'PENDING_COST',
      };
    }

    const normalizedCost = Number(unitCost);
    const unitPrice = normalizedCost * 2;

    return {
      unitCost: normalizedCost,
      pricePolicy: ECE_PRICE_POLICY.BASIC_DOUBLE_COST,
      unitPrice,
      subtotal: Math.max(1, Number(cantidad || 1)) * unitPrice,
      pricingStatus: 'PRICED',
    };
  },
});
