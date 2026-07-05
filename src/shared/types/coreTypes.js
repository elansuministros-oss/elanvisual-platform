/**
 * Shared JSDoc contracts for ELANVISUAL V2 infrastructure.
 * These are documentation-only runtime types for plain JavaScript modules.
 */

/**
 * @typedef {'active' | 'experimental' | 'legacy' | 'disabled'} RegistryStatus
 */

/**
 * @typedef {Object} DomainDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} responsibility
 * @property {RegistryStatus} status
 * @property {string[]} allowedDependencies
 * @property {string[]} forbiddenDependencies
 */

/**
 * @typedef {Object} ServiceDefinition
 * @property {string} name
 * @property {string} domain
 * @property {string} purpose
 * @property {unknown} service
 * @property {string[]} permissions
 */

/**
 * @typedef {Object} EventPayload
 * @property {string} name
 * @property {string} source
 * @property {unknown} payload
 * @property {string} emittedAt
 */

/**
 * @typedef {Object} PermissionDefinition
 * @property {string} name
 * @property {string} domain
 * @property {string} description
 * @property {RegistryStatus} status
 */

/**
 * @typedef {Object} NavigationDefinition
 * @property {string} path
 * @property {string} domain
 * @property {string} title
 * @property {string[]} permissions
 * @property {RegistryStatus} status
 */

/**
 * @typedef {Object} ConfigurationDefinition
 * @property {string} key
 * @property {string} owner
 * @property {unknown} value
 * @property {'public' | 'internal' | 'sensitive'} visibility
 */

export {};
