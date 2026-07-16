import React from 'react';

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function normalizeWhatsAppPhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 8) return `505${digits}`;
  if (digits.startsWith('00')) return digits.slice(2);
  return digits;
}

function buildWhatsAppMessage({ data, contract, pdfUrl }) {
  const quotationNumber = data.quotation_number || 'cotización';
  const installments = contract.payments.installments
    .map((payment) => `${payment.label} ${payment.percentage}%: ${money(payment.amountUsd)}`)
    .join('\n');
  const products = contract.items
    .map((item) => `• ${item.title}: ${money(item.subtotalUsd)}`)
    .join('\n');

  return [
    `Hola ${contract.customer.name || ''},`,
    '',
    `Te compartimos la ${quotationNumber} de ELANVISUAL.`,
    '',
    products,
    '',
    `Total: ${money(contract.pricing.totalUsd)}`,
    installments,
    pdfUrl ? '' : null,
    pdfUrl ? `Ver o descargar PDF: ${pdfUrl}` : null,
    '',
    'Para iniciar el proyecto, confirmá por este medio el pago del anticipo correspondiente.'
  ].filter((line) => line !== null).join('\n');
}

export default function VQSProjectSummary({ creation, contract, onBack }) {
  const data = creation?.data || creation || {};
  const pdfUrl = data.document_url || data.pdf_url || '';
  const whatsappPhone = normalizeWhatsAppPhone(contract.customer.phone);
  const canSendWhatsApp = Boolean(whatsappPhone);

  function sendByWhatsApp() {
    if (!canSendWhatsApp) return;

    const destination = `+${whatsappPhone}`;
    const quotationNumber = data.quotation_number || 'esta cotización';
    const confirmed = window.confirm(
      `Vas a enviar ${quotationNumber} a ${contract.customer.name || 'Cliente'} (${destination}). ¿Confirmás el envío?`
    );
    if (!confirmed) return;

    const message = buildWhatsAppMessage({ data, contract, pdfUrl });
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="uq-shell">
      <header className="uq-header">
        <div>
          <span>ELANVISUAL · VQS</span>
          <h1>Resumen Proyecto</h1>
          <p>Cotización creada correctamente en Project Core.</p>
        </div>
        <button type="button" className="uq-light" onClick={onBack}>Nueva cotización</button>
      </header>

      <section className="uq-card uq-success">
        <strong>Cotización creada correctamente.</strong>
        <div className="uq-result-grid">
          <div><small>Cotización</small><b>{data.quotation_number || '—'}</b></div>
          <div><small>Proyecto</small><b>{data.project_number || '—'}</b></div>
          <div><small>Estado</small><b>{data.status || '—'}</b></div>
          <div><small>Etapa</small><b>{data.stage || '—'}</b></div>
        </div>
      </section>

      <section className="uq-grid">
        <div className="uq-main">
          <section className="uq-card">
            <h2>Cliente</h2>
            <p><strong>{contract.customer.name}</strong>{contract.customer.companyName ? ` · ${contract.customer.companyName}` : ''}</p>
            <p>{contract.customer.phone || 'Sin teléfono'} · {contract.customer.email || 'Sin correo'}</p>
          </section>

          <section className="uq-card">
            <h2>Ejecutivo</h2>
            <p><strong>{contract.executive.name}</strong> · {contract.executive.role}</p>
          </section>

          <section className="uq-card">
            <h2>Productos</h2>
            {contract.items.map((item) => (
              <article className="uq-summary-item" key={item.itemId}>
                <div><strong>{item.title}</strong><small>{item.description}</small></div>
                <b>{item.quantity} {item.unit} · {money(item.subtotalUsd)}</b>
              </article>
            ))}
          </section>
        </div>

        <aside className="uq-side">
          <section className="uq-card">
            <h2>Pagos</h2>
            {contract.payments.installments.map((payment, index) => (
              <div className="uq-summary-row" key={`${payment.label}-${index}`}>
                <span>{payment.label} · {payment.percentage}%</span>
                <b>{money(payment.amountUsd)}</b>
              </div>
            ))}
            <div className="uq-summary-row uq-total"><span>Total</span><b>{money(contract.pricing.totalUsd)}</b></div>
          </section>

          <button
            type="button"
            className="uq-primary-wide"
            disabled={!canSendWhatsApp}
            onClick={sendByWhatsApp}
            title={!canSendWhatsApp ? 'La cotización no tiene un teléfono válido del cliente' : 'Verificar destinatario y abrir WhatsApp'}
          >
            Enviar por WhatsApp
          </button>
          {!canSendWhatsApp && <small className="uq-muted">Agregá el teléfono del cliente para habilitar el envío.</small>}

          <button
            type="button"
            className="uq-light uq-primary-wide"
            disabled={!pdfUrl}
            onClick={() => pdfUrl && window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
            title={!pdfUrl ? 'Disponible cuando Document Engine publique el documento' : 'Descargar PDF'}
          >
            Descargar PDF
          </button>
          {!pdfUrl && <small className="uq-muted">El mensaje de WhatsApp puede enviarse de inmediato. El PDF se adjuntará automáticamente cuando Document Engine entregue su URL oficial.</small>}
        </aside>
      </section>
    </main>
  );
}
