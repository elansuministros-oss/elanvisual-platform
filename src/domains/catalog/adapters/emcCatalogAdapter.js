import { createCatalogNotImplemented } from '../services/notImplemented';

export const emcCatalogAdapter = Object.freeze({
  toMaterialCandidate: createCatalogNotImplemented('emcCatalogAdapter.toMaterialCandidate'),
  toSupplierCostCandidate: createCatalogNotImplemented('emcCatalogAdapter.toSupplierCostCandidate'),
});
