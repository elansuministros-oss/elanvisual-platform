import React, { useEffect, useMemo, useState } from 'react';
import { projectCoreClient } from '../modules/vqs/services/projectCoreClient';
import { projectContextClient } from '../modules/vqs/services/projectContextClient';
import { buildBulkIntakeContract, parseBulkQuotationPayload } from '../modules/vqs/services/bulkQuotationImport';
import { getQuotationEditData, updateQuotation } from '../modules/quotation-viewer/services/quotationViewerService';
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

function isImageDataUrl(value = '') {
  return /^data:image\/(?:png|jpe?g|webp);base64,/i.test(String(value || '').trim());
}

function resolvePrimaryItemImage(item = {}) {
  const explicitImageUrl = resolveAssetUrl(item.imageUrl);
  if (explicitImageUrl) return explicitImageUrl;

  const assetFiles = Array.isArray(item.assetFiles) ? item.assetFiles : [];
  const generatedRender = assetFiles.find((asset) =>
    String(asset?.kind || '').trim() === 'generated-render' && resolveAssetUrl(asset)
  );
  if (generatedRender) return resolveAssetUrl(generatedRender);

  const manualImage = (Array.isArray(item.manualImages) ? item.manualImages : [])
    .find((image) => isImageDataUrl(image?.dataUrl) || isHttpUrl(image?.dataUrl));

  return manualImage?.dataUrl || '';
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

function resolveEditPublicDocument(record = {}) {
  const document = record.quotation_document || record.quotationDocument || {};
  return document.publicDocument || document.public_document || {};
}

export default function CotizadorUniversal() {
  const editProjectId = new URLSearchParams(window.location.search).get('quotationId')?.trim() || '';
  const isEditing = Boolean(editProjectId);
  const [customerId, setCustomerId] = useState(() => `ELANVISUAL-${crypto.randomUUID()}`);
  const [customer, setCustomer] = useState({ name: '', companyName: '', phone: '', email: '', address: '', taxId: '' });
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
  const [editLoading, setEditLoading] = useState(isEditing);
  const [editQuotationNumber, setEditQuotationNumber] = useState('');
  const [bulkImport, setBulkImport] = useState(null);
  const [bulkSelectedKeys, setBulkSelectedKeys] = useState([]);
  const [bulkError, setBulkError] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ completed: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState({});
  const [bulkClient, setBulkClient] = useState({
    companyName: 'COMEX',
    phone: '',
    email: '',
    taxId: ''
  });

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
    const primaryImageUrl = resolvePrimaryItemImage(item);

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
      imageUrl: primaryImageUrl,
      images: primaryImageUrl ? [primaryImageUrl] : [],
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
      images: uniqueStrings(project.images)
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
        phone: result.customer.phone || '', email: result.customer.email || '', address: result.customer.address || '',
        taxId: result.customer.taxId || result.customer.tax_id || result.customer.ruc || ''
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

  useEffect(() => {
    if (!isEditing) return undefined;
    let mounted = true;

    async function loadEditData() {
      setEditLoading(true);
      setSaveError('');
      try {
        const record = await getQuotationEditData(editProjectId);
        const publicDocument = resolveEditPublicDocument(record);
        const pricing = publicDocument.pricing || publicDocument.totals || record.pricing || {};
        const paymentTerms = publicDocument.paymentTerms || publicDocument.payment_terms || record.paymentTerms || record.payment_terms || {};
        const customerData = publicDocument.customer || record.customer || {};
        const projectData = publicDocument.project || record.project || {};
        const sourceData = publicDocument.source || record.source || {};
        const loadedItems = Array.isArray(publicDocument.items) ? publicDocument.items.map((item) => mapContextItem(item, publicDocument)) : [];
        const loadedSubtotal = loadedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
        const discountUsd = Number(pricing.discountUsd ?? pricing.discount_usd ?? 0);
        const taxRate = Number(pricing.taxRate ?? pricing.tax_rate ?? 0);
        const type = paymentTerms.type || '60_40';
        const loadedInstallments = Array.isArray(paymentTerms.installments) ? paymentTerms.installments : [];

        if (!mounted) return;
        setEditQuotationNumber(publicDocument.quotationNumber || record.quotationNumber || record.quotation_number || '');
        setCustomerId(customerData.customerId || customerData.customer_id || record.customerId || record.customer_id || `ELANVISUAL-${crypto.randomUUID()}`);
        setCustomer({
          name: customerData.name || '',
          companyName: customerData.companyName || customerData.company_name || '',
          phone: customerData.phone || '',
          email: customerData.email || '',
          address: customerData.address || '',
          taxId: customerData.taxId || customerData.tax_id || ''
        });
        setProject({
          title: projectData.title || record.title || '',
          expectedDeliveryAt: projectData.expectedDeliveryAt || projectData.expected_delivery_at || '',
          images: Array.isArray(projectData.images) ? projectData.images : []
        });
        if (loadedItems.length) setItems(loadedItems);
        setSource({
          type: sourceData.type || record.sourceType || 'manual',
          sourceId: sourceData.sourceId || sourceData.source_id || record.sourceId || '',
          designRequestId: sourceData.designRequestId || sourceData.design_request_id || '',
          storeProductId: sourceData.storeProductId || sourceData.store_product_id || '',
          storeCartId: sourceData.storeCartId || sourceData.store_cart_id || '',
          designMode: sourceData.designMode || sourceData.design_mode || 'optional'
        });
        setDiscountRate(loadedSubtotal > 0 ? (discountUsd / loadedSubtotal) * 100 : 0);
        setApplyTax(taxRate > 0);
        setExchangeRate(Number(pricing.exchangeRate ?? pricing.exchange_rate ?? 36.8));
        setPaymentType(type);
        if (type === 'custom' && loadedInstallments.length) {
          setCustomInstallments(loadedInstallments.map((entry) => ({
            label: entry.label || '',
            percentage: Number(entry.percentage || 0),
            dueCondition: entry.dueCondition || entry.due_condition || ''
          })));
        }
      } catch (error) {
        if (mounted) setSaveError(error.message || 'No fue posible cargar la cotización para editar.');
      } finally {
        if (mounted) setEditLoading(false);
      }
    }

    loadEditData();
    return () => { mounted = false; };
  }, [editProjectId, isEditing]);

  async function saveInProjectCore() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const response = isEditing
        ? await updateQuotation(editProjectId, intakeContract)
        : await projectCoreClient.createProject(intakeContract);
      setCreation(response?.data || response);
      setSavedContract(intakeContract);
    } catch (error) {
      const details = error.details?.length ? ` ${error.details.join(' · ')}` : '';
      setSaveError(`${error.message || (isEditing ? 'No fue posible guardar los cambios.' : 'No fue posible crear la cotización.')}${details}`);
    } finally {
      setSaving(false);
    }
  }

  async function loadBulkQuotationFile(file) {
    if (!file) return;
    setBulkError('');
    setBulkResults({});
    setBulkProgress({ completed: 0, total: 0 });
    try {
      if (!String(file.name || '').toLowerCase().endsWith('.json')) {
        throw new Error('Seleccioná el archivo JSON del expediente modular.');
      }
      const payload = JSON.parse(await file.text());
      const parsed = parseBulkQuotationPayload(payload, {
        companyName: bulkClient.companyName,
        exchangeRate
      });
      setBulkImport(parsed);
      setBulkClient((current) => ({ ...current, companyName: parsed.companyName }));
      setBulkSelectedKeys(parsed.quotations.map((quotation) => quotation.key));
      setExchangeRate(parsed.exchangeRate);
      setApplyTax(parsed.taxRate > 0);
    } catch (error) {
      const details = Array.isArray(error.details) ? ` ${error.details.join(' · ')}` : '';
      setBulkImport(null);
      setBulkSelectedKeys([]);
      setBulkError(`${error.message || 'No fue posible leer el expediente.'}${details}`);
    }
  }

  function toggleBulkQuotation(key) {
    setBulkSelectedKeys((current) => current.includes(key)
      ? current.filter((entry) => entry !== key)
      : [...current, key]);
  }

  async function addBulkReferenceImage(quotationKey, file) {
    if (!file || !bulkImport) return;
    setBulkError('');
    try {
      if (!String(file.type || '').startsWith('image/')) {
        throw new Error('La referencia debe ser una imagen JPG, PNG o WEBP.');
      }
      const prepared = await readDesignFile(file);
      setBulkImport((current) => ({
        ...current,
        quotations: current.quotations.map((quotation) => quotation.key === quotationKey
          ? { ...quotation, images: [prepared.dataUrl] }
          : quotation)
      }));
    } catch (error) {
      setBulkError(error.message || 'No fue posible agregar la imagen de referencia.');
    }
  }

  async function createBulkQuotations() {
    if (!bulkImport || bulkSaving) return;
    const pending = bulkImport.quotations.filter((quotation) =>
      bulkSelectedKeys.includes(quotation.key) && bulkResults[quotation.key]?.status !== 'success'
    );
    if (!pending.length) {
      setBulkError('No hay cotizaciones pendientes seleccionadas.');
      return;
    }

    setBulkSaving(true);
    setBulkError('');
    setBulkProgress({ completed: 0, total: pending.length });
    let completed = 0;
    for (const quotation of pending) {
      setBulkResults((current) => ({
        ...current,
        [quotation.key]: { status: 'creating', message: 'Creando…' }
      }));
      try {
        const contract = buildBulkIntakeContract(quotation, bulkImport, {
          executive: EXECUTIVE,
          exchangeRate,
          paymentType,
          customInstallments,
          phone: bulkClient.phone,
          email: bulkClient.email,
          taxId: bulkClient.taxId
        });
        const response = await projectCoreClient.createProject(contract);
        const result = response?.data || response;
        setBulkResults((current) => ({
          ...current,
          [quotation.key]: {
            status: 'success',
            message: 'Cotización creada',
            projectId: result?.projectId || result?.project_id || result?.id || '',
            quotationNumber: result?.quotationNumber || result?.quotation_number || ''
          }
        }));
      } catch (error) {
        const details = error.details?.length ? ` ${error.details.join(' · ')}` : '';
        setBulkResults((current) => ({
          ...current,
          [quotation.key]: {
            status: 'error',
            message: `${error.message || 'No fue posible crear la cotización.'}${details}`
          }
        }));
      } finally {
        completed += 1;
        setBulkProgress({ completed, total: pending.length });
      }
    }
    setBulkSaving(false);
  }

  if (creation && savedContract) {
    return <VQSProjectSummary creation={creation} contract={savedContract} onBack={() => { setCreation(null); setSavedContract(null); }} />;
  }

  if (editLoading) {
    return <main className="uq-shell"><section className="uq-card"><h2>Cargando cotización…</h2><p>Consultando los datos oficiales en el Orchestrator.</p></section></main>;
  }

  return (
    <main className="uq-shell">
      <header className="uq-header">
        <div><span>ELANVISUAL · VQS</span><h1>{isEditing ? `Editar cotización ${editQuotationNumber}` : 'Nueva cotización'}</h1><p>Conectada directamente a Project Core mediante el Orchestrator.</p></div>
        <button type="button" disabled={!canSubmit || saving} onClick={saveInProjectCore}>{saving ? (isEditing ? 'Guardando…' : 'Creando…') : (isEditing ? 'Guardar cambios' : 'Crear cotización')}</button>
      </header>

      {!isEditing && <section className="uq-card uq-bulk">
        <div className="uq-section-title">
          <div>
            <h2>Crear varias cotizaciones</h2>
            <small>Cargá un expediente modular JSON, revisá las sucursales y crealas en una sola operación.</small>
          </div>
          <label className="uq-file-button">
            Importar expediente
            <input
              type="file"
              accept=".json,application/json"
              disabled={bulkSaving}
              onChange={(event) => {
                void loadBulkQuotationFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
        </div>
        {bulkError && <p className="uq-error">{bulkError}</p>}
        {bulkImport && <>
          <div className="uq-fields uq-bulk-contact">
            <label>Empresa
              <input value={bulkClient.companyName} disabled />
            </label>
            <label>Teléfono común
              <input value={bulkClient.phone} onChange={(event) => setBulkClient({ ...bulkClient, phone: event.target.value })} />
            </label>
            <label>Correo común
              <input type="email" value={bulkClient.email} onChange={(event) => setBulkClient({ ...bulkClient, email: event.target.value })} />
            </label>
            <label>RUC / identificación
              <input value={bulkClient.taxId} onChange={(event) => setBulkClient({ ...bulkClient, taxId: event.target.value })} />
            </label>
          </div>
          <div className="uq-bulk-summary">
            <span><strong>{bulkImport.quotations.length}</strong> sucursales</span>
            <span><strong>{bulkImport.quotations.reduce((sum, quotation) => sum + quotation.items.length, 0)}</strong> ítems</span>
            <span><strong>USD {bulkImport.totalUsd.toFixed(2)}</strong> total expediente</span>
            <span><strong>{bulkImport.quotations.filter((quotation) => quotation.images.length === 0).length}</strong> sin imagen</span>
          </div>
          <div className="uq-bulk-list">
            {bulkImport.quotations.map((quotation) => {
              const result = bulkResults[quotation.key];
              return <details className="uq-bulk-branch" key={quotation.key}>
                <summary>
                  <label onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={bulkSelectedKeys.includes(quotation.key)}
                      disabled={bulkSaving || result?.status === 'success'}
                      onChange={() => toggleBulkQuotation(quotation.key)}
                    />
                    <span>{quotation.customerName}</span>
                  </label>
                  <span>{quotation.items.length} ítems · USD {quotation.totalUsd.toFixed(2)}</span>
                  <span className={`uq-bulk-status ${result?.status || ''}`}>{result?.message || (quotation.images.length ? 'Lista' : 'Lista · sin imagen')}</span>
                </summary>
                <div className="uq-bulk-items">
                  <div className="uq-bulk-reference">
                    <span>
                      <strong>Imagen de referencia</strong>
                      <small>{quotation.images.length ? 'Adjunta al proyecto' : 'Pendiente; la cotización puede crearse sin imagen'}</small>
                    </span>
                    {quotation.images[0] && <img src={quotation.images[0]} alt={`Referencia ${quotation.branchName}`} />}
                    <label className="uq-light uq-bulk-image-button">
                      {quotation.images.length ? 'Cambiar imagen' : 'Agregar imagen'}
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        disabled={bulkSaving || result?.status === 'success'}
                        onChange={(event) => {
                          void addBulkReferenceImage(quotation.key, event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {quotation.items.map((item) => <div key={`${quotation.key}-${item.code}`}>
                    <span><strong>{item.code}</strong> {item.title}</span>
                    <span>{item.quantity} {item.unit}</span>
                    <strong>USD {item.unitPriceUsd.toFixed(2)}</strong>
                  </div>)}
                </div>
              </details>;
            })}
          </div>
          <div className="uq-bulk-actions">
            <p>
              {bulkSaving
                ? `Procesando ${bulkProgress.completed} de ${bulkProgress.total}…`
                : `${bulkSelectedKeys.length} cotizaciones seleccionadas · forma de pago ${paymentType.replaceAll('_', '/')}`}
            </p>
            <button
              type="button"
              disabled={bulkSaving || bulkSelectedKeys.length === 0}
              onClick={createBulkQuotations}
            >
              {bulkSaving ? 'Creando cotizaciones…' : `Crear ${bulkSelectedKeys.length} cotizaciones`}
            </button>
          </div>
        </>}
      </section>}

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
              <label>RUC / identificación fiscal<input value={customer.taxId} onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })} /></label>
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
          <button type="button" className="uq-primary-wide" disabled={!canSubmit || saving} onClick={saveInProjectCore}>{saving ? (isEditing ? 'Guardando…' : 'Creando…') : (isEditing ? 'Guardar cambios' : 'Crear cotización')}</button>
        </aside>
      </section>
    </main>
  );
}
