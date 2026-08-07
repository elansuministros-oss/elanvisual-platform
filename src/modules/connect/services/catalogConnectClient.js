import { buildQuery, requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';
const CATALOG_PATH = '/api/v1/catalog';
const DEFAULT_LIMIT = 5000;
const IMAGE_FALLBACK = '/productos/portada-visual.png';

function toText(value) {
  return String(value ?? '').trim();
}

function slugify(value) {
  return toText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function listFromPayload(result, keys = []) {
  if (Array.isArray(result)) return result;
  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function resolveItemMetadata(item = {}) {
  const rowMetadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const visualMetadata =
    rowMetadata.metadata && typeof rowMetadata.metadata === 'object'
      ? rowMetadata.metadata
      : {};

  return {
    ...rowMetadata,
    ...visualMetadata,
  };
}

function resolveStorePrice(item = {}) {
  const activePrices = Array.isArray(item.prices)
    ? item.prices.filter((price) => price?.active !== false)
    : [];
  const activePrice = activePrices[0] || {};
  const metadata = resolveItemMetadata(item);

  return firstPositiveNumber(
    item.salePrice,
    activePrice.salePrice,
    activePrice.price,
    metadata.salePrice,
    metadata.basePrice,
    metadata.price,
    metadata.precio
  );
}

function resolveStoreImage(item = {}) {
  const metadata = resolveItemMetadata(item);
  const media = Array.isArray(metadata.media) ? metadata.media : [];
  const firstMedia = media.find((entry) => toText(entry?.url || entry?.src || entry?.image));

  return (
    toText(metadata.imageUrl) ||
    toText(metadata.image_url) ||
    toText(metadata.image) ||
    toText(metadata.imagen) ||
    toText(firstMedia?.url || firstMedia?.src || firstMedia?.image) ||
    IMAGE_FALLBACK
  );
}

function resolveSaleMode(item = {}) {
  const metadata = resolveItemMetadata(item);
  const value = slugify(
    metadata.saleMode ||
      metadata.sale_mode ||
      metadata.modoVenta ||
      metadata.tipoProducto ||
      ''
  );

  if (['catalogo', 'compra', 'prefabricado'].includes(value)) return 'compra';
  if (['catalogo-personalizado', 'mixto', 'compra-diseno'].includes(value)) return 'mixto';
  return 'diseno';
}

export function mapCatalogItemToStoreProduct(item = {}) {
  const metadata = resolveItemMetadata(item);
  const category = toText(item.category) || 'GENERAL';
  const categorySlug =
    slugify(metadata.categorySlug || metadata.category_slug || category) || 'general';
  const code = toText(item.code || metadata.sku || item.id);
  const saleMode = resolveSaleMode(item);

  return {
    id: toText(item.id || code),
    codigo: code,
    sku: code,
    nombre: toText(item.name) || 'Producto ELANVISUAL',
    descripcion: toText(item.description),
    categoria: category,
    categoriaSlug: categorySlug,
    subcategoria: toText(item.subcategory),
    imagen: resolveStoreImage(item),
    precio: resolveStorePrice(item),
    moneda: toText(item.currency) || 'USD',
    activo: item.active !== false,
    modoVenta: saleMode,
    tipoProducto: saleMode,
    aliases: Array.isArray(item.aliases) ? item.aliases : [],
    unidad: toText(item.unit),
    medidas: toText(metadata.medidas || metadata.measurements),
    etiqueta: toText(metadata.etiqueta || metadata.label),
    categoriaHomeId: toText(metadata.categoriaHomeId || metadata.categoryHomeId),
    metadata,
    fuenteCatalogo: 'CONNECT',
  };
}

export function buildStoreCategories(products = []) {
  const categories = new Map();

  products.forEach((product, index) => {
    const slug = product.categoriaSlug || slugify(product.categoria) || 'general';
    if (categories.has(slug)) return;

    const metadata = product.metadata && typeof product.metadata === 'object' ? product.metadata : {};
    categories.set(slug, {
      id: product.categoriaHomeId || `connect-category-${slug}`,
      nombre:
        toText(metadata.categoryLabel || metadata.category_label || product.categoria) ||
        'General',
      slug,
      descripcion: toText(metadata.categoryDescription || metadata.category_description),
      imagenDesktop:
        toText(metadata.categoryImage || metadata.category_image) ||
        product.imagen ||
        IMAGE_FALLBACK,
      imagenMobile: toText(
        metadata.categoryImageMobile || metadata.category_image_mobile
      ),
      orden:
        firstPositiveNumber(metadata.categoryOrder, metadata.category_order, index + 1) ||
        index + 1,
      activo: true,
      fuenteCatalogo: 'CONNECT',
    });
  });

  return Array.from(categories.values()).sort(
    (left, right) => Number(left.orden || 999) - Number(right.orden || 999)
  );
}

export async function getCatalogSummaryConnect({ platform = PLATFORM } = {}) {
  return requestConnect(`${CATALOG_PATH}/summary${buildQuery({ platform })}`, {
    method: 'GET',
  });
}

export async function listCatalogItemsConnect({
  query = '',
  supplierId = '',
  category = '',
  itemType = '',
  active,
  limit = 300,
  platform = PLATFORM,
} = {}) {
  const result = await requestConnect(
    `${CATALOG_PATH}/items${buildQuery({
      q: query,
      supplierId,
      category,
      itemType,
      active,
      platform,
      limit,
    })}`,
    { method: 'GET' }
  );

  return listFromPayload(result, ['catalogItems', 'materials', 'products', 'services']);
}

export async function getElanvisualStoreCatalog({ limit = DEFAULT_LIMIT } = {}) {
  const items = await listCatalogItemsConnect({
    platform: PLATFORM,
    active: true,
    limit,
  });

  const products = items
    .map(mapCatalogItemToStoreProduct)
    .filter((product) => product.activo !== false);

  return {
    platform: PLATFORM,
    products,
    categories: buildStoreCategories(products),
    source: 'CONNECT',
  };
}

export async function listCatalogMaterialsConnect({
  query = '',
  supplierId = '',
  limit = DEFAULT_LIMIT,
  platform = PLATFORM,
} = {}) {
  const result = await requestConnect(
    `${CATALOG_PATH}/materials${buildQuery({
      q: query,
      supplierId,
      platform,
      limit,
    })}`,
    { method: 'GET' }
  );
  return listFromPayload(result, ['materials', 'catalogItems', 'items']);
}

export async function listSupplierCatalogItemsConnect({
  supplierId,
  limit = 50,
  platform = PLATFORM,
} = {}) {
  const result = await requestConnect(
    `${CATALOG_PATH}/supplier-items${buildQuery({
      supplierId,
      platform,
      limit,
    })}`,
    { method: 'GET' }
  );
  return listFromPayload(result, ['supplierItems', 'items']);
}

export const catalogConnectClient = Object.freeze({
  getCatalogSummaryConnect,
  listCatalogItemsConnect,
  getElanvisualStoreCatalog,
  listCatalogMaterialsConnect,
  listSupplierCatalogItemsConnect,
  mapCatalogItemToStoreProduct,
  buildStoreCategories,
});
