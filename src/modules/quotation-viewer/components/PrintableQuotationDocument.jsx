import React from 'react';
import '../../../styles/quotation-print-commercial.css';

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function numberValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!hasValue(value)) return null;

  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value, currency = 'USD') {
  const parsed = numberValue(value);

  if (parsed === null) return '';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(parsed);
}

function formatDate(value) {
  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
}

function addDaysIso(value, days) {
  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return '';

  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString();
}

function display(value) {
  return hasValue(value) ? String(value) : '';
}

function dimensionsText(dimensions) {
  if (!dimensions) return '';

  if (typeof dimensions === 'string') return dimensions;

  const unit = dimensions.unit ? ` ${dimensions.unit}` : '';

  return [
    dimensions.width ? `${dimensions.width}${unit}` : '',
    dimensions.height ? `${dimensions.height}${unit}` : '',
    dimensions.depth ? `${dimensions.depth}${unit}` : ''
  ]
    .filter(Boolean)
    .join(' × ');
}

function resolveUnitPrice(item = {}) {
  const direct = numberValue(
    item.unitPrice ??
    item.unit_price ??
    item.price
  );

  if (direct !== null) return direct;

  const subtotal = numberValue(item.subtotal);
  const quantity = numberValue(item.quantity);

  if (subtotal !== null && quantity && quantity > 0) {
    return subtotal / quantity;
  }

  return null;
}

function resolveItemTotal(item = {}) {
  const subtotal = numberValue(item.subtotal);

  if (subtotal !== null) return subtotal;

  const quantity = numberValue(item.quantity);
  const unitPrice = resolveUnitPrice(item);

  if (quantity !== null && unitPrice !== null) {
    return quantity * unitPrice;
  }

  return null;
}

function paymentEntries(payment = {}, totalUsd = 0) {
  const installments = Array.isArray(payment.installments)
    ? payment.installments
    : [];

  if (installments.length) {
    return installments.map((entry, index) => {
      const percentage = numberValue(entry.percentage);
      let amount = numberValue(entry.amountUsd);

      if (
        amount === null &&
        percentage !== null &&
        Number.isFinite(totalUsd)
      ) {
        amount = totalUsd * percentage / 100;
      }

      return {
        id: entry.id || `installment-${index}`,
        label:
          display(entry.label) ||
          (percentage !== null ? `${percentage}%` : `Pago ${index + 1}`),
        percentage,
        amount,
        condition: display(entry.dueCondition)
      };
    });
  }

  const advance = payment.advance || {};
  const advancePercentage = numberValue(advance.percentage);

  if (advancePercentage !== null) {
    const advanceAmount =
      numberValue(advance.amountUsd) ??
      totalUsd * advancePercentage / 100;

    const balancePercentage = Math.max(0, 100 - advancePercentage);

    return [
      {
        id: 'advance',
        label: display(advance.label) || 'Anticipo',
        percentage: advancePercentage,
        amount: advanceAmount,
        condition: display(advance.dueCondition) || 'Al aprobar la cotización'
      },
      {
        id: 'balance',
        label: 'Contra entrega',
        percentage: balancePercentage,
        amount: totalUsd - advanceAmount,
        condition: 'Al finalizar el proyecto'
      }
    ];
  }

  return [];
}

function accountCurrency(account = {}) {
  return display(account.currency).toUpperCase();
}

