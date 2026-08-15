const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const SCALE = 2;
const BRAND_NAVY = '#10365d';
const BORDER = '#cbd5e1';
const LIGHT = '#eef3f7';
const TEXT = '#1f2937';
const MUTED = '#66727e';

function value(input) {
  return input === undefined || input === null ? '' : String(input).trim();
}

function numberValue(input) {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const parsed = Number(String(input ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(input, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(numberValue(input));
}

function formatDate(input) {
  if (!input) return '';
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return value(input);
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
}

function addDaysIso(input, days) {
  if (!input) return '';
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString();
}

function resolveUnitPrice(item = {}) {
  const direct = numberValue(item.unitPrice ?? item.unit_price ?? item.price);
  if (direct) return direct;
  const subtotal = numberValue(item.subtotal);
  const quantity = numberValue(item.quantity);
  return quantity > 0 ? subtotal / quantity : 0;
}

function resolveItemTotal(item = {}) {
  const subtotal = numberValue(item.subtotal);
  if (subtotal) return subtotal;
  return numberValue(item.quantity) * resolveUnitPrice(item);
}

function wrapLines(ctx, text, maxWidth) {
  const words = value(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words.shift();
  for (const word of words) {
    const next = `${line} ${word}`;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  const lines = wrapLines(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length * lineHeight;
}

function strokeRect(ctx, x, y, w, h, fill = '#fff') {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, w, h);
}

function drawMetaCell(ctx, label, text, x, y, w, h) {
  strokeRect(ctx, x, y, w, h, LIGHT);
  ctx.fillStyle = MUTED;
  ctx.font = '700 5.5px Arial';
  ctx.fillText(label, x + 7, y + 11);
  ctx.fillStyle = TEXT;
  ctx.font = '700 7.2px Arial';
  drawWrapped(ctx, text, x + 7, y + 23, w - 14, 8, 2);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function paymentEntries(payment = {}, totalUsd = 0) {
  const installments = Array.isArray(payment.installments) ? payment.installments : [];
  if (installments.length) {
    return installments.slice(0, 3).map((entry, index) => {
      const percentage = numberValue(entry.percentage);
      const amount = numberValue(entry.amountUsd) || (percentage ? totalUsd * percentage / 100 : 0);
      return {
        id: entry.id || `payment-${index}`,
        percentage,
        label: value(entry.label) || `Pago ${index + 1}`,
        amount,
        condition: value(entry.dueCondition)
      };
    });
  }
  const advance = payment.advance || {};
  const percentage = numberValue(advance.percentage);
  if (!percentage) return [];
  const advanceAmount = numberValue(advance.amountUsd) || totalUsd * percentage / 100;
  return [
    {
      id: 'advance',
      percentage,
      label: value(advance.label) || 'Anticipo',
      amount: advanceAmount,
      condition: value(advance.dueCondition) || 'Al aprobar la cotización'
    },
    {
      id: 'balance',
      percentage: Math.max(0, 100 - percentage),
      label: 'Contra entrega',
      amount: Math.max(0, totalUsd - advanceAmount),
      condition: 'Al finalizar el proyecto'
    }
  ];
}

function absoluteUrl(input) {
  const url = value(input);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://visual.elankav.com${url.startsWith('/') ? url : `/${url}`}`;
}

function escapePdfString(input) {
  return String(input).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function asciiBytes(input) {
  return new TextEncoder().encode(input);
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function buildPdf(jpegBytes, imageWidth, imageHeight, links) {
  const annotations = links.map((link, index) => {
    const objectNumber = 6 + index;
    const x1 = link.x;
    const y1 = PAGE_HEIGHT - (link.y + link.h);
    const x2 = link.x + link.w;
    const y2 = PAGE_HEIGHT - link.y;
    const body = `${objectNumber} 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfString(link.url)}) >> >>\nendobj\n`;
    return { objectNumber, bytes: asciiBytes(body) };
  });

  const annotRefs = annotations.map((entry) => `${entry.objectNumber} 0 R`).join(' ');
  const content = `q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im0 Do Q`;
  const contentBytes = asciiBytes(content);

  const objects = [];
  objects.push({ objectNumber: 1, bytes: asciiBytes('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n') });
  objects.push({ objectNumber: 2, bytes: asciiBytes('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n') });
  objects.push({
    objectNumber: 3,
    bytes: asciiBytes(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R${annotRefs ? ` /Annots [${annotRefs}]` : ''} >>\nendobj\n`)
  });
  objects.push({
    objectNumber: 4,
    bytes: concatBytes([
      asciiBytes(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
      jpegBytes,
      asciiBytes('\nendstream\nendobj\n')
    ])
  });
  objects.push({
    objectNumber: 5,
    bytes: concatBytes([
      asciiBytes(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      asciiBytes('\nendstream\nendobj\n')
    ])
  });
  objects.push(...annotations);

  const header = asciiBytes('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n');
  const bodyParts = [header];
  const offsets = [0];
  let cursor = header.length;
  const maxObject = 5 + annotations.length;

  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber += 1) {
    const object = objects.find((entry) => entry.objectNumber === objectNumber);
    offsets[objectNumber] = cursor;
    bodyParts.push(object.bytes);
    cursor += object.bytes.length;
  }

  const xrefOffset = cursor;
  let xref = `xref\n0 ${maxObject + 1}\n0000000000 65535 f \n`;
  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber += 1) {
    xref += `${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  bodyParts.push(asciiBytes(xref));
  return concatBytes(bodyParts);
}

export async function downloadQuotationPdf({ quotation, dossier = null }) {
  if (!quotation) throw new Error('No hay cotización disponible para generar el PDF.');

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH * SCALE;
  canvas.height = PAGE_HEIGHT * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no pudo preparar el PDF.');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.textBaseline = 'alphabetic';

  const project = quotation.project || {};
  const customer = quotation.customer || {};
  const totals = quotation.totals || {};
  const payment = quotation.payment || {};
  const items = Array.isArray(quotation.items) ? quotation.items : [];
  const accounts = Array.isArray(quotation.paymentAccounts) ? quotation.paymentAccounts : [];
  const totalUsd = numberValue(totals.totalUsd ?? quotation.totalUsd);
  const validUntil = quotation.validUntil || addDaysIso(quotation.date, 15);
  const payments = paymentEntries(payment, totalUsd);
  const documents = dossier?.documents || {};
  const workOrder = documents.workOrder || null;
  const receipts = Array.isArray(documents.receipts) ? documents.receipts : [];
  const accessCode = value(dossier?.accessCode);
  const portalUrl = accessCode ? `https://visual.elankav.com/q/${accessCode}` : '';
  const links = [];

  const margin = 24;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let y = 22;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(margin, y, 158, 35, 5);
  ctx.fill();
  const logo = await loadImage('/assets/branding/elanvisual.svg');
  if (logo) ctx.drawImage(logo, margin + 8, y + 6, 142, 23);
  else {
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px Arial';
    ctx.fillText('VE VISUAL KAV', margin + 12, y + 22);
  }
  ctx.fillStyle = MUTED;
  ctx.font = '5.5px Arial';
  ctx.fillText('Ingeniería, rotulación e imagen corporativa', margin, y + 43);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#176799';
  ctx.font = '700 12px Arial';
  ctx.fillText('COTIZACIÓN', PAGE_WIDTH - margin, y + 9);
  ctx.fillStyle = TEXT;
  ctx.font = '700 8.5px Arial';
  drawWrapped(ctx, value(project.title) || value(quotation.quotationNumber), PAGE_WIDTH - margin - 250, y + 25, 250, 10, 2);
  ctx.fillStyle = MUTED;
  ctx.font = '5.5px Arial';
  ctx.fillText(value(quotation.quotationNumber), PAGE_WIDTH - margin, y + 41);
  ctx.textAlign = 'left';

  y = 79;
  const col1 = 165;
  const col2 = 258;
  const col3 = contentWidth - col1 - col2;
  drawMetaCell(ctx, 'CLIENTE', value(customer.companyName) || value(customer.name), margin, y, col1, 36);
  drawMetaCell(ctx, 'PROYECTO', value(project.title), margin + col1, y, col2, 36);
  drawMetaCell(ctx, 'FECHA', formatDate(quotation.date), margin + col1 + col2, y, col3, 36);
  drawMetaCell(ctx, 'UBICACIÓN', value(project.location) || value(customer.address), margin, y + 36, col1, 36);
  drawMetaCell(ctx, 'MONEDA', value(totals.currency || quotation.currency || 'USD'), margin + col1, y + 36, col2, 36);
  drawMetaCell(ctx, 'VIGENCIA', formatDate(validUntil), margin + col1 + col2, y + 36, col3, 36);

  y += 88;
  ctx.fillStyle = TEXT;
  ctx.font = '700 9px Arial';
  ctx.fillText('Detalle de trabajos', margin + 6, y);
  y += 10;

  const widths = [38, 340, 45, 65, 76];
  const headers = ['ITEM', 'DESCRIPCIÓN', 'CANT.', 'P. UNIT.', 'TOTAL USD'];
  let x = margin;
  ctx.fillStyle = BRAND_NAVY;
  ctx.fillRect(margin, y, contentWidth, 18);
  ctx.fillStyle = '#fff';
  ctx.font = '700 5.5px Arial';
  headers.forEach((header, index) => {
    ctx.fillText(header, x + 5, y + 12);
    x += widths[index];
  });
  y += 18;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    ctx.font = '700 6.2px Arial';
    const titleLines = wrapLines(ctx, value(item.title) || 'Trabajo', widths[1] - 10).slice(0, 2);
    ctx.font = '5.8px Arial';
    const descriptionLines = wrapLines(ctx, value(item.commercialDescription), widths[1] - 10).slice(0, 5);
    const rowHeight = Math.max(42, 12 + titleLines.length * 7 + descriptionLines.length * 6.2);
    x = margin;
    widths.forEach((w) => {
      strokeRect(ctx, x, y, w, rowHeight, '#fff');
      x += w;
    });
    x = margin;
    ctx.fillStyle = TEXT;
    ctx.font = '6px Arial';
    ctx.fillText(String(index + 1), x + 6, y + 12);
    x += widths[0];
    ctx.font = '700 6.2px Arial';
    titleLines.forEach((line, lineIndex) => ctx.fillText(line, x + 5, y + 11 + lineIndex * 7));
    ctx.font = '5.8px Arial';
    const descY = y + 11 + titleLines.length * 7 + 2;
    descriptionLines.forEach((line, lineIndex) => ctx.fillText(line, x + 5, descY + lineIndex * 6.2));
    x += widths[1];
    ctx.font = '6px Arial';
    ctx.fillText(value(item.quantity), x + 5, y + 12);
    x += widths[2];
    ctx.fillText(money(resolveUnitPrice(item), 'USD'), x + 5, y + 12);
    x += widths[3];
    ctx.font = '700 6px Arial';
    ctx.fillText(money(resolveItemTotal(item), 'USD'), x + 5, y + 12);
    y += rowHeight;
  }

  y += 6;
  ctx.fillStyle = BRAND_NAVY;
  ctx.fillRect(margin, y, contentWidth, 30);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.font = '700 10px Arial';
  ctx.fillText('TOTAL GENERAL', PAGE_WIDTH - margin - 105, y + 19);
  ctx.font = '700 13px Arial';
  ctx.fillText(`USD ${money(totalUsd, 'USD')}`, PAGE_WIDTH - margin - 8, y + 20);
  ctx.textAlign = 'left';
  y += 40;

  if (payments.length) {
    const labelWidth = 120;
    const payWidth = (contentWidth - labelWidth) / Math.max(3, payments.length);
    strokeRect(ctx, margin, y, labelWidth, 44, LIGHT);
    ctx.fillStyle = MUTED;
    ctx.font = '700 5.6px Arial';
    ctx.fillText('FORMA DE PAGO', margin + 8, y + 12);
    payments.forEach((entry, index) => {
      const px = margin + labelWidth + index * payWidth;
      strokeRect(ctx, px, y, payWidth, 44, LIGHT);
      ctx.fillStyle = TEXT;
      ctx.font = '700 6.5px Arial';
      ctx.fillText(`${entry.percentage ? `${entry.percentage}% ` : ''}${entry.label}`, px + 7, y + 12);
      ctx.font = '700 7.4px Arial';
      ctx.fillText(money(entry.amount, 'USD'), px + 7, y + 25);
      ctx.fillStyle = MUTED;
      ctx.font = '5px Arial';
      drawWrapped(ctx, entry.condition, px + 7, y + 35, payWidth - 14, 5.5, 1);
    });
    y += 54;
  }

  if (accounts.length) {
    ctx.fillStyle = '#8a6600';
    ctx.font = '700 6px Arial';
    ctx.fillText('CUENTAS AUTORIZADAS', margin, y);
    y += 7;
    const accountWidth = contentWidth / Math.min(4, accounts.length);
    accounts.slice(0, 4).forEach((account, index) => {
      const ax = margin + index * accountWidth;
      strokeRect(ctx, ax, y, accountWidth, 38, '#f6f8fa');
      ctx.fillStyle = TEXT;
      ctx.font = '700 5.8px Arial';
      ctx.fillText(value(account.label) || value(account.bankName), ax + 6, y + 10);
      ctx.fillStyle = MUTED;
      ctx.font = '5px Arial';
      ctx.fillText(`${value(account.currency)}${account.accountType ? ` · ${account.accountType}` : ''}`, ax + 6, y + 19);
      ctx.fillStyle = TEXT;
      ctx.font = '700 6px Arial';
      ctx.fillText(value(account.accountNumber), ax + 6, y + 29);
    });
    y += 48;
  }

  if (workOrder || receipts.length) {
    const dossierTop = y;
    ctx.fillStyle = BRAND_NAVY;
    ctx.fillRect(margin, y, contentWidth, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '700 6.5px Arial';
    ctx.fillText('EXPEDIENTE DEL PROYECTO', margin + 7, y + 12);
    y += 18;

    const drawRecord = (label, main, secondary, url, buttonText) => {
      const rowHeight = 31;
      strokeRect(ctx, margin, y, contentWidth, rowHeight, '#fff');
      ctx.fillStyle = MUTED;
      ctx.font = '700 5px Arial';
      ctx.fillText(label, margin + 7, y + 9);
      ctx.fillStyle = TEXT;
      ctx.font = '700 6.2px Arial';
      ctx.fillText(main, margin + 7, y + 18);
      ctx.fillStyle = MUTED;
      ctx.font = '5px Arial';
      ctx.fillText(secondary, margin + 7, y + 26);
      const buttonW = 62;
      const buttonH = 16;
      const buttonX = PAGE_WIDTH - margin - buttonW - 7;
      const buttonY = y + 7;
      ctx.strokeStyle = BRAND_NAVY;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(buttonX, buttonY, buttonW, buttonH);
      ctx.fillStyle = BRAND_NAVY;
      ctx.font = '700 5.3px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(buttonText, buttonX + buttonW / 2, buttonY + 10.7);
      ctx.textAlign = 'left';
      if (url) links.push({ x: buttonX, y: buttonY, w: buttonW, h: buttonH, url: absoluteUrl(url) });
      y += rowHeight;
    };

    if (workOrder) {
      drawRecord('ORDEN DE TRABAJO', value(workOrder.workOrderNumber), value(workOrder.statusLabel), workOrder.viewUrl, 'ABRIR OT');
    }
    receipts.forEach((receipt) => {
      drawRecord('RECIBO', value(receipt.receiptNumber), money(receipt.amountUsd, 'USD'), receipt.viewUrl, 'ABRIR RECIBO');
    });

    if (portalUrl) {
      const rowHeight = 24;
      strokeRect(ctx, margin, y, contentWidth, rowHeight, '#f6f8fa');
      ctx.fillStyle = MUTED;
      ctx.font = '700 5px Arial';
      ctx.fillText('EXPEDIENTE COMPLETO', margin + 7, y + 9);
      ctx.fillStyle = '#176799';
      ctx.font = '700 5.5px Arial';
      const visible = portalUrl.replace('https://', '');
      ctx.fillText(visible, margin + 7, y + 18);
      links.push({ x: margin + 5, y: y + 10, w: Math.min(contentWidth - 10, ctx.measureText(visible).width + 8), h: 11, url: portalUrl });
      y += rowHeight;
    }

    if (y - dossierTop > 135) {
      // Mantiene el pie dentro de la página incluso con varios recibos.
      y = Math.min(y, PAGE_HEIGHT - 35);
    }
  }

  ctx.strokeStyle = '#d1d5db';
  ctx.beginPath();
  ctx.moveTo(margin, PAGE_HEIGHT - 23);
  ctx.lineTo(PAGE_WIDTH - margin, PAGE_HEIGHT - 23);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = '5px Arial';
  ctx.fillText('RUC 4012805831001E', margin, PAGE_HEIGHT - 14);
  ctx.textAlign = 'center';
  ctx.fillText('visual.elankav.com', PAGE_WIDTH / 2, PAGE_HEIGHT - 14);
  ctx.textAlign = 'right';
  ctx.fillText('WhatsApp +505 7882 8089', PAGE_WIDTH - margin, PAGE_HEIGHT - 14);
  ctx.textAlign = 'left';

  const jpegBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.97));
  const pdfBytes = buildPdf(jpegBytes, canvas.width, canvas.height, links);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const fileName = `${value(quotation.quotationNumber) || 'cotizacion-ELANVISUAL'}.pdf`;
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
