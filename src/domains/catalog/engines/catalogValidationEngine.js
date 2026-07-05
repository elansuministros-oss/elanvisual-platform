import { createCatalogNotImplemented } from '../services/notImplemented';

export const catalogValidationEngine = Object.freeze({
  validateMaterial: createCatalogNotImplemented('catalogValidationEngine.validateMaterial'),
  validateInk: createCatalogNotImplemented('catalogValidationEngine.validateInk'),
  validateCombination: createCatalogNotImplemented('catalogValidationEngine.validateCombination'),
});
