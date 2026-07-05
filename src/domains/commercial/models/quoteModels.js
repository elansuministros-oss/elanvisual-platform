export function createQuoteLineModel(line = {}) {
  const medidas = line.medidas || {};
  const unitCost = Number(line.unitCost || 0);
  const precioVentaUnitario = Number(line.precioVentaUnitario || unitCost * 2);
  const cantidad = Math.max(1, Number(line.cantidad || 1));

  return {
    id: line.id || `quote-line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    producto: {
      id: line.producto?.id || line.productId || '',
      nombre: String(line.producto?.nombre || line.productName || 'Producto registrado').trim(),
      categoria: String(line.producto?.categoria || '').trim(),
    },
    cantidad,
    medidas: {
      ancho: medidas.ancho === '' || medidas.ancho == null ? '' : Number(medidas.ancho),
      alto: medidas.alto === '' || medidas.alto == null ? '' : Number(medidas.alto),
    },
    unidad: String(line.unidad || 'cm').trim(),
    observaciones: String(line.observaciones || '').trim(),
    recipeId: String(line.recipeId || '').trim(),
    bomId: String(line.bomId || '').trim(),
    technologyId: String(line.technologyId || '').trim(),
    technologyName: String(line.technologyName || '').trim(),
    technologyQuery: String(line.technologyQuery || '').trim(),
    technologySource: String(line.technologySource || '').trim(),
    materialId: String(line.materialId || '').trim(),
    materialName: String(line.materialName || '').trim(),
    materialQuery: String(line.materialQuery || '').trim(),
    tintaId: String(line.tintaId || '').trim(),
    tintaName: String(line.tintaName || '').trim(),
    tintaQuery: String(line.tintaQuery || '').trim(),
    tintaSource: String(line.tintaSource || '').trim(),
    emcItemId: String(line.emcItemId || '').trim(),
    supplierId: String(line.supplierId || '').trim(),
    supplierName: String(line.supplierName || '').trim(),
    source: String(line.source || '').trim(),
    emcSource: String(line.emcSource || '').trim(),
    resolutionStatus: String(line.resolutionStatus || 'PENDIENTE MATERIAL').trim(),
    unitCost,
    currency: String(line.currency || '').trim(),
    costUnit: String(line.costUnit || line.unitCostUnit || '').trim(),
    costSource: String(line.costSource || '').trim(),
    ai23Status: String(line.ai23Status || 'PENDING').trim(),
    ai23Message: String(line.ai23Message || '').trim(),
    ai23Source: String(line.ai23Source || '').trim(),
    precioVentaUnitario,
    lineSubtotal: Number(line.lineSubtotal || cantidad * precioVentaUnitario),
  };
}

export function createQuoteModel(quote = {}) {
  const proyecto = quote.proyecto || {};

  const lineas = Array.isArray(quote.lineas) ? quote.lineas.map(createQuoteLineModel) : [];
  const totalGeneral = Number(
    quote.totalGeneral || lineas.reduce((total, line) => total + Number(line.lineSubtotal || 0), 0)
  );

  return {
    id: quote.id || `quote-${Date.now()}`,
    proyecto: {
      id: proyecto.id || quote.projectId || '',
      nombre: String(proyecto.nombre || quote.projectName || '').trim(),
    },
    cliente: String(quote.cliente || '').trim(),
    fecha: quote.fecha || new Date().toISOString().slice(0, 10),
    estado: String(quote.estado || 'Generada').trim(),
    lineas,
    totalGeneral,
    anticipoRequerido: Number(quote.anticipoRequerido || totalGeneral * 0.6),
    saldoPendiente: Number(quote.saldoPendiente || totalGeneral * 0.4),
  };
}
