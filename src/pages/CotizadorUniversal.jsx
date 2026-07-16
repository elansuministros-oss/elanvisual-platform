import React, { useMemo, useState } from 'react';
import { createQuotationDocument } from '../modules/vqs/contracts/quotationDocument';
import VQSQuotationPreview from './VQSQuotationPreview';
import '../styles/cotizador-universal.css';

const emptyItem = () => ({
  id: crypto.randomUUID(),
  title: '',
  commercialDescription: '',
  quantity: 1,
  unit: 'unidad',
  unitPrice: 0,
  imageUrl: '',
  features: ''
});

const PAYMENT_PRESETS = {
  cash: [{ label: 'Pago total', percentage: 100, dueCondition: 'Al aprobar la cotización' }],
  '60_40': [
    { label: 'Anticipo', percentage: 60, dueCondition: 'Al aprobar la cotización' },
    { label: 'Contra entrega', percentage: 40, dueCondition: 'Al finalizar el proyecto' }
  ],
  '60_20_20': [
    { label: 'Anticipo', percentage: 60, dueCondition: 'Al aprobar la cotización' },
    { label: 'Avance', percentage: 20, dueCondition: 'Durante producción' },
    { label: 'Contra entrega', percentage: 20, dueCondition: 'Al finalizar el proyecto' }
  ]
};

