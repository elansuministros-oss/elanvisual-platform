import { createCatalogNotImplemented } from './notImplemented';

export const materialService = Object.freeze({
  list: createCatalogNotImplemented('materialService.list'),
  getById: createCatalogNotImplemented('materialService.getById'),
  create: createCatalogNotImplemented('materialService.create'),
  update: createCatalogNotImplemented('materialService.update'),
  archive: createCatalogNotImplemented('materialService.archive'),
});
