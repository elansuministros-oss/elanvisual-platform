import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Printer, ReceiptText, RefreshCw } from 'lucide-react';
import { createCustomerPayment, listCustomerPayments } from '../services/customerPaymentsService';
import {
  bankingData,
  officialReceiptNumber,
  paymentLabel,
  printReceiptDocument
} from '../renderers/receiptDocumentRenderer';

const METHODS = [['transfer', 'Transferencia bancaria'], ['deposit', 'Depósito bancario'], ['cash', 'Efectivo'], ['card', 'Tarjeta'], ['other', 'Otro']];
const OPERATIONS = [
  ['USD_TO_USD', 'Pago USD → cuenta USD', 'USD', 'USD'],
  ['NIO_TO_NIO', 'Pago NIO → cuenta NIO', 'NIO', 'NIO'],
  ['USD_TO_NIO', 'Cliente envía USD → banco acredita NIO', 'USD', 'NIO'],
  ['NIO_TO_USD', 'Cliente envía NIO → banco acredita USD', 'NIO', 'USD']
];

const money = (value, currency = 'USD') => new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(Number(value || 0));
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const dateInputValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
const emptyForm = () => ({ operationType: 'USD_TO_USD', customerAmount: '', bankAmount: '', exchangeRate: '', paymentMethod: 'transfer', bankName: '', paymentReference: '', paidAt: dateInputValue(), notes: '', bankFee: '' });

