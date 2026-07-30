const DEFAULT_PAYMENT_PRESETS = Object.freeze({
  cash: [{ label: 'Pago total', percentage: 100, dueCondition: 'Al aprobar la cotización' }],
  '60_40': [
    { label: 'Anticipo', percentage: 60, dueCondition: 'Al aprobar la cotización' },
    { label: 'Contra entrega', percentage: 40, dueCondition: 'Al finalizar el proyecto' }
  ],
  '60_20_20': [
    { label: 'Anticipo', percentage: 60, dueCondition: 'Al aprobar la cotización' },
    { label: 'Avance', percentage: 20, dueCondition: 'Durante producción' },
    { label: 'Contra entrega', percentage: 20, dueCondition: 'Al finalizar el proyecto' }
  ]
});

function asText(value) {
  return String(value ?? '').trim();
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function slugify(value) {
  return asText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function uniqueHttpUrls(values = []) {
  const seen = new Set();
  return values
    .map(asText)
    .filter((value) => {
      if (!/^https?:\/\//i.test(value) || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function resolveBranchImages(branch = {}) {
  return uniqueHttpUrls([
    branch.imageUrl,
    branch.imagen_url,
    ...(Array.isArray(branch.images) ? branch.images : []),
    ...(Array.isArray(branch.imagenes) ? branch.imagenes : [])
  ]);
}

function normalizeModule(module, branchName, index) {
  const code = asText(module?.codigo || module?.code);
  const title = asText(module?.partida || module?.title);
  const description = asText(module?.descripcion || module?.description);
  const unitPriceUsd = asNumber(module?.precio_comercial_usd ?? module?.unitPriceUsd);
  const errors = [];

  if (!code) errors.push(`Sucursal ${branchName}: el ítem ${index + 1} no tiene código.`);
  if (!title) errors.push(`Sucursal ${branchName}: el ítem ${code || index + 1} no tiene partida.`);
  if (!description) errors.push(`Sucursal ${branchName}: el ítem ${code || index + 1} no tiene descripción.`);
  if (!Number.isFinite(unitPriceUsd) || unitPriceUsd < 0) {
    errors.push(`Sucursal ${branchName}: el ítem ${code || index + 1} no tiene un precio USD válido.`);
  }

  return {
    errors,
    item: {
      code,
      title,
      description,
      type: asText(module?.tipo || module?.type || 'Autónoma'),
      quantity: 1,
      unit: 'partida',
      unitPriceUsd: roundMoney(unitPriceUsd),
      imageUrl: uniqueHttpUrls([module?.imageUrl, module?.imagen_url])[0] || ''
    }
  };
}

export function parseBulkQuotationPayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('El expediente debe ser un objeto JSON.');
  }

  const branches = Array.isArray(payload.sucursales) ? payload.sucursales : [];
  if (!branches.length) throw new Error('El expediente no contiene sucursales.');

  const currency = asText(payload.moneda_cliente || payload.currency || 'USD').toUpperCase();
  if (currency !== 'USD') {
    throw new Error(`La carga masiva solo acepta precios comerciales en USD. Moneda recibida: ${currency || 'sin definir'}.`);
  }

  const exchangeRate = asNumber(payload.tipo_cambio_referencia ?? payload.exchangeRate ?? options.exchangeRate);
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error('El expediente no contiene un tipo de cambio válido.');
  }

  const companyName = asText(options.companyName || payload.empresa || payload.companyName || 'COMEX');
  const sourceDate = asText(payload.fecha || payload.date || new Date().toISOString().slice(0, 10));
  const batchId = asText(options.batchId || `${slugify(companyName)}-${sourceDate}-${branches.length}`);
  const errors = [];
  const seenBranches = new Set();
  const quotations = branches.map((branch, branchIndex) => {
    const branchName = asText(branch?.nombre || branch?.name);
    if (!branchName) errors.push(`La sucursal ${branchIndex + 1} no tiene nombre.`);
    const normalizedBranch = branchName.toLocaleLowerCase('es');
    if (seenBranches.has(normalizedBranch)) errors.push(`La sucursal ${branchName} está duplicada.`);
    seenBranches.add(normalizedBranch);

    const modules = Array.isArray(branch?.modulos) ? branch.modulos : [];
    if (!modules.length) errors.push(`La sucursal ${branchName || branchIndex + 1} no contiene ítems.`);
    const seenCodes = new Set();
    const items = modules.map((module, moduleIndex) => {
      const normalized = normalizeModule(module, branchName || branchIndex + 1, moduleIndex);
      errors.push(...normalized.errors);
      const normalizedCode = normalized.item.code.toLocaleUpperCase('es');
      if (normalized.item.code && seenCodes.has(normalizedCode)) {
        errors.push(`Sucursal ${branchName}: el código ${normalized.item.code} está duplicado.`);
      }
      seenCodes.add(normalizedCode);
      return normalized.item;
    });
    const totalUsd = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unitPriceUsd, 0));

    return {
      key: `${batchId}-${slugify(branchName || branchIndex + 1)}`,
      branchName,
      customerName: asText(branch?.cliente || `${companyName} - ${branchName}`),
      companyName,
      address: asText(branch?.direccion || branch?.address || branchName),
      projectTitle: asText(branch?.proyecto || `Renovación de imagen corporativa ${companyName} - ${branchName}`),
      images: resolveBranchImages(branch),
      items,
      totalUsd
    };
  });

  const calculatedTotalUsd = roundMoney(quotations.reduce((sum, quotation) => sum + quotation.totalUsd, 0));
  const declaredTotalUsd = asNumber(payload.total_general_usd ?? payload.totalUsd);
  if (Number.isFinite(declaredTotalUsd) && Math.abs(roundMoney(declaredTotalUsd) - calculatedTotalUsd) > 0.01) {
    errors.push(`El total declarado (USD ${roundMoney(declaredTotalUsd).toFixed(2)}) no coincide con la suma de los ítems (USD ${calculatedTotalUsd.toFixed(2)}).`);
  }

  if (errors.length) {
    const error = new Error('El expediente contiene datos inválidos.');
    error.details = errors;
    throw error;
  }

  return {
    batchId,
    sourceDate,
    currency,
    exchangeRate,
    companyName,
    taxRate: Number(payload?.tratamiento_fiscal?.iva_trasladado_cliente || 0),
    quotations,
    totalUsd: calculatedTotalUsd
  };
}

