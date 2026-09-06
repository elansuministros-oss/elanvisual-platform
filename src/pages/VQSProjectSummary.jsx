import React, { useState } from 'react';
import { projectCoreClient } from '../modules/vqs/services/projectCoreClient';

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

export default function VQSProjectSummary({ creation, contract, onBack }) {
  const data = creation?.data || creation || {};
  const pdfUrl = data.document_url || data.pdf_url || '';
  const projectId = data.project_id || '';
  const publicQuotationUrl = projectId
    ? `${window.location.origin}/cotizaciones/publicas/${encodeURIComponent(projectId)}`
    : '';
  const shareUrl = pdfUrl || publicQuotationUrl;
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendResult, setSendResult] = useState(null);
  const canSend = Boolean(projectId && String(contract.customer.phone || '').trim());

  async function sendQuotation() {
    if (!canSend || sending) return;
    const confirmed = window.confirm(
      `Enviar ${data.quotation_number || 'la cotización'} a ${contract.customer.name || 'Cliente'} por WhatsApp${contract.customer.email ? ' y correo' : ''}?`
    );
    if (!confirmed) return;

    setSending(true);
    setSendError('');
    setSendResult(null);
    try {
      const response = await projectCoreClient.sendQuotation(projectId);
      setSendResult(response?.data || response);
    } catch (error) {
      setSendError(error.message || 'No fue posible enviar la cotización.');
    } finally {
      setSending(false);
    }
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
            disabled={!canSend || sending}
            onClick={sendQuotation}
            title={!projectId ? 'No se recibió el identificador del proyecto' : !contract.customer.phone ? 'Agregá el teléfono del cliente' : 'Enviar por WhatsApp y, si existe correo registrado, también por email'}
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
          {sendResult && (
            <small className="uq-muted">
              WhatsApp enviado
              {sendResult?.channels?.email?.state === 'SENT'
                ? ' · Correo enviado'
                : sendResult?.channels?.email?.state === 'SKIPPED'
                  ? ' · Cliente sin correo: no se detuvo el envío'
                  : sendResult?.channels?.email?.state === 'FAILED'
                    ? ' · Correo no pudo enviarse'
                    : ''}
            </small>
          )}
          {sendError && <small className="uq-error">{sendError}</small>}

          <button
            type="button"
            className="uq-light uq-primary-wide"
            disabled={!pdfUrl}
            onClick={() => pdfUrl && window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
            title={!pdfUrl ? 'Disponible cuando Document Engine publique el documento' : 'Descargar PDF'}
          >
            Descargar PDF
          </button>
          {!pdfUrl && <small className="uq-muted">El envío directo compartirá el enlace oficial de la cotización. El PDF se habilitará cuando Document Engine publique su URL.</small>}
        </aside>
      </section>
    </main>
  );
}
