import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Printer, ReceiptText, RefreshCw, Send } from 'lucide-react';
import { createCustomerPayment, listCustomerPayments } from '../services/customerPaymentsService';
import {
  bankingData,
  officialReceiptNumber,
  paymentLabel,
  printReceiptDocument
} from '../renderers/receiptDocumentRenderer';

const METHODS = [
  ['bank', 'Banco'],
  ['cash', 'Efectivo'],
  ['cheque', 'Cheque']
];

const money = (value, currency = 'USD') => new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(Number(value || 0));
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const dateInputValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const emptyForm = () => ({
  method: 'bank',
  currency: 'USD',
  amount: '',
  exchangeRate: '',
  bankName: '',
  paymentReference: '',
  chequeNumber: '',
  chequeDate: '',
  paidAt: dateInputValue(),
  notes: ''
});

function normalizeWhatsappPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 8) return `505${digits}`;
  if (digits.startsWith('505') && digits.length === 11) return digits;
  return digits.length >= 10 ? digits : '';
}

function openWhatsappReceipt(payment, quotation) {
  const target = normalizeWhatsappPhone(
    payment.customer_snapshot?.phone
    || payment.customer_snapshot?.whatsapp
    || quotation.customer?.phone
    || quotation.customer?.whatsapp
  );

  if (!target) {
    window.alert('El cliente no tiene un número de WhatsApp válido registrado.');
    return;
  }

  const receiptNumber = officialReceiptNumber(payment);
  const customerName = payment.customer_snapshot?.name || quotation.customer?.name || '';
  const brandName = quotation.brand?.name || quotation.brand?.displayName || 'ELANVISUAL';
  const message = [
    customerName ? `Hola ${customerName},` : 'Hola,',
    '',
    `Le compartimos su recibo oficial ${receiptNumber} de ${brandName}.`,
    `Pago recibido: ${money(payment.amount, payment.currency || 'USD')}.`,
    Number(payment.pending_balance) > 0
      ? `Saldo pendiente: ${money(payment.pending_balance, payment.currency || 'USD')}.`
      : 'Estado: PAGADO.',
    '',
    'Adjuntaremos el documento oficial en este chat.'
  ].join('\n');

  const encodedMessage = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${target}&text=${encodedMessage}`;
  const webUrl = `https://api.whatsapp.com/send?phone=${target}&text=${encodedMessage}&type=phone_number&app_absent=0`;

  const fallbackTimer = window.setTimeout(() => {
    if (document.visibilityState === 'visible') window.location.assign(webUrl);
  }, 900);

  const clearFallback = () => {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') clearFallback();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.location.href = appUrl;
}

export default function CustomerPaymentsPanel({ projectId, quotation, onDepositCompleted }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const confirmed = useMemo(() => payments.filter((payment) => payment.status === 'confirmed'), [payments]);
  const latest = confirmed[0] || null;
  const quotationTotal = Number(latest?.quotation_total ?? quotation?.totals?.totalUsd ?? 0);
  const totalPaid = confirmed.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingBalance = Math.max(quotationTotal - totalPaid, 0);
  const depositCompleted = confirmed.some((payment) => payment.deposit_completed);

  const enteredAmount = Number(form.amount || 0);
  const exchangeRate = Number(form.exchangeRate || 0);
  const appliedAmountUsd = form.currency === 'USD'
    ? enteredAmount
    : (exchangeRate > 0 ? enteredAmount / exchangeRate : 0);
  const bankRequired = form.method === 'bank' || form.method === 'cheque';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const rows = await listCustomerPayments(projectId);
      setPayments(Array.isArray(rows) ? rows : []);
    } catch (requestError) {
      setError(requestError.message || 'No fue posible consultar los pagos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [projectId]);

  async function submit(event) {
    event.preventDefault();
    const applied = roundMoney(appliedAmountUsd);

    if (!(enteredAmount > 0)) {
      setError('Ingresá el monto recibido.');
      return;
    }
    if (form.currency === 'NIO' && !(exchangeRate > 0)) {
      setError('Ingresá el tipo de cambio en córdobas por cada USD.');
      return;
    }
    if (bankRequired && !form.bankName.trim()) {
      setError('Indicá el banco.');
      return;
    }
    if (form.method === 'cheque' && !form.chequeNumber.trim()) {
      setError('Indicá el número de cheque.');
      return;
    }
    if (!(applied > 0)) {
      setError('No fue posible calcular el monto aplicado en USD.');
      return;
    }
    if (pendingBalance > 0 && applied > pendingBalance + 0.01) {
      setError('El monto aplicado no puede superar el saldo pendiente.');
      return;
    }
    if (!quotation.quotationId) {
      setError('La cotización no entregó quotationId; no se registró ningún pago.');
      return;
    }

    const paymentMethod = form.method === 'bank' ? 'transfer' : form.method === 'cheque' ? 'other' : 'cash';
    const metadata = {};

    if (form.method === 'bank') {
      metadata.banking = {
        operationType: form.currency === 'USD' ? 'USD_TO_USD' : 'NIO_TO_USD',
        bankName: form.bankName.trim(),
        customerPayment: { currency: form.currency, amount: roundMoney(enteredAmount) },
        bankCredit: { currency: 'USD', amount: applied },
        effectiveExchangeRate: form.currency === 'USD' ? 1 : roundMoney(exchangeRate),
        appliedAmountUsd: applied,
        bankFee: 0,
        bankFeeAbsorbedBy: 'ELANKAV'
      };
    }

    if (form.method === 'cheque') {
      metadata.cheque = {
        bankName: form.bankName.trim(),
        number: form.chequeNumber.trim(),
        date: form.chequeDate || null,
        currency: form.currency,
        amount: roundMoney(enteredAmount),
        effectiveExchangeRate: form.currency === 'USD' ? 1 : roundMoney(exchangeRate)
      };
    }

    setSaving(true);
    setError('');
    try {
      const result = await createCustomerPayment(projectId, {
        quotationId: quotation.quotationId,
        status: 'confirmed',
        concept: pendingBalance && applied >= pendingBalance ? 'Cancelación de cotización' : totalPaid > 0 ? 'Abono de cotización' : 'Anticipo de cotización',
        amount: applied,
        currency: 'USD',
        paymentMethod,
        paymentReference: form.paymentReference,
        paidAt: new Date(form.paidAt).toISOString(),
        notes: form.notes,
        metadata
      });
      setForm(emptyForm());
      await load();
      if (result?.balance?.depositCompleted) onDepositCompleted?.();
    } catch (requestError) {
      const details = requestError.details?.length ? ` ${requestError.details.join(' · ')}` : '';
      setError(`${requestError.message || 'No fue posible registrar el pago.'}${details}`);
    } finally {
      setSaving(false);
    }
  }

  return <section className="qv-finance-panel" aria-label="Pagos y recibos">
    <div className="qv-finance-heading"><div><span className="qv-eyebrow">Centro financiero</span><h2>Pagos y recibos</h2><p>Registra el pago con los datos mínimos necesarios.</p></div><button type="button" onClick={load} disabled={loading}><RefreshCw size={17}/>{loading ? 'Cargando' : 'Actualizar'}</button></div>
    {error && <div className="qv-operational-error">{error}</div>}
    <div className="qv-finance-metrics"><div><span>Total cotización</span><strong>{money(quotationTotal)}</strong></div><div><span>Total pagado</span><strong>{money(totalPaid)}</strong></div><div><span>Saldo</span><strong>{money(pendingBalance)}</strong></div><div className={depositCompleted ? 'is-complete' : ''}><span>Anticipo</span><strong>{depositCompleted ? 'Confirmado' : 'Pendiente'}</strong></div></div>
    <form className="qv-payment-form" onSubmit={submit}>
      <label>Forma de pago<select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value, bankName: '', paymentReference: '', chequeNumber: '', chequeDate: '' })}>{METHODS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Moneda<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value, exchangeRate: '' })}><option value="USD">USD</option><option value="NIO">NIO</option></select></label>
      <label>Monto recibido<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required/></label>
      {form.currency === 'NIO' && <label>Tipo de cambio<input type="number" min="0.0001" step="0.0001" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} required/></label>}
      {form.currency === 'NIO' && <label>Aplicado USD<input value={appliedAmountUsd > 0 ? roundMoney(appliedAmountUsd).toFixed(2) : ''} readOnly/></label>}
      {bankRequired && <label>Banco<input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="BAC, Banpro, Lafise…" required/></label>}
      {form.method === 'bank' && <label>Referencia<input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="Opcional"/></label>}
      {form.method === 'cheque' && <label>Número de cheque<input value={form.chequeNumber} onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })} required/></label>}
      {form.method === 'cheque' && <label>Fecha del cheque<input type="date" value={form.chequeDate} onChange={(e) => setForm({ ...form, chequeDate: e.target.value })}/></label>}
      <label>Fecha de pago<input type="datetime-local" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })}/></label>
      <label className="wide">Observaciones<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/></label>
      <button type="submit" disabled={saving || pendingBalance === 0}><Banknote size={18}/>{saving ? 'Registrando…' : pendingBalance === 0 ? 'Cotización cancelada' : 'Registrar pago'}</button>
    </form>
    <div className="qv-payment-history"><h3>Historial</h3>{!loading && payments.length === 0 && <p>No hay pagos registrados.</p>}{payments.map((payment) => { const banking = bankingData(payment); return <article key={payment.id}><div><ReceiptText size={18}/><strong>{officialReceiptNumber(payment)}</strong><span>{paymentLabel(payment)} · {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-NI')}{banking.bankName ? ` · ${banking.bankName}` : ''}</span></div><div><strong>{money(payment.amount)}</strong><small>Saldo {money(payment.pending_balance)}</small></div><div className="qv-payment-actions"><button type="button" onClick={() => printReceiptDocument(payment, quotation)}><Printer size={17}/>Imprimir</button><button type="button" onClick={() => openWhatsappReceipt(payment, quotation)}><Send size={17}/>Enviar al cliente</button></div>{payment.deposit_completed && <CheckCircle2 size={19} className="qv-payment-ok"/>}</article>; })}</div>
  </section>;
}
