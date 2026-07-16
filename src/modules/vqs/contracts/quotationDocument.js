export const VQS_SCHEMA_VERSION = '1.3.0';

function normalizePaymentTerms(paymentTerms = {}, totalUsd = 0, payableTotalNio = 0) {
  const type = paymentTerms.type || '60_40';
  const sourceInstallments = Array.isArray(paymentTerms.installments) ? paymentTerms.installments : [];
  const defaults = {
    cash: [{ label: 'Pago total', percentage: 100 }],
    '60_40': [
      { label: 'Anticipo', percentage: 60 },
      { label: 'Contra entrega', percentage: 40 }
    ],
    '60_20_20': [
      { label: 'Anticipo', percentage: 60 },
      { label: 'Avance de producción', percentage: 20 },
      { label: 'Contra entrega', percentage: 20 }
    ]
  };
  const installments = sourceInstallments.length > 0 ? sourceInstallments : (defaults[type] || []);

  return {
    type,
    label: paymentTerms.label || '',
    installments: installments.map((installment, index) => {
      const percentage = Number(installment.percentage || 0);
      return {
        id: installment.id || `installment-${index + 1}`,
        label: installment.label || `Pago ${index + 1}`,
        percentage,
        amountUsd: Number(installment.amountUsd ?? installment.amount ?? (totalUsd * percentage) / 100),
        amountNio: Number(installment.amountNio ?? (payableTotalNio * percentage) / 100),
        dueCondition: installment.dueCondition || ''
      };
    })
  };
}

export function createQuotationDocument(input = {}) {
  const items = Array.isArray(input.items) ? input.items : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const discount = Number(input.totals?.discount || 0);
  const tax = Number(input.totals?.tax || 0);
  const totalUsd = Number(input.totals?.total ?? subtotal - discount + tax);
  const exchangeRate = Number(input.totals?.exchangeRate || 0);
  const payableTotalNio = Number(
    input.totals?.payableTotalNio ?? input.totals?.convertedTotal ?? (exchangeRate > 0 ? totalUsd * exchangeRate : 0)
  );

  return {
    schemaVersion: VQS_SCHEMA_VERSION,
    documentType: 'quotation',
    platformId: input.platformId || 'ELANVISUAL',
    quotationNumber: input.quotationNumber || 'COT-PENDIENTE',
    status: input.status || 'draft',
    currency: 'USD',
    settlementCurrency: input.settlementCurrency || 'NIO',
    issuedAt: input.issuedAt || new Date().toISOString().slice(0, 10),
    validUntil: input.validUntil || '',
    customer: {
      id: input.customer?.id || '',
      name: input.customer?.name || 'Cliente',
      companyName: input.customer?.companyName || '',
      taxId: input.customer?.taxId || '',
      phone: input.customer?.phone || '',
      email: input.customer?.email || '',
      address: input.customer?.address || ''
    },
    executive: {
      executiveId: input.executive?.executiveId || input.advisor?.id || '',
      name: input.executive?.name || input.advisor?.name || '',
      role: input.executive?.role || 'Ejecutivo Comercial',
      phone: input.executive?.phone || input.advisor?.phone || '',
      email: input.executive?.email || '',
      photoUrl: input.executive?.photoUrl || '',
      commissionEligible: Boolean(input.executive?.commissionEligible),
      registryVersion: input.executive?.registryVersion || ''
    },
    advisor: {
      name: input.executive?.name || input.advisor?.name || '',
      phone: input.executive?.phone || input.advisor?.phone || ''
    },
    project: {
      title: input.project?.title || 'Proyecto visual',
      summary: input.project?.summary || '',
      category: input.project?.category || '',
      location: input.project?.location || '',
      estimatedDelivery: input.project?.estimatedDelivery || '',
      warranty: input.project?.warranty || '',
      heroImage: input.project?.heroImage || null
    },
    items: items.map((item, index) => ({
      id: item.id || `item-${index + 1}`,
      title: item.title || `Ítem ${index + 1}`,
      commercialDescription: item.commercialDescription || '',
      quantity: Number(item.quantity || 1),
      unit: item.unit || 'unidad',
      unitPrice: Number(item.unitPrice || 0),
      discount: Number(item.discount || 0),
      tax: Number(item.tax || 0),
      subtotal: Number(item.subtotal || 0),
      currency: 'USD',
      dimensions: item.dimensions || null,
      features: Array.isArray(item.features) ? item.features : [],
      images: Array.isArray(item.images) ? item.images : [],
      publicNotes: Array.isArray(item.publicNotes) ? item.publicNotes : []
    })),
    totals: {
      subtotalGross: Number(input.totals?.subtotalGross ?? subtotal),
      discount,
      subtotal: Number(input.totals?.subtotal ?? subtotal - discount),
      taxRate: Number(input.totals?.taxRate || 0),
      tax,
      total: totalUsd,
      currency: 'USD',
      exchangeRate,
      exchangeRateDate: input.totals?.exchangeRateDate || input.issuedAt || new Date().toISOString().slice(0, 10),
      settlementCurrency: input.totals?.settlementCurrency || input.settlementCurrency || 'NIO',
      payableTotalNio,
      convertedTotal: payableTotalNio
    },
    paymentTerms: normalizePaymentTerms(input.paymentTerms, totalUsd, payableTotalNio),
    paymentAccountsSnapshot: Array.isArray(input.paymentAccountsSnapshot) ? input.paymentAccountsSnapshot : [],
    publicNotes: Array.isArray(input.publicNotes) ? input.publicNotes : [],
    digitalLinks: input.digitalLinks || {},
    template: {
      templateId: input.template?.templateId || 'ELANKAV-QUOTATION',
      templateVersion: input.template?.templateVersion || '1.0.0',
      brandVersion: input.template?.brandVersion || '1.0.0',
      layoutMode: input.template?.layoutMode || 'automatic'
    }
  };
}

export function validateQuotationDocument(document) {
  const errors = [];
  if (!document?.platformId) errors.push('platformId es obligatorio');
  if (!document?.quotationNumber) errors.push('quotationNumber es obligatorio');
  if (!document?.customer?.name) errors.push('customer.name es obligatorio');
  if (!Array.isArray(document?.items) || document.items.length === 0) errors.push('Debe existir al menos un ítem');
  if (document?.currency !== 'USD') errors.push('La moneda comercial debe ser USD');
  if (document?.settlementCurrency !== 'NIO') errors.push('La moneda de pago debe ser NIO');
  if (!Number.isFinite(Number(document?.totals?.total))) errors.push('totals.total debe ser numérico');
  if (!(Number(document?.totals?.exchangeRate) > 0)) errors.push('totals.exchangeRate debe ser mayor que cero');
  if (!(Number(document?.totals?.payableTotalNio) >= 0)) errors.push('totals.payableTotalNio debe ser numérico');
  if (!document?.executive?.executiveId) errors.push('executive.executiveId es obligatorio');
  if (!document?.executive?.name) errors.push('executive.name es obligatorio');

  const installments = document?.paymentTerms?.installments || [];
  if (installments.length === 0) errors.push('Debe existir al menos una cuota de pago');
  const percentageTotal = installments.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
  if (Math.abs(percentageTotal - 100) > 0.001) errors.push('Las cuotas de pago deben sumar 100%');

  return { ok: errors.length === 0, errors };
}
