export const PRODUCT_DOMAIN_CONTRACT = Object.freeze({
  name: 'product',
  responsibility:
    'Own the enterprise product model: products, templates, recipes references, BOM references, variations, and configurations.',
  exposes: Object.freeze([
    'product.ProductCore',
    'product.productService',
    'product.templateService',
    'product.recipeReferenceService',
    'product.configurationService',
  ]),
  publishes: Object.freeze([
    'product.definition.requested',
    'product.template.requested',
    'product.configuration.requested',
  ]),
  listensTo: Object.freeze([]),
  allowedDependencies: Object.freeze([]),
  forbiddenDependencies: Object.freeze([
    'supabase',
    'emc',
    'ai',
    'production',
    'inventory',
    'purchasing',
    'pdf',
    'catalog-internals',
    'src/pages',
    'src/components',
    'src/services',
    'App.jsx',
  ]),
});
