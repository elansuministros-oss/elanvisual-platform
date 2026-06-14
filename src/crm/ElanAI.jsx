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


export default function ElanAI() {
  const { cotizaciones = [], pedidos = [], compras = [], cobros = [], cuentasPorCobrar = [], cuentasPorPagar = [], produccion = [] } = useCore();
  const diagnostico = useMemo(() => {
    const ventas = [...cotizaciones, ...pedidos].reduce((a,i)=>a+montoRegistro(i),0);
    const costos = compras.reduce((a,i)=>a+montoRegistro(i),0) + produccion.reduce((a,i)=>a+(numero(i.costoTotal)||montoRegistro(i)),0);
    const utilidad = ventas - costos;
    const pendientesCobro = cuentasPorCobrar.filter(i=>(i.estado||'').toLowerCase() !== 'pagado').length;
    const pendientesPago = cuentasPorPagar.filter(i=>(i.estado||'').toLowerCase() !== 'pagado').length;
    const recomendaciones = [];
    if (pendientesCobro > 0) recomendaciones.push(`Dar seguimiento a ${pendientesCobro} cuentas por cobrar pendientes.`);
    if (pendientesPago > 0) recomendaciones.push(`Programar pagos de ${pendientesPago} cuentas por pagar.`);
    if (utilidad < 0) recomendaciones.push('Revisar costos: la utilidad estimada estÃ¡ negativa.');
    if (ventas === 0) recomendaciones.push('Registrar ventas o cotizaciones para activar anÃ¡lisis comercial.');
    if (recomendaciones.length === 0) recomendaciones.push('OperaciÃ³n estable segÃºn los datos registrados.');
    return { ventas, costos, utilidad, recomendaciones };
  }, [cotizaciones, pedidos, compras, cobros, cuentasPorCobrar, cuentasPorPagar, produccion]);
  return <div style={{ padding: 20 }}><h2>ELAN AI</h2><p style={{ color: '#6b7280' }}>MÃ³dulo base del asistente corporativo integrado al CRM.</p><div style={grid}><div style={tarjeta}><strong>Ventas analizadas</strong><h3>{fmt(diagnostico.ventas)}</h3></div><div style={tarjeta}><strong>Costos analizados</strong><h3>{fmt(diagnostico.costos)}</h3></div><div style={tarjeta}><strong>Utilidad estimada</strong><h3>{fmt(diagnostico.utilidad)}</h3></div></div><div style={{ ...tarjeta, marginTop: 18 }}><h3>Recomendaciones automÃ¡ticas</h3>{diagnostico.recomendaciones.map((r,i)=><p key={i}>ðŸ¤– {r}</p>)}</div></div>;
}


