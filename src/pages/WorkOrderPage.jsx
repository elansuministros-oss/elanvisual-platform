import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Factory,
  FileText,
  Plus,
  Search,
  ShieldCheck
} from 'lucide-react';
import '../styles/operator-documents.css';

const WORK_ORDER_STATUSES = [
  'draft',
  'approved',
  'scheduled',
  'in_production',
  'quality_review',
  'completed',
  'cancelled'
];

const STATUS_LABELS = {
  draft: 'Borrador',
  approved: 'Aprobada',
  scheduled: 'Programada',
  in_production: 'En producción',
  quality_review: 'Revisión de calidad',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

const emptyWorkOrders = [];

function WorkOrderEmptyState() {
  return (
    <section className="op-state">
      <Factory size={22} />
      <strong>Sin órdenes de trabajo</strong>
      <p>No hay registros para mostrar.</p>
    </section>
  );
}

export default function WorkOrderPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const visibleWorkOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return emptyWorkOrders.filter((workOrder) => {
      const text = [
        workOrder.workOrderNumber,
        workOrder.title,
        workOrder.customer?.name,
        workOrder.project?.title
      ].filter(Boolean).join(' ').toLowerCase();
      return (!query || text.includes(query)) && (!status || workOrder.status === status);
    });
  }, [search, status]);

  return (
    <main className="op-shell">
      <header className="op-header">
        <div>
          <span>ELANKAV Operador</span>
          <h1>Órdenes de trabajo</h1>
          <p>Gestión interna de trabajo, producción y control de calidad.</p>
        </div>
        <button type="button" disabled title="Se habilitará al conectar Orchestrator">
          <Plus size={18} /> Nueva OT
        </button>
      </header>

      <section className="op-toolbar" aria-label="Filtros de órdenes de trabajo">
        <label>
          <span><Search size={16} /> Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Número, cliente, proyecto"
          />
        </label>
        <label>
          <span><ClipboardCheck size={16} /> Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {WORK_ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>{STATUS_LABELS[value]}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="op-layout">
        <section className="op-panel">
          <div className="op-section-heading">
            <div>
              <span>Listado</span>
              <h2>Trabajos</h2>
            </div>
            <strong>{visibleWorkOrders.length}</strong>
          </div>
          <WorkOrderEmptyState />
        </section>

        <aside className="op-side-panel">
          <span>Contrato</span>
          <h2>WorkOrderContract v1</h2>
          <dl>
            <div><dt>Origen activo</dt><dd>manual</dd></div>
            <div><dt>Orígenes futuros</dt><dd>quotation, project</dd></div>
            <div><dt>Documento</dt><dd>WorkOrderDocumentBuilder</dd></div>
            <div><dt>Fuente oficial</dt><dd>Orchestrator</dd></div>
          </dl>
        </aside>
      </section>

      <section className="op-document-preview" aria-label="Infraestructura documental">
        <div>
          <FileText size={20} />
          <strong>Plantilla documental preparada</strong>
          <p>Branding, logo, colores, numeración y datos fiscales se resolverán por platformId.</p>
        </div>
        <div>
          <ShieldCheck size={20} />
          <strong>Control operativo</strong>
          <p>Estados, validadores y transiciones quedan alineados con el dominio WO-01.</p>
        </div>
      </section>
    </main>
  );
}
