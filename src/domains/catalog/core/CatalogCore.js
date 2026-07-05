import { EMCCore } from '../../emc';

const NOT_IMPLEMENTED = 'Not implemented';

function notImplemented(operationName) {
  return () => {
    throw new Error(`${operationName}: ${NOT_IMPLEMENTED}`);
  };
}

const PRODUCT_TECHNICAL_REFERENCES = Object.freeze({
  'prod-rotulo-acm': Object.freeze({
    recipeId: 'recipe-rotulo-acm-standard',
    bomId: 'bom-rotulo-acm-standard',
    technologyId: 'tech-router-vinyl-assembly',
    materialId: 'mat-acm-3mm',
  }),
  'prod-letras-3d': Object.freeze({
    recipeId: 'recipe-letras-3d-standard',
    bomId: 'bom-letras-3d-standard',
    technologyId: 'tech-cnc-fabrication',
    materialId: 'mat-pvc-10mm',
  }),
  'prod-lona-impresa': Object.freeze({
    recipeId: 'recipe-lona-impresa-standard',
    bomId: 'bom-lona-impresa-standard',
    technologyId: 'tech-large-format-print',
    materialId: 'mat-frontlit-banner',
  }),
  'prod-vinil-adhesivo': Object.freeze({
    recipeId: 'recipe-vinil-adhesivo-standard',
    bomId: 'bom-vinil-adhesivo-standard',
    technologyId: 'tech-eco-solvent-print',
    materialId: 'mat-vinyl-adhesive',
  }),
  'prod-roll-up': Object.freeze({
    recipeId: 'recipe-roll-up-standard',
    bomId: 'bom-roll-up-standard',
    technologyId: 'tech-large-format-pop',
    materialId: 'mat-roll-up-banner',
  }),
});

async function resolverProducto(productId) {
  const references = PRODUCT_TECHNICAL_REFERENCES[productId] || {};
  const emcReference = await EMCCore.resolverItemCatalogo(references.materialId || '');

  return {
    productId,
    recipeId: references.recipeId || '',
    bomId: references.bomId || '',
    technologyId: references.technologyId || '',
    materialId: references.materialId || '',
    emcItemId: emcReference.emcItemId || '',
    supplierId: emcReference.supplierId || '',
    supplierName: emcReference.supplierName || '',
    source: emcReference.source || '',
    unitCost: Number(emcReference.unitCost || 0),
    currency: emcReference.currency || '',
    unit: emcReference.unit || '',
    costSource: emcReference.costSource || '',
  };
}

/**
 * Official public facade for the Catalog V2 domain.
 *
 * This facade defines the stable API that internal catalog services and other
 * domains must target. It intentionally contains no data access or business
 * rules during this phase.
 */
export const CatalogCore = Object.freeze({
  resolverProducto,

  /**
   * Obtain a catalog material by future resolver criteria.
   */
  obtenerMaterial: notImplemented('CatalogCore.obtenerMaterial'),

  /**
   * Obtain an ink or print-cost source by future resolver criteria.
   */
  obtenerTinta: notImplemented('CatalogCore.obtenerTinta'),

  /**
   * Obtain an approved print or fabrication technology.
   */
  obtenerTecnologia: notImplemented('CatalogCore.obtenerTecnologia'),

  /**
   * Obtain an approved material/ink/technology combination.
   */
  obtenerCombinacion: notImplemented('CatalogCore.obtenerCombinacion'),

  /**
   * Obtain an approved technical library entry or recipe.
   */
  obtenerBibliotecaTecnica: notImplemented('CatalogCore.obtenerBibliotecaTecnica'),

  /**
   * Obtain a supplier reference associated with catalog data.
   */
  obtenerProveedor: notImplemented('CatalogCore.obtenerProveedor'),

  /**
   * Obtain a validated cost source for catalog usage.
   */
  obtenerCosto: notImplemented('CatalogCore.obtenerCosto'),
});
