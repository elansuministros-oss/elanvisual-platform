import { supabase } from '../../../lib/supabase';

const PENDING_TECHNOLOGY_MATCH = 'PENDING_TECHNOLOGY_MATCH';

const GENERIC_TECHNOLOGY_TOKENS = new Set([
  'tecnologia',
  'tecnología',
  'impresion',
  'impresión',
  'print',
  'printing',
  'formato',
  'produccion',
  'producción',
]);

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
    .filter((token) => token && !GENERIC_TECHNOLOGY_TOKENS.has(token));
}

function getTechnologyText(technology = {}) {
  return normalizeText(
    [
      technology.id,
      technology.nombre,
      technology.tipo,
      technology.categoria,
      technology.descripcion,
      technology.notas,
    ].join(' ')
  );
}

function scoreTechnology(technology = {}, query = '') {
  const tokens = tokenize(query);
  const text = getTechnologyText(technology);
  if (!tokens.length || !text) return 0;

  return tokens.reduce((score, token) => (text.includes(token) ? score + 1 : score), 0);
}

function createPendingTechnology(query = '') {
  return {
    id: '',
    name: '',
    query,
    source: PENDING_TECHNOLOGY_MATCH,
    status: PENDING_TECHNOLOGY_MATCH,
  };
}

async function resolveForQuote(query = '') {
  if (!query || !supabase) {
    return createPendingTechnology(query);
  }

  try {
    const { data, error } = await supabase.from('tecnologias_impresion').select('*').order('nombre');
    if (error) return createPendingTechnology(query);

    const match = (data || [])
      .map((technology) => ({ technology, score: scoreTechnology(technology, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.technology;

    if (!match?.id) return createPendingTechnology(query);

    return {
      id: String(match.id || '').trim(),
      name: String(match.nombre || '').trim(),
      query,
      source: 'TECNOLOGIAS_IMPRESION',
      status: 'RESOLVED',
    };
  } catch {
    return createPendingTechnology(query);
  }
}

export const technologyResolver = Object.freeze({
  resolveForQuote,
});
