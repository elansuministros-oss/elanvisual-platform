/**
 * Catalog V2 domain type documentation.
 * These JSDoc typedefs are contracts only; they do not implement business logic.
 */

/**
 * @typedef {'EMC' | 'MANUAL' | 'TECHNICAL_LIBRARY' | 'AI_DRAFT' | 'LEGACY'} CatalogOrigin
 */

/**
 * @typedef {'active' | 'inactive' | 'obsolete' | 'pending_validation'} CatalogStatus
 */

/**
 * @typedef {Object} MaterialRecord
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} unit
 * @property {number|null} cost
 * @property {string} currency
 * @property {CatalogOrigin} origin
 * @property {CatalogStatus} status
 */

/**
 * @typedef {Object} InkRecord
 * @property {string} id
 * @property {string} name
 * @property {number|null} cost
 * @property {string} unit
 * @property {CatalogOrigin} origin
 * @property {CatalogStatus} status
 */

/**
 * @typedef {Object} CombinationRecord
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {Array<unknown>} components
 * @property {CatalogStatus} status
 */

/**
 * @typedef {Object} TechnologyRecord
 * @property {string} id
 * @property {string} name
 * @property {string} family
 * @property {CatalogStatus} status
 */

/**
 * @typedef {Object} CostRequestRecord
 * @property {string} id
 * @property {'material' | 'ink' | 'supplier' | 'technology'} type
 * @property {string} description
 * @property {'low' | 'medium' | 'high'} priority
 * @property {'open' | 'validated' | 'discarded'} state
 */

export {};
