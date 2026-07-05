export const CATALOG_EVENTS = Object.freeze({
  MATERIAL_UPDATED: 'catalog.material.updated',
  INK_UPDATED: 'catalog.ink.updated',
  COST_MISSING_DETECTED: 'catalog.cost.missingDetected',
  COST_VALIDATED: 'catalog.cost.validated',
});

export const CATALOG_EVENT_CONTRACTS = Object.freeze({
  [CATALOG_EVENTS.MATERIAL_UPDATED]: Object.freeze({
    emitter: 'catalog',
    consumers: Object.freeze(['commercial', 'ai', 'production', 'inventory']),
    payload: Object.freeze(['materialId', 'origin', 'updatedAt']),
    rules: 'Payload must reference the material. Consumers must reload details through catalog services.',
  }),
  [CATALOG_EVENTS.INK_UPDATED]: Object.freeze({
    emitter: 'catalog',
    consumers: Object.freeze(['commercial', 'ai']),
    payload: Object.freeze(['inkId', 'origin', 'updatedAt']),
    rules: 'Payload must reference the ink. Consumers must not infer pricing from event payload alone.',
  }),
  [CATALOG_EVENTS.COST_MISSING_DETECTED]: Object.freeze({
    emitter: 'catalog',
    consumers: Object.freeze(['commercial', 'ai', 'admin']),
    payload: Object.freeze(['requestId', 'source', 'priority', 'createdAt']),
    rules: 'Missing costs must open validation flow. No domain may invent cost values.',
  }),
  [CATALOG_EVENTS.COST_VALIDATED]: Object.freeze({
    emitter: 'catalog',
    consumers: Object.freeze(['commercial', 'ai', 'finance']),
    payload: Object.freeze(['requestId', 'validatedBy', 'validatedAt']),
    rules: 'Validated cost consumers must reload canonical catalog data before using it.',
  }),
});
