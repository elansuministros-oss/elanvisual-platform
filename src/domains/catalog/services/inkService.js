import { createCatalogNotImplemented } from './notImplemented';

export const inkService = Object.freeze({
  list: createCatalogNotImplemented('inkService.list'),
  getById: createCatalogNotImplemented('inkService.getById'),
  create: createCatalogNotImplemented('inkService.create'),
  update: createCatalogNotImplemented('inkService.update'),
  archive: createCatalogNotImplemented('inkService.archive'),
});
