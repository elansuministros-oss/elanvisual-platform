const METHOD_LABELS = Object.freeze({
  transfer: 'Transferencia bancaria',
  deposit: 'Depósito bancario',
  cash: 'Efectivo',
  card: 'Tarjeta',
  other: 'Otro'
});

const PLATFORM_LOGO_FALLBACKS = Object.freeze({
  ELANVISUAL: Object.freeze({
    logoUrl: 'https://visual.elankav.com/assets/branding/elanvisual.svg',
    needsDarkBackground: true
  })
});

const money = (value, currency = 'USD') => new Intl.NumberFormat('es-NI', {
  style: 'currency',
  currency: currency || 'USD'
}).format(Number(value || 0));

const text = (value) => String(value ?? '').trim();
const safe = (value) => text(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[char]));

function formatDocumentDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return text(value) || '—';
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
}

export function paymentLabel(payment = {}) {
  if (Number(payment.pending_balance) === 0) return 'Pago total';
  if (Number(payment.previous_paid) > 0) return 'Abono';
  return 'Anticipo';
}

export function bankingData(payment = {}) {
  return payment.metadata?.banking || {};
}

export function officialReceiptNumber(payment = {}) {
  return text(
    payment.receipt_number
    || payment.receiptNumber
    || payment.official_number
    || payment.officialNumber
    || payment.number
    || payment.id
  ) || 'RECIBO SIN NÚMERO';
}

function projectName(quotation = {}) {
  return text(
    quotation.projectName
    || quotation.project_name
    || quotation.project?.name
    || quotation.project?.title
    || quotation.title
    || quotation.name
    || quotation.projectId
    || quotation.id
  ) || 'Proyecto';
}

function receiptBrand(quotation = {}) {
  const brand = quotation.brand || {};
  const platformId = text(brand.platformId || brand.platform_id).toUpperCase();
  const name = text(brand.name || brand.displayName || brand.display_name || platformId) || 'Plataforma ELANKAV';
  const fallback = PLATFORM_LOGO_FALLBACKS[platformId] || PLATFORM_LOGO_FALLBACKS[name.toUpperCase()] || null;
  const logoForLightBackground = text(brand.logoForLightBackground || brand.logo_for_light_background);
  const logoLightUrl = text(brand.logoLightUrl || brand.logo_light_url);
  const logoUrl = text(brand.logoUrl || brand.logo_url);

  return {
    platformId,
    name,
    logoUrl: logoForLightBackground || logoLightUrl || logoUrl || fallback?.logoUrl || '',
    logoNeedsDarkBackground: logoForLightBackground
      ? false
      : Boolean(logoLightUrl || logoUrl) || Boolean(fallback?.needsDarkBackground),
    website: text(brand.website),
    whatsapp: text(brand.whatsapp),
    email: text(brand.email)
  };
}

function row(label, value, className = '') {
  return `<div class="data-row ${className}"><span>${safe(label)}</span><strong>${safe(value || '—')}</strong></div>`;
}

