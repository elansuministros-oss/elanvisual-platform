import React, { useEffect, useMemo, useState } from 'react';
import '../styles/public-receipt.css';

const CONNECT_BASE_URL = 'https://connect.elankav.com';
const PLATFORM_URL = 'https://visual.elankav.com';
const PHONE_DISPLAY = '+505 7882 8089';
const PHONE_LINK = 'tel:+50578828089';
const OFFICIAL_LOGO = 'data:image/png;base64,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';

const money = (value) => new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

function paymentTypeLabel(value) {
  if (value === 'deposit') return 'Anticipo';
  if (value === 'balance') return 'Cancelación';
  if (value === 'refund') return 'Reembolso';
  return 'Pago';
}

function paymentMethodLabel(value) {
  if (value === 'bank_transfer' || value === 'transfer') return 'Transferencia bancaria';
  if (value === 'cash') return 'Efectivo';
  if (value === 'card') return 'Tarjeta';
  if (value === 'cheque' || value === 'other') return 'Cheque / Otro';
  return value || 'No especificado';
}

function Row({ label, value, strong = false }) {
  if (value === undefined || value === null || value === '') return null;
  return <div><span>{label}</span><strong className={strong ? 'receipt-amount' : ''}>{value}</strong></div>;
}

export default function PublicReceipt() {
  const receiptNumber = useMemo(() => String(window.location.pathname || '').replace(/^\/+|\/+$/g, '').toUpperCase(), []);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`${CONNECT_BASE_URL}/api/v1/business/vqs/public/receipts/${encodeURIComponent(receiptNumber)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error?.message || 'No fue posible consultar el recibo.');
        if (payload?.data?.platform && String(payload.data.platform).toUpperCase() !== 'ELANVISUAL') {
          throw new Error('Este recibo pertenece a otra plataforma ELANKAV.');
        }
        if (active) setReceipt(payload?.data || null);
      } catch (cause) {
        if (active) setError(cause?.message || 'No fue posible consultar el recibo.');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (/^ELV-REC-\d{4}-\d{6}$/.test(receiptNumber)) void load();
    else { setError('Número de recibo ELANVISUAL no válido.'); setLoading(false); }
    return () => { active = false; };
  }, [receiptNumber]);

  if (loading) return <main className="public-receipt-shell"><div className="receipt-status">Cargando recibo…</div></main>;
  if (error || !receipt) return <main className="public-receipt-shell"><div className="receipt-status receipt-error"><strong>Recibo no disponible</strong><span>{error || 'No encontramos este recibo.'}</span></div></main>;

  const isPaid = Number(receipt.pendingBalanceUsd || 0) <= 0.009 && Number(receipt.quotationTotalUsd || 0) > 0;

  return (
    <main className="public-receipt-shell">
      <section className="public-receipt-card">
        <header className="receipt-head">
          <img className="receipt-brand-logo" src={OFFICIAL_LOGO} alt="Visual Kay" />
          <span>RECIBO OFICIAL</span>
          <h1>{receipt.receiptNumber}</h1>
        </header>

        <div className="receipt-body">
          <div className="receipt-project"><small>PROYECTO</small><strong>{receipt.projectName || 'Proyecto ELANVISUAL'}</strong></div>

          <h2 className="receipt-section-title">Datos del documento</h2>
          <div className="receipt-grid">
            <Row label="Tipo de pago" value={paymentTypeLabel(receipt.paymentType)} />
            <Row label="Cotización" value={receipt.quotationNumber} />
            <Row label="Fecha de pago" value={new Date(receipt.paidAt).toLocaleString('es-NI')} />
            <Row label="Cliente" value={receipt.customerName} />
            <Row label="Empresa" value={receipt.companyName} />
            <Row label="Ejecutivo" value={receipt.executiveName} />
          </div>

          <h2 className="receipt-section-title">Detalle del pago</h2>
          <div className="receipt-grid">
            <Row label="Forma de pago" value={paymentMethodLabel(receipt.paymentMethod)} />
            <Row label="Banco" value={receipt.bankName} />
            <Row label="Monto recibido" value={money(receipt.amountUsd)} strong />
          </div>

          <h2 className="receipt-section-title">Resumen financiero</h2>
          <div className="receipt-grid receipt-financial">
            <Row label="Total de la cotización" value={money(receipt.quotationTotalUsd)} />
            <Row label="Total pagado" value={money(receipt.totalPaidUsd)} />
            <Row label="Saldo pendiente" value={money(receipt.pendingBalanceUsd)} strong />
          </div>

          {receipt.notes ? <div className="receipt-notes"><small>OBSERVACIONES</small><p>{receipt.notes}</p></div> : null}
          <div className={`receipt-paid ${isPaid ? 'is-paid' : ''}`}>{isPaid ? 'PAGADO' : 'PAGO REGISTRADO'}</div>
        </div>

        <footer className="receipt-footer">
          <strong>ELANVISUAL</strong>
          <span>Documento oficial de recepción de pago</span>
          <div className="receipt-contact">
            <a href={PLATFORM_URL}>visual.elankav.com</a><span>•</span><a href={PHONE_LINK}>{PHONE_DISPLAY}</a>
          </div>
        </footer>
      </section>

      <div className="receipt-actions">
        <button type="button" onClick={() => window.print()}>Descargar PDF</button>
        <a href={PLATFORM_URL}>Ir a ELANVISUAL</a>
      </div>
    </main>
  );
}
