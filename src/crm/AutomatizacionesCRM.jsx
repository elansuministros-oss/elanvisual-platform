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

const unidades = ['Corporativo', 'ELANPET', 'ELANKAV VISUAL', 'ELANKAV CENTER', 'ELANKAV SOLAR', 'ELAN AI'];

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


export default function AutomatizacionesCRM() {
  const { cuentasPorCobrar = [], cuentasPorPagar = [], ordenesTrabajo = [], produccion = [], inventario = [] } = useCore();
  const acciones = useMemo(() => [
    ...cuentasPorCobrar.filter(i => estaVencido(i.vencimiento || i.fechaVencimiento) && (i.estado || '').toLowerCase() !== 'pagado').map(i => ({ tipo:'Cobro vencido', detalle: i.cliente || i.empresa || i.concepto || i.id, prioridad:'Alta' })),
    ...cuentasPorPagar.filter(i => estaVencido(i.vencimiento || i.fechaVencimiento) && (i.estado || '').toLowerCase() !== 'pagado').map(i => ({ tipo:'Pago vencido', detalle: i.proveedor || i.concepto || i.id, prioridad:'Alta' })),
    ...ordenesTrabajo.filter(i => ['pendiente','en proceso','activa'].includes((i.estado || '').toLowerCase())).map(i => ({ tipo:'Orden activa', detalle: i.codigo || i.titulo || i.id, prioridad:'Media' })),
    ...produccion.filter(i => ['pendiente','en proceso','activa'].includes((i.estado || '').toLowerCase())).map(i => ({ tipo:'Producción activa', detalle: i.codigo || i.producto || i.id, prioridad:'Media' })),
    ...inventario.filter(i => numero(i.stock) <= numero(i.stockMinimo || i.minimo)).map(i => ({ tipo:'Inventario bajo', detalle: i.nombre || i.material || i.id, prioridad:'Media' })),
  ], [cuentasPorCobrar, cuentasPorPagar, ordenesTrabajo, produccion, inventario]);

  return <div style={{ padding: 20 }}>
    <h2>Automatizaciones Corporativas</h2><p style={{ color: '#6b7280' }}>Reglas operativas sugeridas por el sistema según cobros, pagos, órdenes, producción e inventario.</p>
    <div style={grid}><div style={tarjeta}><strong>Acciones detectadas</strong><h3>{acciones.length}</h3></div><div style={tarjeta}><strong>Prioridad alta</strong><h3>{acciones.filter(a=>a.prioridad==='Alta').length}</h3></div></div>
    <div style={{ ...tarjeta, marginTop: 18 }}><h3>Cola de automatizaciones</h3>{acciones.length === 0 ? <p>No hay acciones automáticas pendientes.</p> : acciones.map((a,idx)=><div key={idx} style={{padding:'12px 0',borderBottom:'1px solid #eef2f7'}}><strong>{a.tipo}</strong><p style={{margin:'4px 0',color:'#6b7280'}}>{a.detalle}</p><span>Prioridad: {a.prioridad}</span></div>)}</div>
  </div>;
}
