async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api/ops/${path.replace(/^\/+/, '')}`, {
    method,
    headers: {
      Accept: 'application/json',
      'X-Elankav-Platform': 'ELANVISUAL',
      'X-Elankav-Actor-Type': 'user',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.error || 'No fue posible completar la operación.');
    error.code = payload?.error?.code || payload?.code || 'PROCUREMENT_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.error?.details || payload?.details || [];
    throw error;
  }
  return payload?.data ?? payload;
}

const normalizeLineKey = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('No fue posible leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function extractProcurementDocument(documentType, file) {
  return fileToDataUrl(file).then((fileData) => request('procurement/documents/extract', {
    method: 'POST',
    body: { documentType, fileName: file.name, mimeType: file.type || 'application/octet-stream', fileData }
  }));
}

export function listRequirements(projectId, workOrderId) {
  return request(`quotations/${encodeURIComponent(projectId)}/work-orders/${encodeURIComponent(workOrderId)}/requirements`);
}

export function saveRequirements(projectId, workOrderId, items, sourceFileName = '') {
  return request(`quotations/${encodeURIComponent(projectId)}/work-orders/${encodeURIComponent(workOrderId)}/requirements`, {
    method: 'POST', body: { items, sourceFileName }
  });
}

export function listProviders(q = '') {
  return request(`procurement/providers${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}

export function listOpenWorkOrders(q = '') {
  return request(`procurement/open-work-orders${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}

export async function createPurchaseOrder(projectId, input) {
  const originalLines = Array.isArray(input?.lines) ? input.lines : [];
  if (!originalLines.length) throw new Error('La OC requiere al menos una necesidad seleccionada.');

  let invoices = [];
  const needsRecoveredCost = originalLines.some((line) => !(Number(line?.unitPrice) > 0));
  if (needsRecoveredCost) invoices = await listPurchaseInvoices();

  const supplierId = String(input?.supplierId || '');
  const matchingInvoices = invoices.filter((invoice) => !supplierId || String(invoice?.supplierId || '') === supplierId);
  const enrichedLines = originalLines.map((line) => {
    const explicitPrice = Number(line?.unitPrice || 0);
    if (explicitPrice > 0) return { ...line, unitPrice: explicitPrice };
    const targetKey = normalizeLineKey(line?.description);
    let recovered = null;
    for (const invoice of matchingInvoices) {
      const matches = (Array.isArray(invoice?.lines) ? invoice.lines : []).filter((invoiceLine) => normalizeLineKey(invoiceLine?.description) === targetKey && Number(invoiceLine?.unitPrice) > 0);
      if (matches.length === 1) { recovered = { invoice, line: matches[0] }; break; }
    }
    if (!recovered) return { ...line, unitPrice: 0 };
    return { ...line, unitPrice: Number(recovered.line.unitPrice) };
  });

  const invalid = enrichedLines.filter((line) => !(Number(line?.quantity) > 0) || !(Number(line?.unitPrice) > 0));
  if (invalid.length) {
    const error = new Error('No se puede generar una OC con cantidades o costos en cero. Recuperá la compra/factura para cargar los costos reales antes de continuar.');
    error.code = 'PURCHASE_ORDER_ZERO_COST_BLOCKED';
    throw error;
  }

  let currency = String(input?.currency || '').toUpperCase();
  if (!['USD', 'NIO'].includes(currency) && matchingInvoices[0] && ['USD', 'NIO'].includes(String(matchingInvoices[0].currency || '').toUpperCase())) currency = String(matchingInvoices[0].currency).toUpperCase();

  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders`, {
    method: 'POST', body: { ...input, ...(currency ? { currency } : {}), lines: enrichedLines }
  });
}

export function updatePurchaseOrder(projectId, purchaseOrderId, patch) {
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}`, { method: 'PATCH', body: patch });
}

export function getSupplierPurchaseOrderAccess(projectId, purchaseOrderId) {
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/supplier-access`, { method: 'POST' });
}

export function receivePurchaseOrder(projectId, purchaseOrderId, items) {
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/receipt`, { method: 'PATCH', body: { items } });
}

export function updateSupplierPayment(projectId, purchaseOrderId, input) {
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/payment`, { method: 'PATCH', body: input });
}

export function sendPurchaseOrderOfficialWhatsApp(projectId, purchaseOrderId, document, phone = '') {
  let targetPhone = String(phone || document?.providerPhone || '').trim();
  if (!targetPhone && typeof window !== 'undefined') {
    targetPhone = String(window.prompt('Ingresá el número de WhatsApp del proveedor para enviar esta OC desde el número oficial de ELANVISUAL. Ejemplo: 88881234', '') || '').trim();
  }
  if (!targetPhone) {
    const error = new Error('El proveedor no tiene WhatsApp registrado. Ingresá el número para enviar la OC.');
    error.code = 'SUPPLIER_WHATSAPP_REQUIRED';
    throw error;
  }
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/send-whatsapp`, {
    method: 'POST',
    body: {
      phone: targetPhone,
      text: document?.whatsappMessage,
      fileName: document?.fileName || 'orden-compra.pdf',
      mimeType: document?.mimeType || 'application/pdf',
      dataBase64: document?.dataBase64 || ''
    }
  });
}

export async function getPurchaseOrderDocument(projectId, purchaseOrderId) {
  const document = await request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/document`);
  const officialDelivery = await sendPurchaseOrderOfficialWhatsApp(projectId, purchaseOrderId, document);
  document.officialSent = true;
  document.officialDelivery = officialDelivery;
  if (typeof window !== 'undefined' && document?.dataBase64) {
    const file = base64PdfToFile(document, true);
    const url = URL.createObjectURL(file);
    const preview = window.open(url, '_blank', 'noopener,noreferrer');
    if (!preview) {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return document;
}

export function createPurchaseInvoice(input) { return request('procurement/invoices', { method: 'POST', body: input }); }
export function listPurchaseInvoices(assignmentStatus = '') { return request(`procurement/invoices${assignmentStatus ? `?assignmentStatus=${encodeURIComponent(assignmentStatus)}` : ''}`); }
export function allocateInvoice(invoiceId, allocations) { return request(`procurement/invoices/${encodeURIComponent(invoiceId)}/allocations`, { method: 'POST', body: { allocations } }); }
export function listInventory() { return request('procurement/inventory'); }
export function issueInventory(inventoryItemId, input) { return request(`procurement/inventory/${encodeURIComponent(inventoryItemId)}/issue`, { method: 'POST', body: input }); }
export function getCostReport(projectId) { return request(`quotations/${encodeURIComponent(projectId)}/cost-report`); }

export function base64PdfToFile(document, allowOfficialPreview = false) {
  if (document?.officialSent && !allowOfficialPreview) {
    const handled = new Error('La OC ya fue enviada desde el WhatsApp oficial.');
    handled.name = 'AbortError';
    throw handled;
  }
  const binary = atob(document.dataBase64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], document.fileName || 'orden-compra.pdf', { type: document.mimeType || 'application/pdf' });
}
