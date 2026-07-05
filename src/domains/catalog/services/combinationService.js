import { createCatalogNotImplemented } from './notImplemented';

export const combinationService = Object.freeze({
  list: createCatalogNotImplemented('combinationService.list'),
  getById: createCatalogNotImplemented('combinationService.getById'),
  create: createCatalogNotImplemented('combinationService.create'),
  update: createCatalogNotImplemented('combinationService.update'),
  archive: createCatalogNotImplemented('combinationService.archive'),
});
