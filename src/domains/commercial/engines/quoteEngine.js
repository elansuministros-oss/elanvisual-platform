import { createQuoteModel } from '../models/quoteModels';

function defaultProductResolver(productId) {
  return {
    id: productId,
    nombre: 'Producto registrado',
    categoria: '',
  };
}

function defaultCatalogResolver(productId) {
  return {
    productId,
    recipeId: '',
    bomId: '',
    technologyId: '',
    materialId: '',
    emcItemId: '',
    supplierId: '',
    supplierName: '',
    source: '',
    unitCost: 0,
    currency: '',
    unit: '',
    costSource: '',
  };
}

function defaultAI23Validator() {
  return {
    ai23Status: 'PENDING',
    ai23Message: '',
    ai23Source: '',
  };
}

export const QuoteEngine = Object.freeze({
  async transformProject(project, options = {}) {
    const resolveProduct = options.resolveProduct || defaultProductResolver;
    const resolveCatalogReferences = options.resolveCatalogReferences || defaultCatalogResolver;
    const validateQuoteLineWithAI23 = options.validateQuoteLineWithAI23 || defaultAI23Validator;

    if (!project || !project.id) {
      throw new Error('Project is required');
    }

    const lineas = await Promise.all((project.productos || []).map(async (projectProduct) => {
      const configuration = projectProduct.configuracion || {};
      const product = resolveProduct(projectProduct.productId) || defaultProductResolver(projectProduct.productId);
      const technicalReferences =
        (await resolveCatalogReferences(projectProduct.productId)) || defaultCatalogResolver(projectProduct.productId);
      const cantidad = Math.max(1, Number(configuration.cantidad || 1));
      const unitCost = Number(technicalReferences.unitCost || 0);
      const precioVentaUnitario = unitCost * 2;
      const lineSubtotal = cantidad * precioVentaUnitario;

      const quoteLine = {
        producto: {
          id: product.id || projectProduct.productId,
          nombre: product.nombre || 'Producto registrado',
          categoria: product.categoria || '',
        },
        cantidad,
        medidas: {
          ancho: configuration.ancho ?? '',
          alto: configuration.alto ?? '',
        },
        unidad: configuration.unidadMedida || 'cm',
        observaciones: configuration.observacionesComerciales || '',
        recipeId: technicalReferences.recipeId || '',
        bomId: technicalReferences.bomId || '',
        technologyId: technicalReferences.technologyId || '',
        materialId: technicalReferences.materialId || '',
        emcItemId: technicalReferences.emcItemId || '',
        supplierId: technicalReferences.supplierId || '',
        supplierName: technicalReferences.supplierName || '',
        source: technicalReferences.source || '',
        unitCost,
        currency: technicalReferences.currency || '',
        costUnit: technicalReferences.unit || '',
        costSource: technicalReferences.costSource || '',
        precioVentaUnitario,
        lineSubtotal,
      };

      const ai23Validation = await validateQuoteLineWithAI23(quoteLine);

      return {
        ...quoteLine,
        ai23Status: ai23Validation.ai23Status || 'PENDING',
        ai23Message: ai23Validation.ai23Message || '',
        ai23Source: ai23Validation.ai23Source || '',
      };
    }));

    const totalGeneral = lineas.reduce((total, line) => total + Number(line.lineSubtotal || 0), 0);

    return createQuoteModel({
      proyecto: {
        id: project.id,
        nombre: project.nombre,
      },
      cliente: project.cliente,
      fecha: new Date().toISOString().slice(0, 10),
      estado: project.estado || 'Generada',
      lineas,
      totalGeneral,
      anticipoRequerido: totalGeneral * 0.6,
      saldoPendiente: totalGeneral * 0.4,
    });
  },
});
