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


export default function CRMComercialAvanzado() {
  const { empresas = [], contactos = [], cotizaciones = [], pedidos = [], cobros = [] } = useCore();
  const embudo = useMemo(() => [
    { etapa:'Empresas registradas', cantidad: empresas.length, monto: 0 },
    { etapa:'Contactos', cantidad: contactos.length, monto: 0 },
    { etapa:'Cotizaciones', cantidad: cotizaciones.length, monto: cotizaciones.reduce((a,i)=>a+montoRegistro(i),0) },
    { etapa:'Pedidos', cantidad: pedidos.length, monto: pedidos.reduce((a,i)=>a+montoRegistro(i),0) },
    { etapa:'Cobros', cantidad: cobros.length, monto: cobros.reduce((a,i)=>a+montoRegistro(i),0) },
  ], [empresas, contactos, cotizaciones, pedidos, cobros]);
  return <div style={{ padding: 20 }}><h2>CRM Comercial Avanzado</h2><p style={{ color: '#6b7280' }}>Embudo comercial desde prospecto hasta cobro.</p><div style={grid}>{embudo.map(e=><div style={tarjeta} key={e.etapa}><strong>{e.etapa}</strong><h3>{e.cantidad}</h3>{e.monto>0 && <p>{fmt(e.monto)}</p>}</div>)}</div></div>;
}


