/**
 * Product V2 domain type documentation.
 * These JSDoc typedefs describe enterprise concepts only.
 */

/**
 * @typedef {'registered' | 'template' | 'ai_proposal' | 'custom'} ProductType
 */

/**
 * @typedef {'active' | 'inactive' | 'draft' | 'pending_validation'} ProductStatus
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {ProductType} type
 * @property {ProductStatus} status
 */

/**
 * @typedef {Object} ProductTemplate
 * @property {string} id
 * @property {string} productId
 * @property {string} name
 * @property {string} purpose
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string} productId
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} ProductConfiguration
 * @property {string} id
 * @property {string} productId
 * @property {string[]} selectedVariantIds
 * @property {Record<string, unknown>} attributes
 */

export {};
