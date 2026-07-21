const METHOD_LABELS = Object.freeze({
  transfer: 'Banco',
  deposit: 'Banco',
  cash: 'Efectivo',
  card: 'Tarjeta',
  other: 'Cheque'
});

const QUOTATION_FALLBACK_LOGO_URL = '/assets/branding/elanvisual.svg';

const money = (value, currency = 'USD') => new Intl.NumberFormat('es-NI', {
  style: 'currency',
  currency: currency || 'USD'
}).format(Number(value || 0));

const text = (value) => String(value ?? '').trim();
const safe = (value) => text(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[char]));

function absoluteAssetUrl(value, baseUrl = '') {
  const assetUrl = text(value);
  if (!assetUrl || !baseUrl) return assetUrl;
  try { return new URL(assetUrl, `${text(baseUrl).replace(/\/+$/, '')}/`).href; }
  catch { return assetUrl; }
}

function sanitizeInlineSvg(value = '') {
  const svg = text(value)
    .replace(/^<\?xml[^>]*>\s*/i, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .trim();
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>$/i.test(svg)) {
    throw new Error('El asset del logo no contiene un SVG válido.');
  }
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(["'])[^"']*\1/gi, '');
}

export function paymentLabel(payment = {}) {
  if (Number(payment.pending_balance) === 0) return 'Cancelación';
  if (Number(payment.previous_paid) > 0) return 'Abono';
  return 'Anticipo';
}

export function bankingData(payment = {}) {
  return payment.metadata?.banking || {};
}

export function officialReceiptNumber(payment = {}) {
  return text(
    payment.receipt_number || payment.receiptNumber || payment.official_number
    || payment.officialNumber || payment.number || payment.id
  ) || 'RECIBO SIN NÚMERO';
}

function projectName(quotation = {}) {
  return text(
    quotation.projectName || quotation.project_name || quotation.project?.name
    || quotation.project?.title || quotation.title || quotation.name
    || quotation.projectId || quotation.id
  ) || 'Proyecto';
}

function receiptBrand(quotation = {}, baseUrl = '') {
  const brand = quotation.brand || {};
  const platformId = text(brand.platformId || brand.platform_id).toUpperCase();
  const name = text(brand.name || brand.displayName || brand.display_name || platformId) || 'Plataforma ELANKAV';
  const logoUrl = text(
    brand.logoForLightBackground || brand.logo_for_light_background
    || brand.logoLightUrl || brand.logo_light_url || brand.logoUrl
    || brand.logo_url || QUOTATION_FALLBACK_LOGO_URL
  );
  return {
    platformId,
    name,
    logoUrl: absoluteAssetUrl(logoUrl, baseUrl),
    website: text(brand.website),
    whatsapp: text(brand.whatsapp),
    email: text(brand.email)
  };
}

export async function loadEmbeddedReceiptLogo(quotation = {}, options = {}) {
  const brand = receiptBrand(quotation, options.baseUrl);
  if (!brand.logoUrl) return { brand, logoSvg: '' };
  const fetchFn = options.fetchFn || globalThis.fetch;
  if (typeof fetchFn !== 'function') throw new Error('Fetch no disponible para cargar el logo del recibo.');
  const response = await fetchFn(brand.logoUrl, { cache: 'no-store' });
  if (!response?.ok) throw new Error(`No fue posible cargar el logo del recibo (${response?.status || 'sin estado'}).`);
  const contentType = text(response.headers?.get?.('content-type')).toLowerCase();
  const rawSvg = await response.text();
  if (contentType && !contentType.includes('svg') && !/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(rawSvg)) {
    throw new Error('El asset recibido no corresponde a un logo SVG.');
  }
  return { brand, logoSvg: sanitizeInlineSvg(rawSvg) };
}

function row(label, value, className = '') {
  if (value === undefined || value === null || text(value) === '') return '';
  return `<div class="data-row ${className}"><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`;
}

function paymentDetailRows(payment = {}, banking = {}) {
  const method = payment.payment_method;
  if (method === 'cash') return row('Recepción', 'Pago recibido en efectivo');

  if (method === 'other' && payment.metadata?.cheque) {
    const cheque = payment.metadata.cheque;
    return `${row('Monto', money(payment.amount))}${row('Banco', cheque.bankName)}${row('Cheque No.', cheque.number)}${row('Fecha del cheque', cheque.date ? new Date(cheque.date).toLocaleDateString('es-NI') : '')}`;
  }

  if (['transfer', 'deposit'].includes(method)) {
    const bankCredit = banking.bankCredit || {};
    const rate = Number(banking.effectiveExchangeRate || 0);
    const converted = banking.customerPayment?.currency && bankCredit.currency
      && banking.customerPayment.currency !== bankCredit.currency;
    return `${row('Monto', money(bankCredit.amount || payment.amount, bankCredit.currency || payment.currency || 'USD'))}${row('Banco', banking.bankName || 'No especificado')}${row('Referencia', payment.payment_reference)}${converted && rate > 0 ? row('Tipo de cambio', rate.toFixed(4)) : ''}`;
  }

  return row('Forma de pago', METHOD_LABELS[method] || method || 'No especificado');
}

export function financialSummaryRows(payment = {}) {
  const amount = Number(payment.amount || 0);
  const previousPaid = Number(payment.previous_paid || 0);
  const totalPaid = Number(payment.total_paid || 0);
  const pendingBalance = Number(payment.pending_balance || 0);
  const quotationTotal = Number(payment.quotation_total || 0);
  const isPaid = pendingBalance <= 0.009;
  const isInstallment = previousPaid > 0.009;

  if (isPaid) {
    return `${row('Total de la cotización', money(quotationTotal))}${row('Pago recibido', money(amount), 'emphasis')}${row('Estado', 'PAGADO', 'status-paid')}`;
  }

  if (isInstallment) {
    return `${row('Total de la cotización', money(quotationTotal))}${row('Pago recibido', money(amount), 'emphasis')}${row('Total pagado', money(totalPaid))}${row('Saldo pendiente', money(pendingBalance), 'emphasis')}`;
  }

  return `${row('Total de la cotización', money(quotationTotal))}${row('Pago recibido', money(amount), 'emphasis')}${row('Saldo pendiente', money(pendingBalance), 'emphasis')}`;
}

export function buildReceiptDocument(payment = {}, quotation = {}, options = {}) {
  const customer = payment.customer_snapshot || quotation.customer || {};
  const executive = payment.executive_snapshot || quotation.executive || {};
  const banking = bankingData(payment);
  const method = METHOD_LABELS[payment.payment_method] || text(payment.payment_method) || 'No especificado';
  const receiptNumber = officialReceiptNumber(payment);
  const receiptType = paymentLabel(payment);
  const brand = options.brand || receiptBrand(quotation, options.baseUrl);
  const logoSvg = text(options.logoSvg);
  const logo = logoSvg
    ? `<span class="brand-logo-box is-dark" role="img" aria-label="${safe(brand.name)}">${logoSvg}</span>`
    : `<strong class="brand-name">${safe(brand.name)}</strong>`;
  const contact = [brand.website, brand.whatsapp, brand.email].filter(Boolean).join(' · ');
  const paidAt = payment.paid_at || payment.created_at;
  const detailRows = paymentDetailRows(payment, banking);
  const summaryRows = financialSummaryRows(payment);

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(receiptNumber)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#eef2f6;color:#172033;margin:0;padding:18px}.receipt{width:min(100%,5in);min-height:10in;margin:auto;background:#fff;border:1px solid #dbe3ec;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(18,56,95,.13)}.head{display:grid;gap:18px;padding:22px;border-bottom:2px solid #111827}.brand{display:flex;min-height:58px;align-items:center}.brand-logo-box{display:inline-flex;align-items:center;justify-content:center;max-width:230px}.brand-logo-box.is-dark{min-height:58px;padding:11px 14px;border-radius:8px;background:#11151b}.brand-logo-box svg{display:block;width:205px;height:auto;max-height:38px}.brand-name{font-size:18px;color:#12385f}.document-kind{display:block;margin-bottom:6px;color:#8a6400;font-size:12px;font-weight:900;text-transform:uppercase}.document-number{margin:0;color:#071b3d;font-size:20px;line-height:1.1;overflow-wrap:anywhere}.head-meta{display:flex;justify-content:space-between;gap:16px}.meta-block{display:grid;gap:4px}.meta-block span{color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase}.meta-block strong{color:#071b3d;font-size:14px}.body{padding:20px 22px}.section{margin-top:17px}.section:first-child{margin-top:0}.section-title{margin:0 0 8px;color:#12385f;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.project-card{padding:13px 15px;border:1px solid #dbe3ec;border-left:4px solid #12385f;border-radius:10px;background:#f8fafc}.project-card span{display:block;color:#6b778c;font-size:10px;text-transform:uppercase}.project-card strong{display:block;margin-top:4px;font-size:16px}.grid{display:grid;grid-template-columns:1fr}.data-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #e4e9ef;font-size:11px}.data-row span{color:#5d6879}.data-row strong{text-align:right;color:#172033}.financial{border:1px solid #dbe3ec;border-radius:11px;padding:3px 13px}.financial .data-row strong{font-size:14px}.financial .emphasis strong{font-size:17px;color:#12385f}.financial .status-paid strong{color:#137333;font-weight:900;letter-spacing:.04em}.notes{padding:10px 12px;border-radius:8px;background:#f8fafc;font-size:11px}.footer{display:flex;justify-content:space-between;gap:14px;padding:14px 22px;background:#12385f;color:#fff;font-size:10px}.footer strong{display:block;margin-bottom:3px}.actions{text-align:center;margin:18px}button{padding:11px 18px;border:0;border-radius:10px;background:#12385f;color:#fff;font-weight:700;cursor:pointer}@media(max-width:640px){body{padding:0;background:#fff}.receipt{width:100%;min-height:100vh;border:0;border-radius:0;box-shadow:none}.footer{flex-direction:column}}@page{size:5in 10in;margin:.22in}@media print{html,body{width:5in;min-height:10in;margin:0;padding:0;background:#fff}.receipt{width:4.56in;min-height:9.56in;margin:0 auto;border:0;border-radius:0;box-shadow:none}.head{padding:.22in}.body{padding:.18in .22in}.section{margin-top:.12in;break-inside:avoid}.data-row{padding:.055in 0;font-size:7.5pt}.project-card strong{font-size:10pt}.financial .data-row strong{font-size:9pt}.financial .emphasis strong{font-size:11pt}.footer{padding:.12in .22in;font-size:6.5pt}.actions{display:none}.head,.body,.footer,.brand-logo-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><section class="receipt"><header class="head"><div><div class="brand">${logo}</div><span class="document-kind">Recibo oficial</span><h1 class="document-number">${safe(receiptNumber)}</h1></div><div class="head-meta"><div class="meta-block"><span>Tipo de pago</span><strong>${safe(receiptType)}</strong></div><div class="meta-block"><span>Forma</span><strong>${safe(method)}</strong></div></div></header><main class="body"><section class="section"><div class="project-card"><span>Proyecto</span><strong>${safe(projectName(quotation))}</strong></div></section><section class="section"><h2 class="section-title">Datos del documento</h2><div class="grid">${row('Cotización', quotation.quotationNumber || '')}${row('Fecha de pago', new Date(paidAt).toLocaleString('es-NI'))}${row('Cliente', customer.name || '')}${row('Empresa', customer.companyName || customer.company_name || '')}${row('Ejecutivo', executive.name || '')}</div></section><section class="section"><h2 class="section-title">Detalle del pago</h2><div class="grid">${detailRows}</div></section><section class="section"><h2 class="section-title">Resumen financiero</h2><div class="grid financial">${summaryRows}</div></section>${payment.notes ? `<section class="section"><h2 class="section-title">Observaciones</h2><div class="notes">${safe(payment.notes)}</div></section>` : ''}</main><footer class="footer"><div><strong>${safe(brand.name)}</strong>Documento oficial de recepción de pago</div><div>${safe(contact)}</div></footer></section><div class="actions"><button type="button" onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`;
}

export async function printReceiptDocument(payment, quotation, windowObject = window) {
  const windowRef = windowObject.open('', '_blank');
  if (!windowRef) {
    windowObject.alert('El navegador bloqueó la ventana del recibo. Habilitá ventanas emergentes e intentá nuevamente.');
    return false;
  }
  windowRef.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Preparando recibo…</title></head><body style="font-family:Arial,sans-serif;padding:24px">Preparando recibo oficial…</body></html>');
  windowRef.document.close();
  try {
    const embedded = await loadEmbeddedReceiptLogo(quotation, {
      baseUrl: windowObject.location?.origin || '',
      fetchFn: windowObject.fetch?.bind(windowObject) || globalThis.fetch
    });
    windowRef.document.open();
    windowRef.document.write(buildReceiptDocument(payment, quotation, embedded));
    windowRef.document.close();
    return true;
  } catch (error) {
    windowRef.close();
    windowObject.alert(error?.message || 'No fue posible cargar el logo oficial del recibo.');
    return false;
  }
}