function resolvePaymentPreset(paymentType, customInstallments) {
  if (paymentType === 'custom') return Array.isArray(customInstallments) ? customInstallments : [];
  return DEFAULT_PAYMENT_PRESETS[paymentType] || DEFAULT_PAYMENT_PRESETS['60_40'];
}

export function buildBulkIntakeContract(quotation, batch, options = {}) {
  const exchangeRate = asNumber(options.exchangeRate ?? batch.exchangeRate);
  const paymentType = asText(options.paymentType || '60_40');
  const totalUsd = roundMoney(quotation.totalUsd);
  const payableTotalNio = roundMoney(totalUsd * exchangeRate);
  const sourceInstallments = resolvePaymentPreset(paymentType, options.customInstallments);
  const installments = sourceInstallments.map((entry) => {
    const percentage = asNumber(entry.percentage);
    return {
      label: asText(entry.label),
      percentage,
      amountUsd: roundMoney(totalUsd * (percentage / 100)),
      amountNio: roundMoney(payableTotalNio * (percentage / 100)),
      dueCondition: asText(entry.dueCondition)
    };
  });
  const percentageTotal = installments.reduce((sum, entry) => sum + entry.percentage, 0);
  if (Math.abs(percentageTotal - 100) > 0.001) {
    throw new Error(`La forma de pago de ${quotation.branchName} suma ${percentageTotal}% y debe sumar 100%.`);
  }

  const items = quotation.items.map((item) => ({
    itemId: `${quotation.key}-${item.code}`,
    productId: '',
    designId: '',
    title: `${item.code} · ${item.title}`,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPriceUsd: item.unitPriceUsd,
    subtotalUsd: roundMoney(item.quantity * item.unitPriceUsd),
    imageUrl: item.imageUrl,
    images: item.imageUrl ? [item.imageUrl] : [],
    features: [item.type, `Módulo ${item.code}`],
    internalData: null
  }));

  return {
    contractVersion: '1.0.0',
    platform: 'ELANVISUAL',
    source: {
      type: 'bulk-tender-import',
      sourceId: batch.batchId,
      designRequestId: '',
      storeProductId: '',
      storeCartId: '',
      designMode: 'optional'
    },
    customer: {
      customerId: `ELANVISUAL-${quotation.key}`,
      name: quotation.customerName,
      companyName: quotation.companyName,
      phone: asText(options.phone),
      email: asText(options.email),
      address: quotation.address,
      taxId: asText(options.taxId)
    },
    executive: options.executive || {},
    project: {
      title: quotation.projectTitle,
      priority: 'normal',
      expectedDeliveryAt: '',
      images: quotation.images
    },
    items,
    pricing: {
      currency: 'USD',
      settlementCurrency: 'NIO',
      discountUsd: 0,
      taxRate: batch.taxRate,
      taxUsd: 0,
      totalUsd,
      exchangeRate,
      exchangeRateDate: new Date().toISOString().slice(0, 10),
      payableTotalNio
    },
    payments: { type: paymentType, installments },
    metadata: {
      sourceScreen: 'CotizadorUniversal',
      contextGateway: 'orchestrator',
      emcStatus: 'interfaces_only',
      bulkImportId: batch.batchId,
      bulkQuotationKey: quotation.key,
      branchName: quotation.branchName,
      sourceDate: batch.sourceDate,
      sourceAssets: []
    }
  };
}
