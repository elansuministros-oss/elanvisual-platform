import React from 'react';
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

  return (
    <main className="vqs-shell">
      <div className="vqs-toolbar no-print">
        <div>
          <strong>VQS · Vista experimental</strong>
          <span>{validation.ok ? 'Contrato válido' : validation.errors.join(' · ')}</span>
        </div>
        <button type="button" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
      </div>

      <article className="vqs-document" style={{ '--vqs-primary': elanvisualBrand.primaryColor, '--vqs-accent': elanvisualBrand.secondaryColor }}>
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
              <span><b>Moneda</b>{document.currency}</span>
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
                    <strong>{money(item.subtotal, document.currency)}</strong>
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
                <div key={installment.label}>
                  <strong>{installment.percentage}%</strong>
                  <span>{installment.label}</span>
                  <b>{money(installment.amount, document.currency)}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="vqs-total-card">
            <div><span>Subtotal</span><b>{money(document.totals.subtotal, document.currency)}</b></div>
            {document.totals.discount > 0 && <div><span>Descuento</span><b>-{money(document.totals.discount, document.currency)}</b></div>}
            {document.totals.tax > 0 && <div><span>IVA</span><b>{money(document.totals.tax, document.currency)}</b></div>}
            <div className="vqs-total"><span>Total</span><strong>{money(document.totals.total, document.currency)}</strong></div>
            {document.totals.convertedTotal > 0 && <small>Referencia: C$ {Number(document.totals.convertedTotal).toLocaleString('es-NI')}</small>}
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
      </article>
    </main>
  );
}
