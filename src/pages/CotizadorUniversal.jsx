import React, { useMemo, useState } from 'react';
import { projectCoreClient } from '../modules/vqs/services/projectCoreClient';
import { projectContextClient } from '../modules/vqs/services/projectContextClient';
import VQSProjectSummary from './VQSProjectSummary';
import '../styles/cotizador-universal.css';

const EXECUTIVE = Object.freeze({
  executiveId: 'EXEC-ERICK-CANO-001',
  name: 'Erick Cano',
  role: 'Director Comercial',
  phone: '+505 8838 8940',
  email: '',
  photoUrl: ''
});

const PAYMENT_PRESETS = Object.freeze({
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
});

const emptyItem = () => ({
  id: crypto.randomUUID(), productId: '', designId: '', title: '', commercialDescription: '', quantity: 1,
  unit: 'unidad', unitPrice: 0, imageUrl: '', features: ''
});

function mapContextItem(item = {}) {
  return {
    id: item.itemId || crypto.randomUUID(),
    productId: item.productId || '',
    designId: item.designId || '',
    title: item.title || '',
    commercialDescription: item.description || '',
    quantity: Number(item.quantity || 1),
    unit: item.unit || 'unidad',
    unitPrice: Number(item.unitPriceUsd || 0),
    imageUrl: item.imageUrl || item.images?.[0] || '',
    features: Array.isArray(item.features) ? item.features.join(', ') : String(item.features || '')
  };
}

