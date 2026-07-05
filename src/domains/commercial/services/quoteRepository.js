import { createQuoteModel } from '../models/quoteModels';

const STORAGE_KEY = 'elanvisual_v2_quotes';

function readQuotes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createQuoteModel) : [];
  } catch {
    return [];
  }
}

function writeQuotes(quotes) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

export const QuoteRepository = Object.freeze({
  list() {
    return readQuotes();
  },

  getByProject(projectId) {
    return readQuotes().filter((quote) => quote.proyecto.id === projectId);
  },

  save(quote) {
    const nextQuote = createQuoteModel(quote);
    const quotes = [nextQuote, ...readQuotes().filter((item) => item.id !== nextQuote.id)];
    writeQuotes(quotes);
    return nextQuote;
  },

  remove(quoteId) {
    writeQuotes(readQuotes().filter((quote) => quote.id !== quoteId));
  },
});
