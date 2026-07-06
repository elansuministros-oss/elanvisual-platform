import { createCommercialQuoteModel } from '../models';

const STORAGE_KEY = 'ece_quotes';

function getStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function readQuotes() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createCommercialQuoteModel) : [];
  } catch {
    return [];
  }
}

function writeQuotes(quotes) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

export const QuoteRepository = Object.freeze({
  save(quote) {
    const nextQuote = createCommercialQuoteModel(quote);
    const quotes = [nextQuote, ...readQuotes().filter((item) => item.quoteId !== nextQuote.quoteId)];
    writeQuotes(quotes);
    return nextQuote;
  },

  findById(quoteId) {
    return readQuotes().find((quote) => quote.quoteId === quoteId) || null;
  },

  list() {
    return readQuotes();
  },

  remove(quoteId) {
    const quotes = readQuotes().filter((quote) => quote.quoteId !== quoteId);
    writeQuotes(quotes);
  },
});
