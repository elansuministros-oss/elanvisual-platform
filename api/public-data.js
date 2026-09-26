import { getCache } from '@vercel/functions';

const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;
const QUOTE_RE = /^[A-Za-z0-9._-]{3,120}$/;

function text(value) {
  return String(value ?? '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const kind = text(req.query?.kind);
  const id = text(req.query?.id);

  if (!['portal', 'quote'].includes(kind)) {
    return res.status(400).json({ error: 'Tipo de recurso inválido.' });
  }
  if (kind === 'portal' && !TOKEN_RE.test(id)) {
    return res.status(400).json({ error: 'Token de portal inválido.' });
  }
  if (kind === 'quote' && !QUOTE_RE.test(id)) {
    return res.status(400).json({ error: 'Identificador de cotización inválido.' });
  }

  const cache = getCache();
  const key = kind === 'portal'
    ? `elan-one-public:portal:${id}`
    : `elan-one-public:quote:${id}`;
  const data = await cache.get(key);

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (!data) {
    return res.status(404).json({ error: 'Recurso temporal no publicado.' });
  }

  return res.status(200).json({ data });
}
