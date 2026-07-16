import React from 'react';
import { elanvisualBrand } from '../modules/vqs/config/elanvisualBrand';
import '../styles/vqs-quotation.css';
import '../styles/vqs-print.css';

const money = (value, currency) => new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(Number(value || 0));

export default function CotizadorUniversalPreview({ quotation, onBack }) {
  const showDiscount = Number(quotation.totals.discount) > 0;
  const showTax = Number(quotation.totals.tax) > 0;

  const downloadQuotation = () => {
    const previousTitle = document.title;
    document.title = `${quotation.quotationNumber}-${quotation.customer.companyName || quotation.customer.name}`.replace(/[^a-zA-Z0-9_-]+/g, '-');
    setTimeout(() => {
      window.print();
      setTimeout(() => { document.title = previousTitle; }, 500);
    }, 80);
  };

  return (
    <main className="vqs-shell">
      <div className="vqs-toolbar no-print">
        <button type="button" className="vqs-secondary-action" onClick={onBack}>← Editar cotización</button>
        <button type="button" onClick={downloadQuotation}>Descargar cotización</button>
      </div>
      <article className="vqs-document" style={{ '--vqs-primary': elanvisualBrand.primaryColor, '--vqs-accent': elanvisualBrand.secondaryColor }}>
        <header className="vqs-header">
          <a className="vqs-brand" href={elanvisualBrand.website} target="_blank" rel="noreferrer"><img src={elanvisualBrand.logoUrl} alt={elanvisualBrand.displayName} /></a>
          <div className="vqs-document-meta"><span className="vqs-kicker">Cotización</span><h1>{quotation.quotationNumber}</h1><div className="vqs-meta-grid"><span><b>Fecha</b>{quotation.issuedAt}</span><span><b>Precios</b>USD</span></div></div>
        </header>
        <section className="vqs-top-grid">
          <div className="vqs-card"><span className="vqs-section-label">Cliente</span><h2>{quotation.customer.companyName || quotation.customer.name}</h2>{quotation.customer.companyName && <p>{quotation.customer.name}</p>}<p>{quotation.customer.phone}</p><p>{quotation.customer.email}</p><p>{quotation.customer.address}</p></div>
          <div className="vqs-card vqs-project-card"><span className="vqs-section-label">Proyecto</span><h2>{quotation.project.title}</h2><p>{quotation.project.summary}</p><div className="vqs-project-facts"><span><b>Entrega</b>{quotation.project.estimatedDelivery || 'Por definir'}</span><span><b>Garantía</b>{quotation.project.warranty || 'Por definir'}</span><span><b>Ubicación</b>{quotation.project.location || 'Por definir'}</span></div></div>
        </section>
        <section className="vqs-items-section">
          <div className="vqs-section-heading"><span className="vqs-section-label">Propuesta visual</span><h2>{quotation.items.length} {quotation.items.length === 1 ? 'producto' : 'productos'}</h2></div>
          <div className={`vqs-items-grid vqs-items-${Math.min(quotation.items.length, 4)}`}>
            {quotation.items.map((item, index) => <article className="vqs-item-card" key={item.id}>{item.images?.[0]?.url ? <img className="vqs-item-image" src={item.images[0].url} alt={item.title} /> : <div className="vqs-image-placeholder">Imagen o render del producto</div>}<div className="vqs-item-content"><span className="vqs-item-number">{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.commercialDescription}</p><div className="vqs-badges">{item.features.map((feature) => <span key={feature}>{feature}</span>)}</div><div className="vqs-item-price"><span>{item.quantity} {item.unit} × {money(item.unitPrice, 'USD')}</span><strong>{money(item.subtotal, 'USD')}</strong></div></div></article>)}
          </div>
        </section>
        <section className="vqs-summary-grid">
          <div className="vqs-card"><span className="vqs-section-label">Forma de pago</span><div className="vqs-installments">{quotation.paymentTerms.installments.map((entry) => <div key={entry.id}><strong>{entry.percentage}%</strong><span>{entry.label}</span><b>{money(entry.amountNio, 'NIO')}</b>{entry.dueCondition && <small>{entry.dueCondition}</small>}</div>)}</div></div>
          <div className="vqs-total-card"><div><span>Subtotal USD</span><b>{money(quotation.totals.subtotal, 'USD')}</b></div>{showDiscount && <div><span>Descuento</span><b>-{money(quotation.totals.discount, 'USD')}</b></div>}{showTax && <div><span>IVA 15%</span><b>{money(quotation.totals.tax, 'USD')}</b></div>}<div><span>Total cotizado USD</span><b>{money(quotation.totals.total, 'USD')}</b></div><div className="vqs-total"><span>Total a pagar</span><strong>{money(quotation.totals.payableTotalNio, 'NIO')}</strong></div><small>Tipo de cambio: C$ {Number(quotation.totals.exchangeRate).toFixed(4)} por USD</small></div>
        </section>
        <footer className="vqs-footer"><a href={elanvisualBrand.website}>{elanvisualBrand.website.replace('https://', '')}</a><span>RUC {elanvisualBrand.taxId} · WhatsApp {elanvisualBrand.whatsapp}</span><a href={elanvisualBrand.ecosystemUrl}>Conoce ELANKAV →</a></footer>
      </article>
    </main>
  );
}
