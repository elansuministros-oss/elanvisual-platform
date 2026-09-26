import { randomInt } from 'node:crypto';
import { getCache } from '@vercel/functions';

const TTL_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;
const QUOTE_RE = /^[A-Za-z0-9._-]{3,120}$/;

function text(value) {
  return String(value ?? '').trim();
}

function number(value) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function approved(value) {
  return ['approved', 'accepted', 'aprobada', 'aprobado'].includes(
    text(value).toLowerCase()
  );
}

function publicReceiptMeta(receipt) {
  return {
    receiptNumber: receipt.receiptNumber,
    receiptCode: receipt.receiptCode,
    quotationId: receipt.quotationId,
    paymentType: receipt.paymentType,
    paidAt: receipt.paidAt,
    amountUsd: receipt.amountUsd,
    originalCurrency: receipt.originalCurrency,
    originalAmount: receipt.originalAmount,
    viewUrl: receipt.viewUrl
  };
}

async function uniqueReceipt(cache, portalToken) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const receiptCode = String(randomInt(1000000000, 9999999999));
    const year = new Date().getFullYear();
    const suffix = String(randomInt(0, 1000000)).padStart(6, '0');
    const receiptNumber = `ELV-REC-${year}-${suffix}`;
    const key = `elan-one-public:receipt:${portalToken}:${receiptCode}`;
    const existing = await cache.get(key);
    if (!existing) return { receiptCode, receiptNumber, key };
  }
  throw new Error('No fue posible generar un número de recibo único.');
}

export default async function handler(req, res) {
  if (String(req.method || '').toUpperCase() !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const portalToken = text(body.portalToken);
  const quotationId = text(body.quotationId);
  const originalCurrency = text(body.currency || 'USD').toUpperCase();
  const originalAmount = number(body.amount);
  const exchangeRate = originalCurrency === 'NIO' ? number(body.exchangeRate) : null;

  if (!TOKEN_RE.test(portalToken) || !QUOTE_RE.test(quotationId)) {
    return res.status(400).json({ error: 'Portal o cotización inválidos.' });
  }
  if (!['USD', 'NIO'].includes(originalCurrency)) {
    return res.status(400).json({ error: 'Moneda inválida.' });
  }
  if (originalAmount <= 0) {
    return res.status(400).json({ error: 'El monto recibido debe ser mayor que cero.' });
  }
  if (originalCurrency === 'NIO' && exchangeRate <= 0) {
    return res.status(400).json({ error: 'Ingresá el tipo de cambio utilizado.' });
  }

  const cache = getCache();
  const portalKey = `elan-one-public:portal:${portalToken}`;
  const quoteKey = `elan-one-public:quote:${quotationId}`;
  const [portal, quote] = await Promise.all([
    cache.get(portalKey),
    cache.get(quoteKey)
  ]);

  if (!portal || !quote) {
    return res.status(404).json({ error: 'La cotización publicada no está disponible.' });
  }

  const projects = Array.isArray(portal.projects) ? portal.projects : [];
  const project = projects.find(
    (item) => text(item?.quotationId || item?.quotationNumber) === quotationId
  );

  if (!project) {
    return res.status(403).json({ error: 'La cotización no pertenece a este portal.' });
  }
  if (!approved(quote.status)) {
    return res.status(409).json({ error: 'La cotización debe estar aprobada antes de registrar el anticipo.' });
  }

  const amountUsd = originalCurrency === 'NIO'
    ? originalAmount / exchangeRate
    : originalAmount;
  const totalUsd = number(quote.total);
  const existingReceipts = Array.isArray(portal.receipts) ? portal.receipts : [];
  const priorPaidUsd = existingReceipts
    .filter((item) => text(item.quotationId) === quotationId)
    .reduce((sum, item) => sum + number(item.amountUsd), 0);
  const pendingBefore = Math.max(0, totalUsd - priorPaidUsd);

  if (amountUsd > pendingBefore + 0.01) {
    return res.status(400).json({
      error: `El pago supera el saldo pendiente de US$ ${pendingBefore.toFixed(2)}.`
    });
  }

  const generated = await uniqueReceipt(cache, portalToken);
  const paidAtRaw = text(body.paidAt);
  const paidAt = paidAtRaw
    ? new Date(`${paidAtRaw}T12:00:00`).toISOString()
    : new Date().toISOString();
  const totalPaidUsd = priorPaidUsd + amountUsd;
  const pendingBalanceUsd = Math.max(0, totalUsd - totalPaidUsd);

  const receipt = {
    platform: 'ELANVISUAL',
    receiptNumber: generated.receiptNumber,
    receiptCode: generated.receiptCode,
    quotationId,
    quotationNumber: quotationId,
    projectName: text(quote.project || project.projectTitle || 'Proyecto ELANVISUAL'),
    customerName: text(quote.client?.name || quote.client_name || portal.customer?.name),
    companyName: text(quote.client?.company || quote.client_name || portal.customer?.name),
    executiveName: 'ELANVISUAL',
    paymentType: 'deposit',
    paymentMethod: text(body.paymentMethod || 'transfer'),
    bankName: text(body.bankName),
    paymentReference: text(body.reference),
    paidAt,
    originalCurrency,
    originalAmount,
    exchangeRate,
    amountUsd,
    quotationTotalUsd: totalUsd,
    priorPaidUsd,
    totalPaidUsd,
    pendingBalanceUsd,
    notes: text(body.notes),
    status: 'paid',
    viewUrl: `/r/${portalToken}/${generated.receiptCode}/`,
    createdAt: new Date().toISOString(),
    source: 'elan_one_vercel_runtime_cache_lab'
  };

  const meta = publicReceiptMeta(receipt);
  const quoteReceipts = Array.isArray(quote.receipts) ? quote.receipts : [];
  const updatedQuote = {
    ...quote,
    receipts: [...quoteReceipts, meta],
    paid_total_usd: totalPaidUsd,
    balance_usd: pendingBalanceUsd,
    advance_confirmed: true
  };
  const updatedPortal = {
    ...portal,
    counts: {
      ...(portal.counts || {}),
      receipts: existingReceipts.length + 1
    },
    receipts: [...existingReceipts, meta],
    projects: projects.map((item) =>
      text(item?.quotationId || item?.quotationNumber) === quotationId
        ? {
            ...item,
            paidUsd: totalPaidUsd,
            balanceUsd: pendingBalanceUsd,
            receipts: [
              ...(Array.isArray(item.receipts) ? item.receipts : []),
              meta
            ]
          }
        : item
    )
  };

  await Promise.all([
    cache.set(generated.key, receipt, {
      ttl: TTL_SECONDS,
      tags: [`elan-one-receipt-${generated.receiptCode}`]
    }),
    cache.set(quoteKey, updatedQuote, {
      ttl: TTL_SECONDS,
      tags: [`elan-one-quote-${quotationId}`]
    }),
    cache.set(portalKey, updatedPortal, {
      ttl: TTL_SECONDS,
      tags: [`elan-one-portal-${portalToken}`]
    })
  ]);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(201).json({
    data: receipt,
    source: 'elan_one_vercel_runtime_cache_lab'
  });
}
