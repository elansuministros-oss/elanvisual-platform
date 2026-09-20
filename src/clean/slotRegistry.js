export const SLOT_REGISTRY = Object.freeze({
  'HOME.HERO.MAIN': {
    label: 'Portada principal',
    kind: 'hero',
    minHeight: 620,
    purpose: 'Campaña o portada principal de ELANVISUAL.'
  },
  'HOME.PROMO.PRIMARY': {
    label: 'Promoción principal',
    kind: 'banner',
    minHeight: 260,
    purpose: 'Promoción temporal destacada.'
  },
  'CATALOG.PRODUCT.CARD': {
    label: 'Tarjeta HTML de producto',
    kind: 'product',
    minHeight: 430,
    purpose: 'Módulo completo de producto: visual, texto, precio y CTA.'
  },
  'CATALOG.CATEGORY.HERO': {
    label: 'Cabecera de categoría',
    kind: 'category',
    minHeight: 360,
    purpose: 'Cabecera visual para una categoría específica.'
  },
  'PORTFOLIO.PROJECT.CARD': {
    label: 'Proyecto de portafolio',
    kind: 'project',
    minHeight: 420,
    purpose: 'Presentación HTML completa de un proyecto realizado.'
  }
});

export function getSlotConfig(slotId) {
  return SLOT_REGISTRY[slotId] || {
    label: slotId,
    kind: 'generic',
    minHeight: 320,
    purpose: 'Slot HTML administrable.'
  };
}
