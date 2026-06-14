import React, { useMemo } from 'react';
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


export default function CalendarioCorporativo() {
  const { ordenesTrabajo = [], produccion = [], cuentasPorCobrar = [], cuentasPorPagar = [] } = useCore();
  const eventos = useMemo(() => [
    ...ordenesTrabajo.map(i=>({fecha: fechaRegistro(i), tipo:'Orden de trabajo', titulo:i.codigo || i.titulo || i.id, unidad: unidadDe(i)})),
    ...produccion.map(i=>({fecha: fechaRegistro(i), tipo:'ProducciÃ³n', titulo:i.codigo || i.producto || i.id, unidad: unidadDe(i)})),
    ...cuentasPorCobrar.map(i=>({fecha:i.vencimiento || i.fechaVencimiento || fechaRegistro(i), tipo:'Cuenta por cobrar', titulo:i.cliente || i.concepto || i.id, unidad: unidadDe(i)})),
    ...cuentasPorPagar.map(i=>({fecha:i.vencimiento || i.fechaVencimiento || fechaRegistro(i), tipo:'Cuenta por pagar', titulo:i.proveedor || i.concepto || i.id, unidad: unidadDe(i)})),
  ].filter(e=>e.fecha).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)), [ordenesTrabajo, produccion, cuentasPorCobrar, cuentasPorPagar]);
  return <div style={{ padding: 20 }}><h2>Calendario Corporativo</h2><p style={{ color: '#6b7280' }}>Agenda operativa de entregas, producciÃ³n, cobros y pagos.</p><div style={tarjeta}>{eventos.length===0 ? <p>Sin eventos programados.</p> : eventos.slice(0,80).map((e,idx)=><div key={idx} style={{display:'grid',gridTemplateColumns:'140px 170px 1fr 180px',gap:10,padding:'10px 0',borderBottom:'1px solid #eef2f7'}}><strong>{String(e.fecha).slice(0,10)}</strong><span>{e.tipo}</span><span>{e.titulo}</span><span>{e.unidad}</span></div>)}</div></div>;
}


