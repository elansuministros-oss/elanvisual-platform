import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
  Plus,
  Search
} from 'lucide-react';
import '../styles/operator-documents.css';

const PURCHASE_ORDER_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'ordered',
  'partially_received',
  'received',
  'cancelled'
];

const STATUS_LABELS = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobada',
  ordered: 'Ordenada',
  partially_received: 'Recepción parcial',
  received: 'Recibida',
  cancelled: 'Cancelada'
};

const emptyPurchaseOrders = [];

function PurchaseOrderEmptyState() {
  return (
    <section className="op-state">
      <PackageCheck size={22} />
      <strong>Sin órdenes de compra</strong>
      <p>No hay registros para mostrar.</p>
    </section>
  );
}

export default function PurchaseOrderPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const visiblePurchaseOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return emptyPurchaseOrders.filter((purchaseOrder) => {
      const text = [
        purchaseOrder.purchaseOrderNumber,
        purchaseOrder.title,
        purchaseOrder.supplier?.name,
        purchaseOrder.project?.title
      ].filter(Boolean).join(' ').toLowerCase();
      return (!query || text.includes(query)) && (!status || purchaseOrder.status === status);
    });
  }, [search, status]);

  return (
    <main className="op-shell">
      <header className="op-header">
        <div>
          <span>ELANKAV Operador</span>
          <h1>Órdenes de compra</h1>
          <p>Gestión interna de compras, aprobación y recepción.</p>
        </div>
        <button type="button" disabled title="Se habilitará al conectar Orchestrator">
          <Plus size={18} /> Nueva OC
        </button>
      </header>

      <section className="op-toolbar" aria-label="Filtros de órdenes de compra">
        <label>
          <span><Search size={16} /> Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Número, proveedor, proyecto"
          />
        </label>
        <label>
          <span><ClipboardList size={16} /> Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {PURCHASE_ORDER_STATUSES.map((value) => (
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
              <h2>Compras</h2>
            </div>
            <strong>{visiblePurchaseOrders.length}</strong>
          </div>
          <PurchaseOrderEmptyState />
        </section>

        <aside className="op-side-panel">
          <span>Contrato</span>
          <h2>PurchaseOrderContract v1</h2>
          <dl>
            <div><dt>Origen activo</dt><dd>manual</dd></div>
            <div><dt>Orígenes futuros</dt><dd>workOrder, quotation, purchaseRequest</dd></div>
            <div><dt>Documento</dt><dd>PurchaseOrderDocumentBuilder</dd></div>
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
          <CheckCircle2 size={20} />
          <strong>Flujo de aprobación</strong>
          <p>Estados, reglas de aprobación y recepción quedan alineados con el dominio PO-01.</p>
        </div>
      </section>
    </main>
  );
}
