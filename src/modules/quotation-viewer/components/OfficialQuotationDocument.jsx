import React from 'react';
import { ArrowLeft, MessageCircle, Printer } from 'lucide-react';
import '../../../styles/quotation-item-layout.css';

const BRAND = Object.freeze({
  name: 'ELANVISUAL',
  fallbackLogoUrl: '/assets/branding/elanvisual.svg',
  taxId: '4012805831001E',
  website: 'https://visual.elankav.com',
  whatsapp: '+505 7882 8089'
});

const STATUS_LABELS = Object.freeze({
  approved: 'Aprobada',
  sent: 'Enviada',
  issued: 'Emitida',
  active: 'Activa',
  pending_activation: 'Pendiente de activacion',
  completed: 'Completada',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  expired: 'Vencida'
});

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

function numericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function display(value) {
  return hasValue(value) ? String(value) : '';
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-NI', { year: 'numeric', month: 'long', day: '2-digit' }).format(parsed);
}

function formatMoney(value, currency = 'USD') {
  if (!hasValue(value)) return '';
  const parsed = numericValue(value);
  if (parsed === null) return String(value);
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency }).format(parsed);
}

function formatPercent(value) {
  if (!hasValue(value)) return '';
  if (typeof value === 'string' && value.includes('%')) return value;
  return `${value}%`;
}

function formatDimensions(dimensions) {
  if (!dimensions) return '';
  if (typeof dimensions === 'string') return dimensions;
  const unit = dimensions.unit ? ` ${dimensions.unit}` : '';
  return [
    ['Ancho', dimensions.width],
    ['Alto', dimensions.height],
    ['Fondo', dimensions.depth]
  ]
    .filter(([, value]) => hasValue(value))
    .map(([label, value]) => `${label}: ${value}${unit}`)
    .join(' / ');
}

function cleanPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 8) return `505${digits}`;
  if (digits.length >= 11 && digits.startsWith('505')) return digits;
  if (digits.length > 8) return digits;
  return '';
}

function buildWhatsappUrl(phone, quotationNumber) {
  const target = cleanPhone(phone);
  if (!target) return '';
  const message = encodeURIComponent(`Hola, le comparto seguimiento de la cotizacion ${quotationNumber || ''} de ELANVISUAL.`);
  return `https://wa.me/${target}?text=${message}`;
}

function addDaysIso(value, days) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const date = new Date(parsed.getTime());
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function formatStatus(status) {
  const key = String(status || '').trim().toLowerCase();
  if (!key || key === 'draft') return '';
  return STATUS_LABELS[key] || '';
}

function resolveBrand(quotation) {
  return { ...BRAND, ...(quotation.brand || {}) };
}

function resolveLogoUrl(brand) {
  return brand.logoForLightBackground || brand.logoLightUrl || brand.logoUrl || brand.fallbackLogoUrl;
}

