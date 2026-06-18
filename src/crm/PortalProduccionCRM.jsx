import React from 'react';
import { useCore } from '../core/context/CoreContext';

const numero = (valor) => {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 2,
  }).format(numero(valor));

const tarjeta = {
  background: '#fff',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 10px 24px rgba(15,23,42,.08)',
  border: '1px solid #e5e7eb',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
};

export default function PortalProduccionCRM() {
  const {
    ordenesTrabajo = [],
    produccion = [],
    materiales = [],
    inventario = [],
  } = useCore();

  return (
    <div style={{ padding: 20 }}>
      <h2>Portal Producción</h2>
      <p style={{ color: '#6b7280' }}>
        Panel operativo para taller, instaladores y supervisores.
      </p>

      <div style={grid}>
        <div style={tarjeta}>
          <strong>Órdenes</strong>
          <h3>{ordenesTrabajo.length}</h3>
        </div>

        <div style={tarjeta}>
          <strong>Producción</strong>
          <h3>{produccion.length}</h3>
        </div>

        <div style={tarjeta}>
          <strong>Materiales</strong>
          <h3>{materiales.length}</h3>
        </div>

        <div style={tarjeta}>
          <strong>Inventario</strong>
          <h3>{inventario.length}</h3>
        </div>
      </div>
    </div>
  );
}