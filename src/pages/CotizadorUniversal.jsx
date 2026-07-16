import React, { useEffect, useMemo, useState } from 'react';
import { projectCoreClient } from '../modules/vqs/services/projectCoreClient';
import { projectContextClient } from '../modules/vqs/services/projectContextClient';
import { readDesignFile } from '../services/designPortalService';
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
  id: crypto.randomUUID(),
  productId: '',
  designId: '',
  title: '',
  commercialDescription: '',
  quantity: 1,
  unit: 'unidad',
  unitPrice: 0,
  imageUrl: '',
  contextImageUrls: [],
  features: '',
  assetFiles: [],
  manualImages: [],
  imagePreviewError: false,
  uploadError: ''
});

function classifyQuery(value = '') {
  const query = String(value).trim();
  const digits = query.replace(/\D/g, '');
  if (/^DESIGN-[A-Z0-9-]+$/i.test(query)) return 'design';
  if (digits.length >= 8 && digits.length <= 13) return 'customer';
  return 'all';
}

const ASSET_URL_FIELDS = ['publicUrl', 'signedUrl', 'url', 'downloadUrl', 'imageUrl', 'src'];

function isHttpUrl(value = '') {
  const candidate = String(value || '').trim();
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isImageAsset(asset = {}) {
  const mimeType = String(asset?.mimeType || asset?.type || '').trim().toLowerCase();
  return !mimeType || mimeType.startsWith('image/');
}

function resolveAssetUrl(asset) {
  if (typeof asset === 'string') {
    return isHttpUrl(asset) ? asset.trim() : '';
  }

  if (!asset || typeof asset !== 'object' || !isImageAsset(asset)) return '';

  for (const field of ASSET_URL_FIELDS) {
    const value = asset[field];
    if (typeof value === 'string' && isHttpUrl(value)) return value.trim();
  }

  return '';
}

function uniqueStrings(values = []) {
  const seen = new Set();
  return values
    .map((value) => String(value || '').trim())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function normalizeImageSources(values = []) {
  return uniqueStrings(
    (Array.isArray(values) ? values : [values])
      .map((entry) => resolveAssetUrl(entry))
  );
}

function normalizeAssetFiles(images = []) {
  return (Array.isArray(images) ? images : [])
    .filter((asset) => asset && typeof asset === 'object')
    .map((asset) => {
      const normalized = {
        kind: String(asset.kind || ''),
        name: String(asset.name || ''),
        path: String(asset.path || ''),
        bucket: String(asset.bucket || ''),
        mimeType: String(asset.mimeType || ''),
        sizeBytes: Number(asset.sizeBytes || 0)
      };

      ASSET_URL_FIELDS.forEach((field) => {
        if (typeof asset[field] === 'string' && asset[field].trim()) {
          normalized[field] = asset[field].trim();
        }
      });

      return normalized;
    });
}

function mapContextItem(item = {}, context = {}) {
  const sourceImages = Array.isArray(item.images) ? item.images : [];
  const resultImages = [
    ...(Array.isArray(item.resultFiles) ? item.resultFiles : []),
    ...(Array.isArray(item.result_files) ? item.result_files : []),
    ...(Array.isArray(context.resultFiles) ? context.resultFiles : []),
    ...(Array.isArray(context.result_files) ? context.result_files : []),
    ...(Array.isArray(context.raw?.result_files) ? context.raw.result_files : [])
  ];
  const contextImageUrls = uniqueStrings([
    resolveAssetUrl(item.imageUrl),
    ...resultImages.map((entry) => resolveAssetUrl(entry)),
    ...sourceImages.map((entry) => resolveAssetUrl(entry))
  ]);
  const primaryImageUrl = contextImageUrls[0] || '';

  return {
    id: item.itemId || crypto.randomUUID(),
    productId: item.productId || '',
    designId: item.designId || '',
    title: item.title || '',
    commercialDescription: item.description || '',
    quantity: Number(item.quantity || 1),
    unit: item.unit || 'unidad',
    unitPrice: Number(item.unitPriceUsd || 0),
    imageUrl: primaryImageUrl,
    contextImageUrls,
    features: Array.isArray(item.features) ? item.features.join(', ') : String(item.features || ''),
    assetFiles: normalizeAssetFiles([...resultImages, ...sourceImages]),
    manualImages: [],
    imagePreviewError: false,
    uploadError: ''
  };
}

function isEmptyItem(item) {
  return !item.title && !item.productId && !item.designId && Number(item.unitPrice || 0) === 0;
}

export default function CotizadorUniversal() {
  const [customerId, setCustomerId] = useState(() => `ELANVISUAL-${crypto.randomUUID()}`);
  const [customer, setCustomer] = useState({ name: '', companyName: '', phone: '', email: '', address: '' });
  const [project, setProject] = useState({ title: '', expectedDeliveryAt: '', images: [] });
  const [items, setItems] = useState([emptyItem()]);
  const [source, setSource] = useState({ type: 'manual', sourceId: '', designRequestId: '', storeProductId: '', storeCartId: '', designMode: 'optional' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lastAutoQuery, setLastAutoQuery] = useState('');
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

  const normalizedItems = items.map((item) => {
    const contextImageUrls = Array.isArray(item.contextImageUrls) ? item.contextImageUrls : [];
    const images = uniqueStrings([
      String(item.imageUrl || '').trim(),
      ...contextImageUrls,
      ...(Array.isArray(item.manualImages) ? item.manualImages.map((image) => image.dataUrl) : [])
    ].filter(Boolean));

    return {
      itemId: item.id,
      productId: item.productId || '',
      designId: item.designId || '',
      title: item.title.trim(),
      description: item.commercialDescription.trim(),
      quantity: Number(item.quantity || 0),
      unit: item.unit.trim() || 'unidad',
      unitPriceUsd: Number(item.unitPrice || 0),
      subtotalUsd: Number(item.quantity || 0) * Number(item.unitPrice || 0),
      imageUrl: images[0] || '',
      images,
      features: item.features.split(',').map((value) => value.trim()).filter(Boolean),
      internalData: null
    };
  });

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
      images: normalizeImageSources(project.images)
    },
    items: normalizedItems,
    pricing: {
      currency: 'USD', settlementCurrency: 'NIO', discountUsd: discount,
      taxRate: applyTax ? 15 : 0, taxUsd: tax, totalUsd: total,
      exchangeRate: Number(exchangeRate || 0),
      exchangeRateDate: new Date().toISOString().slice(0, 10), payableTotalNio
    },
    payments: { type: paymentType, installments },
    metadata: {
      sourceScreen: 'CotizadorUniversal',
      contextGateway: 'orchestrator',
      emcStatus: 'interfaces_only',
      sourceAssets: items.flatMap((item) => [
        ...(item.assetFiles || []),
        ...(item.manualImages || []).map((image) => ({
          kind: 'existing-product-photo',
          name: image.name,
          mimeType: image.mimeType,
          sizeBytes: image.sizeBytes,
          itemId: item.id
        }))
      ])
    }
  };

  const canSubmit = Boolean(
    customer.name.trim() && project.title.trim() && Number(exchangeRate) > 0 &&
    normalizedItems.every((item) => item.title && item.quantity > 0 && item.unitPriceUsd >= 0) &&
    Math.abs(paymentPercentTotal - 100) < 0.001
  );

  const updateItem = (id, field, value) => setItems((current) =>
    current.map((item) => item.id === id
      ? { ...item, [field]: value, ...(field === 'imageUrl' ? { imagePreviewError: false } : {}) }
      : item)
  );

  async function addManualImages(itemId, selectedFiles) {
    const files = Array.from(selectedFiles || []);
    if (!files.length) return;

    setItems((current) => current.map((item) => item.id === itemId ? { ...item, uploadError: '' } : item));

    try {
      const item = items.find((entry) => entry.id === itemId);
      const availableSlots = Math.max(0, 4 - Number(item?.manualImages?.length || 0));
      if (!availableSlots) throw new Error('Este producto ya tiene el máximo de 4 fotos existentes.');

      const acceptedFiles = files.slice(0, availableSlots);
      const preparedImages = [];
      for (const file of acceptedFiles) {
        if (!String(file.type || '').startsWith('image/')) {
          throw new Error('Solo se permiten imágenes JPG, PNG o WEBP.');
        }
        const prepared = await readDesignFile(file);
        preparedImages.push({ id: crypto.randomUUID(), ...prepared });
      }

      setItems((current) => current.map((entry) => entry.id === itemId
        ? { ...entry, manualImages: [...(entry.manualImages || []), ...preparedImages], uploadError: '' }
        : entry));
    } catch (error) {
      setItems((current) => current.map((entry) => entry.id === itemId
        ? { ...entry, uploadError: error.message || 'No fue posible agregar la fotografía.' }
        : entry));
    }
  }

  function removeManualImage(itemId, imageId) {
    setItems((current) => current.map((item) => item.id === itemId
      ? { ...item, manualImages: (item.manualImages || []).filter((image) => image.id !== imageId), uploadError: '' }
      : item));
  }

  function applyContext(result, { automatic = false } = {}) {
    if (result.customer) {
      setCustomerId(result.customer.customerId || `ELANVISUAL-${crypto.randomUUID()}`);
      setCustomer({
        name: result.customer.name || '', companyName: result.customer.companyName || '',
        phone: result.customer.phone || '', email: result.customer.email || '', address: result.customer.address || ''
      });
    }

    if (result.type === 'design') {
      const mappedItems = Array.isArray(result.items) ? result.items.map((item) => mapContextItem(item, result)) : [];
      setProject((current) => ({
        ...current,
        title: result.project?.title || current.title,
        images: uniqueStrings(mappedItems.flatMap((item) => item.contextImageUrls || []))
      }));
      if (mappedItems.length) setItems(mappedItems);
    } else if (result.type === 'store') {
      const mappedItems = Array.isArray(result.items) ? result.items.map((item) => mapContextItem(item, result)) : [];
      if (result.project?.title) setProject((current) => ({ ...current, title: current.title || result.project.title }));
      if (mappedItems.length) {
        setItems((current) => {
          const base = current.length === 1 && isEmptyItem(current[0]) ? [] : current;
          const existingIds = new Set(base.map((item) => item.productId || item.id));
          return [...base, ...mappedItems.filter((item) => !existingIds.has(item.productId || item.id))];
        });
      }
    } else if (result.project?.title) {
      setProject((current) => ({ ...current, title: result.project.title }));
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
    setSearchError(automatic ? 'Información cargada automáticamente desde el Orchestrator.' : '');
  }

  async function runContextSearch(queryOverride, options = {}) {
    const query = String(queryOverride ?? searchQuery).trim();
    if (query.length < 2 || searching) return;
    const type = options.type || classifyQuery(query);
    setSearching(true);
    setSearchError('');
    try {
      const result = await projectContextClient.searchContext(query, { type, limit: 12 });
      const results = Array.isArray(result.results) ? result.results : [];
      if (options.automatic && results.length === 1) {
        applyContext(results[0], { automatic: true });
      } else {
        setSearchResults(results);
        if (!results.length) setSearchError('No se encontraron clientes, diseños o productos con ese dato.');
      }
    } catch (error) {
      setSearchResults([]);
      setSearchError(error.message || 'No fue posible consultar el contexto.');
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    const query = searchQuery.trim();
    const type = classifyQuery(query);
    const ready = type === 'design'
      ? /^DESIGN-[A-Z0-9-]+$/i.test(query)
      : type === 'customer'
        ? query.replace(/\D/g, '').length >= 8
        : query.length >= 3;
    if (!ready || query === lastAutoQuery) return undefined;
    const timer = window.setTimeout(() => {
      setLastAutoQuery(query);
      runContextSearch(query, { type, automatic: true });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [searchQuery, lastAutoQuery]);

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
        <p>Escribí un teléfono, un código DESIGN, un cliente o un producto. El cotizador consulta y carga automáticamente desde el Orchestrator.</p>
        <div className="uq-fields two">
          <label className="wide">Buscar contexto
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runContextSearch()} placeholder="Ej. RESTAURANTES LAS SOPAS, 58401030 o DESIGN-..." />
          </label>
        </div>
        <button type="button" className="uq-light" disabled={searching || searchQuery.trim().length < 2} onClick={() => runContextSearch()}>{searching ? 'Buscando…' : 'Buscar en Orchestrator'}</button>
        {searchError && <p className={searchError.startsWith('Información cargada') ? '' : 'uq-error'}>{searchError}</p>}
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
            <div className="uq-section-title"><div><h2>Productos</h2><small>Podés combinar diseños del ecosistema con fotos reales de productos existentes.</small></div><button type="button" className="uq-light" onClick={() => setItems([...items, emptyItem()])}>+ Agregar producto</button></div>
            <div className="uq-items">
              {items.map((item, index) => (
                <article className="uq-item" key={item.id}>
                  <div className="uq-item-heading"><strong>Ítem {index + 1}</strong>{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((entry) => entry.id !== item.id))}>Eliminar</button>}</div>
                  <div className="uq-fields two">
                    <label>Producto<input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} /></label>
                    <label>Imagen principal URL<input value={item.imageUrl} onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)} placeholder="https://..." /></label>
                    <label className="wide">Descripción comercial<textarea rows="3" value={item.commercialDescription} onChange={(e) => updateItem(item.id, 'commercialDescription', e.target.value)} /></label>
                    <label>Cantidad<input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} /></label>
                    <label>Unidad<input value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} /></label>
                    <label>Precio unitario USD<input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} /></label>
                    <label>Características<input value={item.features} onChange={(e) => updateItem(item.id, 'features', e.target.value)} placeholder="Exterior, LED, instalación" /></label>
                    <label className="wide">Agregar fotos existentes
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        multiple
                        onChange={(event) => {
                          void addManualImages(item.id, event.target.files);
                          event.target.value = '';
                        }}
                      />
                      <small>Hasta 4 fotos por producto. Cada archivo debe pesar menos de 8 MB.</small>
                    </label>
                  </div>
                  {item.imageUrl && (
                    <div className={`uq-image-preview ${item.imagePreviewError ? 'is-error' : ''}`}>
                      {item.imagePreviewError ? (
                        <p>No fue posible cargar la imagen desde la URL indicada.</p>
                      ) : (
                        <img
                          src={item.imageUrl}
                          alt={`Imagen principal de ${item.title || `item ${index + 1}`}`}
                          onLoad={() => updateItem(item.id, 'imagePreviewError', false)}
                          onError={() => updateItem(item.id, 'imagePreviewError', true)}
                        />
                      )}
                      <small>{item.imageUrl}</small>
                    </div>
                  )}
                  {item.uploadError && <p className="uq-error">{item.uploadError}</p>}
                  {item.manualImages?.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
                    {item.manualImages.map((image) => <div key={image.id} style={{ border: '1px solid #d7dde7', borderRadius: 12, padding: 8 }}>
                      <img src={image.dataUrl} alt={image.name} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} />
                      <small style={{ display: 'block', overflowWrap: 'anywhere', margin: '7px 0' }}>{image.name}</small>
                      <button type="button" className="uq-light" onClick={() => removeManualImage(item.id, image.id)}>Quitar</button>
                    </div>)}
                  </div>}
                  {item.assetFiles?.length > 0 && <div><small><strong>Archivos del diseño:</strong></small><ul>{item.assetFiles.map((asset, assetIndex) => <li key={`${asset.path}-${assetIndex}`}><small>{asset.kind || 'archivo'} · {asset.name || asset.path}</small></li>)}</ul></div>}
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
