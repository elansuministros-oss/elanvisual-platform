import { getCache } from '@vercel/functions';
import upstreamHandler, { config } from './vqs/[...path].js';

export { config };

const TTL_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;
const QUOTE_RE = /^[A-Za-z0-9._-]{3,120}$/;

function text(value) {
  return String(value ?? '').trim();
}

function isApproved(value) {
  return ['approved', 'accepted', 'aprobada', 'aprobado'].includes(
    text(value).toLowerCase()
  );
}

async function approveTemporaryQuotation(req, res, path) {
  const match = path.match(
    /^public\/portal\/([A-Za-z0-9_-]{22})\/quotations\/([A-Za-z0-9._-]{3,120})\/approve$/
  );

  if (!match || String(req.method || '').toUpperCase() !== 'POST') {
    return false;
  }

  const portalToken = match[1];
  const quotationId = match[2];

  if (!TOKEN_RE.test(portalToken) || !QUOTE_RE.test(quotationId)) {
    res.status(400).json({ error: { message: 'Solicitud de aprobación inválida.' } });
    return true;
  }

  const cache = getCache();
  const portalKey = `elan-one-public:portal:${portalToken}`;
  const quoteKey = `elan-one-public:quote:${quotationId}`;
  const portal = await cache.get(portalKey);

  // Si no pertenece al circuito temporal, conservar el comportamiento VQS existente.
  if (!portal) return false;

  const projects = Array.isArray(portal.projects) ? portal.projects : [];
  const project = projects.find(
    (item) => text(item?.quotationId || item?.quotationNumber) === quotationId
  );

  if (!project) {
    res.status(403).json({
      error: { message: 'Esta cotización no pertenece a este portal.' }
    });
    return true;
  }

  const quote = await cache.get(quoteKey);
  if (!quote) {
    res.status(404).json({
      error: { message: 'La cotización ya no está disponible para aprobación.' }
    });
    return true;
  }

  const previousApproval = quote.approval && typeof quote.approval === 'object'
    ? quote.approval
    : null;
  const approvedAt = previousApproval?.approved_at || new Date().toISOString();

  const approvedQuote = {
    ...quote,
    status: 'approved',
    approval: {
      status: 'approved',
      approved_at: approvedAt,
      source: 'customer_portal_temp'
    }
  };

  const approvedPortal = {
    ...portal,
    projects: projects.map((item) =>
      text(item?.quotationId || item?.quotationNumber) === quotationId
        ? {
            ...item,
            status: 'approved',
            approvedAt
          }
        : item
    )
  };

  if (!isApproved(quote.status) || !previousApproval) {
    await Promise.all([
      cache.set(quoteKey, approvedQuote, {
        ttl: TTL_SECONDS,
        tags: [`elan-one-quote-${quotationId}`]
      }),
      cache.set(portalKey, approvedPortal, {
        ttl: TTL_SECONDS,
        tags: [`elan-one-portal-${portalToken}`]
      })
    ]);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.status(200).json({
    data: {
      quotationId,
      status: 'approved',
      approvedAt,
      alreadyApproved: isApproved(quote.status) && Boolean(previousApproval)
    },
    source: 'elan_one_vercel_runtime_cache_lab'
  });
  return true;
}

export default async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const path = text(req.query?.path).replace(/^\/+/, '');

  if (method === 'POST') {
    try {
      if (await approveTemporaryQuotation(req, res, path)) return;
    } catch {
      return res.status(503).json({
        error: { message: 'No fue posible registrar la aprobación en este momento.' }
      });
    }
  }

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
