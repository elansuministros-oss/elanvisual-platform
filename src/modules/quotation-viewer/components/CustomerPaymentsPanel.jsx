import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, ExternalLink, MessageCircle, Printer, ReceiptText, RefreshCw } from 'lucide-react';
import { createCustomerPayment, listCustomerPayments } from '../services/customerPaymentsService';
import {
  bankingData,
  officialReceiptNumber,
  paymentLabel,
  printReceiptDocument
} from '../renderers/receiptDocumentRenderer';

const METHODS = [
  ['bank', 'Transferencia / depósito bancario'],
  ['electronic_withdrawal', 'Retiro sin tarjeta / electrónico'],
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
  withdrawalCollected: false,
  paidAt: dateInputValue(),
  notes: ''
});

function publicReceiptUrl(payment) {
  const receiptNumber = officialReceiptNumber(payment);
  if (!/^ELV-REC-\d{4}-\d{6}$/.test(receiptNumber)) return '';
  return `https://visual.elankav.com/${encodeURIComponent(receiptNumber)}`;
}

function whatsappReceiptUrl(payment) {
  const receiptNumber = officialReceiptNumber(payment);
  const receiptUrl = publicReceiptUrl(payment);
  if (!receiptUrl) return '';
  const message = `Hola, le compartimos su recibo ELANVISUAL ${receiptNumber}. Puede verlo o descargarlo en PDF aquí: ${receiptUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
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
  const bankRequired = ['bank', 'cheque', 'electronic_withdrawal'].includes(form.method);
  const referenceRequired = ['bank', 'electronic_withdrawal'].includes(form.method);

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
    if (referenceRequired && !form.paymentReference.trim()) {
      setError('Indicá la referencia bancaria u operación.');
      return;
    }
    if (form.method === 'cheque' && !form.chequeNumber.trim()) {
      setError('Indicá el número de cheque.');
      return;
    }
    if (form.method === 'electronic_withdrawal' && !form.withdrawalCollected) {
      setError('Confirmá que el retiro electrónico ya fue cobrado antes de registrarlo como pago.');
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

    const paymentMethod = form.method === 'bank'
      ? 'transfer'
      : form.method === 'electronic_withdrawal'
        ? 'electronic_withdrawal'
        : form.method === 'cheque'
          ? 'cheque'
          : 'cash';
    const metadata = {};

    if (form.method === 'bank') {
      metadata.banking = {
        operationType: form.currency === 'USD' ? 'USD_TO_USD' : 'NIO_TO_USD',
        bankName: form.bankName.trim(),
        reference: form.paymentReference.trim(),
        customerPayment: { currency: form.currency, amount: roundMoney(enteredAmount) },
        bankCredit: { currency: 'USD', amount: applied },
        effectiveExchangeRate: form.currency === 'USD' ? 1 : roundMoney(exchangeRate),
        appliedAmountUsd: applied,
        bankFee: 0,
        bankFeeAbsorbedBy: 'ELANKAV'
      };
    }

    if (form.method === 'electronic_withdrawal') {
      metadata.electronicWithdrawal = {
        collected: true,
        bankName: form.bankName.trim(),
        reference: form.paymentReference.trim(),
        currency: form.currency,
        amount: roundMoney(enteredAmount),
        effectiveExchangeRate: form.currency === 'USD' ? 1 : roundMoney(exchangeRate),
        appliedAmountUsd: applied
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
      <label>Forma de pago<select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value, bankName: '', paymentReference: '', chequeNumber: '', chequeDate: '', withdrawalCollected: false })}>{METHODS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Moneda<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value, exchangeRate: '' })}><option value="USD">USD</option><option value="NIO">NIO - Córdoba</option></select></label>
      <label>Monto recibido<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required/></label>
      {form.currency === 'NIO' && <label>Tipo de cambio C$/USD<input type="number" min="0.0001" step="0.0001" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} required/></label>}
      {form.currency === 'NIO' && <label>Monto aplicado USD<input value={appliedAmountUsd > 0 ? roundMoney(appliedAmountUsd).toFixed(2) : ''} readOnly/></label>}
      {bankRequired && <label>Banco<input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="BAC, Banpro, LAFISE…" required/></label>}
      {referenceRequired && <label>Referencia bancaria / operación<input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="Número o referencia" required/></label>}
      {form.method === 'cheque' && <label>Número de cheque<input value={form.chequeNumber} onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })} required/></label>}
      {form.method === 'cheque' && <label>Fecha del cheque<input type="date" value={form.chequeDate} onChange={(e) => setForm({ ...form, chequeDate: e.target.value })}/></label>}
      {form.method === 'electronic_withdrawal' && <label className="wide"><input type="checkbox" checked={form.withdrawalCollected} onChange={(e) => setForm({ ...form, withdrawalCollected: e.target.checked })}/> Confirmo que el retiro electrónico ya fue cobrado/recibido</label>}
      <label>Fecha de pago<input type="datetime-local" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })}/></label>
      <label className="wide">Observaciones<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/></label>
      <button type="submit" disabled={saving || pendingBalance === 0}><Banknote size={18}/>{saving ? 'Registrando…' : pendingBalance === 0 ? 'Cotización cancelada' : 'Registrar pago'}</button>
    </form>
    <div className="qv-payment-history"><h3>Historial</h3>{!loading && payments.length === 0 && <p>No hay pagos registrados.</p>}{payments.map((payment) => { const banking = bankingData(payment); const publicUrl = publicReceiptUrl(payment); const whatsappUrl = whatsappReceiptUrl(payment); return <article key={payment.id}><div><ReceiptText size={18}/><strong>{officialReceiptNumber(payment)}</strong><span>{paymentLabel(payment)} · {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-NI')}{banking.bankName ? ` · ${banking.bankName}` : ''}</span></div><div><strong>{money(payment.amount)}</strong><small>Saldo {money(payment.pending_balance)}</small></div>{publicUrl && <button type="button" onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={17}/>PDF</button>}{whatsappUrl && <button type="button" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}><MessageCircle size={17}/>WhatsApp</button>}<button type="button" onClick={() => printReceiptDocument(payment, quotation)}><Printer size={17}/>Imprimir</button>{payment.deposit_completed && <CheckCircle2 size={19} className="qv-payment-ok"/>}</article>; })}</div>
  </section>;
}
