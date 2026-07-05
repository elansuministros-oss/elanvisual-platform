import React, { useMemo, useState } from 'react';
import { CreditCard, FileText, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { CheckoutService } from '../../checkout';
import { OrderService } from '../../orders';
import { QuoteService } from '../services/quoteService';
import './CommercialQuotesPage.css';

const formatMoney = (value, currency = 'USD') =>
  `${currency || 'USD'} ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getLineResolutionStatus = (line) => {
  if (line.resolutionStatus) return line.resolutionStatus;
  if (!line.materialId) return 'PENDIENTE MATERIAL';
  if (!line.tintaId) return 'PENDING_INK_MATCH';
  if (!line.technologyId) return 'PENDING_TECHNOLOGY_MATCH';
  if (!line.emcItemId) return 'PENDIENTE EMC';
  return 'RESUELTA';
};

const getStatusClassName = (status) => status.toLowerCase().replace(/[_\s]+/g, '-');

export default function CommercialQuotesPage() {
  const [projects] = useState(() => QuoteService.listProjects());
  const [quotes, setQuotes] = useState(() => QuoteService.list());
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [checkoutQuoteId, setCheckoutQuoteId] = useState(null);
  const [checkoutForms, setCheckoutForms] = useState({});
  const [paymentAttempts, setPaymentAttempts] = useState(() => CheckoutService.listAttempts());
  const [orders, setOrders] = useState(() => OrderService.list());
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const projectQuotes = useMemo(
    () => quotes.filter((quote) => quote.proyecto.id === selectedProjectId),
    [quotes, selectedProjectId]
  );

  const generateQuote = async () => {
    if (!selectedProjectId) return;
    setIsGeneratingQuote(true);
    try {
      const quote = await QuoteService.generateFromProject(selectedProjectId);
      setQuotes((current) => [quote, ...current.filter((item) => item.id !== quote.id)]);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const reloadQuotes = () => {
    setQuotes(QuoteService.list());
  };

  const removeQuote = (quoteId) => {
    QuoteService.remove(quoteId);
    setQuotes((current) => current.filter((quote) => quote.id !== quoteId));
  };

  const getPaymentMethod = (quoteId) => checkoutForms[quoteId] || CheckoutService.paymentMethods.BANK_TRANSFER;

  const setPaymentMethod = (quoteId, paymentMethod) => {
    setCheckoutForms((current) => ({ ...current, [quoteId]: paymentMethod }));
  };

  const getPaymentAttempt = (quoteId) => paymentAttempts.find((attempt) => attempt.quoteId === quoteId) || null;
  const getOrder = (quoteId) => orders.find((order) => order.quoteId === quoteId) || null;

  const confirmCheckout = (quote) => {
    const attempt = CheckoutService.createPendingAttempt(quote, getPaymentMethod(quote.id));
    const order = OrderService.createFromQuoteCheckout(quote, attempt);
    setPaymentAttempts((current) => [attempt, ...current.filter((item) => item.quoteId !== quote.id)]);
    setOrders((current) => [order, ...current.filter((item) => item.quoteId !== quote.id)]);
    setCheckoutQuoteId(null);
  };

  const updatePaymentStatus = (quoteId, status) => {
    const attempt = CheckoutService.updateAttemptStatus(quoteId, status);
    const order = OrderService.updatePaymentStatusByQuote(quoteId, status);
    setPaymentAttempts((current) => [attempt, ...current.filter((item) => item.quoteId !== quoteId)]);
    setOrders((current) => [order, ...current.filter((item) => item.quoteId !== quoteId)]);
  };

  return (
    <main className="commercial-quotes-page">
      <section className="commercial-quotes-header">
        <div>
          <span>COMMERCIAL V2</span>
          <h1>Cotizaciones</h1>
        </div>
        <div className="commercial-quotes-counter">
          <FileText size={22} />
          <strong>{quotes.length}</strong>
        </div>
      </section>

      <section className="commercial-quotes-workspace">
        <aside className="commercial-quotes-panel">
          <h2>Proyecto</h2>
          <label>
            Seleccionar proyecto
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nombre}
                </option>
              ))}
            </select>
          </label>

          {selectedProject && (
            <div className="commercial-project-summary">
              <strong>{selectedProject.nombre}</strong>
              <span>{selectedProject.cliente}</span>
              <small>{selectedProject.productos?.length || 0} productos configurados</small>
            </div>
          )}

          <button
            type="button"
            className="commercial-primary"
            onClick={generateQuote}
            disabled={!selectedProjectId || isGeneratingQuote}
          >
            <Save size={18} />
            {isGeneratingQuote ? 'Generando...' : 'Generar cotización'}
          </button>
          <button type="button" className="commercial-secondary" onClick={reloadQuotes}>
            <RefreshCcw size={18} />
            Volver a abrir
          </button>
        </aside>

        <section className="commercial-quotes-list">
          {projectQuotes.map((quote) => (
            <article className="commercial-quote-card" key={quote.id}>
              <header>
                <div>
                  <h3>{quote.proyecto.nombre}</h3>
                  <p>{quote.cliente}</p>
                </div>
                <div className="commercial-quote-actions">
                  <span>{quote.fecha}</span>
                  <span>{quote.estado}</span>
                  <button type="button" className="commercial-secondary compact" onClick={() => setCheckoutQuoteId(quote.id)}>
                    <CreditCard size={16} />
                    Iniciar Checkout
                  </button>
                  <button type="button" className="commercial-danger" onClick={() => removeQuote(quote.id)}>
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </header>

              <div className="commercial-quote-lines">
                {quote.lineas.map((line) => (
                  <div className="commercial-quote-line" key={line.id}>
                    <div>
                      <strong>{line.producto.nombre}</strong>
                      <small>{line.producto.categoria || line.producto.id}</small>
                    </div>
                    <span>Cant. {line.cantidad}</span>
                    <span>
                      {line.medidas.ancho || '-'} x {line.medidas.alto || '-'} {line.unidad}
                    </span>
                    <p>{line.observaciones || 'Sin observaciones'}</p>
                    <div className="commercial-price-grid">
                      <span>Unit Cost: {formatMoney(line.unitCost, line.currency)}</span>
                      <span>Currency: {line.currency || '-'}</span>
                      <span>Precio venta unitario: {formatMoney(line.precioVentaUnitario, line.currency)}</span>
                      <span>Subtotal: {formatMoney(line.lineSubtotal, line.currency)}</span>
                    </div>
                    <div className="commercial-technical-refs">
                      <span className={`commercial-resolution-status status-${getStatusClassName(getLineResolutionStatus(line))}`}>
                        Estado técnico: {getLineResolutionStatus(line)}
                      </span>
                      <span>Recipe ID: {line.recipeId || '-'}</span>
                      <span>BOM ID: {line.bomId || '-'}</span>
                      <span>Material: {line.materialName || line.materialQuery || 'PENDIENTE MATERIAL'}</span>
                      <span>Material ID: {line.materialId || 'PENDIENTE MATERIAL'}</span>
                      <span>Tinta: {line.tintaName || line.tintaQuery || 'PENDING_INK_MATCH'}</span>
                      <span>Tinta ID: {line.tintaId || 'PENDING_INK_MATCH'}</span>
                      <span>Tinta Source: {line.tintaSource || 'PENDING_INK_MATCH'}</span>
                      <span>Tecnología: {line.technologyName || line.technologyQuery || 'PENDING_TECHNOLOGY_MATCH'}</span>
                      <span>Technology ID: {line.technologyId || 'PENDING_TECHNOLOGY_MATCH'}</span>
                      <span>Technology Source: {line.technologySource || 'PENDING_TECHNOLOGY_MATCH'}</span>
                      <span>EMC Item ID: {line.emcItemId || '-'}</span>
                      <span>Supplier ID: {line.supplierId || '-'}</span>
                      <span>Proveedor: {line.supplierName || 'PENDIENTE EMC'}</span>
                      <span>Source: {line.source || 'PENDING_CATALOG_MATCH'}</span>
                      <span>AI-23 Status: {line.ai23Status || 'PENDING'}</span>
                      <span>AI-23 Source: {line.ai23Source || '-'}</span>
                      <span>AI-23 Message: {line.ai23Message || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <footer className="commercial-quote-total">
                <div>
                  <span>Total general</span>
                  <strong>{formatMoney(quote.totalGeneral, quote.lineas[0]?.currency)}</strong>
                </div>
                <div>
                  <span>Anticipo requerido 60%</span>
                  <strong>{formatMoney(quote.anticipoRequerido, quote.lineas[0]?.currency)}</strong>
                </div>
                <div>
                  <span>Saldo pendiente 40%</span>
                  <strong>{formatMoney(quote.saldoPendiente, quote.lineas[0]?.currency)}</strong>
                </div>
              </footer>
              {checkoutQuoteId === quote.id && (
                <section className="commercial-checkout-panel">
                  <div className="commercial-checkout-head">
                    <h4>Checkout V2</h4>
                    <span>Intención de pago</span>
                  </div>
                  <div className="commercial-checkout-summary">
                    <span>Cliente: {quote.cliente}</span>
                    <span>Proyecto: {quote.proyecto.nombre}</span>
                    <span>Total general: {formatMoney(quote.totalGeneral, quote.lineas[0]?.currency)}</span>
                    <span>Anticipo requerido: {formatMoney(quote.anticipoRequerido, quote.lineas[0]?.currency)}</span>
                    <span>Saldo pendiente: {formatMoney(quote.saldoPendiente, quote.lineas[0]?.currency)}</span>
                  </div>
                  <div className="commercial-payment-methods">
                    <label>
                      <input
                        type="radio"
                        name={`payment-${quote.id}`}
                        checked={getPaymentMethod(quote.id) === CheckoutService.paymentMethods.BANK_TRANSFER}
                        onChange={() => setPaymentMethod(quote.id, CheckoutService.paymentMethods.BANK_TRANSFER)}
                      />
                      Transferencia bancaria
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`payment-${quote.id}`}
                        checked={getPaymentMethod(quote.id) === CheckoutService.paymentMethods.CARD}
                        onChange={() => setPaymentMethod(quote.id, CheckoutService.paymentMethods.CARD)}
                      />
                      Tarjeta de crédito / débito
                    </label>
                  </div>
                  <button type="button" className="commercial-primary compact" onClick={() => confirmCheckout(quote)}>
                    Confirmar
                  </button>
                </section>
              )}
              {getPaymentAttempt(quote.id) && (
                <section className="commercial-payment-attempt">
                  <span>Método seleccionado: {getPaymentAttempt(quote.id).paymentMethod}</span>
                  <span>Monto: {formatMoney(getPaymentAttempt(quote.id).amount, quote.lineas[0]?.currency)}</span>
                  <span>Estado: {getPaymentAttempt(quote.id).status}</span>
                  <div className="commercial-payment-status-actions">
                    <button
                      type="button"
                      className="commercial-primary compact"
                      onClick={() => updatePaymentStatus(quote.id, CheckoutService.paymentStatus.PAID)}
                    >
                      Marcar PAID
                    </button>
                    <button
                      type="button"
                      className="commercial-danger compact"
                      onClick={() => updatePaymentStatus(quote.id, CheckoutService.paymentStatus.FAILED)}
                    >
                      Marcar FAILED
                    </button>
                  </div>
                </section>
              )}
              {getOrder(quote.id) && (
                <section className="commercial-order-created">
                  <span>Order ID: {getOrder(quote.id).orderId}</span>
                  <span>Payment Status: {getOrder(quote.id).paymentStatus}</span>
                  <span>Order Status: {getOrder(quote.id).orderStatus}</span>
                  <span>Lineas snapshot: {getOrder(quote.id).lineas.length}</span>
                </section>
              )}
            </article>
          ))}

          {!projectQuotes.length && (
            <div className="commercial-empty">
              <FileText size={34} />
              <p>No hay cotizaciones guardadas para este proyecto.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
