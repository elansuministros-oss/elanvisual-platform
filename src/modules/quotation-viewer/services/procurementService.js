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

export function createPurchaseOrder(projectId, input) {
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders`, { method: 'POST', body: input });
}

export function getPurchaseOrderDocument(projectId, purchaseOrderId) {
  return request(`quotations/${encodeURIComponent(projectId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/document`);
}

export function createPurchaseInvoice(input) {
  return request('procurement/invoices', { method: 'POST', body: input });
}

export function listPurchaseInvoices(assignmentStatus = '') {
  return request(`procurement/invoices${assignmentStatus ? `?assignmentStatus=${encodeURIComponent(assignmentStatus)}` : ''}`);
}

export function allocateInvoice(invoiceId, allocations) {
  return request(`procurement/invoices/${encodeURIComponent(invoiceId)}/allocations`, { method: 'POST', body: { allocations } });
}

export function listInventory() {
  return request('procurement/inventory');
}

export function issueInventory(inventoryItemId, input) {
  return request(`procurement/inventory/${encodeURIComponent(inventoryItemId)}/issue`, { method: 'POST', body: input });
}

export function getCostReport(projectId) {
  return request(`quotations/${encodeURIComponent(projectId)}/cost-report`);
}

export function base64PdfToFile(document) {
  const binary = atob(document.dataBase64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], document.fileName || 'orden-compra.pdf', { type: document.mimeType || 'application/pdf' });
}
