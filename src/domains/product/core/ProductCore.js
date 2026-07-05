const NOT_IMPLEMENTED = 'Not implemented';

function notImplemented(operationName) {
  return () => {
    throw new Error(`${operationName}: ${NOT_IMPLEMENTED}`);
  };
}

/**
 * Official public facade for the Product V2 domain.
 *
 * ProductCore defines the stable enterprise product API. It contains no data
 * access, external integration, quoting logic, catalog logic, or production
 * logic during this phase.
 */
export const ProductCore = Object.freeze({
  /**
   * Obtain an enterprise product definition.
   */
  obtenerProducto: notImplemented('ProductCore.obtenerProducto'),

  /**
   * Obtain a commercial product template.
   */
  obtenerPlantilla: notImplemented('ProductCore.obtenerPlantilla'),

  /**
   * Obtain the recipe reference associated with a product model.
   */
  obtenerRecipe: notImplemented('ProductCore.obtenerRecipe'),

  /**
   * Obtain the conceptual bill of materials reference for a product model.
   */
  obtenerBOM: notImplemented('ProductCore.obtenerBOM'),

  /**
   * Obtain commercial product variations.
   */
  obtenerVariaciones: notImplemented('ProductCore.obtenerVariaciones'),

  /**
   * Obtain a product configuration model.
   */
  obtenerConfiguracion: notImplemented('ProductCore.obtenerConfiguracion'),
});
