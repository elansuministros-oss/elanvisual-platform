import React from 'react';
import { ArrowRight, CalendarDays, CircleDollarSign, Phone, UserRound } from 'lucide-react';

const empty = 'No registrado';

function numericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return empty;
  const parsed = numericValue(value);
  if (parsed === null) return String(value);
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'USD' }).format(parsed);
}

function formatDate(value) {
  if (!value) return empty;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-NI', { year: 'numeric', month: 'short', day: '2-digit' }).format(parsed);
}

function display(value) {
  return value || empty;
}

export default function QuotationCard({ quotation, onOpen }) {
  const canOpen = Boolean(quotation?.id);

  return (
    <article className="qv-card">
      <div className="qv-card-main">
        <div>
          <span className="qv-eyebrow">Cotizacion</span>
          <h2>{display(quotation.quotationNumber)}</h2>
        </div>
        <span className="qv-status">{display(quotation.status)}</span>
      </div>

      <div className="qv-card-grid">
        <div>
          <small>Cliente</small>
          <strong>{display(quotation.customer?.name)}</strong>
        </div>
        <div>
          <small>Empresa</small>
          <strong>{display(quotation.customer?.companyName)}</strong>
        </div>
        <div>
          <small><Phone size={15} /> Telefono</small>
          <strong>{display(quotation.customer?.phone)}</strong>
        </div>
        <div>
          <small><CalendarDays size={15} /> Fecha</small>
          <strong>{formatDate(quotation.date)}</strong>
        </div>
        <div>
          <small><CircleDollarSign size={15} /> Total USD</small>
          <strong>{formatMoney(quotation.totals?.totalUsd)}</strong>
        </div>
        <div>
          <small><UserRound size={15} /> Ejecutivo</small>
          <strong>{display(quotation.executive?.name)}</strong>
        </div>
      </div>

      <button
        type="button"
        className="qv-card-action"
        disabled={!canOpen}
        onClick={() => canOpen && onOpen(quotation.id)}
      >
        Ver cotizacion <ArrowRight size={18} />
      </button>
    </article>
  );
}
