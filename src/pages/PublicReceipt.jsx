import React, { useEffect, useMemo, useState } from 'react';
import '../styles/public-receipt.css';

const CONNECT_BASE_URL = 'https://connect.elankav.com';
const PLATFORM_URL = 'https://visual.elankav.com';
const PHONE_DISPLAY = '+505 7882 8089';
const PHONE_LINK = 'tel:+50578828089';
const OFFICIAL_LOGO = '/assets/branding/visualkav.svg';

const money = (value, currency = 'USD') => new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(Number(value || 0));

function paymentTypeLabel(value) {
  if (value === 'deposit') return 'Anticipo';
  if (value === 'balance') return 'Cancelación';
  if (value === 'refund') return 'Reembolso';
  return 'Pago';
}

function paymentMethodLabel(value) {
  if (value === 'bank_transfer' || value === 'transfer') return 'Transferencia / depósito bancario';
  if (value === 'electronic_withdrawal') return 'Retiro sin tarjeta / electrónico';
  if (value === 'cash') return 'Efectivo';
  if (value === 'card') return 'Tarjeta';
  if (value === 'cheque') return 'Cheque';
  if (value === 'other') return 'Otro';
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
  const originalCurrency = String(receipt.originalCurrency || 'USD').toUpperCase();
  const isNio = originalCurrency === 'NIO';

  return (
    <main className="public-receipt-shell">
      <section className="public-receipt-card">
        <header className="receipt-head">
          <div className="receipt-brand-box">
            <img className="receipt-brand-logo" src={OFFICIAL_LOGO} alt="Visual KAV" />
          </div>
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
            <Row label="Referencia bancaria" value={receipt.paymentReference} />
            {isNio ? <Row label="Monto recibido" value={money(receipt.originalAmount, 'NIO')} strong /> : null}
            {isNio ? <Row label="Tipo de cambio" value={`C$ ${Number(receipt.exchangeRate || 0).toFixed(4)} / USD`} /> : null}
            <Row label={isNio ? 'Monto aplicado' : 'Monto recibido'} value={money(receipt.amountUsd, 'USD')} strong />
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
