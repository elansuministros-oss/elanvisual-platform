import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { resolveBaseUrl } from '../modules/vqs/services/projectCoreClient';
import '../styles/public-quotation-v2.css';

const HEADERS = Object.freeze({
  Accept: 'application/json',
  'X-Elankav-Platform': 'ELANVISUAL',
  'X-Elankav-Actor-Type': 'public-customer'
});

function readProjectId() {
  const match = window.location.pathname.match(/^\/cotizaciones\/v2\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function text(...values) {
  const value = values.find((entry) => entry !== undefined && entry !== null && String(entry).trim() !== '');
  return value === undefined ? '' : String(value).trim();
}

function numberValue(...values) {
  const value = values.find((entry) => entry !== undefined && entry !== null && entry !== '');
  if (value === undefined) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value, currency = 'USD') {
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(numberValue(value));
}

function imageUrlOf(item) {
  const images = Array.isArray(item?.images) ? item.images : [];
  const first = images.find((image) => text(image?.url, image?.signedUrl, image?.publicUrl));
  return text(
    first?.url,
    first?.signedUrl,
    first?.publicUrl,
    item?.imageUrl,
    item?.image_url,
    item?.imagen,
    item?.renderUrl,
    item?.render_url
  );
}

function normalizeItems(record) {
  const source = Array.isArray(record?.items)
    ? record.items
    : Array.isArray(record?.products)
      ? record.products
      : Array.isArray(record?.productos)
        ? record.productos
        : [];

  return source.map((item, index) => ({
    id: text(item?.id, item?.itemId, item?.item_id, index + 1),
    title: text(item?.title, item?.name, item?.nombre, item?.productName, 'Producto'),
    description: text(item?.commercialDescription, item?.description, item?.descripcion, item?.details),
    dimensions: text(item?.dimensionsText, item?.dimensions, item?.medidas),
    quantity: numberValue(item?.quantity, item?.cantidad, 1),
    unit: text(item?.unit, item?.unidad, 'unidad'),
    unitPrice: numberValue(item?.unitPrice, item?.unit_price, item?.precioUnitario, item?.price),
    subtotal: numberValue(item?.subtotal, item?.total, item?.lineTotal, item?.line_total),
    imageUrl: imageUrlOf(item)
  }));
}

function normalizeRecord(payload) {
  const record = payload?.data || payload?.quotation || payload || {};
  const customer = record?.customer || record?.client || record?.cliente || {};
  const totals = record?.totals || record?.summary || record?.resumen || {};
  const payment = record?.payment || record?.paymentTerms || record?.formaPago || {};

  return {
    id: text(record?.id, record?.quotationId, record?.quotation_id, record?.projectId),
    number: text(record?.quotationNumber, record?.number, record?.numeroCotizacion, 'Cotización'),
    date: text(record?.date, record?.createdAt, record?.created_at),
    customer: {
      name: text(customer?.name, customer?.fullName, customer?.nombre, record?.customerName),
      company: text(customer?.companyName, customer?.company, customer?.empresa),
      phone: text(customer?.phone, customer?.telefono),
      email: text(customer?.email, customer?.correo),
      address: text(customer?.address, customer?.direccion)
    },
    items: normalizeItems(record),
    paymentLabel: text(payment?.label, payment?.type, payment?.description, record?.paymentLabel),
    subtotal: numberValue(totals?.subtotal, record?.subtotal),
    discount: numberValue(totals?.discount, record?.discount),
    tax: numberValue(totals?.tax, totals?.iva, record?.tax),
    totalUsd: numberValue(totals?.totalUsd, totals?.total_usd, totals?.total, record?.totalUsd, record?.total),
    totalNio: numberValue(totals?.nioReference, totals?.totalNio, totals?.total_nio, record?.totalNio),
    pdfUrl: text(record?.pdfUrl, record?.pdf_url)
  };
}

async function fetchQuotation(projectId) {
  const url = new URL(`${resolveBaseUrl()}/api/vqs/public/quotations/${encodeURIComponent(projectId)}`);
  url.searchParams.set('_refresh', String(Date.now()));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: HEADERS,
    cache: 'no-store'
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(text(payload?.error, payload?.message, 'No fue posible cargar la cotización.'));
    error.status = response.status;
    throw error;
  }

  return normalizeRecord(payload);
}

export default function PublicQuotationV2() {
  const projectId = useMemo(() => readProjectId(), []);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuotation(await fetchQuotation(projectId));
    } catch (requestError) {
      setQuotation(null);
      setError(requestError.message || 'No fue posible cargar la cotización.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <main className="pq2-state"><FileText size={34} /><strong>Cargando cotización…</strong></main>;
  }

  if (error || !quotation) {
    return (
      <main className="pq2-state pq2-error">
        <FileText size={34} />
        <strong>No fue posible abrir la cotización</strong>
        <p>{error}</p>
        <button type="button" onClick={load}><RefreshCw size={17} /> Reintentar</button>
      </main>
    );
  }

  const downloadPdf = () => {
    if (quotation.pdfUrl) {
      window.open(quotation.pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.print();
  };

  return (
    <main className="pq2-page">
      <div className="pq2-toolbar no-print">
        <div><span>ELANVISUAL</span><strong>{quotation.number}</strong></div>
        <div className="pq2-toolbar-actions">
          <button type="button" onClick={load}><RefreshCw size={17} /> Actualizar</button>
          <button type="button" onClick={downloadPdf}><Download size={17} /> PDF</button>
        </div>
      </div>

      <article className="pq2-document">
        <header className="pq2-header">
          <img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" />
          <div><span>COTIZACIÓN</span><h1>{quotation.number}</h1></div>
          <dl><div><dt>Fecha</dt><dd>{quotation.date || '—'}</dd></div></dl>
        </header>

        <section className="pq2-customer">
          <div><span>Cliente</span><strong>{quotation.customer.name || 'Cliente'}</strong></div>
          {quotation.customer.company && <div><span>Empresa</span><strong>{quotation.customer.company}</strong></div>}
          {quotation.customer.phone && <div><span>Teléfono</span><strong>{quotation.customer.phone}</strong></div>}
          {quotation.customer.email && <div><span>Correo</span><strong>{quotation.customer.email}</strong></div>}
          {quotation.customer.address && <div><span>Dirección</span><strong>{quotation.customer.address}</strong></div>}
        </section>

        <section className="pq2-products">
          <div className="pq2-section-title"><span>Productos</span><h2>Detalle comercial</h2></div>
          {quotation.items.length ? quotation.items.map((item) => (
            <article className="pq2-item" key={`${item.id}-${item.imageUrl}`}>
              <div className="pq2-image">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" />
                  : <span>Sin imagen</span>}
              </div>
              <div className="pq2-description"><h3>{item.title}</h3><p>{item.description || 'Sin descripción comercial.'}</p></div>
              <div><span>Medidas</span><strong>{item.dimensions || '—'}</strong></div>
              <div><span>Cantidad</span><strong>{item.quantity} {item.unit}</strong></div>
              <div><span>Subtotal</span><strong>{money(item.subtotal || item.unitPrice * item.quantity)}</strong></div>
            </article>
          )) : <p>No hay productos en esta cotización.</p>}
        </section>

        <section className="pq2-summary">
          <div className="pq2-payment"><span>Forma de pago</span><strong>{quotation.paymentLabel || 'Según acuerdo comercial'}</strong></div>
          <div className="pq2-totals">
            <div><span>Subtotal</span><strong>{money(quotation.subtotal)}</strong></div>
            {quotation.discount > 0 && <div><span>Descuento</span><strong>{money(quotation.discount)}</strong></div>}
            {quotation.tax > 0 && <div><span>IVA</span><strong>{money(quotation.tax)}</strong></div>}
            <div className="pq2-grand"><span>Total USD</span><strong>{money(quotation.totalUsd)}</strong></div>
            {quotation.totalNio > 0 && <div><span>Referencia NIO</span><strong>{money(quotation.totalNio, 'NIO')}</strong></div>}
          </div>
        </section>
      </article>
    </main>
  );
}
