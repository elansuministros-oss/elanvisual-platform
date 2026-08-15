import React, { useEffect, useMemo, useState } from 'react';
import '../styles/supplier-purchase-order-portal.css';

const CONNECT_BASE = 'https://connect.elankav.com/api/v1/business/vqs';
const money = (value, currency) => new Intl.NumberFormat('es-NI', { style: 'currency', currency: currency === 'NIO' ? 'NIO' : 'USD' }).format(Number(value || 0));

export default function SupplierPurchaseOrderPortal() {
  const token = useMemo(() => decodeURIComponent(window.location.pathname.split('/oc/proveedor/')[1] || '').trim(), []);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    if (!token) { setError('El enlace de la orden no es válido.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch(`${CONNECT_BASE}/purchase-orders/supplier/${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || 'No fue posible abrir la orden de compra.');
      const order = payload.data;
      setData(order);
      setForm({
        promisedDeliveryDate: order.promisedDeliveryDate || '',
        deliveryMode: order.deliveryMode || 'full',
        supplierNotes: order.supplierNotes || '',
        items: (order.items || []).map((item) => ({
          lineId: item.lineId,
          supplierStatus: item.supplierStatus || 'pending',
          readyQty: item.readyQty ?? 0,
          deliveredQty: item.deliveredQty ?? 0,
          supplierNote: item.supplierNote || ''
        }))
      });
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  useEffect(() => { void load(); }, [token]);

  function patchItem(index, patch) {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  async function downloadPdf() {
    setDownloadBusy(true); setError('');
    try {
      const response = await fetch(`${CONNECT_BASE}/purchase-orders/supplier/${encodeURIComponent(token)}/document`, { headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible descargar la orden de compra.');
      const document = payload?.data ?? payload;
      const binary = atob(document.dataBase64 || '');
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      const blob = new Blob([bytes], { type: document.mimeType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName || `${data?.purchaseOrderNumber || 'orden-compra'}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (cause) { setError(cause.message); } finally { setDownloadBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${CONNECT_BASE}/purchase-orders/supplier/${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || 'No fue posible guardar el avance.');
      setData(payload.data);
      setMessage('Actualización guardada. ELANVISUAL ya puede ver este avance.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  if (busy && !data) return <main className="supplier-po-shell"><div className="supplier-po-card"><p>Cargando orden de compra…</p></div></main>;
  if (error && !data) return <main className="supplier-po-shell"><div className="supplier-po-card"><h1>Orden de compra</h1><div className="supplier-po-error">{error}</div></div></main>;
  if (!data || !form) return null;

  return <main className="supplier-po-shell">
    <section className="supplier-po-card">
      <header className="supplier-po-header">
        <div><div className="supplier-po-brand">ELANVISUAL</div><small>ELANKAV · Gestión de proveedores</small></div>
        <div><span>ORDEN DE COMPRA</span><h1>{data.purchaseOrderNumber}</h1></div>
      </header>

      {error && <div className="supplier-po-error">{error}</div>}
      {message && <div className="supplier-po-ok">{message}</div>}
      {data.closed && <div className="supplier-po-ok"><strong>OC cerrada.</strong> El pago fue procesado y esta orden ya no admite cambios.</div>}

      <div className="supplier-po-summary">
        <div><span>Proveedor</span><strong>{data.supplierName}</strong></div>
        <div><span>Total OC</span><strong>{money(data.total, data.currency)}</strong></div>
        <div><span>Estado</span><strong>{String(data.status || '').toUpperCase()}</strong></div>
        <div><span>Pago</span><strong>{data.paymentStatus ? String(data.paymentStatus).toUpperCase() : 'Pendiente de recepción'}</strong></div>
      </div>

      <button className="supplier-po-submit" type="button" disabled={downloadBusy} onClick={downloadPdf}>{downloadBusy ? 'Preparando PDF…' : 'Descargar orden de compra PDF'}</button>

      <form onSubmit={save}>
        <section className="supplier-po-section">
          <h2>Compromiso de entrega</h2>
          <div className="supplier-po-form-grid">
            <label>Fecha estimada de entrega<input type="date" required disabled={data.closed} value={form.promisedDeliveryDate} onChange={(event) => setForm((current) => ({ ...current, promisedDeliveryDate: event.target.value }))}/></label>
            <label>Modalidad<select disabled={data.closed} value={form.deliveryMode} onChange={(event) => setForm((current) => ({ ...current, deliveryMode: event.target.value }))}><option value="full">Entrega completa</option><option value="partial">Entrega parcial</option></select></label>
          </div>
          <label>Observaciones<textarea disabled={data.closed} rows="3" value={form.supplierNotes} onChange={(event) => setForm((current) => ({ ...current, supplierNotes: event.target.value }))} placeholder="Indicá aquí cualquier condición o reprogramación."/></label>
        </section>

        <section className="supplier-po-section">
          <h2>Avance por ítem</h2>
          <p className="supplier-po-help">Podés actualizar cada ítem por separado. ELANVISUAL validará internamente la recepción antes de habilitar el pago.</p>
          <div className="supplier-po-items">
            {data.items.map((item, index) => <article key={item.lineId}>
              <div className="supplier-po-item-title"><span>{index + 1}</span><div><strong>{item.description}</strong><small>Ordenado: {item.orderedQty} {item.unit}{item.specification ? ` · ${item.specification}` : ''}</small></div></div>
              <div className="supplier-po-item-fields">
                <label>Estado<select disabled={data.closed} value={form.items[index].supplierStatus} onChange={(event) => patchItem(index, { supplierStatus: event.target.value })}><option value="pending">Pendiente</option><option value="in_progress">En proceso</option><option value="ready">Listo</option><option value="delivered">Entregado</option></select></label>
                <label>Cantidad lista<input disabled={data.closed} type="number" min="0" max={item.orderedQty} step="0.0001" value={form.items[index].readyQty} onChange={(event) => patchItem(index, { readyQty: event.target.value })}/></label>
                <label>Cantidad entregada<input disabled={data.closed} type="number" min="0" max={item.orderedQty} step="0.0001" value={form.items[index].deliveredQty} onChange={(event) => patchItem(index, { deliveredQty: event.target.value })}/></label>
              </div>
              <label>Nota del ítem<input disabled={data.closed} type="text" value={form.items[index].supplierNote} onChange={(event) => patchItem(index, { supplierNote: event.target.value })} placeholder="Opcional"/></label>
              <div className="supplier-po-internal">Recepción ELANVISUAL: <strong>{item.internalReceivedQty} {item.unit}</strong> · {item.internalConformity === 'conforming' ? 'Conforme' : item.internalConformity === 'nonconforming' ? 'No conforme' : 'Pendiente de validar'}</div>
            </article>)}
          </div>
        </section>

        {!data.closed && <button className="supplier-po-submit" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar confirmación y avance'}</button>}
      </form>

      <footer>visual.elankav.com · +505 7882 8089</footer>
    </section>
  </main>;
}
