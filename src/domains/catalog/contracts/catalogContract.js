export const CATALOG_DOMAIN_CONTRACT = Object.freeze({
  name: 'catalog',
  responsibility:
    'Own Material Master, inks, combinations, print technologies, technical library, and missing cost requests.',
  exposes: Object.freeze([
    'catalog.materialService',
    'catalog.inkService',
    'catalog.combinationService',
    'catalog.technologyService',
    'catalog.technicalLibraryService',
    'catalog.costRequestService',
  ]),
  publishes: Object.freeze([
    'catalog.material.updated',
    'catalog.ink.updated',
    'catalog.cost.missingDetected',
    'catalog.cost.validated',
  ]),
  listensTo: Object.freeze([
    'emc.import.saved',
    'emc.catalog.itemNormalized',
    'ai.costMissing.detected',
    'commercial.cost.missingDetected',
  ]),
  allowedDependencies: Object.freeze(['emc', 'suppliers', 'knowledge']),
  forbiddenDependencies: Object.freeze([
    'src/pages',
    'src/components',
    'src/services',
    'App.jsx',
    'direct-supabase-from-ui',
    'ai-internals',
    'commercial-internals',
    'emc-internals',
  ]),
});
