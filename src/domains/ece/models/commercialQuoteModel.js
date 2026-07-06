import { createCommercialLineModel } from './commercialLineModel';

export const COMMERCIAL_QUOTE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  READY: 'READY',
  ARCHIVED: 'ARCHIVED',
});

function createQuoteId() {
  return `ece-quote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStatus(status) {
  return Object.values(COMMERCIAL_QUOTE_STATUS).includes(status) ? status : COMMERCIAL_QUOTE_STATUS.DRAFT;
}

function calculateTotal(lineas = []) {
  const pricedLines = lineas.filter((line) => line.subtotal !== null && line.subtotal !== undefined);
  if (!pricedLines.length) return null;
  return pricedLines.reduce((total, line) => total + Number(line.subtotal || 0), 0);
}

export function createCommercialQuoteModel(quote = {}) {
  const lineas = Array.isArray(quote.lineas) ? quote.lineas.map(createCommercialLineModel) : [];

  return {
    quoteId: quote.quoteId || createQuoteId(),
    projectId: String(quote.projectId || '').trim(),
    productId: String(quote.productId || '').trim(),
    configurationId: String(quote.configurationId || '').trim(),
    cliente: String(quote.cliente || '').trim(),
    nombreProyecto: String(quote.nombreProyecto || '').trim(),
    fechaCreacion: quote.fechaCreacion || new Date().toISOString().slice(0, 10),
    estado: normalizeStatus(quote.estado),
    lineas,
    total: quote.total === null || quote.total === undefined ? calculateTotal(lineas) : Number(quote.total),
  };
}
