import { COMMERCIAL_QUOTE_STATUS, createCommercialLineModel, createCommercialQuoteModel } from '../models';
import { PricePolicyService } from '../services/pricePolicyService';

function getConfigurationId(configuration = {}) {
  return configuration.configurationId || configuration.id || '';
}

function getQuantity(configuration = {}) {
  return Math.max(1, Number(configuration.cantidad || configuration.quantity || 1));
}

function getUnit(configuration = {}) {
  return configuration.unidad || configuration.unidadMedida || configuration.unit || 'unidad';
}

function getObservations(configuration = {}) {
  return configuration.observaciones || configuration.observacionesComerciales || configuration.notes || '';
}

export const CommercialEngine = Object.freeze({
  async buildQuote(project, product, configuration, options = {}) {
    const line = await this.buildLine(product, configuration, options);

    return createCommercialQuoteModel({
      projectId: project.id || project.projectId || '',
      productId: product.id || product.productId || '',
      configurationId: getConfigurationId(configuration),
      cliente: project.cliente || project.customer || '',
      nombreProyecto: project.nombre || project.nombreProyecto || project.projectName || '',
      fechaCreacion: new Date().toISOString().slice(0, 10),
      estado: COMMERCIAL_QUOTE_STATUS.DRAFT,
      lineas: [line],
    });
  },

  async buildLine(product, configuration, options = {}) {
    const resolveCatalogReferences = options.resolveCatalogReferences;
    const validateQuoteLineWithAI23 = options.validateQuoteLineWithAI23;
    const productId = product.id || product.productId || '';
    const technicalReferences = resolveCatalogReferences ? await resolveCatalogReferences(productId) : {};
    const cantidad = getQuantity(configuration);
    const pricing = PricePolicyService.priceLine({
      cantidad,
      unitCost: technicalReferences.unitCost ?? null,
    });

    const line = createCommercialLineModel({
      productId,
      descripcion: product.nombre || product.descripcion || product.name || '',
      cantidad,
      unidad: getUnit(configuration),
      observaciones: getObservations(configuration),
      recipeId: technicalReferences.recipeId || '',
      bomId: technicalReferences.bomId || '',
      materialId: technicalReferences.materialId || '',
      materialName: technicalReferences.materialName || '',
      tintaId: technicalReferences.tintaId || '',
      tintaName: technicalReferences.tintaName || '',
      technologyId: technicalReferences.technologyId || '',
      technologyName: technicalReferences.technologyName || '',
      emcItemId: technicalReferences.emcItemId || '',
      supplierId: technicalReferences.supplierId || '',
      supplierName: technicalReferences.supplierName || '',
      emcSource: technicalReferences.emcSource || technicalReferences.source || 'PENDING_EMC_MATCH',
      costSource: technicalReferences.costSource || '',
      unitCost: pricing.unitCost,
      currency: technicalReferences.currency || '',
      unit: technicalReferences.unit || '',
      pricePolicy: pricing.pricePolicy,
      unitPrice: pricing.unitPrice,
      subtotal: pricing.subtotal,
      pricingStatus: pricing.pricingStatus,
      resolutionStatus: technicalReferences.resolutionStatus || 'PENDIENTE MATERIAL',
    });

    if (!validateQuoteLineWithAI23) return line;

    const ai23Validation = await validateQuoteLineWithAI23(line);

    return createCommercialLineModel({
      ...line,
      ai23Status: ai23Validation.ai23Status || 'PENDING',
      ai23Message: ai23Validation.ai23Message || 'AI-23 no disponible',
      ai23Source: ai23Validation.ai23Source || 'AI23_UNAVAILABLE',
    });
  },
});