export default function CotizadorUniversal() {
  const [customer, setCustomer] = useState({ name: '', companyName: '', phone: '', email: '', address: '' });
  const [project, setProject] = useState({ title: '', summary: '', location: '', estimatedDelivery: '', warranty: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [discountRate, setDiscountRate] = useState(0);
  const [applyTax, setApplyTax] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(36.8);
  const [paymentType, setPaymentType] = useState('60_40');
  const [customInstallments, setCustomInstallments] = useState([{ label: 'Anticipo', percentage: 60 }, { label: 'Saldo', percentage: 40 }]);
  const [showPreview, setShowPreview] = useState(false);

  const subtotalGross = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
    [items]
  );
  const discount = subtotalGross * (Number(discountRate || 0) / 100);
  const subtotal = subtotalGross - discount;
  const tax = applyTax ? subtotal * 0.15 : 0;
  const total = subtotal + tax;
  const payableTotalNio = total * Number(exchangeRate || 0);

  const installmentsSource = paymentType === 'custom' ? customInstallments : PAYMENT_PRESETS[paymentType];
  const installments = installmentsSource.map((entry, index) => ({
    id: `payment-${index + 1}`,
    ...entry,
    amountUsd: total * (Number(entry.percentage || 0) / 100),
    amountNio: payableTotalNio * (Number(entry.percentage || 0) / 100)
  }));

  const paymentPercentTotal = installments.reduce((sum, entry) => sum + Number(entry.percentage || 0), 0);

  const document = createQuotationDocument({
    platformId: 'ELANVISUAL',
    quotationNumber: 'BORRADOR-VQS',
    settlementCurrency: 'NIO',
    customer,
    executive: {
      executiveId: 'PENDING',
      name: 'Ejecutivo por asignar',
      role: 'Ejecutivo comercial',
      phone: '',
      commissionEligible: false
    },
    project,
    items: items.map((item) => ({
      ...item,
      subtotal: Number(item.quantity || 0) * Number(item.unitPrice || 0),
      features: item.features.split(',').map((value) => value.trim()).filter(Boolean),
      images: item.imageUrl ? [{ role: 'primary', url: item.imageUrl, alt: item.title }] : []
    })),
    totals: {
      subtotalGross,
      discount,
      subtotal,
      taxRate: applyTax ? 15 : 0,
      tax,
      total,
      exchangeRate: Number(exchangeRate || 0),
      payableTotalNio
    },
    paymentTerms: { type: paymentType, installments }
  });

  const updateItem = (id, field, value) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const canPreview = customer.name.trim() && project.title.trim() && items.every((item) => item.title.trim()) && Math.abs(paymentPercentTotal - 100) < 0.001;

  if (showPreview) {
    return <VQSQuotationPreview quotation={document} onBack={() => setShowPreview(false)} />;
  }

  return (
    <main className="uq-shell">
      <header className="uq-header">
        <div>
          <span>VQS · Nuevo módulo</span>
          <h1>Cotizador universal</h1>
          <p>Construido desde cero. Sin conexiones heredadas del cotizador anterior.</p>
        </div>
        <button type="button" disabled={!canPreview} onClick={() => setShowPreview(true)}>Vista previa</button>
      </header>

      <section className="uq-grid">
        <div className="uq-main">
          <section className="uq-card">
            <h2>Cliente</h2>
            <div className="uq-fields two">
              <label>Nombre<input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></label>
              <label>Empresa<input value={customer.companyName} onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })} /></label>
              <label>Teléfono<input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></label>
              <label>Correo<input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></label>
              <label className="wide">Dirección<input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></label>
            </div>
          </section>

          <section className="uq-card">
            <h2>Proyecto</h2>
            <div className="uq-fields two">
              <label>Nombre del proyecto<input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} /></label>
              <label>Ubicación<input value={project.location} onChange={(e) => setProject({ ...project, location: e.target.value })} /></label>
              <label className="wide">Resumen<textarea rows="3" value={project.summary} onChange={(e) => setProject({ ...project, summary: e.target.value })} /></label>
              <label>Tiempo de entrega<input value={project.estimatedDelivery} onChange={(e) => setProject({ ...project, estimatedDelivery: e.target.value })} /></label>
              <label>Garantía<input value={project.warranty} onChange={(e) => setProject({ ...project, warranty: e.target.value })} /></label>
            </div>
          </section>

          <section className="uq-card">
            <div className="uq-section-title"><h2>Productos</h2><button type="button" className="uq-light" onClick={() => setItems([...items, emptyItem()])}>+ Agregar producto</button></div>
            <div className="uq-items">
              {items.map((item, index) => (
                <article className="uq-item" key={item.id}>
                  <div className="uq-item-heading"><strong>Ítem {index + 1}</strong>{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((entry) => entry.id !== item.id))}>Eliminar</button>}</div>
                  <div className="uq-fields two">
                    <label>Producto<input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} /></label>
                    <label>Imagen URL<input value={item.imageUrl} onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)} placeholder="https://..." /></label>
                    <label className="wide">Descripción comercial<textarea rows="3" value={item.commercialDescription} onChange={(e) => updateItem(item.id, 'commercialDescription', e.target.value)} /></label>
                    <label>Cantidad<input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} /></label>
                    <label>Unidad<input value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} /></label>
                    <label>Precio unitario USD<input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} /></label>
                    <label>Características<input value={item.features} onChange={(e) => updateItem(item.id, 'features', e.target.value)} placeholder="Exterior, LED, instalación" /></label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="uq-card">
            <h2>Forma de pago</h2>
            <div className="uq-payment-options">
              {[['cash', 'Contado'], ['60_40', '60 / 40'], ['60_20_20', '60 / 20 / 20'], ['custom', 'Personalizado']].map(([value, label]) => (
                <button type="button" key={value} className={paymentType === value ? 'active' : ''} onClick={() => setPaymentType(value)}>{label}</button>
              ))}
            </div>
            {paymentType === 'custom' && (
              <div className="uq-custom-payments">
                {customInstallments.map((entry, index) => (
                  <div key={index}>
                    <input value={entry.label} onChange={(e) => setCustomInstallments(customInstallments.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} />
                    <input type="number" value={entry.percentage} onChange={(e) => setCustomInstallments(customInstallments.map((item, i) => i === index ? { ...item, percentage: Number(e.target.value) } : item))} />
                    <span>%</span>
                  </div>
                ))}
                <button type="button" className="uq-light" onClick={() => setCustomInstallments([...customInstallments, { label: `Cuota ${customInstallments.length + 1}`, percentage: 0 }])}>+ Agregar cuota</button>
                <p className={Math.abs(paymentPercentTotal - 100) < 0.001 ? 'ok' : 'error'}>Total: {paymentPercentTotal}%</p>
              </div>
            )}
          </section>
        </div>

        <aside className="uq-sidebar">
          <section className="uq-card sticky">
            <h2>Resumen</h2>
            <label>Descuento<select value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value))}><option value="0">Sin descuento</option><option value="5">5%</option><option value="10">10%</option></select></label>
            <label className="uq-check"><input type="checkbox" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} /> Aplicar IVA 15%</label>
            <label>Tipo de cambio<input type="number" step="0.0001" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} /></label>
            <div className="uq-totals">
              <span>Subtotal <b>USD {subtotalGross.toFixed(2)}</b></span>
              {discount > 0 && <span>Descuento <b>-USD {discount.toFixed(2)}</b></span>}
              {tax > 0 && <span>IVA <b>USD {tax.toFixed(2)}</b></span>}
              <span>Total USD <b>USD {total.toFixed(2)}</b></span>
              <strong>Total a pagar <b>C$ {payableTotalNio.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</b></strong>
            </div>
            <button type="button" disabled={!canPreview} onClick={() => setShowPreview(true)}>Generar vista previa</button>
          </section>
        </aside>
      </section>
    </main>
  );
}