export default function PrintableQuotationDocument({ quotation, dossier = null }) {
  const totals = quotation?.totals || {};
  const project = quotation?.project || {};
  const customer = quotation?.customer || {};
  const payment = quotation?.payment || {};
  const items = Array.isArray(quotation?.items) ? quotation.items : [];
  const accounts = Array.isArray(quotation?.paymentAccounts)
    ? quotation.paymentAccounts
    : [];
  const notes = Array.isArray(quotation?.publicNotes)
    ? quotation.publicNotes.filter(Boolean)
    : [];

  const dossierDocuments =
    dossier?.documents || {};

  const dossierWorkOrder =
    dossierDocuments.workOrder || null;

  const dossierReceipts =
    Array.isArray(dossierDocuments.receipts)
      ? dossierDocuments.receipts
      : [];

  const dossierAccessCode =
    display(dossier?.accessCode);

  const dossierUrl =
    dossierAccessCode
      ? `visual.elankav.com/q/${dossierAccessCode}`
      : '';

  const totalUsd =
    numberValue(totals.totalUsd) ??
    numberValue(quotation?.totalUsd) ??
    0;

  const payments = paymentEntries(payment, totalUsd);

  const validUntil =
    quotation?.validUntil ||
    addDaysIso(quotation?.date, 15);

  const currency = display(
    totals.currency ||
    quotation?.currency ||
    'USD'
  );

  const scope =
    display(project.summary) ||
    display(quotation?.scope);

  const observation =
    notes[0] ||
    display(quotation?.observation);

  return (
    <article className="qprint-document print-only">
      <header className="qprint-header">
        <div className="qprint-brand">
          <div className="qprint-brand-mark">
            <img
              src="/assets/branding/elanvisual.svg"
              alt="ELANVISUAL"
            />
          </div>
          <p>Ingeniería, rotulación e imagen corporativa</p>
        </div>

        <div className="qprint-title">
          <span>COTIZACIÓN</span>
          <strong>
            {display(project.title) ||
             display(quotation?.quotationNumber)}
          </strong>
          <small>{display(quotation?.quotationNumber)}</small>
        </div>
      </header>

      <section className="qprint-meta">
        <div>
          <span>CLIENTE</span>
          <strong>
            {display(customer.companyName) ||
             display(customer.name)}
          </strong>
        </div>

        <div>
          <span>PROYECTO</span>
          <strong>{display(project.title)}</strong>
        </div>

        <div>
          <span>FECHA</span>
          <strong>{formatDate(quotation?.date)}</strong>
        </div>

        <div>
          <span>UBICACIÓN</span>
          <strong>
            {display(project.location) ||
             display(customer.address)}
          </strong>
        </div>

        <div>
          <span>MONEDA</span>
          <strong>{currency}</strong>
        </div>

        <div>
          <span>VIGENCIA</span>
          <strong>{formatDate(validUntil)}</strong>
        </div>
      </section>

      <section className="qprint-detail">
        <h2>Detalle de trabajos</h2>

        <table>
          <thead>
            <tr>
              <th className="qprint-col-item">ITEM</th>
              <th>DESCRIPCIÓN</th>
              <th className="qprint-col-qty">CANT.</th>
              <th className="qprint-col-price">P. UNIT.</th>
              <th className="qprint-col-total">TOTAL USD</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>

                <td>
                  <strong>
                    {display(item.title) || 'Trabajo'}
                  </strong>

                  {item.commercialDescription && (
                    <p>{item.commercialDescription}</p>
                  )}

                  {dimensionsText(item.dimensions) && (
                    <small>
                      Medidas: {dimensionsText(item.dimensions)}
                    </small>
                  )}
                </td>

                <td>{display(item.quantity)}</td>

                <td>
                  {money(resolveUnitPrice(item), 'USD')}
                </td>

                <td>
                  <strong>
                    {money(resolveItemTotal(item), 'USD')}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="qprint-total">
        <span>TOTAL GENERAL</span>
        <strong>USD {money(totalUsd, 'USD').replace('$', '$')}</strong>
      </section>

      {(scope || observation) && (
        <section className="qprint-notes">
          <div>
            <span>ALCANCE</span>
            <p>{scope}</p>
          </div>

          <div>
            <span>OBSERVACIÓN</span>
            <p>{observation}</p>
          </div>
        </section>
      )}

      {payments.length > 0 && (
        <section className="qprint-payments">
          <div className="qprint-payment-label">
            FORMA DE PAGO
          </div>

          {payments.map((entry) => (
            <div key={entry.id}>
              <strong>
                {entry.percentage !== null
                  ? `${entry.percentage}% `
                  : ''}
                {entry.label}
              </strong>

              <b>{money(entry.amount, 'USD')}</b>

              {entry.condition && (
                <small>{entry.condition}</small>
              )}
            </div>
          ))}
        </section>
      )}

      {accounts.length > 0 && (
        <section className="qprint-accounts">
          <h3>CUENTAS AUTORIZADAS</h3>

          <div className="qprint-account-grid">
            {accounts.map((account, index) => (
              <div
                className="qprint-account"
                key={account.id || `${account.accountNumber}-${index}`}
              >
                <strong>
                  {display(account.label) ||
                   display(account.bankName)}
                </strong>

                <span>
                  {accountCurrency(account)}
                  {account.accountType
                    ? ` · ${account.accountType}`
                    : ''}
                </span>

                <b>{display(account.accountNumber)}</b>

                {account.accountHolder && (
                  <small>{account.accountHolder}</small>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(dossierWorkOrder || dossierReceipts.length > 0) && (
        <section className="qprint-dossier">
          <div className="qprint-dossier-title">
            <span>EXPEDIENTE DEL PROYECTO</span>
            <strong>Documentos vinculados</strong>
          </div>

          <div className="qprint-dossier-grid">
            {dossierWorkOrder && (
              <div className="qprint-dossier-record">
                <span>ORDEN DE TRABAJO</span>
                <strong>
                  {display(dossierWorkOrder.workOrderNumber)}
                </strong>
                <small>
                  {display(dossierWorkOrder.statusLabel)}
                </small>
              </div>
            )}

            {dossierReceipts.map((receipt) => (
              <div
                className="qprint-dossier-record"
                key={receipt.receiptNumber}
              >
                <span>RECIBO</span>
                <strong>
                  {display(receipt.receiptNumber)}
                </strong>
                <small>
                  USD {money(receipt.amountUsd, 'USD')}
                </small>
              </div>
            ))}
          </div>

          {dossierUrl && (
            <div className="qprint-dossier-url">
              <span>EXPEDIENTE EN LÍNEA</span>
              <strong>{dossierUrl}</strong>
            </div>
          )}
        </section>
      )}

      {(workOrder || receipts.length > 0) && (
        <section className="qprint-linked-dossier">

          <div className="qprint-linked-title">
            EXPEDIENTE DEL PROYECTO
          </div>

          {workOrder && (
            <div className="qprint-linked-row">

              <div className="qprint-linked-info">
                <span>ORDEN DE TRABAJO</span>

                <strong>
                  {display(workOrder.workOrderNumber)}
                </strong>

                <small>
                  {display(workOrder.statusLabel)}
                </small>
              </div>

              <a
                href={absolutePublicUrl(
                  workOrder.viewUrl
                )}
              >
                ABRIR OT
              </a>

            </div>
          )}


          {receipts.map((receipt) => (
            <div
              className="qprint-linked-row"
              key={receipt.receiptNumber}
            >

              <div className="qprint-linked-info">
                <span>RECIBO</span>

                <strong>
                  {display(
                    receipt.receiptNumber
                  )}
                </strong>

                <small>
                  {money(
                    receipt.amountUsd,
                    'USD'
                  )}
                </small>
              </div>

              <a
                href={absolutePublicUrl(
                  receipt.viewUrl
                )}
              >
                ABRIR RECIBO
              </a>

            </div>
          ))}


          {portalUrl && (
            <div className="qprint-linked-portal">

              <span>
                EXPEDIENTE COMPLETO
              </span>

              <a href={portalUrl}>
                {portalUrl.replace(
                  'https://',
                  ''
                )}
              </a>

            </div>
          )}

        </section>
      )}

      <footer className="qprint-footer">
        <span>RUC 4012805831001E</span>
        <span>visual.elankav.com</span>
        <span>WhatsApp +505 7882 8089</span>
      </footer>
    </article>
  );
}
