import { createCatalogNotImplemented } from '../services/notImplemented';

export const costResolver = Object.freeze({
  resolveCostSource: createCatalogNotImplemented('costResolver.resolveCostSource'),
  detectMissingCost: createCatalogNotImplemented('costResolver.detectMissingCost'),
});
