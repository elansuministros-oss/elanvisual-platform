import { supabase } from '../../../lib/supabase';

const PENDING_INK_MATCH = 'PENDING_INK_MATCH';

const GENERIC_INK_TOKENS = new Set(['tinta', 'impresion', 'impresión', 'print', 'printing']);

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(value = '') {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token && !GENERIC_INK_TOKENS.has(token));
}

function getInkText(ink = {}) {
  return normalizeText([ink.id, ink.nombre, ink.tipo, ink.notas, ink.descripcion].join(' '));
}

function scoreInk(ink = {}, query = '') {
  const tokens = tokenize(query);
  const text = getInkText(ink);
  if (!tokens.length || !text) return 0;

  return tokens.reduce((score, token) => (text.includes(token) ? score + 1 : score), 0);
}

function createPendingInk(query = '') {
  return {
    id: '',
    name: '',
    query,
    source: PENDING_INK_MATCH,
    status: PENDING_INK_MATCH,
  };
}

async function resolveForQuote(query = '') {
  if (!query || !supabase) {
    return createPendingInk(query);
  }

  try {
    const { data, error } = await supabase.from('tintas_master').select('*').order('nombre');
    if (error) return createPendingInk(query);

    const match = (data || [])
      .map((ink) => ({ ink, score: scoreInk(ink, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.ink;

    if (!match?.id) return createPendingInk(query);

    return {
      id: String(match.id || '').trim(),
      name: String(match.nombre || '').trim(),
      query,
      source: 'TINTAS_MASTER',
      status: 'RESOLVED',
    };
  } catch {
    return createPendingInk(query);
  }
}

export const inkResolver = Object.freeze({
  resolveForQuote,
  resolveByTechnology: resolveForQuote,
});
