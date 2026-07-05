import { createPaymentAttemptModel } from '../models/paymentAttemptModel';

const STORAGE_KEY = 'elanvisual_v2_checkout_attempts';

function readAttempts() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createPaymentAttemptModel) : [];
  } catch {
    return [];
  }
}

function writeAttempts(attempts) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

export const CheckoutRepository = Object.freeze({
  list() {
    return readAttempts();
  },

  getByQuote(quoteId) {
    return readAttempts().find((attempt) => attempt.quoteId === quoteId) || null;
  },

  save(attempt) {
    const nextAttempt = createPaymentAttemptModel(attempt);
    const attempts = [nextAttempt, ...readAttempts().filter((item) => item.quoteId !== nextAttempt.quoteId)];
    writeAttempts(attempts);
    return nextAttempt;
  },

  updateByQuote(quoteId, updates) {
    let updatedAttempt = null;
    const attempts = readAttempts().map((attempt) => {
      if (attempt.quoteId !== quoteId) return attempt;
      updatedAttempt = createPaymentAttemptModel({ ...attempt, ...updates, quoteId });
      return updatedAttempt;
    });

    writeAttempts(attempts);
    return updatedAttempt;
  },
});
