import React, { useMemo, useState } from 'react';
import { CreditCard, FileText, RefreshCcw, Save } from 'lucide-react';
import { CheckoutService } from '../../checkout';
import { ECECore } from '../core';
import './ECEPage.css';

const demoProject = Object.freeze({
  id: 'ece-project-demo-001',
  nombre: 'Demo ECE - Vinil para vitrina',
  cliente: 'Cliente QA ECE',
});

const demoProduct = Object.freeze({
  id: 'prod-vinil-adhesivo',
  nombre: 'Vinil adhesivo',
  categoria: 'Impresion',
});

const demoConfiguration = Object.freeze({
  id: 'ece-config-demo-001',
  cantidad: 12,
  unidadMedida: 'm2',
  observacionesComerciales: 'Prueba QA ECE con producto de impresion.',
});

const formatMoney = (value, currency = 'USD') => {
  if (value === null || value === undefined || value === '') return '-';
  return `${currency || 'USD'} ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function ECEPage() {
  const [quotes, setQuotes] = useState(() => ECECore.listQuotes());
  const [selectedQuoteId, setSelectedQuoteId] = useState(quotes[0]?.quoteId || '');
  const [paymentMethod, setPaymentMethod] = useState(CheckoutService.paymentMethods.BANK_TRANSFER);
  const [checkoutAttempt, setCheckoutAttempt] = useState(null);
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.quoteId === selectedQuoteId) || quotes[0] || null,
    [quotes, selectedQuoteId]
  );

  const refreshQuotes = () => {
    const nextQuotes = ECECore.listQuotes();
    setQuotes(nextQuotes);
    setSelectedQuoteId((current) => current || nextQuotes[0]?.quoteId || '');
  };

  const createQuote = async () => {
    setIsCreating(true);
    setMessage('');

    try {
      const quote = await ECECore.createQuote(demoProject, demoProduct, demoConfiguration);
      const nextQuotes = ECECore.listQuotes();
      setQuotes(nextQuotes);
      setSelectedQuoteId(quote.quoteId);
      setCheckoutAttempt(null);
      setMessage('Quote ECE creada y persistida.');
    } catch (error) {
      setMessage(error.message || 'No se pudo crear la Quote ECE.');
    } finally {
      setIsCreating(false);
    }
  };

  const generatePdf = () => {
    if (!selectedQuote) return;

    try {
      ECECore.generatePdf(selectedQuote.quoteId);
      setMessage('PDF solicitado desde Quote ECE.');
    } catch (error) {
      setMessage(error.message || 'No se pudo generar PDF.');
    }
  };

  const startCheckout = () => {
    if (!selectedQuote) return;

    try {
      const attempt = ECECore.startCheckout(selectedQuote.quoteId, paymentMethod);
      setCheckoutAttempt(attempt);
      setMessage('Checkout iniciado desde Quote ECE.');
    } catch (error) {
      setMessage(error.message || 'No se pudo iniciar checkout.');
    }
  };

  return (
    <main className="ece-page">
      <section className="ece-header">
        <div>
          <span>ELAN COMMERCIAL ENGINE</span>
          <h1>ECE QA</h1>
        </div>
        <button type="button" className="ece-secondary" onClick={refreshQuotes}>
          <RefreshCcw size={18} />
          Recargar
        </button>
      </section>

      <section className="ece-layout">
        <aside className="ece-panel">
          <h2>Datos demo</h2>
          <dl className="ece-demo-data">
            <div>
              <dt>Proyecto</dt>
              <dd>{demoProject.nombre}</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{demoProject.cliente}</dd>
            </div>
            <div>
              <dt>Producto</dt>
              <dd>{demoProduct.nombre}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>
                {demoConfiguration.cantidad} {demoConfiguration.unidadMedida}
              </dd>
            </div>
          </dl>

          <button type="button" className="ece-primary" onClick={createQuote} disabled={isCreating}>
            <Save size={18} />
            {isCreating ? 'Creando...' : 'Crear Quote ECE'}
          </button>

          {quotes.length > 0 && (
            <label className="ece-select-label">
              Quote persistida
              <select value={selectedQuote?.quoteId || ''} onChange={(event) => setSelectedQuoteId(event.target.value)}>
                {quotes.map((quote) => (
                  <option key={quote.quoteId} value={quote.quoteId}>
                    {quote.quoteId}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="ece-select-label">
            Metodo checkout
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value={CheckoutService.paymentMethods.BANK_TRANSFER}>BANK_TRANSFER</option>
              <option value={CheckoutService.paymentMethods.CARD}>CARD</option>
            </select>
          </label>

          <div className="ece-actions">
            <button type="button" className="ece-secondary" onClick={generatePdf} disabled={!selectedQuote}>
              <FileText size={18} />
              Generar PDF
            </button>
            <button type="button" className="ece-primary" onClick={startCheckout} disabled={!selectedQuote}>
              <CreditCard size={18} />
              Iniciar Checkout
            </button>
          </div>

          {message && <p className="ece-message">{message}</p>}
        </aside>

        <section className="ece-results">
          {!selectedQuote && (
            <div className="ece-empty">
              <FileText size={34} />
              <p>No hay Quote ECE seleccionada.</p>
            </div>
          )}

          {selectedQuote && (
            <article className="ece-quote">
              <header>
                <div>
                  <h2>{selectedQuote.nombreProyecto}</h2>
                  <p>{selectedQuote.cliente}</p>
                </div>
                <div className="ece-quote-meta">
                  <span>{selectedQuote.estado}</span>
                  <span>{selectedQuote.fechaCreacion}</span>
                  <strong>{formatMoney(selectedQuote.total, selectedQuote.lineas[0]?.currency)}</strong>
                </div>
              </header>

              <div className="ece-lines">
                {selectedQuote.lineas.map((line) => (
                  <section className="ece-line" key={line.lineId}>
                    <div className="ece-line-main">
                      <div>
                        <strong>{line.descripcion}</strong>
                        <small>{line.productId}</small>
                      </div>
                      <span>Cant. {line.cantidad}</span>
                      <span>{line.unidad}</span>
                      <p>{line.observaciones || 'Sin observaciones'}</p>
                    </div>

                    <div className="ece-grid">
                      <span>Recipe: {line.recipeId || 'PENDIENTE'}</span>
                      <span>BOM: {line.bomId || 'PENDIENTE'}</span>
                      <span>Material: {line.materialName || line.materialId || 'PENDIENTE'}</span>
                      <span>Tinta: {line.tintaName || line.tintaId || 'PENDIENTE'}</span>
                      <span>Tecnologia: {line.technologyName || line.technologyId || 'PENDIENTE'}</span>
                      <span>EMC Item: {line.emcItemId || 'PENDIENTE'}</span>
                      <span>Proveedor: {line.supplierName || line.supplierId || 'PENDIENTE'}</span>
                      <span>EMC Source: {line.emcSource || 'PENDING_EMC_MATCH'}</span>
                      <span>Cost Source: {line.costSource || 'PENDING_COST'}</span>
                      <span>Unit Cost: {formatMoney(line.unitCost, line.currency)}</span>
                      <span>Unit Price: {formatMoney(line.unitPrice, line.currency)}</span>
                      <span>Subtotal: {formatMoney(line.subtotal, line.currency)}</span>
                      <span>Pricing: {line.pricingStatus}</span>
                      <span>AI-23: {line.ai23Status}</span>
                      <span>AI Source: {line.ai23Source || '-'}</span>
                      <span>Resolucion: {line.resolutionStatus}</span>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          )}

          {checkoutAttempt && (
            <section className="ece-checkout">
              <h2>Checkout V2</h2>
              <div className="ece-grid">
                <span>Quote: {checkoutAttempt.quoteId}</span>
                <span>Cliente: {checkoutAttempt.cliente}</span>
                <span>Total: {formatMoney(checkoutAttempt.totalGeneral)}</span>
                <span>Anticipo: {formatMoney(checkoutAttempt.amount)}</span>
                <span>Saldo: {formatMoney(checkoutAttempt.saldoPendiente)}</span>
                <span>Metodo: {checkoutAttempt.paymentMethod}</span>
                <span>Status: {checkoutAttempt.status}</span>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

