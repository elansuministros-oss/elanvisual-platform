import React from 'react';
import { useCore } from '../core/context/CoreContext';


const numero = (valor) => {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const montoRegistro = (item = {}) =>
  numero(item.total) ||
  numero(item.monto) ||
  numero(item.valor) ||
  numero(item.importe) ||
  numero(item.precio) ||
  numero(item.subtotal) ||
  numero(item.costoTotal) ||
  0;

const fechaRegistro = (item = {}) => item.fecha || item.fechaRegistro || item.actualizado || item.vencimiento || '';

const fmt = (valor) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', maximumFractionDigits: 2 }).format(numero(valor));

const unidades = ['Corporativo', 'ELANVISUAL', 'ELANKAV CENTER', 'ELANHOME', 'ELAN AI'];

const unidadDe = (item = {}) => item.unidadNegocio || item.unidad || item.area || 'Corporativo';

const estaVencido = (fecha) => {
  if (!fecha) return false;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return d < hoy;
};

const tarjeta = {
  background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 10px 24px rgba(15,23,42,.08)', border: '1px solid #e5e7eb'
};

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 };


export default function PortalClienteCRM() {
  const { empresas = [], cotizaciones = [], pedidos = [], cobros = [] } = useCore();
  return <div style={{ padding: 20 }}><h2>Portal Cliente</h2><p style={{ color: '#6b7280' }}>Base futura para que cada cliente consulte cotizaciones, pedidos, avances y cobros.</p><div style={grid}><div style={tarjeta}><strong>Clientes/Empresas</strong><h3>{empresas.length}</h3></div><div style={tarjeta}><strong>Cotizaciones visibles</strong><h3>{cotizaciones.length}</h3></div><div style={tarjeta}><strong>Pedidos</strong><h3>{pedidos.length}</h3></div><div style={tarjeta}><strong>Cobros</strong><h3>{cobros.length}</h3></div></div></div>;
}


