import { createCatalogNotImplemented } from '../services/notImplemented';

export const v1CatalogAdapter = Object.freeze({
  fromV1Material: createCatalogNotImplemented('v1CatalogAdapter.fromV1Material'),
  fromV1Ink: createCatalogNotImplemented('v1CatalogAdapter.fromV1Ink'),
});
