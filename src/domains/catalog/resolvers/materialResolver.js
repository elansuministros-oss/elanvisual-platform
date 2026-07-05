import { createCatalogNotImplemented } from '../services/notImplemented';

export const materialResolver = Object.freeze({
  resolveForQuote: createCatalogNotImplemented('materialResolver.resolveForQuote'),
  resolveFromEmcCandidate: createCatalogNotImplemented('materialResolver.resolveFromEmcCandidate'),
});