function displayWebsite(value) {
  return String(value || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function InfoRow({ label, value }) {
  if (!hasValue(value)) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{String(value)}</dd>
    </div>
  );
}

function ItemRow({ item }) {
  const primaryImage = Array.isArray(item.images) ? item.images.find((image) => image?.url) : null;

  return (
    <article className="qv-item-row">
      <div className="qv-item-image">
        {primaryImage ? (
          <img src={primaryImage.url} alt={primaryImage.alt || item.title || 'Imagen del producto'} />
        ) : (
          <div className="qv-item-image-empty">Sin imagen</div>
        )}
      </div>

      <div className="qv-item-description">
        <strong>{display(item.title)}</strong>
        <p>{display(item.commercialDescription)}</p>
      </div>

      <div className="qv-item-field">
        <span>Medidas</span>
        <strong>{formatDimensions(item.dimensions)}</strong>
      </div>

      <div className="qv-item-field">
        <span>Cantidad</span>
        <strong>{display(item.quantity)}</strong>
      </div>

      <div className="qv-item-field">
        <span>Unidad</span>
        <strong>{display(item.unit)}</strong>
      </div>

      <div className="qv-item-field qv-unit-price">
        <span>P. Unit.</span>
        <strong>
          {formatMoney(
            hasValue(item.unitPrice)
              ? item.unitPrice
              : (
                  numericValue(item.subtotal) !== null &&
                  numericValue(item.quantity) > 0
                    ? numericValue(item.subtotal) / numericValue(item.quantity)
                    : ''
                ),
            'USD'
          )}
        </strong>
      </div>

      <div className="qv-item-field">
        <span>Total</span>
        <strong>{formatMoney(item.subtotal, 'USD')}</strong>
      </div>
    </article>
  );
}

export default function OfficialQuotationDocument({ quotation, onBack }) {
  const brand = resolveBrand(quotation);
  const logoUrl = resolveLogoUrl(brand);
  const whatsappUrl = buildWhatsappUrl(quotation.customer?.phone, quotation.quotationNumber);
  const payment = quotation.payment || {};
  const installments = payment.installments || [];
  const advance = payment.advance || {};
  const totals = quotation.totals || {};
  const discountValue = numericValue(totals.discount);
  const taxValue = numericValue(totals.tax);
  const hasDiscount = discountValue !== null && discountValue > 0;
  const hasTax = taxValue !== null && taxValue > 0;
  const hasAdvance = hasValue(advance.amountUsd) || hasValue(advance.amountNio) || hasValue(advance.percentage);
  const taxLabel = totals.taxRate ? `IVA ${formatPercent(totals.taxRate)}` : 'IVA';
  const publicStatus = formatStatus(quotation.status);
  const validUntil = quotation.validUntil || addDaysIso(quotation.date, 15);
  const items = quotation.items || [];
  const paymentAccounts = quotation.paymentAccounts || [];
  const publicNotes = quotation.publicNotes || [];
  const hasProjectInfo = [
    quotation.project?.title,
    quotation.project?.category,
    quotation.project?.location,
    quotation.project?.estimatedDelivery,
    quotation.project?.warranty,
    quotation.project?.summary
  ].some(hasValue);

  return (
    <main className="qv-detail-shell">
      <div className="qv-document-actions no-print">
        <button type="button" className="qv-action-secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Regresar
        </button>
        <button type="button" onClick={() => window.print()}>
          <Printer size={18} /> Imprimir / PDF
        </button>
        {whatsappUrl && (
          <button type="button" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
            <MessageCircle size={18} /> WhatsApp
          </button>
        )}
      </div>

      <article className="qv-official-document">
        <header className="qv-document-header">
          <a className="qv-document-brand" href={brand.website || BRAND.website} target="_blank" rel="noreferrer">
            <img src={logoUrl} alt={brand.name || BRAND.name} />
          </a>
          <div className="qv-document-title">
            <span>Cotizacion</span>
            <h1>{display(quotation.quotationNumber)}</h1>
            {publicStatus && <p>{publicStatus}</p>}
          </div>
          <dl className="qv-document-dates">
            <InfoRow label="Fecha" value={formatDate(quotation.date)} />
            <InfoRow label="Vigencia" value={formatDate(validUntil)} />
          </dl>
        </header>

        <section className="qv-document-grid">
          <div className="qv-document-panel">
            <span className="qv-section-label">Cliente</span>
            <dl className="qv-info-list">
              <InfoRow label="Nombre" value={quotation.customer?.name} />
              <InfoRow label="Empresa" value={quotation.customer?.companyName} />
              <InfoRow label="Telefono" value={quotation.customer?.phone} />
              <InfoRow label="Correo" value={quotation.customer?.email} />
              <InfoRow label="Direccion" value={quotation.customer?.address} />
              <InfoRow label="RUC cliente" value={quotation.customer?.taxId} />
            </dl>
          </div>

          {hasProjectInfo && (
            <div className="qv-document-panel">
              <span className="qv-section-label">Proyecto</span>
              <dl className="qv-info-list">
                <InfoRow label="Nombre" value={quotation.project?.title} />
                <InfoRow label="Categoria" value={quotation.project?.category} />
                <InfoRow label="Ubicacion" value={quotation.project?.location} />
                <InfoRow label="Entrega" value={quotation.project?.estimatedDelivery} />
                <InfoRow label="Garantia" value={quotation.project?.warranty} />
              </dl>
              {quotation.project?.summary && <p className="qv-project-summary">{quotation.project.summary}</p>}
            </div>
          )}
        </section>

        <section className="qv-document-section">
          <div className="qv-section-heading">
            <span className="qv-section-label">Productos</span>
            <h2>Detalle comercial</h2>
          </div>

          {items.length > 0 ? (
            <div className="qv-item-list">
              {items.map((item) => <ItemRow key={item.id} item={item} />)}
            </div>
          ) : (
            <p className="qv-empty-inline">No hay productos recibidos desde el Orchestrator.</p>
          )}
        </section>

        <section className="qv-summary-section">
          <div className="qv-document-panel">
            <span className="qv-section-label">Forma de pago</span>
            {(payment.label || payment.type) && <p className="qv-payment-label">{payment.label || payment.type}</p>}
            {hasAdvance && (
              <div className="qv-payment-row">
                <span>{advance.label || 'Anticipo'}</span>
                <strong>
                  {hasValue(advance.percentage) ? `${formatPercent(advance.percentage)} ` : ''}
                  {hasValue(advance.amountUsd) ? formatMoney(advance.amountUsd, 'USD') : formatMoney(advance.amountNio, 'NIO')}
                </strong>
              </div>
            )}
            {installments.length > 0 ? (
              <div className="qv-installments">
                {installments.map((entry) => (
                  <div className="qv-payment-row" key={entry.id}>
                    <span>{display(entry.label)} {hasValue(entry.percentage) ? `(${formatPercent(entry.percentage)})` : ''}</span>
                    <strong>{hasValue(entry.amountUsd) ? formatMoney(entry.amountUsd, 'USD') : formatMoney(entry.amountNio, 'NIO')}</strong>
                    {entry.dueCondition && <small>{entry.dueCondition}</small>}
                  </div>
                ))}
              </div>
            ) : !hasAdvance && (
              <p className="qv-empty-inline">No hay cuotas o anticipo recibidos.</p>
            )}
          </div>

          <div className="qv-total-panel">
            <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal, 'USD')}</strong></div>
            {hasDiscount && (
              <div><span>Descuento</span><strong>{formatMoney(totals.discount, 'USD')}</strong></div>
            )}
            {hasTax && (
              <div><span>{taxLabel}</span><strong>{formatMoney(totals.tax, 'USD')}</strong></div>
            )}
            <div className="qv-grand-total"><span>Total USD</span><strong>{formatMoney(totals.totalUsd, 'USD')}</strong></div>
            <div><span>Referencia en cordobas</span><strong>{formatMoney(totals.nioReference, 'NIO')}</strong></div>
            {hasValue(totals.exchangeRate) && (
              <small>Tipo de cambio recibido: {display(totals.exchangeRate)} {totals.exchangeRateDate ? ` / ${totals.exchangeRateDate}` : ''}</small>
            )}
          </div>
        </section>

        {paymentAccounts.length > 0 && (
          <section className="qv-document-section">
            <div className="qv-section-heading">
              <span className="qv-section-label">Cuentas autorizadas</span>
              <h2>Opciones de pago</h2>
            </div>
            <div className="qv-accounts-grid">
              {paymentAccounts.map((account) => (
                <div className="qv-account" key={account.id}>
                  <span>{account.label || account.bankName}</span>
                  {account.currency && <b>{account.currency}</b>}
                  {account.accountType && <small>{account.accountType}</small>}
                  {account.accountNumber && <strong>{account.accountNumber}</strong>}
                  {account.accountHolder && <small>{account.accountHolder}</small>}
                </div>
              ))}
            </div>
          </section>
        )}

        {publicNotes.length > 0 && (
          <section className="qv-document-section">
            <div className="qv-section-heading">
              <span className="qv-section-label">Notas publicas</span>
              <h2>Condiciones</h2>
            </div>
            <div className="qv-notes">
              {publicNotes.map((note) => <p key={note}>{note}</p>)}
            </div>
          </section>
        )}

        <section className="qv-executive-section">
          <div>
            <span className="qv-section-label">Ejecutivo comercial</span>
            <h2>{display(quotation.executive?.name)}</h2>
            <p>{display(quotation.executive?.role)}</p>
          </div>
          <dl className="qv-executive-contact">
            <InfoRow label="Telefono" value={quotation.executive?.phone} />
            <InfoRow label="Correo" value={quotation.executive?.email} />
          </dl>
        </section>

        <footer className="qv-document-footer">
          <span>RUC {brand.taxId || BRAND.taxId}</span>
          <a href={brand.website || BRAND.website} target="_blank" rel="noreferrer">{displayWebsite(brand.website || BRAND.website)}</a>
          <span>WhatsApp {brand.whatsapp || BRAND.whatsapp}</span>
        </footer>
      </article>
    </main>
  );
}
