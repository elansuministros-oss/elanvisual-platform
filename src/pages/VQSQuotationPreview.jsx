import React, { useState } from 'react';
import { sampleQuotation } from '../modules/vqs/demo/sampleQuotation';
import { elanvisualBrand } from '../modules/vqs/config/elanvisualBrand';
import { validateQuotationDocument } from '../modules/vqs/contracts/quotationDocument';
import '../styles/vqs-quotation.css';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(Number(value || 0));

function ProductImage({ item }) {
  const image = item.images?.[0];
  if (image?.url) {
    return <img className="vqs-item-image" src={image.url} alt={image.alt || item.title} />;
  }

  return (
    <div className="vqs-image-placeholder" aria-label={`Imagen pendiente para ${item.title}`}>
      <span>Imagen o render del producto</span>
    </div>
  );
}

export default function VQSQuotationPreview() {
  const document = sampleQuotation;
  const validation = validateQuotationDocument(document);
  const showDiscount = Number(document.totals.discount) > 0;
  const showTax = Number(document.totals.tax) > 0 || Number(document.totals.taxRate) > 0;
  const [printMode, setPrintMode] = useState('print');

  const openPrintDialog = (mode) => {
    const previousTitle = window.document.title;
    const fileName = `${document.quotationNumber}-${document.customer.companyName || document.customer.name}`
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '-');

    setPrintMode(mode);
    window.document.title = fileName;
    window.document.body.dataset.vqsPrintMode = mode;

    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        window.document.title = previousTitle;
        delete window.document.body.dataset.vqsPrintMode;
      }, 500);
    }, 80);
  };

  return (
    <main className="vqs-shell">
      <div className="vqs-toolbar no-print">
        <div>
          <strong>VQS · Vista experimental</strong>
          <span>{validation.ok ? 'Contrato válido' : validation.errors.join(' · ')}</span>
        </div>
        <div className="vqs-toolbar-actions">
          <button type="button" className="vqs-secondary-action" onClick={() => openPrintDialog('print')}>
            Imprimir cotización
          </button>
          <button type="button" onClick={() => openPrintDialog('pdf')}>
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="vqs-print-notice no-print" role="status">
        {printMode === 'pdf'
          ? 'En el diálogo del dispositivo seleccioná “Guardar como PDF”.'
          : 'Formato Carta preparado para impresión corporativa.'}
      </div>

      <article className="vqs-document" style={{ '--vqs-primary': elanvisualBrand.primaryColor, '--vqs-accent': elanvisualBrand.secondaryColor }}>
        <div className="vqs-print-running-header print-only">
          <span>{elanvisualBrand.displayName}</span>
          <b>{document.quotationNumber}</b>
          <span>{document.customer.companyName || document.customer.name}</span>
        </div>

        <header className="vqs-header">
          <a className="vqs-brand" href={elanvisualBrand.website} target="_blank" rel="noreferrer">
            <img src={elanvisualBrand.logoUrl} alt={elanvisualBrand.displayName} />
          </a>
          <div className="vqs-document-meta">
            <span className="vqs-kicker">Cotización</span>
            <h1>{document.quotationNumber}</h1>
            <div className="vqs-meta-grid">
              <span><b>Fecha</b>{document.issuedAt}</span>
              <span><b>Vigencia</b>{document.validUntil || 'No definida'}</span>
              <span><b>Precios</b>USD</span>
            </div>
          </div>
        </header>

        <section className="vqs-top-grid">
          <div className="vqs-card">
            <span className="vqs-section-label">Cliente</span>
            <h2>{document.customer.companyName || document.customer.name}</h2>
            {document.customer.companyName && <p>{document.customer.name}</p>}
            <p>{document.customer.phone}</p>
            <p>{document.customer.email}</p>
            <p>{document.customer.address}</p>
          </div>

          <div className="vqs-card vqs-project-card">
            <span className="vqs-section-label">Proyecto</span>
            <h2>{document.project.title}</h2>
            <p>{document.project.summary}</p>
            <div className="vqs-project-facts">
              <span><b>Entrega</b>{document.project.estimatedDelivery}</span>
              <span><b>Garantía</b>{document.project.warranty}</span>
              <span><b>Ubicación</b>{document.project.location}</span>
            </div>
          </div>
        </section>

        {document.project.heroImage?.url && (
          <section className="vqs-hero">
            <img src={document.project.heroImage.url} alt={document.project.heroImage.alt || document.project.title} />
          </section>
        )}

        <section className="vqs-items-section">
          <div className="vqs-section-heading">
            <span className="vqs-section-label">Propuesta visual</span>
            <h2>{document.items.length} {document.items.length === 1 ? 'producto' : 'productos'}</h2>
          </div>

          <div className={`vqs-items-grid vqs-items-${Math.min(document.items.length, 4)}`}>
            {document.items.map((item, index) => (
              <article className="vqs-item-card" key={item.id}>
                <ProductImage item={item} />
                <div className="vqs-item-content">
                  <span className="vqs-item-number">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  <p>{item.commercialDescription}</p>
                  {item.dimensions && (
                    <p className="vqs-dimensions">
                      {item.dimensions.width} × {item.dimensions.height} {item.dimensions.unit}
                    </p>
                  )}
                  <div className="vqs-badges">
                    {item.features.map((feature) => <span key={feature}>{feature}</span>)}
                  </div>
                  <div className="vqs-item-price">
                    <span>{item.quantity} {item.unit}</span>
                    <strong>{money(item.subtotal, 'USD')}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="vqs-summary-grid">
          <div className="vqs-card">
            <span className="vqs-section-label">Forma de pago</span>
            <div className="vqs-installments">
              {document.paymentTerms.installments.map((installment) => (
                <div key={installment.id}>
                  <strong>{installment.percentage}%</strong>
                  <span>{installment.label}</span>
                  <b>{money(installment.amountNio, 'NIO')}</b>
                  {installment.dueCondition && <small>{installment.dueCondition}</small>}
                </div>
              ))}
            </div>
          </div>

          <div className="vqs-total-card">
            <div><span>Subtotal USD</span><b>{money(document.totals.subtotal, 'USD')}</b></div>
            {showDiscount && <div><span>Descuento</span><b>-{money(document.totals.discount, 'USD')}</b></div>}
            {showTax && <div><span>IVA {document.totals.taxRate > 0 ? `${document.totals.taxRate}%` : ''}</span><b>{money(document.totals.tax, 'USD')}</b></div>}
            <div><span>Total cotizado USD</span><b>{money(document.totals.total, 'USD')}</b></div>
            <div className="vqs-total"><span>Total a pagar</span><strong>{money(document.totals.payableTotalNio, 'NIO')}</strong></div>
            <small>Tipo de cambio aplicado: C$ {Number(document.totals.exchangeRate).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} por USD · {document.totals.exchangeRateDate}</small>
          </div>
        </section>

        <section className="vqs-bank-section">
          <div className="vqs-section-heading compact">
            <span className="vqs-section-label">Cuentas autorizadas</span>
            <h2>Opciones de pago</h2>
          </div>
          <div className="vqs-bank-grid">
            {document.paymentAccountsSnapshot.map((account) => (
              <article key={account.id} className="vqs-bank-card">
                <span>{account.bankName}</span>
                <b>{account.currency}</b>
                <strong>{account.accountNumber}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="vqs-executive-section">
          <div className="vqs-executive-avatar" aria-hidden="true">
            {document.executive.photoUrl
              ? <img src={document.executive.photoUrl} alt="" />
              : document.executive.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </div>
          <div>
            <span className="vqs-section-label">Ejecutivo Comercial</span>
            <h2>{document.executive.name}</h2>
            <p>{document.executive.role}</p>
            <a href={`tel:${document.executive.phone.replace(/\s+/g, '')}`}>{document.executive.phone}</a>
            {document.executive.email && <a href={`mailto:${document.executive.email}`}>{document.executive.email}</a>}
          </div>
          <small>ID {document.executive.executiveId}</small>
        </section>

        {document.publicNotes.length > 0 && (
          <section className="vqs-notes">
            <span className="vqs-section-label">Condiciones</span>
            {document.publicNotes.map((note) => <p key={note}>{note}</p>)}
          </section>
        )}

        <footer className="vqs-footer">
          <a href={elanvisualBrand.website} target="_blank" rel="noreferrer">{elanvisualBrand.website.replace('https://', '')}</a>
          <span>RUC {elanvisualBrand.taxId} · WhatsApp {elanvisualBrand.whatsapp}</span>
          <a href={elanvisualBrand.ecosystemUrl} target="_blank" rel="noreferrer">Conoce todo el ecosistema ELANKAV →</a>
        </footer>

        <div className="vqs-print-running-footer print-only">
          <span>{document.quotationNumber} · Continuación</span>
          <span className="vqs-page-counter">Página</span>
        </div>
      </article>
    </main>
  );
}
