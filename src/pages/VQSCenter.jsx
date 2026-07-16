import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Printer, RefreshCcw, Search, Send, X } from 'lucide-react';
import { listQuotations } from '../lib/vqsCenterClient';

const PRIMARY = '#111827';
const SECONDARY = '#C9A227';

function money(value, currency = 'USD') {
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(Number(value || 0));
}

function normalizePhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 8) return `505${digits}`;
  if (digits.length === 11 && digits.startsWith('505')) return digits;
  return digits;
}

function firstPayment(quotation) {
  const installments = quotation?.paymentTerms?.installments || [];
  return installments[0] || null;
}

export default function VQSCenter() {
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listQuotations({ limit: 200 });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No fue posible cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const customer = row.customer || {};
      return [row.quotationNumber, row.status, customer.name, customer.companyName, customer.phone]
        .some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [rows, query]);

  const sendWhatsApp = (quotation) => {
    const customer = quotation.customer || {};
    const phone = normalizePhone(customer.phone || customer.whatsapp || '');
    if (!phone) return alert('La cotización no tiene un número de WhatsApp válido.');
    const payment = firstPayment(quotation);
    const message = [
      `Hola ${customer.name || 'cliente'}, le compartimos la cotización ${quotation.quotationNumber || ''} de ELANVISUAL.`,
      `Total: ${money(quotation.totalUsd)}.`,
      payment ? `${payment.label || 'Anticipo'}: ${money(payment.amountUsd)} (${payment.percentage || 0}%).` : '',
      quotation.publicUrl ? `Documento: ${quotation.publicUrl}` : '',
      'Quedamos atentos a su confirmación.'
    ].filter(Boolean).join('\n');
    if (!window.confirm(`Enviar cotización a ${customer.name || 'cliente'} · +${phone}?`)) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>
      <section style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header style={{ background: PRIMARY, color: '#fff', borderRadius: 18, padding: 24, marginBottom: 20 }}>
          <img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" style={{ height: 44, maxWidth: 240, marginBottom: 12 }} />
          <h1 style={{ margin: 0 }}>Centro de Cotizaciones</h1>
          <p style={{ marginBottom: 0, opacity: .78 }}>Consulta, verifica, imprime y envía cotizaciones VQS oficiales.</p>
        </header>

        <section style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#6b7280' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente, teléfono, código o estado" style={{ width: '100%', padding: '11px 12px 11px 40px', border: '1px solid #d1d5db', borderRadius: 10 }} />
          </div>
          <button type="button" onClick={load} disabled={loading} style={{ border: 0, borderRadius: 10, padding: '11px 16px', background: SECONDARY, color: PRIMARY, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}>
            <RefreshCcw size={17} /> {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </section>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 14, borderRadius: 12, marginBottom: 18 }}>{error}</div>}

        <section style={{ display: 'grid', gap: 12 }}>
          {filtered.map((row) => {
            const customer = row.customer || {};
            return (
              <article key={row.quotationId} style={{ background: '#fff', borderRadius: 14, padding: 18, borderLeft: `5px solid ${SECONDARY}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{row.quotationNumber || 'Sin código'}</strong>
                  <div style={{ marginTop: 6 }}>{customer.name || 'Cliente sin nombre'} · {customer.phone || 'Sin teléfono'}</div>
                  <small style={{ color: '#6b7280' }}>{row.status || 'draft'} · {money(row.totalUsd)} · {row.createdAt ? new Date(row.createdAt).toLocaleString('es-NI') : ''}</small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setActive(row)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #d1d5db', background: '#fff', display: 'flex', gap: 7, alignItems: 'center' }}><Eye size={16} /> Verificar</button>
                  <button type="button" onClick={() => sendWhatsApp(row)} style={{ padding: '9px 12px', borderRadius: 9, border: 0, background: '#16a34a', color: '#fff', display: 'flex', gap: 7, alignItems: 'center' }}><Send size={16} /> WhatsApp</button>
                </div>
              </article>
            );
          })}
          {!loading && filtered.length === 0 && <div style={{ background: '#fff', borderRadius: 14, padding: 24 }}>No se encontraron cotizaciones.</div>}
        </section>
      </section>

      {active && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,.72)', zIndex: 1000, overflowY: 'auto', padding: 20 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: PRIMARY, color: '#fff', padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" style={{ height: 40, maxWidth: 230 }} />
              <button type="button" onClick={() => setActive(null)} style={{ border: 0, background: 'transparent', color: '#fff' }}><X /></button>
            </div>
            <div id="vqs-official-document" style={{ padding: 28, color: PRIMARY }}>
              <div style={{ borderBottom: `4px solid ${SECONDARY}`, paddingBottom: 16, marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>COTIZACIÓN {active.quotationNumber}</h2>
                <p style={{ margin: '7px 0 0' }}>RUC 4012805831001E · visual.elankav.com · +505 7882 8089</p>
              </div>
              <h3>Cliente</h3>
              <p><strong>{active.customer?.name || 'Sin nombre'}</strong>{active.customer?.companyName ? ` · ${active.customer.companyName}` : ''}<br />{active.customer?.phone || 'Sin teléfono'} · {active.customer?.email || 'Sin correo'}</p>
              <h3>Detalle</h3>
              {(active.items || []).map((item, index) => <div key={item.itemId || index} style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}><strong>{item.title || 'Producto'}</strong><div>{item.description || ''}</div><small>{item.quantity || 1} {item.unit || 'unidad'} · {money(item.subtotalUsd)}</small></div>)}
              <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
                <div>Subtotal: <strong>{money(active.pricing?.subtotalUsd)}</strong></div>
                <div>IVA: <strong>{money(active.pricing?.taxUsd)}</strong></div>
                <div style={{ fontSize: 22, color: SECONDARY }}>TOTAL: <strong>{money(active.totalUsd)}</strong></div>
              </div>
              <h3>Forma de pago</h3>
              {(active.paymentTerms?.installments || []).map((payment, index) => <p key={index}>{payment.label || `Pago ${index + 1}`}: <strong>{payment.percentage}% · {money(payment.amountUsd)}</strong></p>)}
              <p style={{ marginTop: 28 }}><strong>Atendido por:</strong> {active.executive?.name || 'ELANVISUAL'}</p>
            </div>
            <div style={{ padding: 18, background: '#f9fafb', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => window.print()} style={{ padding: '10px 14px', borderRadius: 9, border: '1px solid #d1d5db', background: '#fff', display: 'flex', gap: 7, alignItems: 'center' }}><Printer size={16} /> Imprimir / PDF</button>
              <button type="button" onClick={() => sendWhatsApp(active)} style={{ padding: '10px 14px', borderRadius: 9, border: 0, background: '#16a34a', color: '#fff', display: 'flex', gap: 7, alignItems: 'center' }}><Send size={16} /> Enviar al cliente</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
