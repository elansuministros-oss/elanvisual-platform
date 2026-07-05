import { createCatalogNotImplemented } from '../services/notImplemented';

export const inkResolver = Object.freeze({
  resolveForQuote: createCatalogNotImplemented('inkResolver.resolveForQuote'),
  resolveByTechnology: createCatalogNotImplemented('inkResolver.resolveByTechnology'),
});
