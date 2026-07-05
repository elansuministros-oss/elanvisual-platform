import { listarItemsEMC } from '../../../services/emc/emcService';

const EMC_MATERIAL_SEARCH_TERMS = Object.freeze({
  acm: Object.freeze(['acm 3mm', 'acm', 'alucobond']),
  pvc: Object.freeze(['pvc 10mm', 'pvc']),
  lona: Object.freeze(['frontlit banner', 'lona frontlit', 'banner']),
  vinil: Object.freeze(['vinil adhesivo', 'vinyl adhesive', 'vinil']),
  rollup: Object.freeze(['roll up banner', 'roll up']),
});

const EMC_REAL_LOOKUP_TIMEOUT_MS = 2500;

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function createPendingReference(materialQuery = '') {
  return {
    materialId: '',
    materialName: '',
    materialQuery,
    emcItemId: '',
    supplierId: '',
    supplierName: '',
    source: 'PENDING_CATALOG_MATCH',
    unitCost: 0,
    currency: '',
    unit: '',
    costSource: '',
  };
}

function getSearchTerms(materialQuery = '') {
  const normalizedQuery = normalizeText(materialQuery);
  const presetKey = Object.keys(EMC_MATERIAL_SEARCH_TERMS).find((key) => normalizedQuery.includes(key));
  const presetTerms = presetKey ? EMC_MATERIAL_SEARCH_TERMS[presetKey] : [];
  return [materialQuery, ...presetTerms].filter(Boolean);
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
    materialId: String(item.id || materialId || '').trim(),
    materialName: String(item.nombre || item.descripcion || '').trim(),
    materialQuery: materialId,
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

  return createPendingReference(materialId);
}

export const EMCCore = Object.freeze({
  resolverItemCatalogo,
});
