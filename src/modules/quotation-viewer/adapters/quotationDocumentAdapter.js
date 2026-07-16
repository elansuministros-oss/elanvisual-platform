const hasValue = (value) => value !== undefined && value !== null && value !== '';

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

function valueAt(source, path) {
  if (!isObject(source)) return undefined;
  return path.split('.').reduce((current, key) => {
    if (!isObject(current) && !Array.isArray(current)) return undefined;
    return current?.[key];
  }, source);
}

function firstValue(source, paths) {
  for (const path of paths) {
    const value = valueAt(source, path);
    if (hasValue(value)) return value;
  }
  return undefined;
}

function firstText(source, paths) {
  const value = firstValue(source, paths);
  if (!hasValue(value)) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function firstPublicAmount(source, paths) {
  const value = firstValue(source, paths);
  if (!hasValue(value)) return null;
  return value;
}

function firstArray(source, paths) {
  for (const path of paths) {
    const value = valueAt(source, path);
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim();
        if (isObject(entry)) return String(entry.text || entry.note || entry.label || entry.description || '').trim();
        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeImage(entry, fallbackAlt = '') {
  if (!hasValue(entry)) return null;

  if (typeof entry === 'string') {
    const url = entry.trim();
    return url ? { url, alt: fallbackAlt } : null;
  }

  if (!isObject(entry)) return null;

  const url = String(
    entry.url ||
    entry.src ||
    entry.href ||
    entry.imageUrl ||
    entry.image_url ||
    entry.publicUrl ||
    entry.public_url ||
    entry.downloadUrl ||
    entry.download_url ||
    entry.dataUrl ||
    ''
  ).trim();

  if (!url) return null;

  return {
    url,
    alt: String(entry.alt || entry.title || entry.name || fallbackAlt || '').trim()
  };
}

function normalizeImages(source, paths, fallbackAlt = '') {
  const entries = [];

  for (const path of paths) {
    const value = valueAt(source, path);
    if (Array.isArray(value)) entries.push(...value);
    else if (hasValue(value)) entries.push(value);
  }

  const seen = new Set();
  return entries
    .map((entry) => normalizeImage(entry, fallbackAlt))
    .filter((image) => {
      if (!image?.url || seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    });
}

function normalizeDimensions(value) {
  if (!hasValue(value)) return null;
  if (typeof value === 'string') return value.trim();
  if (!isObject(value)) return null;

  return {
    width: value.width ?? value.ancho ?? value.w ?? '',
    height: value.height ?? value.alto ?? value.h ?? '',
    depth: value.depth ?? value.profundidad ?? value.fondo ?? '',
    unit: value.unit || value.unidad || ''
  };
}

function normalizeItems(source) {
  const sourceItems = firstArray(source, [
    'items',
    'productos',
    'products',
    'lineItems',
    'line_items',
    'quotation.items',
    'quote.items',
    'contract.items',
    'document.items',
    'data.items'
  ]);

  return sourceItems.map((item, index) => {
    const title = firstText(item, ['title', 'name', 'nombre', 'producto', 'productName', 'product_name']);
    const imageAlt = title || `Item ${index + 1}`;

    return {
      id: firstText(item, ['id', 'itemId', 'item_id', 'productId', 'product_id', 'designId', 'design_id']) || `item-${index + 1}`,
      title,
      commercialDescription: firstText(item, [
        'commercialDescription',
        'commercial_description',
        'description',
        'descripcion',
        'descripcionComercial',
        'descripcion_comercial'
      ]),
      dimensions: normalizeDimensions(firstValue(item, ['dimensions', 'dimensiones', 'medidas', 'measurement', 'measurements'])),
      quantity: firstPublicAmount(item, ['quantity', 'cantidad', 'qty']),
      unit: firstText(item, ['unit', 'unidad', 'uom']),
      subtotal: firstPublicAmount(item, ['subtotalUsd', 'subtotal_usd', 'subtotal', 'totalUsd', 'total_usd']),
      discount: firstPublicAmount(item, ['discountUsd', 'discount_usd', 'discount', 'descuento']),
      tax: firstPublicAmount(item, ['taxUsd', 'tax_usd', 'tax', 'iva']),
      images: normalizeImages(item, ['images', 'imagenes', 'renders', 'imageUrl', 'image_url', 'imagen'], imageAlt),
      publicNotes: normalizeTextList(firstValue(item, ['publicNotes', 'public_notes', 'notasPublicas', 'notas_publicas']))
    };
  });
}

function normalizeInstallments(paymentSource = {}) {
  const sourceInstallments = firstArray(paymentSource, ['installments', 'cuotas', 'schedule', 'paymentSchedule', 'payment_schedule']);

  return sourceInstallments.map((entry, index) => ({
    id: firstText(entry, ['id', 'installmentId', 'installment_id']) || `payment-${index + 1}`,
    label: firstText(entry, ['label', 'name', 'nombre', 'concept', 'concepto']),
    percentage: firstPublicAmount(entry, ['percentage', 'percent', 'porcentaje']),
    amountUsd: firstPublicAmount(entry, ['amountUsd', 'amount_usd', 'amount', 'montoUsd', 'monto_usd']),
    amountNio: firstPublicAmount(entry, ['amountNio', 'amount_nio', 'montoNio', 'monto_nio', 'montoCordobas']),
    dueCondition: firstText(entry, ['dueCondition', 'due_condition', 'condition', 'condicion'])
  }));
}

function normalizePayment(source) {
  const paymentSource = firstValue(source, [
    'paymentTerms',
    'payment_terms',
    'payments',
    'payment',
    'contract.paymentTerms',
    'contract.payment_terms',
    'contract.payments',
    'contract.payment',
    'formaPago',
    'forma_pago'
  ]) || {};

  return {
    label: firstText(paymentSource, ['label', 'name', 'nombre', 'type', 'tipo']),
    type: firstText(paymentSource, ['type', 'tipo']),
    installments: normalizeInstallments(paymentSource),
    advance: {
      label: firstText(paymentSource, ['advance.label', 'anticipo.label']),
      amountUsd: firstPublicAmount(paymentSource, ['advance.amountUsd', 'advance.amount_usd', 'anticipo.amountUsd', 'anticipoUsd']),
      amountNio: firstPublicAmount(paymentSource, ['advance.amountNio', 'advance.amount_nio', 'anticipo.amountNio', 'anticipoNio']),
      percentage: firstPublicAmount(paymentSource, ['advance.percentage', 'advance.percent', 'anticipo.percentage', 'anticipoPorcentaje'])
    }
  };
}

function normalizeAccounts(source) {
  const sourceAccounts = firstArray(source, [
    'paymentAccountsSnapshot',
    'payment_accounts_snapshot',
    'authorizedAccounts',
      'authorized_accounts',
      'cuentasAutorizadas',
      'cuentas_autorizadas',
      'payment.accounts',
      'payments.accounts',
      'contract.payment.accounts',
      'contract.payments.accounts'
  ]);

  return sourceAccounts.map((account, index) => {
    if (typeof account === 'string') {
      return { id: `account-${index + 1}`, label: account.trim(), bankName: '', currency: '', accountNumber: '' };
    }

    return {
      id: firstText(account, ['id', 'accountId', 'account_id']) || `account-${index + 1}`,
      label: firstText(account, ['label', 'name', 'nombre']),
      bankName: firstText(account, ['bankName', 'bank_name', 'bank', 'banco']),
      currency: firstText(account, ['currency', 'moneda']),
      accountNumber: firstText(account, ['accountNumber', 'account_number', 'number', 'numero', 'cuenta'])
    };
  }).filter((account) => account.label || account.bankName || account.accountNumber);
}

export function normalizeQuotationRecord(source = {}) {
  const items = normalizeItems(source);
  const quotationNumber = firstText(source, [
    'quotationNumber',
    'quotation_number',
    'quote.quotationNumber',
    'quote.quotation_number',
    'quotation.quotationNumber',
    'quotation.quotation_number',
    'contract.quotationNumber',
    'contract.quotation_number',
    'data.quotation_number',
    'data.quotationNumber',
    'codigo',
    'numero',
    'number'
  ]);
  const projectTitle = firstText(source, [
    'project.title',
    'project.name',
    'project_name',
    'project.title',
    'contract.project.title',
    'biblioteca_nombre',
    'title',
    'nombre'
  ]);

  return {
    id: firstText(source, [
      'id',
      'projectId',
      'project_id',
      'vqsProjectId',
      'vqs_project_id',
      'project.id',
      'data.id'
    ]) || quotationNumber,
    quotationNumber,
    status: firstText(source, ['status', 'estado', 'stage', 'project.status', 'project.stage', 'data.status']),
    date: firstText(source, ['issuedAt', 'issued_at', 'createdAt', 'created_at', 'fecha', 'date', 'contract.issuedAt']),
    validUntil: firstText(source, ['validUntil', 'valid_until', 'vigenciaHasta', 'vigencia_hasta', 'expiresAt', 'expires_at', 'vigencia']),
    customer: {
      name: firstText(source, [
        'customer.name',
        'customer.fullName',
        'customer.nombre',
        'client.name',
        'cliente.nombre',
        'cliente_nombre',
        'clientName',
        'contract.customer.name'
      ]),
      companyName: firstText(source, [
        'customer.companyName',
        'customer.company_name',
        'customer.company',
        'client.companyName',
        'cliente.empresa',
        'empresa',
        'empresa_nombre',
        'companyName',
        'company_name',
        'contract.customer.companyName'
      ]),
      phone: firstText(source, [
        'customer.phone',
        'customer.whatsapp',
        'customer.telefono',
        'customer.celular',
        'client.phone',
        'cliente.telefono',
        'cliente.celular',
        'telefono',
        'celular',
        'phone',
        'whatsapp',
        'contract.customer.phone'
      ]),
      email: firstText(source, ['customer.email', 'customer.correo', 'client.email', 'cliente.email', 'correo', 'email', 'contract.customer.email']),
      address: firstText(source, [
        'customer.address',
        'customer.direccion',
        'client.address',
        'cliente.direccion',
        'direccion',
        'ubicacion',
        'location',
        'contract.customer.address'
      ]),
      taxId: firstText(source, ['customer.taxId', 'customer.tax_id', 'customer.ruc', 'rucCliente', 'ruc_cliente'])
    },
    project: {
      title: projectTitle,
      summary: firstText(source, [
        'project.summary',
        'project.description',
        'project.descripcion',
        'contract.project.summary',
        'description',
        'descripcion'
      ]),
      category: firstText(source, ['project.category', 'project.categoria', 'categoria', 'category']),
      location: firstText(source, ['project.location', 'project.ubicacion', 'contract.project.location', 'ubicacion', 'location']),
      estimatedDelivery: firstText(source, [
        'project.estimatedDelivery',
        'project.estimated_delivery',
        'project.expectedDeliveryAt',
        'contract.project.expectedDeliveryAt',
        'tiempoEntrega',
        'tiempo_entrega'
      ]),
      warranty: firstText(source, ['project.warranty', 'project.garantia', 'garantia', 'warranty'])
    },
    projectMedia: normalizeImages(source, [
      'project.heroImage',
      'project.hero_image',
      'project.images',
      'project.renders',
      'contract.project.images',
      'heroImage',
      'hero_image',
      'imagenPrincipal',
      'imagen_principal',
      'images',
      'imagenes',
      'renders'
    ], projectTitle || quotationNumber),
    items,
    totals: {
      subtotal: firstPublicAmount(source, ['totals.subtotal', 'totals.subtotalUsd', 'pricing.subtotalUsd', 'contract.pricing.subtotalUsd', 'subtotalUsd', 'subtotal']),
      discount: firstPublicAmount(source, ['totals.discount', 'totals.discountUsd', 'pricing.discountUsd', 'contract.pricing.discountUsd', 'descuento', 'discountUsd']),
      taxRate: firstPublicAmount(source, ['totals.taxRate', 'totals.tax_rate', 'pricing.taxRate', 'contract.pricing.taxRate', 'porcentajeIva', 'porcentaje_iva']),
      tax: firstPublicAmount(source, ['totals.tax', 'totals.taxUsd', 'pricing.taxUsd', 'contract.pricing.taxUsd', 'iva', 'taxUsd']),
      totalUsd: firstPublicAmount(source, ['totals.totalUsd', 'totals.total', 'pricing.totalUsd', 'contract.pricing.totalUsd', 'totalUsd', 'total_usd', 'total', 'precio_b', 'totalCliente']),
      nioReference: firstPublicAmount(source, [
        'totals.payableTotalNio',
        'totals.convertedTotal',
        'pricing.payableTotalNio',
        'contract.pricing.payableTotalNio',
        'payableTotalNio',
        'totalNio',
        'total_nio',
        'totalCordobas',
        'referenciaCordobas'
      ]),
      exchangeRate: firstPublicAmount(source, ['totals.exchangeRate', 'pricing.exchangeRate', 'contract.pricing.exchangeRate', 'exchangeRate', 'tipoCambio']),
      exchangeRateDate: firstText(source, ['totals.exchangeRateDate', 'pricing.exchangeRateDate', 'contract.pricing.exchangeRateDate', 'exchangeRateDate', 'tipoCambioFecha'])
    },
    payment: normalizePayment(source),
    paymentAccounts: normalizeAccounts(source),
    publicNotes: normalizeTextList(firstValue(source, [
      'publicNotes',
      'public_notes',
      'notasPublicas',
      'notas_publicas',
      'notes',
      'notas',
      'terms',
      'condiciones'
    ])),
    executive: {
      name: firstText(source, [
        'executive.name',
        'advisor.name',
        'asesorNombre',
        'asesor_nombre',
        'vendedor',
        'ejecutivo',
        'ejecutivoComercial',
        'commercialExecutive',
        'contract.executive.name'
      ]),
      role: firstText(source, ['executive.role', 'advisor.role', 'cargoEjecutivo', 'contract.executive.role']),
      phone: firstText(source, ['executive.phone', 'advisor.phone', 'asesorTelefono', 'asesor_telefono', 'contract.executive.phone']),
      email: firstText(source, ['executive.email', 'advisor.email', 'asesorEmail', 'asesor_email', 'contract.executive.email'])
    }
  };
}

export function normalizeQuotationCollection(payload = {}) {
  const candidates = [
    payload,
    payload.data,
    payload.projects,
    payload.items,
    payload.results,
    payload.records,
    payload.quotations,
    payload.data?.projects,
    payload.data?.items,
    payload.data?.results,
    payload.data?.records,
    payload.data?.quotations
  ];
  const rows = candidates.find((entry) => Array.isArray(entry)) || [];

  return rows.map(normalizeQuotationRecord);
}
