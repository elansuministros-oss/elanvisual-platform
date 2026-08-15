import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Camera, PackageCheck, Receipt, RefreshCw, Send, ShoppingCart, Upload, WalletCards } from 'lucide-react';
import {
  allocateInvoice,
  base64PdfToFile,
  createPurchaseInvoice,
  createPurchaseOrder,
  extractProcurementDocument,
  getCostReport,
  getPurchaseOrderDocument,
  issueInventory,
  listInventory,
  listOpenWorkOrders,
  listProviders,
  listPurchaseInvoices,
  listRequirements,
  saveRequirements
} from '../services/procurementService';
import '../../../styles/procurement-panel.css';

const money = (value, currency = 'USD') => new Intl.NumberFormat('es-NI', { style: 'currency', currency: currency === 'NIO' ? 'NIO' : 'USD' }).format(Number(value || 0));
const remaining = (line) => Math.max(0, Number(line.quantity || 0) - Number(line.assignedQty || 0));
const requirementKey = (description, unit) => `${String(description || '').trim().toLowerCase()}|${String(unit || 'unidad').trim().toLowerCase()}`;
const serviceWords = ['impresión', 'impresion', 'corte', 'grabado', 'instalación', 'instalacion', 'montaje', 'diseño', 'diseno', 'servicio', 'transporte', 'mantenimiento'];
const inferRequirementKind = (description) => serviceWords.some((word) => String(description || '').toLowerCase().includes(word)) ? 'service' : 'material';

