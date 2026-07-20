import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Printer, ReceiptText, RefreshCw } from 'lucide-react';
import { createCustomerPayment, listCustomerPayments } from '../services/customerPaymentsService';

const METHODS = [['transfer', 'Transferencia'], ['deposit', 'Depósito bancario'], ['cash', 'Efectivo'], ['card', 'Tarjeta'], ['other', 'Otro']];
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
const emptyForm = () => ({ operationType: 'USD_TO_USD', customerAmount: '', bankAmount: '', paymentMethod: 'transfer', paymentReference: '', paidAt: dateInputValue(), notes: '', bankFee: '' });

function operationConfig(type) {
  const operation = OPERATIONS.find(([value]) => value === type) || OPERATIONS[0];
  return { customerCurrency: operation[2], bankCurrency: operation[3] };
}

function paymentLabel(payment = {}) {
  if (Number(payment.pending_balance) === 0) return 'Cancelación';
  if (Number(payment.previous_paid) > 0) return 'Abono';
  return 'Anticipo';
}

function bankingData(payment = {}) {
  return payment.metadata?.banking || {};
}

function printReceipt(payment, quotation) {
  const customer = payment.customer_snapshot || quotation.customer || {};
  const executive = payment.executive_snapshot || quotation.executive || {};
  const banking = bankingData(payment);
  const customerPayment = banking.customerPayment || {};
  const bankCredit = banking.bankCredit || {};
  const windowRef = window.open('', '_blank');
  if (!windowRef) {
    window.alert('El navegador bloqueó la ventana del recibo. Habilitá ventanas emergentes e intentá nuevamente.');
    return;
  }
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const row = (label, value) => `<div><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`;
  const bankingRows = banking.operationType
    ? `${row('Cliente envió', money(customerPayment.amount, customerPayment.currency))}${row('Banco acreditó', money(bankCredit.amount, bankCredit.currency))}${customerPayment.currency !== bankCredit.currency ? row('TC efectivo', Number(banking.effectiveExchangeRate || 0).toFixed(4)) : ''}${row('Comisión bancaria', `${money(banking.bankFee || 0, bankCredit.currency)} · absorbida por ELANKAV`)}`
    : '';
  windowRef.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(payment.receipt_number)}</title><style>body{font-family:Arial,sans-serif;background:#f3f4f6;color:#111827;margin:0;padding:24px}.receipt{max-width:760px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px #0002}.head{background:#12385f;color:#fff;padding:28px}.head h1{margin:0}.body{padding:28px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.grid div{display:flex;justify-content:space-between;gap:20px;border-bottom:1px dashed #d1d5db;padding:10px 0}.total{font-size:22px}.footer{padding:20px 28px;background:#f8fafc}.actions{text-align:center;margin:20px}button{padding:12px 18px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:700}@media(max-width:640px){body{padding:8px}.body{padding:18px}.grid{grid-template-columns:1fr}}@media print{body{padding:0;background:#fff}.receipt{box-shadow:none}.actions{display:none}}</style></head><body><section class="receipt"><header class="head"><div>ELANVISUAL</div><h1>RECIBO OFICIAL</h1><p>${safe(payment.receipt_number)}</p></header><main class="body"><div class="grid">${row('Tipo', paymentLabel(payment))}${row('Cotización', quotation.quotationNumber || '')}${row('Cliente', customer.name || '')}${row('Empresa', customer.companyName || customer.company_name || '')}${row('Fecha', new Date(payment.paid_at || payment.created_at).toLocaleString('es-NI'))}${row('Método', payment.payment_method || '')}${row('Referencia', payment.payment_reference || '')}${row('Ejecutivo', executive.name || '')}</div><h2>Operación bancaria</h2><div class="grid">${bankingRows || row('Operación', 'Pago USD')}</div><h2>Detalle financiero</h2><div class="grid total">${row('Aplicado a cotización', money(payment.amount))}${row('Total pagado', money(payment.total_paid))}${row('Saldo pendiente', money(payment.pending_balance))}${row('Total cotización', money(payment.quotation_total))}</div><p><strong>Concepto:</strong> ${safe(payment.concept || 'Pago de cotización')}</p></main><footer class="footer">Documento emitido desde ELANKAV · visual.elankav.com</footer></section><div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`);
  windowRef.document.close();
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
  const converted = currencies.customerCurrency !== currencies.bankCurrency;
  const exchangeRate = converted && customerAmount > 0 && bankAmount > 0
    ? (currencies.customerCurrency === 'USD' ? bankAmount / customerAmount : customerAmount / bankAmount)
    : 1;
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
      <label className="wide">Tipo de operación<select value={form.operationType} onChange={(e) => setForm({ ...form, operationType: e.target.value, customerAmount: '', bankAmount: '' })}>{OPERATIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Monto enviado ({currencies.customerCurrency})<input type="number" min="0.01" step="0.01" value={form.customerAmount} onChange={(e) => setForm({ ...form, customerAmount: e.target.value })} required/></label>
      <label>Monto acreditado ({currencies.bankCurrency})<input type="number" min="0.01" step="0.01" value={form.bankAmount} onChange={(e) => setForm({ ...form, bankAmount: e.target.value })} required/></label>
      <label>TC efectivo<input value={converted && exchangeRate > 0 ? exchangeRate.toFixed(4) : '1.0000'} readOnly/></label>
      <label>Aplicado USD<input value={appliedAmountUsd > 0 ? roundMoney(appliedAmountUsd).toFixed(2) : ''} readOnly/></label>
      <label>Método<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{METHODS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Referencia<input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="Transferencia o depósito"/></label>
      <label>Fecha<input type="datetime-local" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })}/></label>
      <label>Comisión bancaria<input type="number" min="0" step="0.01" value={form.bankFee} onChange={(e) => setForm({ ...form, bankFee: e.target.value })} placeholder="Absorbida por ELANKAV"/></label>
      <label className="wide">Observaciones<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/></label>
      <button type="submit" disabled={saving || pendingBalance === 0}><Banknote size={18}/>{saving ? 'Registrando…' : pendingBalance === 0 ? 'Cotización cancelada' : 'Registrar pago'}</button>
    </form>
    <div className="qv-payment-history"><h3>Historial</h3>{!loading && payments.length === 0 && <p>No hay pagos registrados.</p>}{payments.map((payment) => { const banking = bankingData(payment); return <article key={payment.id}><div><ReceiptText size={18}/><strong>{payment.receipt_number}</strong><span>{paymentLabel(payment)} · {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-NI')}{banking.operationType ? ` · ${banking.operationType.replaceAll('_', ' → ')}` : ''}</span></div><div><strong>{money(payment.amount)}</strong><small>Saldo {money(payment.pending_balance)}</small></div><button type="button" onClick={() => printReceipt(payment, quotation)}><Printer size={17}/>Imprimir</button>{payment.deposit_completed && <CheckCircle2 size={19} className="qv-payment-ok"/>}</article>; })}</div>
  </section>;
}