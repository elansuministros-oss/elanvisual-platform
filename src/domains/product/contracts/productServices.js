export const PRODUCT_SERVICE_CONTRACTS = Object.freeze({
  productService: Object.freeze({
    publicName: 'product.productService',
    purpose: 'Expose enterprise product definitions without infrastructure coupling.',
    inputs: Object.freeze(['productCriteria']),
    outputs: Object.freeze(['Product']),
    errors: Object.freeze(['not_implemented', 'validation_error']),
    permissions: Object.freeze([]),
  }),
  templateService: Object.freeze({
    publicName: 'product.templateService',
    purpose: 'Expose commercial product templates.',
    inputs: Object.freeze(['templateCriteria']),
    outputs: Object.freeze(['ProductTemplate']),
    errors: Object.freeze(['not_implemented', 'validation_error']),
    permissions: Object.freeze([]),
  }),
  recipeReferenceService: Object.freeze({
    publicName: 'product.recipeReferenceService',
    purpose: 'Expose recipe and BOM references without resolving catalog internals.',
    inputs: Object.freeze(['productCriteria']),
    outputs: Object.freeze(['RecipeReference', 'BOMReference']),
    errors: Object.freeze(['not_implemented', 'validation_error']),
    permissions: Object.freeze([]),
  }),
  configurationService: Object.freeze({
    publicName: 'product.configurationService',
    purpose: 'Expose product variations and configuration models.',
    inputs: Object.freeze(['configurationCriteria']),
    outputs: Object.freeze(['ProductVariant', 'ProductConfiguration']),
    errors: Object.freeze(['not_implemented', 'validation_error']),
    permissions: Object.freeze([]),
  }),
});
