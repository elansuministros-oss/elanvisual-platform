const METHOD_LABELS = Object.freeze({
  transfer: 'Transferencia bancaria',
  deposit: 'Depósito bancario',
  cash: 'Efectivo',
  card: 'Tarjeta',
  other: 'Otro'
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
  const logoForLightBackground = text(brand.logoForLightBackground);
  const logoLightUrl = text(brand.logoLightUrl);
  const logoUrl = text(brand.logoUrl);

  return {
    platformId: text(brand.platformId),
    name: text(brand.name || brand.platformId) || 'Plataforma ELANKAV',
    logoUrl: logoForLightBackground || logoLightUrl || logoUrl,
    logoNeedsDarkBackground: !logoForLightBackground && Boolean(logoLightUrl || logoUrl),
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

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(receiptNumber)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#eef2f6;color:#172033;margin:0;padding:28px}.receipt{width:min(100%,148mm);margin:auto;background:#fff;border:1px solid #dbe3ec;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(18,56,95,.13)}.head{padding:22px 24px 18px;border-bottom:4px solid #12385f;background:#fff}.brand{display:flex;min-height:34px;align-items:center}.brand-logo-box{display:inline-flex;align-items:center;justify-content:center;max-width:230px}.brand-logo-box.is-dark{min-height:56px;padding:10px 14px;border-radius:9px;background:#111}.brand-logo{display:block;max-width:200px;max-height:42px;object-fit:contain;object-position:left center}.brand-name{font-size:17px;color:#12385f}.headline{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:9px}.head h1{margin:0;color:#12385f;font-size:24px;letter-spacing:.02em}.receipt-number{text-align:right}.receipt-number span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#718096}.receipt-number strong{display:block;font-size:15px;color:#172033}.status{display:inline-flex;margin-top:10px;padding:6px 10px;border-radius:999px;background:#eaf2f8;color:#12385f;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.body{padding:22px 24px}.section{margin-top:17px}.section:first-child{margin-top:0}.section-title{margin:0 0 8px;color:#12385f;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.project-card{padding:13px 15px;border:1px solid #dbe3ec;border-left:4px solid #12385f;border-radius:10px;background:#f8fafc}.project-card span{display:block;color:#6b778c;font-size:10px;text-transform:uppercase;letter-spacing:.09em}.project-card strong{display:block;margin-top:4px;font-size:16px;line-height:1.25}.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:17px}.data-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #e4e9ef;font-size:11px}.data-row span{color:#5d6879}.data-row strong{text-align:right;color:#172033}.financial{border:1px solid #dbe3ec;border-radius:11px;padding:3px 13px}.financial .data-row strong{font-size:14px}.financial .emphasis strong{font-size:17px;color:#12385f}.notes{padding:10px 12px;border-radius:8px;background:#f8fafc;color:#3f4b5d;line-height:1.4;font-size:11px}.footer{display:flex;justify-content:space-between;gap:14px;padding:14px 24px;background:#12385f;color:#fff;font-size:10px}.footer strong{display:block;margin-bottom:3px}.actions{text-align:center;margin:18px}button{padding:11px 18px;border:0;border-radius:10px;background:#12385f;color:#fff;font-weight:700;cursor:pointer}@media(max-width:640px){body{padding:8px}.head,.body{padding:18px}.headline{align-items:flex-start;flex-direction:column}.receipt-number{text-align:left}.grid{grid-template-columns:1fr}.footer{flex-direction:column}}@page{size:A5 portrait;margin:8mm}@media print{body{padding:0;background:#fff}.receipt{width:100%;max-width:none;border:0;border-radius:0;box-shadow:none}.actions{display:none}.head,.body,.footer,.brand-logo-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><section class="receipt"><header class="head"><div class="brand">${logo}</div><div class="headline"><div><h1>RECIBO OFICIAL</h1><span class="status">${safe(paymentLabel(payment))}</span></div><div class="receipt-number"><span>Número oficial</span><strong>${safe(receiptNumber)}</strong></div></div></header><main class="body"><section class="section"><div class="project-card"><span>Proyecto</span><strong>${safe(projectName(quotation))}</strong></div></section><section class="section"><h2 class="section-title">Datos del documento</h2><div class="grid">${row('Cotización', quotation.quotationNumber || '')}${row('Fecha de pago', new Date(payment.paid_at || payment.created_at).toLocaleString('es-NI'))}${row('Cliente', customer.name || '')}${row('Empresa', customer.companyName || customer.company_name || '')}${row('Forma de pago', method)}${row('Ejecutivo', executive.name || '')}</div></section><section class="section"><h2 class="section-title">Recepción del pago</h2><div class="grid">${bankRows}</div></section><section class="section"><h2 class="section-title">Operación bancaria</h2><div class="grid">${bankingRows}</div></section><section class="section"><h2 class="section-title">Resumen financiero</h2><div class="grid financial">${row('Aplicado a cotización', money(payment.amount), 'emphasis')}${row('Total pagado', money(payment.total_paid))}${row('Saldo pendiente', money(payment.pending_balance), 'emphasis')}${row('Total cotización', money(payment.quotation_total))}</div></section>${payment.notes ? `<section class="section"><h2 class="section-title">Observaciones</h2><div class="notes">${safe(payment.notes)}</div></section>` : ''}</main><footer class="footer"><div><strong>${safe(brand.name)}</strong>Documento oficial de recepción de pago</div><div>${safe(contact)}</div></footer></section><div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`;
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