function FileButton({ accept, label, icon: Icon = Upload, onFile, disabled }) {
  const id = `file-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return <label className={`proc-file-button ${disabled ? 'is-disabled' : ''}`} htmlFor={id}>
    <Icon size={18}/>{label}
    <input id={id} type="file" accept={accept} disabled={disabled} onChange={(event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) onFile(file);
    }}/>
  </label>;
}

export default function ProcurementPanel({ projectId, workOrder, purchaseOrders = [], onRefresh }) {
  const [tab, setTab] = useState('needs');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [requirementDraft, setRequirementDraft] = useState(null);
  const [requirementFileName, setRequirementFileName] = useState('');
  const [invoiceDraft, setInvoiceDraft] = useState(null);
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [openWorkOrders, setOpenWorkOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [providers, setProviders] = useState([]);
  const [costReport, setCostReport] = useState(null);
  const [allocationTargets, setAllocationTargets] = useState({});
  const [allocationQty, setAllocationQty] = useState({});
  const [ocSupplierId, setOcSupplierId] = useState('');
  const [ocPaymentCondition, setOcPaymentCondition] = useState('cash');
  const [ocCreditDays, setOcCreditDays] = useState('30');
  const [ocLines, setOcLines] = useState({});
  const [ocCurrency, setOcCurrency] = useState('');
  const [inventoryIssueQty, setInventoryIssueQty] = useState({});
  const [inventoryRequirement, setInventoryRequirement] = useState({});
  const [inventoryReason, setInventoryReason] = useState({});

  const workOrderId = workOrder?.id || '';
  const pendingRequirements = useMemo(() => requirements.filter((item) => !['acquired', 'delivered', 'executed', 'cancelled'].includes(item.status)), [requirements]);
  const ocRequirements = useMemo(() => requirements.filter((item) => item.status !== 'cancelled' && (!['acquired', 'delivered', 'executed'].includes(item.status) || Boolean(ocLines[item.id]))), [requirements, ocLines]);
  const materialRequirements = useMemo(() => requirements.filter((item) => item.kind === 'material' && item.status !== 'cancelled'), [requirements]);

  async function loadAll() {
    setBusy(true); setError('');
    try {
      const [needRows, invoiceRows, otRows, inventoryRows, providerRows, report] = await Promise.all([
        workOrderId ? listRequirements(projectId, workOrderId) : Promise.resolve([]),
        listPurchaseInvoices('pending'),
        listOpenWorkOrders(),
        listInventory(),
        listProviders(),
        getCostReport(projectId).catch(() => null)
      ]);
      setRequirements(Array.isArray(needRows) ? needRows : []);
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : []);
      setOpenWorkOrders(Array.isArray(otRows) ? otRows : []);
      setInventory(Array.isArray(inventoryRows) ? inventoryRows : []);
      setProviders(Array.isArray(providerRows) ? providerRows : []);
      setCostReport(report);
    } catch (cause) {
      setError(cause.message || 'No fue posible cargar Compras.');
    } finally { setBusy(false); }
  }

  useEffect(() => { void loadAll(); }, [projectId, workOrderId]);

  async function readRequirements(file) {
    if (!workOrderId) { setError('Primero debe existir una OT.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const extracted = await extractProcurementDocument('requirements', file);
      setRequirementDraft(Array.isArray(extracted?.items) ? extracted.items : []);
      setRequirementFileName(file.name);
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function confirmRequirements() {
    if (!requirementDraft?.length) return;
    setBusy(true); setError('');
    try {
      await saveRequirements(projectId, workOrderId, requirementDraft, requirementFileName);
      setRequirementDraft(null); setRequirementFileName(''); setMessage('Lista de necesidades cargada en la OT.');
      await loadAll();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function readInvoice(file) {
    setBusy(true); setError(''); setMessage('');
    try {
      const extracted = await extractProcurementDocument('invoice', file);
      setInvoiceDraft(extracted);
      setInvoiceFileName(file.name);
      setTab('invoice');
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function confirmInvoice() {
    if (!invoiceDraft?.items?.length) return;
    setBusy(true); setError('');
    try {
      const saved = await createPurchaseInvoice({
        supplier: invoiceDraft.supplier,
        invoiceNumber: invoiceDraft.invoiceNumber,
        invoiceDate: invoiceDraft.invoiceDate,
        currency: invoiceDraft.currency,
        subtotal: invoiceDraft.subtotal,
        taxTotal: invoiceDraft.taxTotal,
        total: invoiceDraft.total,
        ...(workOrderId ? { projectId, workOrderId } : {}),
        sourceFileName: invoiceFileName,
        sourceMimeType: 'application/octet-stream',
        extractionPayload: invoiceDraft,
        items: invoiceDraft.items
      });
      setInvoiceDraft(null); setInvoiceFileName(''); setMessage(`Compra ${saved.invoiceNumber || ''} registrada. Podés asignarla o usar sus líneas para preparar la OC.`);
      await loadAll();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function prepareInvoiceForCurrentOt(invoice) {
    if (!workOrderId) return false;
    const sourceLines = Array.isArray(invoice?.lines) ? invoice.lines.filter((line) => Number(line.quantity || 0) > 0) : [];
    if (!sourceLines.length) return false;

    let currentRequirements = Array.isArray(requirements) ? requirements : [];
    const existingKeys = new Set(currentRequirements.map((item) => requirementKey(item.description, item.unit)));
    const newLines = sourceLines.filter((line) => !existingKeys.has(requirementKey(line.description, line.unit)));

    if (newLines.length) {
      const items = newLines.map((line) => ({
        kind: inferRequirementKind(line.description),
        description: line.description,
        specification: `Origen: factura ${invoice.invoiceNumber || 's/n'} · ${invoice.supplierName || 'proveedor'}`,
        quantity: Number(line.quantity || 0),
        unit: line.unit || 'unidad',
        critical: false
      }));
      await saveRequirements(projectId, workOrderId, items, invoice.sourceFileName || `factura-${invoice.invoiceNumber || invoice.id || 'compra'}`);
      currentRequirements = await listRequirements(projectId, workOrderId);
      setRequirements(Array.isArray(currentRequirements) ? currentRequirements : []);
    }

    const requirementMap = new Map((Array.isArray(currentRequirements) ? currentRequirements : []).map((item) => [requirementKey(item.description, item.unit), item]));
    const prepared = {};
    sourceLines.forEach((line) => {
      const requirement = requirementMap.get(requirementKey(line.description, line.unit));
      if (!requirement?.id) return;
      prepared[requirement.id] = {
        requirementId: requirement.id,
        description: requirement.description,
        specification: requirement.specification || '',
        quantity: Number(requirement.requiredQty || line.quantity || 0),
        unit: requirement.unit || line.unit || 'unidad',
        unitPrice: String(Number(line.unitPrice || 0)),
        includesVat: false
      };
    });

    if (invoice.supplierId) setOcSupplierId(String(invoice.supplierId));
    setOcCurrency(['NIO','USD'].includes(String(invoice.currency || '').toUpperCase()) ? String(invoice.currency).toUpperCase() : '');
    setOcLines(prepared);
    return Object.keys(prepared).length > 0;
  }

  async function addInvoiceAsRequirements(invoice) {
    if (!workOrderId) { setError('Primero debe existir una OT.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const prepared = await prepareInvoiceForCurrentOt(invoice);
      if (!prepared) { setError('No fue posible preparar las líneas de la factura para esta OT.'); return; }
      setMessage(`Factura ${invoice.invoiceNumber || 's/n'} convertida/reconciliada con las necesidades de ${workOrder.workOrderNumber}. La OC quedó preparada con cantidades y costos de la factura.`);
      setTab('orders');
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function assignInvoice(invoice) {
    const allocations = [];
    invoice.lines.forEach((line) => {
      const pendingQty = remaining(line);
      const requestedQty = Number(allocationQty[line.id] || pendingQty);
      const qty = Math.min(pendingQty, requestedQty);
      const target = allocationTargets[line.id] || '';
      if (!(qty > 0) || !target || target === 'pending') return;
      if (target === 'inventory') {
        allocations.push({ invoiceLineId: line.id, destinationType: 'inventory', quantity: qty, amount: qty * Number(line.unitPrice || 0), reason: 'Ingreso desde factura' });
        return;
      }
      if (target === 'overhead') {
        allocations.push({ invoiceLineId: line.id, destinationType: 'overhead', quantity: qty, amount: qty * Number(line.unitPrice || 0), reason: 'Gasto general' });
        return;
      }
      const [targetProjectId, targetWorkOrderId] = target.split('|');
      allocations.push({ invoiceLineId: line.id, destinationType: 'project', projectId: targetProjectId, workOrderId: targetWorkOrderId, quantity: qty, amount: qty * Number(line.unitPrice || 0), reason: 'Compra asignada a OT' });
    });
    if (!allocations.length) { setError('Seleccioná al menos un destino para esta factura.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const touchesCurrentOt = allocations.some((item) => item.destinationType === 'project' && item.projectId === projectId && item.workOrderId === workOrderId);
      let ocPrepared = false;
      if (touchesCurrentOt) ocPrepared = await prepareInvoiceForCurrentOt(invoice);

      await allocateInvoice(invoice.id, allocations);
      setAllocationQty({});
      await loadAll();

      if (ocPrepared) {
        setMessage(`Compra asignada a ${workOrder.workOrderNumber}. Sus líneas quedaron reconciliadas como necesidades y la OC está preparada con proveedor, moneda, cantidades y costos de la factura.`);
        setTab('orders');
      } else {
        setMessage('Compra asignada. Si quedó cantidad pendiente podés asignarla a otro proyecto o inventario.');
      }
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  function toggleOcLine(requirement, checked) {
    setOcLines((current) => {
      const next = { ...current };
      if (!checked) delete next[requirement.id];
      else next[requirement.id] = {
        requirementId: requirement.id,
        description: requirement.description,
        specification: requirement.specification || '',
        quantity: Number(requirement.requiredQty || 0),
        unit: requirement.unit || 'unidad',
        unitPrice: '',
        includesVat: false
      };
      return next;
    });
  }

  async function generateOc() {
    const lines = Object.values(ocLines).map((line) => ({ ...line, unitPrice: Number(line.unitPrice || 0) }));
    if (!ocSupplierId || !lines.length) { setError('Seleccioná proveedor y al menos una necesidad.'); return; }
    if (lines.some((line) => !(line.quantity > 0) || line.unitPrice < 0)) { setError('Revisá cantidades y costos unitarios.'); return; }
    setBusy(true); setError('');
    try {
      const order = await createPurchaseOrder(projectId, {
        workOrderId,
        supplierId: ocSupplierId,
        currency: ocCurrency || providers.find((provider) => provider.id === ocSupplierId)?.currency || 'USD',
        paymentCondition: ocPaymentCondition,
        ...(ocPaymentCondition === 'credit' ? { creditDays: Number(ocCreditDays || 30) } : {}),
        lines
      });
      setOcLines({}); setOcCurrency(''); setMessage(`Orden ${order.purchaseOrderNumber} generada.`);
      await onRefresh?.(); await loadAll();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function shareOrder(order) {
    setBusy(true); setError('');
    try {
      const ocDocument = await getPurchaseOrderDocument(projectId, order.id);
      const file = base64PdfToFile(ocDocument);
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: order.purchaseOrderNumber, text: ocDocument.whatsappMessage, files: [file] });
      } else {
        const url = URL.createObjectURL(file);
        const link = window.document.createElement('a');
        link.href = url; link.download = file.name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        const phone = String(ocDocument.providerPhone || '').replace(/\D/g, '');
        if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(ocDocument.whatsappMessage)}`, '_blank', 'noopener,noreferrer');
        setMessage('PDF descargado. Adjuntalo al chat del proveedor.');
      }
    } catch (cause) { if (cause?.name !== 'AbortError') setError(cause.message); } finally { setBusy(false); }
  }

  async function deliverInventory(item) {
    if (!workOrderId) { setError('Primero debe existir una OT.'); return; }
    const quantity = Number(inventoryIssueQty[item.id] || 0);
    const requirementId = inventoryRequirement[item.id] || '';
    const reason = inventoryReason[item.id] || '';
    if (!(quantity > 0)) { setError('Indicá la cantidad a entregar.'); return; }
    setBusy(true); setError('');
    try {
      const result = await issueInventory(item.id, {
        projectId,
        workOrderId,
        quantity,
        ...(requirementId ? { requirementId } : {}),
        ...(reason ? { reason } : {})
      });
      setInventoryIssueQty((current) => ({ ...current, [item.id]: '' }));
      setInventoryReason((current) => ({ ...current, [item.id]: '' }));
      setMessage(result.extra ? 'Salida adicional registrada con su justificación.' : 'Material entregado a la OT.');
      await loadAll();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  return <section className="proc-panel" aria-label="Compras, abastecimiento e inventario">
    <header className="proc-header">
      <div><span>Operación</span><h2>Compras / Abastecimiento</h2><p>{workOrder ? `${workOrder.workOrderNumber} · ${projectId}` : 'El anticipo debe aplicarse antes de generar la OT.'}</p></div>
      <button type="button" onClick={loadAll} disabled={busy}><RefreshCw size={17}/>{busy ? 'Procesando' : 'Actualizar'}</button>
    </header>
    {error && <div className="proc-alert is-error">{error}</div>}
    {message && <div className="proc-alert is-ok">{message}</div>}
    <nav className="proc-tabs">
      {[['needs','Necesidades',PackageCheck],['invoice','Factura',Receipt],['orders','OC',ShoppingCart],['inventory','Inventario',Archive],['report','Gastos',WalletCards]].map(([key,label,Icon]) => <button key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={17}/><span>{label}</span></button>)}
    </nav>

    {tab === 'needs' && <div className="proc-section">
      <div className="proc-toolbar"><FileButton accept="application/pdf,image/*,.txt,.csv" label="Cargar lista" onFile={readRequirements} disabled={busy || !workOrderId}/><small>PDF, foto, TXT o CSV. CONNECT extrae materiales y servicios.</small></div>
      {requirementDraft && <div className="proc-review"><h3>Revisar lista · {requirementFileName}</h3>{requirementDraft.map((item,index) => <div className="proc-line" key={`${item.description}-${index}`}><div><strong>{item.description}</strong><small>{item.kind} · {item.specification || 'Sin especificación'}</small></div><span>{item.quantity} {item.unit}</span></div>)}<button type="button" className="proc-primary" onClick={confirmRequirements}>Confirmar lista</button></div>}
      <div className="proc-list"><h3>Lista autorizada de la OT</h3>{!requirements.length && <p>No hay necesidades cargadas.</p>}{requirements.map((item) => <article key={item.id}><div><strong>{item.description}</strong><small>{item.specification || item.kind}</small></div><div><b>{item.requiredQty} {item.unit}</b><span className={`proc-status ${item.status}`}>{item.status}</span></div></article>)}</div>
    </div>}

    {tab === 'invoice' && <div className="proc-section">
      <div className="proc-toolbar"><FileButton accept="application/pdf,image/*,.txt,.csv" label="Cargar factura" icon={Camera} onFile={readInvoice} disabled={busy}/><small>No necesitás conocer el número de OT al cargarla.</small></div>
      {invoiceDraft && <div className="proc-review"><h3>{invoiceDraft.supplier?.tradeName || 'Proveedor detectado'}</h3><p>Factura {invoiceDraft.invoiceNumber || 's/n'} · {invoiceDraft.invoiceDate || ''} · <strong>{money(invoiceDraft.total, invoiceDraft.currency)}</strong></p>{invoiceDraft.items?.map((item,index) => <div className="proc-line" key={`${item.description}-${index}`}><div><strong>{item.description}</strong><small>{item.quantity} {item.unit} × {money(item.unitPrice, invoiceDraft.currency)}</small></div><span>{money(item.total, invoiceDraft.currency)}</span></div>)}<button type="button" className="proc-primary" onClick={confirmInvoice}>Confirmar compra</button></div>}
      <div className="proc-list"><h3>Compras por asignar</h3>{!invoices.length && <p>No hay facturas pendientes.</p>}{invoices.map((invoice) => <article className="proc-invoice" key={invoice.id}><div className="proc-invoice-head"><div><strong>{invoice.supplierName}</strong><small>{invoice.invoiceNumber || 'Sin número'} · {money(invoice.total, invoice.currency)}</small></div><span className="proc-status pending">{invoice.assignmentStatus}</span></div>{invoice.lines.filter((line) => remaining(line) > 0).map((line) => <div className="proc-allocation" key={line.id}><div><strong>{line.description}</strong><small>Pendiente {remaining(line)} {line.unit}</small></div><input type="number" min="0.0001" max={remaining(line)} step="0.0001" placeholder={`Cantidad · ${remaining(line)}`} value={allocationQty[line.id] || ''} onChange={(event) => setAllocationQty((current) => ({ ...current, [line.id]: event.target.value }))}/><select value={allocationTargets[line.id] || 'pending'} onChange={(event) => setAllocationTargets((current) => ({ ...current, [line.id]: event.target.value }))}><option value="pending">Asignar después</option><option value="inventory">Inventario</option><option value="overhead">Gasto general</option>{openWorkOrders.map((ot) => <option key={ot.id} value={`${ot.projectId}|${ot.id}`}>{ot.customerName ? `${ot.customerName} · ` : ''}{ot.title || ot.projectNumber} · {ot.workOrderNumber}</option>)}</select></div>)}{workOrder && <button type="button" className="proc-secondary" onClick={() => addInvoiceAsRequirements(invoice)} disabled={busy}>Usar factura en esta OT y preparar OC</button>}<button type="button" className="proc-secondary" onClick={() => assignInvoice(invoice)}>Asignar seleccionados</button></article>)}</div>
    </div>}

    {tab === 'orders' && <div className="proc-section">
      {!workOrder && <div className="proc-empty">Primero aplicá el anticipo y generá la OT.</div>}
      {workOrder && <><div className="proc-form-row"><label>Proveedor<select value={ocSupplierId} onChange={(event) => { setOcSupplierId(event.target.value); if (!Object.keys(ocLines).length) setOcCurrency(''); }}><option value="">Seleccionar proveedor</option>{providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}</option>)}</select></label><label>Condición<select value={ocPaymentCondition} onChange={(event) => setOcPaymentCondition(event.target.value)}><option value="cash">Contado</option><option value="credit">Crédito</option></select></label>{ocPaymentCondition === 'credit' && <label>Días<input type="number" min="1" value={ocCreditDays} onChange={(event) => setOcCreditDays(event.target.value)}/></label>}</div>{ocCurrency && <div className="proc-alert is-ok">Moneda de la OC tomada de la factura: <strong>{ocCurrency}</strong></div>}<div className="proc-list"><h3>Seleccionar necesidades para esta OC</h3>{!ocRequirements.length && <><p>Esta OT todavía no tiene necesidades. Podés convertir una compra pendiente en necesidades sin volver a cargar la lista.</p>{invoices.map((invoice) => <article key={invoice.id}><div><strong>{invoice.supplierName}</strong><small>{invoice.invoiceNumber || 'Sin número'} · {money(invoice.total, invoice.currency)}</small></div><button type="button" className="proc-secondary" onClick={() => addInvoiceAsRequirements(invoice)} disabled={busy}>Usar esta factura</button></article>)}</>}{ocRequirements.map((item) => { const selected = Boolean(ocLines[item.id]); return <article key={item.id} className={selected ? 'selected' : ''}><label className="proc-check"><input type="checkbox" checked={selected} onChange={(event) => toggleOcLine(item, event.target.checked)}/><span><strong>{item.description}</strong><small>{item.requiredQty} {item.unit}{['acquired','delivered','executed'].includes(item.status) ? ` · ${item.status}` : ''}</small></span></label>{selected && <input className="proc-price" type="number" min="0" step="0.01" placeholder="Costo unitario real" value={ocLines[item.id]?.unitPrice || ''} onChange={(event) => setOcLines((current) => ({ ...current, [item.id]: { ...current[item.id], unitPrice: event.target.value } }))}/>}</article>})}</div><button type="button" className="proc-primary" onClick={generateOc} disabled={busy || !ocSupplierId || !Object.keys(ocLines).length}>Generar OC formal</button></>}
      <div className="proc-list"><h3>Órdenes del proyecto</h3>{!purchaseOrders.length && <p>No hay órdenes.</p>}{purchaseOrders.map((order) => <article key={order.id}><div><strong>{order.purchaseOrderNumber}</strong><small>{order.supplierName || order.supplierId} · {order.status}</small></div><div className="proc-order-actions"><b>{money(order.total, order.currency)}</b><button type="button" onClick={() => shareOrder(order)}><Send size={16}/>PDF / WhatsApp</button></div></article>)}</div>
    </div>}

    {tab === 'inventory' && <div className="proc-section"><div className="proc-list"><h3>Inventario interno</h3>{!inventory.length && <p>Inventario vacío.</p>}{inventory.map((item) => <article className="proc-inventory-row" key={item.id}><div><strong>{item.description}</strong><small>Costo promedio {money(item.avgUnitCost, item.currency)} · Disponible {item.qtyAvailable} {item.unit}</small></div>{workOrder ? <div className="proc-inventory-issue"><select value={inventoryRequirement[item.id] || ''} onChange={(event) => setInventoryRequirement((current) => ({ ...current, [item.id]: event.target.value }))}><option value="">Salida general de esta OT</option>{materialRequirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.description} · autorizado {requirement.requiredQty} {requirement.unit}</option>)}</select><input type="number" min="0.0001" step="0.0001" placeholder="Cantidad" value={inventoryIssueQty[item.id] || ''} onChange={(event) => setInventoryIssueQty((current) => ({ ...current, [item.id]: event.target.value }))}/><input type="text" placeholder="Motivo si es adicional" value={inventoryReason[item.id] || ''} onChange={(event) => setInventoryReason((current) => ({ ...current, [item.id]: event.target.value }))}/><button type="button" className="proc-secondary" onClick={() => deliverInventory(item)}>Entregar a OT</button></div> : <b>{item.qtyAvailable} {item.unit}</b>}</article>)}</div></div>}

    {tab === 'report' && <div className="proc-section">{costReport ? <div className="proc-report"><div><span>Venta</span><strong>{money(costReport.saleTotal)}</strong></div><div><span>Compras directas</span><strong>{money(costReport.directPurchases)}</strong></div><div><span>Inventario consumido</span><strong>{money(costReport.inventoryConsumption)}</strong></div><div><span>Costo real</span><strong>{money(costReport.realCost)}</strong></div><div className={Number(costReport.profit) >= 0 ? 'profit' : 'loss'}><span>Resultado</span><strong>{money(costReport.profit)}</strong><small>{costReport.marginPercent == null ? '' : `${Number(costReport.marginPercent).toFixed(1)}% margen`}</small></div></div> : <p>Aún no hay costos suficientes para calcular el resultado.</p>}</div>}
  </section>;
}
