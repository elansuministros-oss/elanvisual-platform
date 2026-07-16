import React from 'react';

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

export default function VQSProjectSummary({ creation, contract, onBack }) {
  const data = creation?.data || creation || {};
  const pdfUrl = data.document_url || data.pdf_url || '';

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
            disabled={!pdfUrl}
            onClick={() => pdfUrl && window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
            title={!pdfUrl ? 'Disponible cuando Document Engine publique el documento' : 'Descargar PDF'}
          >
            Descargar PDF
          </button>
          {!pdfUrl && <small className="uq-muted">El PDF se habilitará desde Document Engine cuando el Orchestrator entregue la URL oficial.</small>}
        </aside>
      </section>
    </main>
  );
}
