import React, { useMemo, useState } from 'react';
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


export default function MetasKPIs() {
  const { cotizaciones = [], pedidos = [], cobros = [], produccion = [] } = useCore();
  const [metaVentas, setMetaVentas] = useState(100000);
  const ventaReal = useMemo(() => [...cotizaciones, ...pedidos].reduce((a,i)=>a+montoRegistro(i),0), [cotizaciones, pedidos]);
  const cobroReal = useMemo(() => cobros.reduce((a,i)=>a+montoRegistro(i),0), [cobros]);
  const produccionActiva = produccion.filter(i => ['pendiente','en proceso','activa'].includes((i.estado || '').toLowerCase())).length;
  const cumplimiento = metaVentas > 0 ? (ventaReal / metaVentas) * 100 : 0;
  return <div style={{ padding: 20 }}><h2>Metas y KPIs Corporativos</h2><p style={{ color: '#6b7280' }}>Control de cumplimiento mensual para direcciÃ³n.</p><div style={{ ...tarjeta, marginBottom: 18 }}><label>Meta de ventas C$ </label><input type="number" value={metaVentas} onChange={e=>setMetaVentas(Number(e.target.value))} style={{padding:10,borderRadius:10,border:'1px solid #d1d5db'}} /></div><div style={grid}><div style={tarjeta}><strong>Meta ventas</strong><h3>{fmt(metaVentas)}</h3></div><div style={tarjeta}><strong>Venta real</strong><h3>{fmt(ventaReal)}</h3></div><div style={tarjeta}><strong>Cumplimiento</strong><h3>{cumplimiento.toFixed(1)}%</h3></div><div style={tarjeta}><strong>Cobros</strong><h3>{fmt(cobroReal)}</h3></div><div style={tarjeta}><strong>ProducciÃ³n activa</strong><h3>{produccionActiva}</h3></div></div></div>;
}


