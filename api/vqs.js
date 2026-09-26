import { getCache } from '@vercel/functions';
import upstreamHandler, { config } from './vqs/[...path].js';

export { config };

function text(value) {
  return String(value ?? '').trim();
}

export default async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const path = text(req.query?.path).replace(/^\/+/, '');

  if (method === 'GET') {
    const portal = path.match(/^public\/portal\/([A-Za-z0-9_-]{22})$/);
    if (portal) {
      try {
        const cache = getCache();
        const data = await cache.get(`elan-one-public:portal:${portal[1]}`);
        if (data) {
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
          return res.status(200).json({ data, source: 'elan_one_vercel_runtime_cache_lab' });
        }
      } catch {
        // Si el cache temporal no está disponible, continuar con el upstream existente.
      }
    }
  }

  return upstreamHandler(req, res);
}
