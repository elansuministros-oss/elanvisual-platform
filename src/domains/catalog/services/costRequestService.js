import { createCatalogNotImplemented } from './notImplemented';

export const costRequestService = Object.freeze({
  list: createCatalogNotImplemented('costRequestService.list'),
  getById: createCatalogNotImplemented('costRequestService.getById'),
  create: createCatalogNotImplemented('costRequestService.create'),
  validate: createCatalogNotImplemented('costRequestService.validate'),
  discard: createCatalogNotImplemented('costRequestService.discard'),
});
