import { createCatalogNotImplemented } from './notImplemented';

export const technicalLibraryService = Object.freeze({
  list: createCatalogNotImplemented('technicalLibraryService.list'),
  getById: createCatalogNotImplemented('technicalLibraryService.getById'),
  create: createCatalogNotImplemented('technicalLibraryService.create'),
  update: createCatalogNotImplemented('technicalLibraryService.update'),
  archive: createCatalogNotImplemented('technicalLibraryService.archive'),
});
