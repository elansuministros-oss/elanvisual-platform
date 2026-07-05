import { EMCCore } from '../../emc';
import { inkResolver, technologyResolver } from '../resolvers';

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
    materialQuery: 'acm 3mm',
    tintaQuery: 'vinil corte',
    technologyQuery: 'router cnc vinil',
  }),
  'prod-letras-3d': Object.freeze({
    recipeId: 'recipe-letras-3d-standard',
    bomId: 'bom-letras-3d-standard',
    materialQuery: 'pvc 10mm',
    tintaQuery: '',
    technologyQuery: 'cnc fabricacion',
  }),
  'prod-lona-impresa': Object.freeze({
    recipeId: 'recipe-lona-impresa-standard',
    bomId: 'bom-lona-impresa-standard',
    materialQuery: 'lona frontlit',
    tintaQuery: 'tinta solvente',
    technologyQuery: 'impresion gran formato',
  }),
  'prod-vinil-adhesivo': Object.freeze({
    recipeId: 'recipe-vinil-adhesivo-standard',
    bomId: 'bom-vinil-adhesivo-standard',
    materialQuery: 'vinil adhesivo',
    tintaQuery: 'tinta ecosolvente',
    technologyQuery: 'impresion ecosolvente',
  }),
  'prod-roll-up': Object.freeze({
    recipeId: 'recipe-roll-up-standard',
    bomId: 'bom-roll-up-standard',
    materialQuery: 'roll up banner',
    tintaQuery: 'tinta ecosolvente',
    technologyQuery: 'impresion gran formato pop',
  }),
});

function getResolutionStatus({ materialId, tintaId, technologyId, emcItemId }) {
  if (!materialId) return 'PENDIENTE MATERIAL';
  if (!tintaId) return 'PENDING_INK_MATCH';
  if (!technologyId) return 'PENDING_TECHNOLOGY_MATCH';
  if (!emcItemId) return 'PENDIENTE EMC';
  return 'RESUELTA';
}

async function resolverProducto(productId) {
  const references = PRODUCT_TECHNICAL_REFERENCES[productId] || {};
  const [emcReference, tintaReference, technologyReference] = await Promise.all([
    EMCCore.resolverItemCatalogo(references.materialQuery || productId || ''),
    inkResolver.resolveForQuote(references.tintaQuery || ''),
    technologyResolver.resolveForQuote(references.technologyQuery || ''),
  ]);
  const materialId = emcReference.materialId || '';
  const tintaId = tintaReference.id || '';
  const technologyId = technologyReference.id || '';
  const emcItemId = emcReference.emcItemId || '';
  const resolutionStatus = getResolutionStatus({ materialId, tintaId, technologyId, emcItemId });

  return {
    productId,
    recipeId: references.recipeId || '',
    bomId: references.bomId || '',
    materialId,
    materialName: emcReference.materialName || '',
    materialQuery: references.materialQuery || '',
    tintaId,
    tintaName: tintaReference.name || '',
    tintaQuery: references.tintaQuery || '',
    technologyId,
    technologyName: technologyReference.name || '',
    technologyQuery: references.technologyQuery || '',
    technologySource: technologyReference.source || 'PENDING_TECHNOLOGY_MATCH',
    emcItemId,
    supplierId: emcReference.supplierId || '',
    supplierName: emcReference.supplierName || '',
    source: resolutionStatus === 'RESUELTA' ? emcReference.source || 'EMC_REAL' : resolutionStatus,
    emcSource: emcReference.source || 'PENDING_CATALOG_MATCH',
    tintaSource: tintaReference.source || 'PENDING_INK_MATCH',
    resolutionStatus,
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
