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

function isApproved(value) {
  return ['approved', 'accepted', 'aprobada', 'aprobado'].includes(
    text(value).toLowerCase()
  );
}

function publicItem(item = {}) {
  const qty = number(item.qty ?? item.quantity ?? 0);
  const unitPrice = number(item.unit_price ?? item.unitPrice ?? 0);
  return {
    description: text(item.description || item.title || 'Producto o servicio'),
    specification: text(item.specification || item.especificacion || ''),
    qty,
    unit: text(item.unit || item.unidad || 'unidad'),
    unit_price: unitPrice,
    total: number(item.total ?? qty * unitPrice)
  };
}

function publicPayment(quote = {}) {
  const plan = text(quote.payment_plan || '60_40');
  const isKnownPlan = plan === '60_40' || plan === '60_20_20';
  const depositPercent = isKnownPlan ? 60 : number(quote.deposit_percent || 60);
  const secondPercent = plan === '60_20_20'
    ? 20
    : plan === '60_40'
      ? 0
      : number(quote.second_payment_percent);
  const balancePercent = plan === '60_20_20'
    ? 20
    : plan === '60_40'
      ? 40
      : number(quote.balance_percent || Math.max(0, 100 - depositPercent - secondPercent));

  return {
    plan,
    deposit: `${depositPercent}% del total de la cotización.`,
    second: secondPercent > 0 ? `${secondPercent}% durante el proceso.` : '',
    balance: `${balancePercent}% contraentrega.`,
    note: text(quote.payment_note)
  };
}

function publicQuote(quote = {}, client = {}) {
  return {
    id: text(quote.id),
    client_name: text(quote.client_name || client.name),
    client: {
      name: text(quote.client?.name || client.name),
      company: text(quote.client?.company || client.name),
      tax_id: text(quote.client?.tax_id || client.ruc),
      contact: text(quote.client?.contact || client.contact),
      phone: text(quote.client?.phone || client.phone),
      email: text(quote.client?.email || client.email),
      address: text(quote.client?.address || client.address)
    },
    project: text(quote.project),
    date: text(quote.date),
    valid_until: text(quote.valid_until),
    status: text(quote.status || 'draft'),
    reference: text(quote.reference),
    currency: 'USD',
    items: Array.isArray(quote.items) ? quote.items.map(publicItem) : [],
    payment: publicPayment(quote),
    subtotal: number(quote.subtotal),
    tax: number(quote.tax),
    withholding: number(quote.withholding),
    total: number(quote.total),
    exchange_rate: quote.exchange_rate == null || quote.exchange_rate === '' ? null : number(quote.exchange_rate),
    total_nio: quote.total_nio == null || quote.total_nio === '' ? null : number(quote.total_nio),
    published_at: new Date().toISOString(),
    source: 'elan_one_vercel_runtime_cache_lab'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const portalToken = text(body.portalToken);
  const client = body.client && typeof body.client === 'object' ? body.client : {};
  const quotes = Array.isArray(body.quotes) ? body.quotes : [];

  if (!TOKEN_RE.test(portalToken)) {
    return res.status(400).json({ error: 'Token de portal inválido.' });
  }
  if (!text(client.name)) {
    return res.status(400).json({ error: 'Cliente inválido.' });
  }
  if (!quotes.length || quotes.length > 100) {
    return res.status(400).json({ error: 'No hay cotizaciones válidas para publicar.' });
  }

  const normalizedQuotes = quotes
    .filter((quote) => QUOTE_RE.test(text(quote?.id)))
    .map((quote) => ({ raw: quote, public: publicQuote(quote, client) }));

  if (!normalizedQuotes.length) {
    return res.status(400).json({ error: 'No se encontró una cotización publicable.' });
  }

  const cache = getCache();
  const portalKey = `elan-one-public:portal:${portalToken}`;
  const existingPortal = await cache.get(portalKey);
  const existingQuotes = await Promise.all(
    normalizedQuotes.map(({ public: quote }) =>
      cache.get(`elan-one-public:quote:${quote.id}`)
    )
  );

  const mergedQuotes = normalizedQuotes.map((entry, index) => {
    const previous = existingQuotes[index] || {};
    return {
      raw: entry.raw,
      public: {
        ...entry.public,
        status: isApproved(previous.status) ? 'approved' : entry.public.status,
        ...(previous.approval ? { approval: previous.approval } : {}),
        ...(Array.isArray(previous.receipts) ? { receipts: previous.receipts } : {}),
        ...(previous.paid_total_usd != null ? { paid_total_usd: previous.paid_total_usd } : {}),
        ...(previous.balance_usd != null ? { balance_usd: previous.balance_usd } : {}),
        ...(previous.advance_confirmed ? { advance_confirmed: true } : {})
      }
    };
  });

  await Promise.all(mergedQuotes.map(({ public: quote }) =>
    cache.set(`elan-one-public:quote:${quote.id}`, quote, {
      ttl: TTL_SECONDS,
      tags: [`elan-one-quote-${quote.id}`]
    })
  ));

  const previousProjects = Array.isArray(existingPortal?.projects)
    ? existingPortal.projects
    : [];
  const projects = mergedQuotes.map(({ raw, public: quote }) => {
    const previous = previousProjects.find(
      (item) => text(item?.quotationId || item?.quotationNumber) === quote.id
    ) || {};
    return {
      projectId: text(raw.reference || raw.id),
      projectNumber: text(raw.reference),
      projectTitle: text(raw.project || 'Proyecto ELANVISUAL'),
      quotationId: quote.id,
      quotationNumber: quote.id,
      issuedAt: text(raw.date || raw.created_at),
      totalUsd: number(raw.total),
      status: isApproved(previous.status) || isApproved(quote.status)
        ? 'approved'
        : text(raw.status || 'draft'),
      viewUrl: `/cotizacion/${encodeURIComponent(quote.id)}/`,
      ...(previous.approvedAt ? { approvedAt: previous.approvedAt } : {}),
      ...(previous.paidUsd != null ? { paidUsd: previous.paidUsd } : {}),
      ...(previous.balanceUsd != null ? { balanceUsd: previous.balanceUsd } : {}),
      ...(Array.isArray(previous.receipts) ? { receipts: previous.receipts } : {})
    };
  });

  const existingReceipts = Array.isArray(existingPortal?.receipts)
    ? existingPortal.receipts
    : [];
  const portal = {
    customer: {
      id: text(client.id),
      name: text(client.name),
      email: text(client.email),
      phone: text(client.phone || client.whatsapp)
    },
    counts: {
      quotations: projects.length,
      receipts: existingReceipts.length
    },
    projects,
    receipts: existingReceipts,
    publishedAt: new Date().toISOString(),
    source: 'elan_one_vercel_runtime_cache_lab'
  };

  await cache.set(portalKey, portal, {
    ttl: TTL_SECONDS,
    tags: [`elan-one-portal-${portalToken}`]
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    data: {
      portalUrl: `/c/${portalToken}/`,
      quotations: projects.map((project) => ({
        id: project.quotationId,
        url: project.viewUrl
      })),
      expiresInSeconds: TTL_SECONDS
    }
  });
}
