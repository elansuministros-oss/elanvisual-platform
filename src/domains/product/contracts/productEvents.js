export const PRODUCT_EVENTS = Object.freeze({
  DEFINITION_REQUESTED: 'product.definition.requested',
  TEMPLATE_REQUESTED: 'product.template.requested',
  CONFIGURATION_REQUESTED: 'product.configuration.requested',
});

export const PRODUCT_EVENT_CONTRACTS = Object.freeze({
  [PRODUCT_EVENTS.DEFINITION_REQUESTED]: Object.freeze({
    emitter: 'product',
    consumers: Object.freeze([]),
    payload: Object.freeze(['productId', 'requestedAt']),
    rules: 'Payload references a product definition request only. It must not include catalog, pricing, stock, or supplier data.',
  }),
  [PRODUCT_EVENTS.TEMPLATE_REQUESTED]: Object.freeze({
    emitter: 'product',
    consumers: Object.freeze([]),
    payload: Object.freeze(['templateId', 'requestedAt']),
    rules: 'Payload references a product template request only.',
  }),
  [PRODUCT_EVENTS.CONFIGURATION_REQUESTED]: Object.freeze({
    emitter: 'product',
    consumers: Object.freeze([]),
    payload: Object.freeze(['configurationId', 'requestedAt']),
    rules: 'Payload references a product configuration request only.',
  }),
});