function operationConfig(type) {
  const operation = OPERATIONS.find(([value]) => value === type) || OPERATIONS[0];
  return { customerCurrency: operation[2], bankCurrency: operation[3] };
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
  const currencies = operationConfig(form.operationType);
  const customerAmount = Number(form.customerAmount || 0);
  const bankAmount = Number(form.bankAmount || 0);
  const manualExchangeRate = form.operationType === 'NIO_TO_NIO';
  const converted = currencies.customerCurrency !== currencies.bankCurrency;
  const bankRequired = ['transfer', 'deposit'].includes(form.paymentMethod);
  const derivedExchangeRate = converted && customerAmount > 0 && bankAmount > 0
    ? (currencies.customerCurrency === 'USD' ? bankAmount / customerAmount : customerAmount / bankAmount)
    : 1;
  const exchangeRate = manualExchangeRate ? Number(form.exchangeRate || 0) : derivedExchangeRate;
  const appliedAmountUsd = currencies.customerCurrency === 'USD'
    ? customerAmount
    : (currencies.bankCurrency === 'USD' ? bankAmount : (exchangeRate > 0 ? customerAmount / exchangeRate : 0));

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
    if (!(customerAmount > 0) || !(bankAmount > 0)) {
      setError('Ingresá los montos enviados y acreditados.');
      return;
    }
    if (bankRequired && !form.bankName.trim()) {
      setError('Indicá el banco receptor del depósito o transferencia.');
      return;
    }
    if (manualExchangeRate && !(exchangeRate > 0)) {
      setError('Ingresá el tipo de cambio en córdobas por cada USD.');
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
    setSaving(true);
    setError('');
    try {
      const result = await createCustomerPayment(projectId, {
        quotationId: quotation.quotationId,
        status: 'confirmed',
        concept: pendingBalance && applied >= pendingBalance ? 'Cancelación de cotización' : totalPaid > 0 ? 'Abono de cotización' : 'Anticipo de cotización',
        amount: applied,
        currency: 'USD',
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference,
        paidAt: new Date(form.paidAt).toISOString(),
        notes: form.notes,
        metadata: {
          banking: {
            operationType: form.operationType,
            bankName: form.bankName.trim(),
            customerPayment: { currency: currencies.customerCurrency, amount: roundMoney(customerAmount) },
            bankCredit: { currency: currencies.bankCurrency, amount: roundMoney(bankAmount) },
            effectiveExchangeRate: roundMoney(exchangeRate),
            appliedAmountUsd: applied,
            bankFee: roundMoney(form.bankFee || 0),
            bankFeeAbsorbedBy: 'ELANKAV'
          }
        }
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
    <div className="qv-finance-heading"><div><span className="qv-eyebrow">Centro financiero</span><h2>Pagos y recibos</h2><p>Registra pagos USD/NIO y la acreditación bancaria real.</p></div><button type="button" onClick={load} disabled={loading}><RefreshCw size={17}/>{loading ? 'Cargando' : 'Actualizar'}</button></div>
    {error && <div className="qv-operational-error">{error}</div>}
    <div className="qv-finance-metrics"><div><span>Total cotización</span><strong>{money(quotationTotal)}</strong></div><div><span>Total pagado</span><strong>{money(totalPaid)}</strong></div><div><span>Saldo</span><strong>{money(pendingBalance)}</strong></div><div className={depositCompleted ? 'is-complete' : ''}><span>Anticipo</span><strong>{depositCompleted ? 'Confirmado' : 'Pendiente'}</strong></div></div>
    <form className="qv-payment-form" onSubmit={submit}>
      <label className="wide">Tipo de operación<select value={form.operationType} onChange={(e) => setForm({ ...form, operationType: e.target.value, customerAmount: '', bankAmount: '', exchangeRate: '' })}>{OPERATIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Monto enviado ({currencies.customerCurrency})<input type="number" min="0.01" step="0.01" value={form.customerAmount} onChange={(e) => setForm({ ...form, customerAmount: e.target.value })} required/></label>
      <label>Monto acreditado ({currencies.bankCurrency})<input type="number" min="0.01" step="0.01" value={form.bankAmount} onChange={(e) => setForm({ ...form, bankAmount: e.target.value })} required/></label>
      <label>TC efectivo (NIO por USD)<input type="number" min={manualExchangeRate ? '0.0001' : undefined} step="0.0001" value={manualExchangeRate ? form.exchangeRate : (exchangeRate > 0 ? exchangeRate.toFixed(4) : '')} onChange={manualExchangeRate ? (e) => setForm({ ...form, exchangeRate: e.target.value }) : undefined} readOnly={!manualExchangeRate} required={manualExchangeRate}/></label>
      <label>Aplicado USD<input value={appliedAmountUsd > 0 ? roundMoney(appliedAmountUsd).toFixed(2) : ''} readOnly/></label>
      <label>Método<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value, bankName: ['transfer', 'deposit'].includes(e.target.value) ? form.bankName : '' })}>{METHODS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Banco receptor<input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder={bankRequired ? 'BAC, Banpro, Lafise…' : 'No aplica'} disabled={!bankRequired} required={bankRequired}/></label>
      <label>Referencia<input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="Transferencia o depósito"/></label>
      <label>Fecha<input type="datetime-local" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })}/></label>
      <label>Comisión bancaria<input type="number" min="0" step="0.01" value={form.bankFee} onChange={(e) => setForm({ ...form, bankFee: e.target.value })} placeholder="Absorbida por ELANKAV"/></label>
      <label className="wide">Observaciones<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/></label>
      <button type="submit" disabled={saving || pendingBalance === 0}><Banknote size={18}/>{saving ? 'Registrando…' : pendingBalance === 0 ? 'Cotización cancelada' : 'Registrar pago'}</button>
    </form>
    <div className="qv-payment-history"><h3>Historial</h3>{!loading && payments.length === 0 && <p>No hay pagos registrados.</p>}{payments.map((payment) => { const banking = bankingData(payment); return <article key={payment.id}><div><ReceiptText size={18}/><strong>{officialReceiptNumber(payment)}</strong><span>{paymentLabel(payment)} · {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-NI')}{banking.bankName ? ` · ${banking.bankName}` : ''}</span></div><div><strong>{money(payment.amount)}</strong><small>Saldo {money(payment.pending_balance)}</small></div><button type="button" onClick={() => printReceiptDocument(payment, quotation)}><Printer size={17}/>Imprimir</button>{payment.deposit_completed && <CheckCircle2 size={19} className="qv-payment-ok"/>}</article>; })}</div>
  </section>;
}
