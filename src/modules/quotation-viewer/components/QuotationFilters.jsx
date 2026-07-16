import React from 'react';
import { Filter, Search } from 'lucide-react';

export default function QuotationFilters({
  search,
  status,
  statusOptions = [],
  onSearchChange,
  onStatusChange
}) {
  return (
    <section className="qv-filters" aria-label="Filtros de cotizaciones">
      <label className="qv-search-field">
        <span><Search size={18} /> Buscar</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Numero, cliente, empresa o telefono"
        />
      </label>

      <label className="qv-status-field">
        <span><Filter size={18} /> Estado</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">Todos</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
