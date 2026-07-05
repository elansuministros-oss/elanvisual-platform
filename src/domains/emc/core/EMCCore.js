import { listarItemsEMC } from '../../../services/emc/emcService';

const EMC_ITEM_REFERENCES = Object.freeze({
  'mat-acm-3mm': Object.freeze({
    emcItemId: 'emc-acm-3mm-standard',
    supplierId: 'supplier-alum-panel-mock',
    supplierName: 'Proveedor Paneles Mock',
    unitCost: 18,
    currency: 'USD',
    unit: 'm2',
  }),
  'mat-pvc-10mm': Object.freeze({
    emcItemId: 'emc-pvc-10mm-standard',
    supplierId: 'supplier-plastics-mock',
    supplierName: 'Proveedor Plasticos Mock',
    unitCost: 12,
    currency: 'USD',
    unit: 'm2',
  }),
  'mat-frontlit-banner': Object.freeze({
    emcItemId: 'emc-frontlit-banner-standard',
    supplierId: 'supplier-print-media-mock',
    supplierName: 'Proveedor Medios Impresion Mock',
    unitCost: 6,
    currency: 'USD',
    unit: 'm2',
  }),
  'mat-vinyl-adhesive': Object.freeze({
    emcItemId: 'emc-vinyl-adhesive-standard',
    supplierId: 'supplier-vinyl-mock',
    supplierName: 'Proveedor Vinil Mock',
    unitCost: 4.5,
    currency: 'USD',
    unit: 'm2',
  }),
  'mat-roll-up-banner': Object.freeze({
    emcItemId: 'emc-roll-up-banner-standard',
    supplierId: 'supplier-pop-display-mock',
    supplierName: 'Proveedor POP Mock',
    unitCost: 22,
    currency: 'USD',
    unit: 'unit',
  }),
});

const EMC_MATERIAL_SEARCH_TERMS = Object.freeze({
  'mat-acm-3mm': Object.freeze(['acm 3mm', 'acm', 'alucobond']),
  'mat-pvc-10mm': Object.freeze(['pvc 10mm', 'pvc']),
  'mat-frontlit-banner': Object.freeze(['frontlit banner', 'lona frontlit', 'banner']),
  'mat-vinyl-adhesive': Object.freeze(['vinil adhesivo', 'vinyl adhesive', 'vinil']),
  'mat-roll-up-banner': Object.freeze(['roll up banner', 'roll up']),
});

const EMC_REAL_LOOKUP_TIMEOUT_MS = 2500;

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolverItemCatalogoMock(materialId) {
  const reference = EMC_ITEM_REFERENCES[materialId] || {};

  return {
    materialId,
    emcItemId: reference.emcItemId || '',
    supplierId: reference.supplierId || '',
    supplierName: reference.supplierName || '',
    source: 'EMC_MOCK',
    unitCost: Number(reference.unitCost || 0),
    currency: reference.currency || 'USD',
    unit: reference.unit || '',
    costSource: 'EMC_MOCK_COST',
  };
}

function getSearchTerms(materialId) {
  return [materialId, ...(EMC_MATERIAL_SEARCH_TERMS[materialId] || [])].filter(Boolean);
}

function getItemSearchText(item = {}) {
  return normalizeText(
    [
      item.id,
      item.codigo,
      item.nombre,
      item.descripcion,
      item.categoria_nombre,
      item.subcategoria_nombre,
      item.marca_nombre,
    ].join(' ')
  );
}

function getFirstPrice(item = {}) {
  return Array.isArray(item.precios_proveedor) ? item.precios_proveedor[0] || null : null;
}

function getUnitCost(item = {}) {
  const firstPrice = getFirstPrice(item);
  return Number(
    item.precio_actual ??
      item.precio ??
      item.costo ??
      item.costo_unitario ??
      item.precio_unitario ??
      firstPrice?.precio ??
      0
  );
}

function mapRealEmcItem(materialId, item = {}) {
  const firstPrice = getFirstPrice(item);

  return {
    materialId,
    emcItemId: String(item.id || '').trim(),
    supplierId: String(item.proveedor_id || firstPrice?.proveedor_id || '').trim(),
    supplierName: String(item.proveedor_nombre || item.proveedor || firstPrice?.proveedor_nombre || '').trim(),
    source: 'EMC_REAL',
    unitCost: getUnitCost(item),
    currency: String(item.moneda_actual || item.moneda || firstPrice?.moneda || 'USD').trim(),
    unit: String(item.unidad_nombre || item.unidad || item.unidad_compra || '').trim(),
    costSource: 'EMC_REAL_COST',
  };
}

function findMatchingItem(items = [], searchTerm = '') {
  const normalizedSearchTerm = normalizeText(searchTerm);
  const searchTokens = normalizedSearchTerm.split(/\s+/).filter(Boolean);

  return (items || []).find((item) => {
    const itemText = getItemSearchText(item);
    if (!itemText) return false;
    if (itemText.includes(normalizedSearchTerm)) return true;
    return searchTokens.length > 0 && searchTokens.every((token) => itemText.includes(token));
  });
}

async function resolveRealEmcItem(materialId) {
  const searchTerms = getSearchTerms(materialId);

  for (const searchTerm of searchTerms) {
    try {
      const items = await Promise.race([
        listarItemsEMC({ busqueda: searchTerm, limite: 25 }),
        new Promise((resolve) => {
          globalThis.setTimeout(() => resolve(null), EMC_REAL_LOOKUP_TIMEOUT_MS);
        }),
      ]);
      const match = findMatchingItem(items, searchTerm);
      if (match?.id) {
        return mapRealEmcItem(materialId, match);
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function resolverItemCatalogo(materialId) {
  const realReference = await resolveRealEmcItem(materialId);
  if (realReference) {
    return realReference;
  }

  return resolverItemCatalogoMock(materialId);
}

export const EMCCore = Object.freeze({
  resolverItemCatalogo,
});
