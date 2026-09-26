import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCache } from '@vercel/functions';

const QUOTE_RE = /^[A-Za-z0-9._-]{3,120}$/;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const id = String(req.query?.id || '').trim();
  if (!QUOTE_RE.test(id)) {
    return res.status(400).json({ error: 'Identificador de cotización inválido.' });
  }

  try {
    const cache = getCache();
    const data = await cache.get(`elan-one-public:quote:${id}`);
    if (data) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res.status(200).json(data);
    }
  } catch {
    // Mantener compatibilidad con los JSON estáticos existentes.
  }

  try {
    const file = path.join(process.cwd(), 'public', 'quote-data', `${id}.json`);
    const raw = await readFile(file, 'utf8');
    const data = JSON.parse(raw);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res.status(200).json(data);
  } catch {
    return res.status(404).json({ error: 'Cotización no publicada.' });
  }
}
