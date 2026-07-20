import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Printer, ReceiptText, RefreshCw } from 'lucide-react';
import { createCustomerPayment, listCustomerPayments } from '../services/customerPaymentsService';

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

function paymentLabel(payment = {}) {
  if (Number(payment.pending_balance) === 0) return 'Pago total';
  if (Number(payment.previous_paid) > 0) return 'Abono';
  return 'Anticipo';
}

function paymentMethodLabel(method) {
  return METHODS.find(([value]) => value === method)?.[1] || method || 'No especificado';
}

function bankingData(payment = {}) {
  return payment.metadata?.banking || {};
}

function projectName(quotation = {}) {
  return quotation.projectName
    || quotation.project_name
    || quotation.project?.name
    || quotation.project?.title
    || quotation.title
    || quotation.name
    || quotation.projectId
    || quotation.id
    || 'Proyecto ELANKAV';
}

function printReceipt(payment, quotation) {
  const customer = payment.customer_snapshot || quotation.customer || {};
  const executive = payment.executive_snapshot || quotation.executive || {};
  const banking = bankingData(payment);
  const customerPayment = banking.customerPayment || {};
  const bankCredit = banking.bankCredit || {};
  const method = paymentMethodLabel(payment.payment_method);
  const isBankPayment = ['transfer', 'deposit'].includes(payment.payment_method);
  const windowRef = window.open('', '_blank');
  if (!windowRef) {
    window.alert('El navegador bloqueó la ventana del recibo. Habilitá ventanas emergentes e intentá nuevamente.');
    return;
  }
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const row = (label, value, className = '') => `<div class="data-row ${className}"><span>${safe(label)}</span><strong>${safe(value || '—')}</strong></div>`;
  const bankingRows = banking.operationType
    ? `${row('Cliente envió', money(customerPayment.amount, customerPayment.currency))}${row('Banco acreditó', money(bankCredit.amount, bankCredit.currency))}${banking.effectiveExchangeRate > 0 ? row('TC efectivo', Number(banking.effectiveExchangeRate).toFixed(4)) : ''}${row('Comisión bancaria', `${money(banking.bankFee || 0, bankCredit.currency)} · absorbida por ELANKAV`)}`
    : row('Operación', method);
  const bankRows = isBankPayment
    ? `${row('Banco receptor', banking.bankName || 'No especificado')}${row('Referencia bancaria', payment.payment_reference || 'No especificada')}`
    : row('Recepción', 'Pago recibido en efectivo');

  windowRef.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(payment.receipt_number)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#eef2f6;color:#172033;margin:0;padding:28px}.receipt{max-width:820px;margin:auto;background:#fff;border:1px solid #dbe3ec;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px rgba(18,56,95,.13)}.head{padding:30px 34px 24px;border-bottom:4px solid #12385f;background:#fff}.brand{font-size:13px;letter-spacing:.16em;color:#65758b;font-weight:700}.headline{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:8px}.head h1{margin:0;color:#12385f;font-size:30px;letter-spacing:.02em}.receipt-number{text-align:right}.receipt-number span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#718096}.receipt-number strong{font-size:17px}.status{display:inline-flex;margin-top:14px;padding:7px 12px;border-radius:999px;background:#eaf2f8;color:#12385f;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.body{padding:30px 34px}.section{margin-top:24px}.section:first-child{margin-top:0}.section-title{margin:0 0 12px;color:#12385f;font-size:14px;text-transform:uppercase;letter-spacing:.1em}.project-card{padding:18px 20px;border:1px solid #dbe3ec;border-left:5px solid #12385f;border-radius:12px;background:#f8fafc}.project-card span{display:block;color:#6b778c;font-size:12px;text-transform:uppercase;letter-spacing:.09em}.project-card strong{display:block;margin-top:6px;font-size:20px;line-height:1.3}.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:24px}.data-row{display:flex;justify-content:space-between;gap:18px;padding:11px 0;border-bottom:1px solid #e4e9ef}.data-row span{color:#5d6879}.data-row strong{text-align:right;color:#172033}.financial{border:1px solid #dbe3ec;border-radius:14px;padding:4px 18px}.financial .data-row strong{font-size:18px}.financial .emphasis strong{font-size:22px;color:#12385f}.notes{padding:14px 16px;border-radius:10px;background:#f8fafc;color:#3f4b5d;line-height:1.5}.footer{display:flex;justify-content:space-between;gap:18px;padding:20px 34px;background:#12385f;color:#fff;font-size:12px}.footer strong{display:block;margin-bottom:4px}.actions{text-align:center;margin:22px}button{padding:12px 20px;border:0;border-radius:10px;background:#12385f;color:#fff;font-weight:700;cursor:pointer}@media(max-width:640px){body{padding:8px}.head,.body{padding:22px}.headline{align-items:flex-start;flex-direction:column}.receipt-number{text-align:left}.grid{grid-template-columns:1fr}.footer{flex-direction:column}}@page{size:A4;margin:12mm}@media print{body{padding:0;background:#fff}.receipt{max-width:none;border:0;border-radius:0;box-shadow:none}.actions{display:none}.head,.body,.footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><section class="receipt"><header class="head"><div class="brand">ELANVISUAL · ELANKAV</div><div class="headline"><div><h1>RECIBO OFICIAL</h1><span class="status">${safe(paymentLabel(payment))}</span></div><div class="receipt-number"><span>Número de recibo</span><strong>${safe(payment.receipt_number)}</strong></div></div></header><main class="body"><section class="section"><div class="project-card"><span>Proyecto</span><strong>${safe(projectName(quotation))}</strong></div></section><section class="section"><h2 class="section-title">Datos del documento</h2><div class="grid">${row('Cotización', quotation.quotationNumber || '')}${row('Fecha de pago', new Date(payment.paid_at || payment.created_at).toLocaleString('es-NI'))}${row('Cliente', customer.name || '')}${row('Empresa', customer.companyName || customer.company_name || '')}${row('Forma de pago', method)}${row('Ejecutivo', executive.name || '')}</div></section><section class="section"><h2 class="section-title">Recepción del pago</h2><div class="grid">${bankRows}</div></section><section class="section"><h2 class="section-title">Operación bancaria</h2><div class="grid">${bankingRows}</div></section><section class="section"><h2 class="section-title">Resumen financiero</h2><div class="grid financial">${row('Aplicado a cotización', money(payment.amount), 'emphasis')}${row('Total pagado', money(payment.total_paid))}${row('Saldo pendiente', money(payment.pending_balance), 'emphasis')}${row('Total cotización', money(payment.quotation_total))}</div></section>${payment.notes ? `<section class="section"><h2 class="section-title">Observaciones</h2><div class="notes">${safe(payment.notes)}</div></section>` : ''}</main><footer class="footer"><div><strong>ELANKAV</strong>Documento oficial de recepción de pago</div><div>visual.elankav.com</div></footer></section><div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`);
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
    <div className="qv-payment-history"><h3>Historial</h3>{!loading && payments.length === 0 && <p>No hay pagos registrados.</p>}{payments.map((payment) => { const banking = bankingData(payment); return <article key={payment.id}><div><ReceiptText size={18}/><strong>{payment.receipt_number}</strong><span>{paymentLabel(payment)} · {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-NI')}{banking.bankName ? ` · ${banking.bankName}` : ''}</span></div><div><strong>{money(payment.amount)}</strong><small>Saldo {money(payment.pending_balance)}</small></div><button type="button" onClick={() => printReceipt(payment, quotation)}><Printer size={17}/>Imprimir</button>{payment.deposit_completed && <CheckCircle2 size={19} className="qv-payment-ok"/>}</article>; })}</div>
  </section>;
}