export default function CotizadorUniversal() {
  const [customerId, setCustomerId] = useState(() => `ELANVISUAL-${crypto.randomUUID()}`);
  const [customer, setCustomer] = useState({ name: '', companyName: '', phone: '', email: '', address: '' });
  const [project, setProject] = useState({ title: '', expectedDeliveryAt: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [source, setSource] = useState({ type: 'manual', sourceId: '', designRequestId: '', storeProductId: '', storeCartId: '', designMode: 'optional' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [discountRate, setDiscountRate] = useState(0);
  const [applyTax, setApplyTax] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(36.8);
  const [paymentType, setPaymentType] = useState('60_40');
  const [customInstallments, setCustomInstallments] = useState([{ label: 'Anticipo', percentage: 60 }, { label: 'Saldo', percentage: 40 }]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [creation, setCreation] = useState(null);
  const [savedContract, setSavedContract] = useState(null);

  const subtotalGross = useMemo(() => items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0
  ), [items]);
  const discount = subtotalGross * (Number(discountRate || 0) / 100);
  const subtotal = subtotalGross - discount;
  const tax = applyTax ? subtotal * 0.15 : 0;
  const total = subtotal + tax;
  const payableTotalNio = total * Number(exchangeRate || 0);
  const sourceInstallments = paymentType === 'custom' ? customInstallments : PAYMENT_PRESETS[paymentType];
  const installments = sourceInstallments.map((entry) => ({
    label: entry.label,
    percentage: Number(entry.percentage || 0),
    amountUsd: total * (Number(entry.percentage || 0) / 100),
    amountNio: payableTotalNio * (Number(entry.percentage || 0) / 100),
    dueCondition: entry.dueCondition || ''
  }));
  const paymentPercentTotal = installments.reduce((sum, entry) => sum + entry.percentage, 0);

  const normalizedItems = items.map((item) => ({
    itemId: item.id,
    productId: item.productId || '',
    designId: item.designId || '',
    title: item.title.trim(),
    description: item.commercialDescription.trim(),
    quantity: Number(item.quantity || 0),
    unit: item.unit.trim() || 'unidad',
    unitPriceUsd: Number(item.unitPrice || 0),
    subtotalUsd: Number(item.quantity || 0) * Number(item.unitPrice || 0),
    imageUrl: item.imageUrl.trim(),
    images: item.imageUrl.trim() ? [item.imageUrl.trim()] : [],
    features: item.features.split(',').map((value) => value.trim()).filter(Boolean),
    internalData: null
  }));

  const intakeContract = {
    contractVersion: '1.0.0',
    platform: 'ELANVISUAL',
    source,
    customer: { customerId, ...customer },
    executive: EXECUTIVE,
    project: {
      title: project.title.trim(),
      priority: 'normal',
      expectedDeliveryAt: project.expectedDeliveryAt || '',
      images: []
    },
    items: normalizedItems,
    pricing: {
      currency: 'USD',
      settlementCurrency: 'NIO',
      discountUsd: discount,
      taxRate: applyTax ? 15 : 0,
      taxUsd: tax,
      totalUsd: total,
      exchangeRate: Number(exchangeRate || 0),
      exchangeRateDate: new Date().toISOString().slice(0, 10),
      payableTotalNio
    },
    payments: { type: paymentType, installments },
    metadata: { sourceScreen: 'CotizadorUniversal', contextGateway: 'orchestrator', emcStatus: 'interfaces_only' }
  };

  const canSubmit = Boolean(
    customer.name.trim() && project.title.trim() && Number(exchangeRate) > 0 &&
    normalizedItems.every((item) => item.title && item.quantity > 0 && item.unitPriceUsd >= 0) &&
    Math.abs(paymentPercentTotal - 100) < 0.001
  );

  const updateItem = (id, field, value) => setItems((current) =>
    current.map((item) => item.id === id ? { ...item, [field]: value } : item)
  );

  async function runContextSearch() {
    const query = searchQuery.trim();
    if (query.length < 2 || searching) return;
    setSearching(true);
    setSearchError('');
    try {
      const result = await projectContextClient.searchContext(query);
      setSearchResults(Array.isArray(result.results) ? result.results : []);
      if (!result.results?.length) setSearchError('No se encontraron clientes, diseños o productos con ese dato.');
    } catch (error) {
      setSearchResults([]);
      setSearchError(error.message || 'No fue posible consultar el contexto.');
    } finally {
      setSearching(false);
    }
  }

  function applyContext(result) {
    if (result.customer) {
      setCustomerId(result.customer.customerId || `ELANVISUAL-${crypto.randomUUID()}`);
      setCustomer({
        name: result.customer.name || '',
        companyName: result.customer.companyName || '',
        phone: result.customer.phone || '',
        email: result.customer.email || '',
        address: result.customer.address || ''
      });
    }
    if (result.project?.title) {
      setProject((current) => ({ ...current, title: result.project.title }));
    }
    if (Array.isArray(result.items) && result.items.length) {
      setItems(result.items.map(mapContextItem));
    }
    setSource({
      type: result.source?.type || result.type || 'manual',
      sourceId: result.source?.sourceId || result.sourceId || '',
      designRequestId: result.source?.designRequestId || '',
      storeProductId: result.source?.storeProductId || '',
      storeCartId: result.source?.storeCartId || '',
      designMode: result.type === 'design' ? 'required' : 'optional'
    });
    setSearchResults([]);
    setSearchError('');
  }

  async function saveInProjectCore() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const response = await projectCoreClient.createProject(intakeContract);
      setCreation(response);
      setSavedContract(intakeContract);
    } catch (error) {
      const details = error.details?.length ? ` ${error.details.join(' · ')}` : '';
      setSaveError(`${error.message || 'No fue posible crear la cotización.'}${details}`);
    } finally {
      setSaving(false);
    }
  }

  if (creation && savedContract) {
    return <VQSProjectSummary creation={creation} contract={savedContract} onBack={() => { setCreation(null); setSavedContract(null); }} />;
  }

  return (
    <main className="uq-shell">
      <header className="uq-header">
        <div><span>ELANVISUAL · VQS</span><h1>Nueva cotización</h1><p>Conectada directamente a Project Core mediante el Orchestrator.</p></div>
        <button type="button" disabled={!canSubmit || saving} onClick={saveInProjectCore}>{saving ? 'Creando…' : 'Crear cotización'}</button>
      </header>

      <section className="uq-card">
        <h2>Cargar desde el ecosistema</h2>
        <p>Buscá por teléfono, nombre, empresa, código de diseño o código de producto. Toda consulta pasa por el Orchestrator.</p>
        <div className="uq-fields two">
          <label className="wide">Buscar contexto
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runContextSearch()} placeholder="Ej. 78828089, DESIGN-XXXX o código de producto" />
          </label>
        </div>
        <button type="button" className="uq-light" disabled={searching || searchQuery.trim().length < 2} onClick={runContextSearch}>{searching ? 'Buscando…' : 'Buscar en Orchestrator'}</button>
        {searchError && <p className="uq-error">{searchError}</p>}
        {searchResults.length > 0 && <div className="uq-items">
          {searchResults.map((result, index) => <article className="uq-item" key={`${result.type}-${result.sourceId}-${index}`}>
            <div className="uq-item-heading"><strong>{result.label || result.type}</strong><button type="button" onClick={() => applyContext(result)}>Cargar</button></div>
            <small>Fuente: {result.type} · {result.customer?.phone || result.sourceId}</small>
          </article>)}
        </div>}
        {source.type !== 'manual' && <p><strong>Contexto cargado:</strong> {source.type} · {source.sourceId}</p>}
      </section>

      {saveError && <section className="uq-card uq-error">{saveError}</section>}

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
              <label>Entrega estimada<input type="datetime-local" value={project.expectedDeliveryAt} onChange={(e) => setProject({ ...project, expectedDeliveryAt: e.target.value })} /></label>
            </div>
          </section>

          <section className="uq-card">
            <div className="uq-section-title"><div><h2>Productos</h2><small>Puede cargarse desde Diseño o Tienda mediante el Orchestrator.</small></div><button type="button" className="uq-light" onClick={() => setItems([...items, emptyItem()])}>+ Agregar producto</button></div>
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
            {paymentType === 'custom' && <div className="uq-custom-payments">
              {customInstallments.map((entry, index) => <div key={index}><input value={entry.label} onChange={(e) => setCustomInstallments(customInstallments.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} /><input type="number" value={entry.percentage} onChange={(e) => setCustomInstallments(customInstallments.map((item, i) => i === index ? { ...item, percentage: Number(e.target.value) } : item))} /><span>%</span></div>)}
              <button type="button" className="uq-light" onClick={() => setCustomInstallments([...customInstallments, { label: `Cuota ${customInstallments.length + 1}`, percentage: 0 }])}>+ Agregar cuota</button>
            </div>}
          </section>
        </div>

        <aside className="uq-side">
          <section className="uq-card">
            <h2>Totales</h2>
            <label>Descuento %<input type="number" min="0" max="100" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} /></label>
            <label><input type="checkbox" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} /> Aplicar IVA 15%</label>
            <label>Tipo de cambio<input type="number" min="0.01" step="0.0001" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} /></label>
            <div className="uq-summary-row"><span>Subtotal</span><b>USD {subtotalGross.toFixed(2)}</b></div>
            <div className="uq-summary-row"><span>Descuento</span><b>USD {discount.toFixed(2)}</b></div>
            <div className="uq-summary-row"><span>IVA</span><b>USD {tax.toFixed(2)}</b></div>
            <div className="uq-summary-row uq-total"><span>Total</span><b>USD {total.toFixed(2)}</b></div>
            <div className="uq-summary-row"><span>Total NIO</span><b>C$ {payableTotalNio.toFixed(2)}</b></div>
          </section>
          <button type="button" className="uq-primary-wide" disabled={!canSubmit || saving} onClick={saveInProjectCore}>{saving ? 'Creando…' : 'Crear cotización'}</button>
        </aside>
      </section>
    </main>
  );
}