export function buildReceiptDocument(payment = {}, quotation = {}) {
  const customer = payment.customer_snapshot || quotation.customer || {};
  const executive = payment.executive_snapshot || quotation.executive || {};
  const banking = bankingData(payment);
  const customerPayment = banking.customerPayment || {};
  const bankCredit = banking.bankCredit || {};
  const method = METHOD_LABELS[payment.payment_method] || text(payment.payment_method) || 'No especificado';
  const isBankPayment = ['transfer', 'deposit'].includes(payment.payment_method);
  const receiptNumber = officialReceiptNumber(payment);
  const brand = receiptBrand(quotation);
  const logoClass = brand.logoNeedsDarkBackground ? 'brand-logo-box is-dark' : 'brand-logo-box';
  const logo = brand.logoUrl
    ? `<span class="${logoClass}"><img class="brand-logo" src="${safe(brand.logoUrl)}" alt="${safe(brand.name)}"></span>`
    : `<strong class="brand-name">${safe(brand.name)}</strong>`;
  const bankingRows = banking.operationType
    ? `${row('Cliente envió', money(customerPayment.amount, customerPayment.currency))}${row('Banco acreditó', money(bankCredit.amount, bankCredit.currency))}${banking.effectiveExchangeRate > 0 ? row('TC efectivo', Number(banking.effectiveExchangeRate).toFixed(4)) : ''}${row('Comisión bancaria', `${money(banking.bankFee || 0, bankCredit.currency)} · absorbida por ELANKAV`)}`
    : row('Operación', method);
  const bankRows = isBankPayment
    ? `${row('Banco receptor', banking.bankName || 'No especificado')}${row('Referencia bancaria', payment.payment_reference || 'No especificada')}`
    : row('Recepción', 'Pago recibido en efectivo');
  const contact = [brand.website, brand.whatsapp, brand.email].filter(Boolean).join(' · ');
  const paidAt = payment.paid_at || payment.created_at;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(receiptNumber)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#eef2f6;color:#172033;margin:0;padding:28px}.receipt{width:min(100%,148mm);margin:auto;background:#fff;border:1px solid #dbe3ec;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(18,56,95,.13)}.head{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,.72fr);gap:34px;align-items:start;padding:24px 24px 22px;border-bottom:2px solid #111827;background:#fff}.head-left{display:grid;justify-items:start}.brand{display:flex;min-height:58px;align-items:center;margin-bottom:22px}.brand-logo-box{display:inline-flex;align-items:center;justify-content:center;max-width:230px}.brand-logo-box.is-dark{min-height:58px;padding:11px 14px;border-radius:8px;background:#11151b}.brand-logo{display:block;width:auto;max-width:205px;max-height:38px;object-fit:contain}.brand-name{font-size:18px;color:#12385f}.document-kind{display:block;margin-bottom:6px;color:#8a6400;font-size:12px;font-weight:900;text-transform:uppercase}.document-number{margin:0;color:#071b3d;font-size:22px;line-height:1.05;overflow-wrap:anywhere}.head-meta{display:grid;gap:18px;padding-top:18px}.meta-block{display:grid;gap:5px}.meta-block span{color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase}.meta-block strong{color:#071b3d;font-size:15px;line-height:1.2}.body{padding:22px 24px}.section{margin-top:17px}.section:first-child{margin-top:0}.section-title{margin:0 0 8px;color:#12385f;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.project-card{padding:13px 15px;border:1px solid #dbe3ec;border-left:4px solid #12385f;border-radius:10px;background:#f8fafc}.project-card span{display:block;color:#6b778c;font-size:10px;text-transform:uppercase;letter-spacing:.09em}.project-card strong{display:block;margin-top:4px;font-size:16px;line-height:1.25}.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:17px}.data-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #e4e9ef;font-size:11px}.data-row span{color:#5d6879}.data-row strong{text-align:right;color:#172033}.financial{border:1px solid #dbe3ec;border-radius:11px;padding:3px 13px}.financial .data-row strong{font-size:14px}.financial .emphasis strong{font-size:17px;color:#12385f}.notes{padding:10px 12px;border-radius:8px;background:#f8fafc;color:#3f4b5d;line-height:1.4;font-size:11px}.footer{display:flex;justify-content:space-between;gap:14px;padding:14px 24px;background:#12385f;color:#fff;font-size:10px}.footer strong{display:block;margin-bottom:3px}.actions{text-align:center;margin:18px}button{padding:11px 18px;border:0;border-radius:10px;background:#12385f;color:#fff;font-weight:700;cursor:pointer}@media(max-width:640px){body{padding:8px}.head{grid-template-columns:1fr;gap:16px;padding:18px}.brand{margin-bottom:14px}.head-meta{grid-template-columns:1fr 1fr;padding-top:0}.body{padding:18px}.grid{grid-template-columns:1fr}.footer{flex-direction:column}}@page{size:A5 portrait;margin:5mm}@media print{html,body{width:148mm;height:210mm;margin:0;padding:0;background:#fff;overflow:hidden}.receipt{width:138mm;max-width:138mm;margin:0 auto;border:0;border-radius:0;box-shadow:none;overflow:visible}.head{grid-template-columns:minmax(0,1fr) 43mm;gap:8mm;padding:7mm 5mm 5mm}.brand{min-height:15mm;margin-bottom:5mm}.brand-logo-box.is-dark{min-height:14mm;padding:2.5mm 3.5mm;border-radius:2mm}.brand-logo{max-width:49mm;max-height:9mm}.document-kind{margin-bottom:1.5mm;font-size:8.5pt}.document-number{font-size:15pt}.head-meta{gap:4mm;padding-top:4mm}.meta-block{gap:1mm}.meta-block span{font-size:7pt}.meta-block strong{font-size:10pt}.body{padding:3mm 5mm 2.5mm}.section{margin-top:2.4mm;break-inside:avoid;page-break-inside:avoid}.section-title{margin-bottom:1mm;font-size:7pt}.project-card{padding:2mm 2.5mm}.project-card span{font-size:6.5pt}.project-card strong{font-size:9pt}.grid{column-gap:3mm}.data-row{padding:1mm 0;font-size:7pt;line-height:1.12}.financial{padding:.5mm 2mm}.financial .data-row strong{font-size:8.5pt}.financial .emphasis strong{font-size:10.5pt}.footer{padding:2mm 5mm;font-size:6.5pt;break-inside:avoid;page-break-inside:avoid}.footer strong{margin-bottom:.3mm}.actions{display:none}.head,.body,.footer,.brand-logo-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><section class="receipt"><header class="head"><div class="head-left"><div class="brand">${logo}</div><span class="document-kind">Recibo oficial</span><h1 class="document-number">${safe(receiptNumber)}</h1></div><div class="head-meta"><div class="meta-block"><span>Fecha</span><strong>${safe(formatDocumentDate(paidAt))}</strong></div><div class="meta-block"><span>Tipo de pago</span><strong>${safe(paymentLabel(payment))}</strong></div></div></header><main class="body"><section class="section"><div class="project-card"><span>Proyecto</span><strong>${safe(projectName(quotation))}</strong></div></section><section class="section"><h2 class="section-title">Datos del documento</h2><div class="grid">${row('Cotización', quotation.quotationNumber || '')}${row('Fecha de pago', new Date(paidAt).toLocaleString('es-NI'))}${row('Cliente', customer.name || '')}${row('Empresa', customer.companyName || customer.company_name || '')}${row('Forma de pago', method)}${row('Ejecutivo', executive.name || '')}</div></section><section class="section"><h2 class="section-title">Recepción del pago</h2><div class="grid">${bankRows}</div></section><section class="section"><h2 class="section-title">Operación bancaria</h2><div class="grid">${bankingRows}</div></section><section class="section"><h2 class="section-title">Resumen financiero</h2><div class="grid financial">${row('Aplicado a cotización', money(payment.amount), 'emphasis')}${row('Total pagado', money(payment.total_paid))}${row('Saldo pendiente', money(payment.pending_balance), 'emphasis')}${row('Total cotización', money(payment.quotation_total))}</div></section>${payment.notes ? `<section class="section"><h2 class="section-title">Observaciones</h2><div class="notes">${safe(payment.notes)}</div></section>` : ''}</main><footer class="footer"><div><strong>${safe(brand.name)}</strong>Documento oficial de recepción de pago</div><div>${safe(contact)}</div></footer></section><div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`;
}

export function printReceiptDocument(payment, quotation, windowObject = window) {
  const windowRef = windowObject.open('', '_blank');
  if (!windowRef) {
    windowObject.alert('El navegador bloqueó la ventana del recibo. Habilitá ventanas emergentes e intentá nuevamente.');
    return false;
  }
  windowRef.document.write(buildReceiptDocument(payment, quotation));
  windowRef.document.close();
  return true;
}
