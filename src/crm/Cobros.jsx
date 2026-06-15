import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';


const UNIDADES_NEGOCIO = ['ELANVISUAL', 'ELANKAV CENTER', 'ELANHOME', 'ELAN AI'];
const TIPOS_FISCALES = ['Con IVA', 'Sin factura', 'Exento'];
const IVA = 0.15;

const hoyISO = () => new Date().toISOString().slice(0, 10);
const numero = (valor) => Number(valor) || 0;
const moneda = (valor) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', minimumFractionDigits: 2 }).format(numero(valor));

const fiscalVenta = (total, tipoFiscal, retencionPorcentaje = 0) => {
  const monto = numero(total);
  const retencion = monto * (numero(retencionPorcentaje) / 100);
  if (tipoFiscal === 'Con IVA') {
    const subtotal = monto / (1 + IVA);
    const iva = monto - subtotal;
    return { subtotal, iva, retencion, neto: monto - retencion };
  }
  return { subtotal: monto, iva: 0, retencion, neto: monto - retencion };
};

const fiscalCompra = (subtotal, tipoFiscal) => {
  const base = numero(subtotal);
  if (tipoFiscal === 'Con IVA') {
    const iva = base * IVA;
    return { subtotal: base, iva, total: base + iva };
  }
  return { subtotal: base, iva: 0, total: base };
};

const styles = {
  page: { display: 'grid', gap: 18 },
  header: { background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 8px 24px rgba(15,23,42,.08)' },
  title: { margin: 0, color: '#111827' },
  subtitle: { margin: '6px 0 0', color: '#6b7280' },
  card: { background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 24px rgba(15,23,42,.08)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 },
  label: { display: 'grid', gap: 6, fontWeight: 800, color: '#374151', fontSize: 13 },
  input: { width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 12px', fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 76, border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 },
  primary: { border: 0, borderRadius: 12, padding: '11px 15px', background: '#1f5fad', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  secondary: { border: '1px solid #d1d5db', borderRadius: 12, padding: '11px 15px', background: '#fff', color: '#374151', fontWeight: 900, cursor: 'pointer' },
  edit: { border: 0, borderRadius: 10, padding: '8px 10px', background: '#2563eb', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  danger: { border: 0, borderRadius: 10, padding: '8px 10px', background: '#dc2626', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 },
  stat: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14 },
  statLabel: { color: '#6b7280', fontSize: 12, fontWeight: 800 },
  statValue: { display: 'block', marginTop: 6, fontSize: 20, color: '#111827', fontWeight: 950 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 980 },
  th: { textAlign: 'left', padding: 11, background: '#f3f6fb', color: '#374151', fontSize: 12, borderBottom: '1px solid #e5e7eb' },
  td: { padding: 11, borderBottom: '1px solid #e5e7eb', fontSize: 13, verticalAlign: 'top' },
  badge: { display: 'inline-flex', borderRadius: 999, padding: '5px 9px', fontWeight: 900, fontSize: 12, background: '#eef2ff', color: '#3730a3' },
};


const METODOS = ['Transferencia', 'Efectivo', 'Tarjeta', 'Cheque', 'Mixto'];
const ESTADOS = ['Pendiente', 'Parcial', 'Pagado', 'Anulado'];

const inicial = {
  codigo: '',
  cliente: '',
  empresa: '',
  factura: '',
  unidadNegocio: 'ELANVISUAL',
  tipoFiscal: 'Con IVA',
  facturaFiscal: 'Si',
  retencionPorcentaje: '',
  subtotal: '',
  iva: '',
  montoFactura: '',
  montoCobrado: '',
  retencionMonto: '',
  netoRecibido: '',
  saldoPendiente: '',
  metodoPago: 'Transferencia',
  estado: 'Pendiente',
  fechaCobro: hoyISO(),
  observaciones: '',
};

export default function Cobros() {
  const { cobros = [], crearCobro, actualizarCobro, eliminarCobro } = useCore();
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(inicial);

  const limpiar = () => { setForm(inicial); setEditandoId(null); };

  const recalcular = (base) => {
    const fiscal = fiscalVenta(base.montoFactura, base.tipoFiscal, base.retencionPorcentaje);
    const cobrado = numero(base.montoCobrado);
    return {
      ...base,
      facturaFiscal: base.tipoFiscal === 'Con IVA' ? 'Si' : base.facturaFiscal,
      subtotal: fiscal.subtotal.toFixed(2),
      iva: fiscal.iva.toFixed(2),
      retencionMonto: fiscal.retencion.toFixed(2),
      netoRecibido: fiscal.neto.toFixed(2),
      saldoPendiente: Math.max(numero(base.montoFactura) - cobrado, 0).toFixed(2),
    };
  };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => recalcular({ ...prev, [name]: value }));
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!form.cliente.trim() && !form.empresa.trim()) return;

    const fiscal = fiscalVenta(form.montoFactura, form.tipoFiscal, form.retencionPorcentaje);
    const montoFactura = numero(form.montoFactura);
    const montoCobrado = numero(form.montoCobrado);

    const datos = {
      ...form,
      id: editandoId || `cob-${Date.now()}`,
      codigo: form.codigo.trim() || `COB-${Date.now()}`,
      cliente: form.cliente.trim(),
      empresa: form.empresa.trim(),
      factura: form.factura.trim(),
      unidadNegocio: form.unidadNegocio || 'ELANVISUAL',
      tipoFiscal: form.tipoFiscal || 'Con IVA',
      facturaFiscal: form.tipoFiscal === 'Con IVA' ? 'Si' : form.facturaFiscal || 'No',
      subtotal: fiscal.subtotal,
      iva: fiscal.iva,
      ivaDebito: form.tipoFiscal === 'Con IVA' ? fiscal.iva : 0,
      retencionPorcentaje: numero(form.retencionPorcentaje),
      retencionMonto: fiscal.retencion,
      netoRecibido: fiscal.neto,
      montoFactura,
      montoCobrado,
      saldoPendiente: Math.max(montoFactura - montoCobrado, 0),
      metodoPago: form.metodoPago,
      estado: form.estado,
      fechaCobro: form.fechaCobro || hoyISO(),
      observaciones: form.observaciones.trim(),
      actualizado: new Date().toISOString(),
    };

    if (editandoId) actualizarCobro(editandoId, datos);
    else crearCobro(datos);

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm(recalcular({
      codigo: item.codigo || '',
      cliente: item.cliente || '',
      empresa: item.empresa || '',
      factura: item.factura || '',
      unidadNegocio: item.unidadNegocio || 'ELANVISUAL',
      tipoFiscal: item.tipoFiscal || (numero(item.ivaDebito || item.iva) > 0 ? 'Con IVA' : 'Sin factura'),
      facturaFiscal: item.facturaFiscal || (numero(item.ivaDebito || item.iva) > 0 ? 'Si' : 'No'),
      retencionPorcentaje: String(item.retencionPorcentaje || ''),
      subtotal: String(item.subtotal || ''),
      iva: String(item.ivaDebito || item.iva || ''),
      montoFactura: String(item.montoFactura || ''),
      montoCobrado: String(item.montoCobrado || ''),
      retencionMonto: String(item.retencionMonto || ''),
      netoRecibido: String(item.netoRecibido || ''),
      saldoPendiente: String(item.saldoPendiente || ''),
      metodoPago: item.metodoPago || 'Transferencia',
      estado: item.estado || 'Pendiente',
      fechaCobro: item.fechaCobro || hoyISO(),
      observaciones: item.observaciones || '',
    }));
  };

  const resumen = useMemo(() => cobros.reduce((acc, item) => {
    if (item.estado === 'Anulado') return acc;
    acc.facturado += numero(item.montoFactura);
    acc.cobrado += numero(item.montoCobrado);
    acc.ivaDebito += item.tipoFiscal === 'Con IVA' ? numero(item.ivaDebito || item.iva) : 0;
    acc.retenciones += numero(item.retencionMonto);
    acc.sinFactura += item.tipoFiscal === 'Sin factura' ? numero(item.montoFactura) : 0;
    acc.saldo += numero(item.saldoPendiente);
    return acc;
  }, { facturado: 0, cobrado: 0, ivaDebito: 0, retenciones: 0, sinFactura: 0, saldo: 0 }), [cobros]);

  return (
    <div style={styles.page}>
      <div style={styles.header}><h2 style={styles.title}>Cobros</h2><p style={styles.subtitle}>Ventas y cobros con IVA debito, retencion y control de ingresos sin factura.</p></div>
      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Facturado</span><strong style={styles.statValue}>{moneda(resumen.facturado)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cobrado</span><strong style={styles.statValue}>{moneda(resumen.cobrado)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA debito</span><strong style={styles.statValue}>{moneda(resumen.ivaDebito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Retenciones</span><strong style={styles.statValue}>{moneda(resumen.retenciones)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Sin factura</span><strong style={styles.statValue}>{moneda(resumen.sinFactura)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Saldo pendiente</span><strong style={styles.statValue}>{moneda(resumen.saldo)}</strong></div>
      </div>

      <form style={styles.card} onSubmit={guardar}>
        <div style={styles.grid}>
          <label style={styles.label}>Codigo<input style={styles.input} name="codigo" value={form.codigo} onChange={cambiar} /></label>
          <label style={styles.label}>Cliente<input style={styles.input} name="cliente" value={form.cliente} onChange={cambiar} /></label>
          <label style={styles.label}>Empresa<input style={styles.input} name="empresa" value={form.empresa} onChange={cambiar} /></label>
          <label style={styles.label}>Factura<input style={styles.input} name="factura" value={form.factura} onChange={cambiar} /></label>
          <label style={styles.label}>Unidad<select style={styles.select} name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>{UNIDADES_NEGOCIO.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
          <label style={styles.label}>Tipo fiscal<select style={styles.select} name="tipoFiscal" value={form.tipoFiscal} onChange={cambiar}>{TIPOS_FISCALES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label style={styles.label}>Factura fiscal<select style={styles.select} name="facturaFiscal" value={form.facturaFiscal} onChange={cambiar}><option>Si</option><option>No</option></select></label>
          <label style={styles.label}>Retencion %<input style={styles.input} type="number" step="0.01" name="retencionPorcentaje" value={form.retencionPorcentaje} onChange={cambiar} /></label>
          <label style={styles.label}>Total factura<input style={styles.input} type="number" step="0.01" name="montoFactura" value={form.montoFactura} onChange={cambiar} /></label>
          <label style={styles.label}>Subtotal<input style={styles.input} type="number" step="0.01" name="subtotal" value={form.subtotal} readOnly /></label>
          <label style={styles.label}>IVA<input style={styles.input} type="number" step="0.01" name="iva" value={form.iva} readOnly /></label>
          <label style={styles.label}>Monto cobrado<input style={styles.input} type="number" step="0.01" name="montoCobrado" value={form.montoCobrado} onChange={cambiar} /></label>
          <label style={styles.label}>Retencion monto<input style={styles.input} type="number" step="0.01" name="retencionMonto" value={form.retencionMonto} readOnly /></label>
          <label style={styles.label}>Neto estimado<input style={styles.input} type="number" step="0.01" name="netoRecibido" value={form.netoRecibido} readOnly /></label>
          <label style={styles.label}>Saldo<input style={styles.input} type="number" step="0.01" name="saldoPendiente" value={form.saldoPendiente} readOnly /></label>
          <label style={styles.label}>Metodo<select style={styles.select} name="metodoPago" value={form.metodoPago} onChange={cambiar}>{METODOS.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <label style={styles.label}>Estado<select style={styles.select} name="estado" value={form.estado} onChange={cambiar}>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
          <label style={styles.label}>Fecha<input style={styles.input} type="date" name="fechaCobro" value={form.fechaCobro} onChange={cambiar} /></label>
        </div>
        <label style={{ ...styles.label, marginTop: 12 }}>Observaciones<textarea style={styles.textarea} name="observaciones" value={form.observaciones} onChange={cambiar} /></label>
        <div style={styles.actions}><button style={styles.primary} type="submit">{editandoId ? 'Actualizar cobro' : 'Guardar cobro'}</button><button style={styles.secondary} type="button" onClick={limpiar}>Limpiar</button></div>
      </form>

      <div style={styles.card}><div style={styles.tableWrap}><table style={styles.table}>
        <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Codigo</th><th style={styles.th}>Cliente/Empresa</th><th style={styles.th}>Unidad</th><th style={styles.th}>Fiscal</th><th style={styles.th}>Factura</th><th style={styles.th}>Cobrado</th><th style={styles.th}>IVA</th><th style={styles.th}>Retencion</th><th style={styles.th}>Saldo</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
        <tbody>{cobros.map((item) => <tr key={item.id}>
          <td style={styles.td}>{item.fechaCobro}</td><td style={styles.td}>{item.codigo}</td><td style={styles.td}>{item.cliente || item.empresa}</td><td style={styles.td}>{item.unidadNegocio}</td><td style={styles.td}><span style={styles.badge}>{item.tipoFiscal || 'Sin clasificar'}</span></td><td style={styles.td}>{moneda(item.montoFactura)}</td><td style={styles.td}>{moneda(item.montoCobrado)}</td><td style={styles.td}>{moneda(item.ivaDebito || item.iva)}</td><td style={styles.td}>{moneda(item.retencionMonto)}</td><td style={styles.td}>{moneda(item.saldoPendiente)}</td><td style={styles.td}>{item.estado}</td><td style={styles.td}><button style={styles.edit} type="button" onClick={() => editar(item)}>Editar</button> <button style={styles.danger} type="button" onClick={() => eliminarCobro(item.id)}>Eliminar</button></td>
        </tr>)}</tbody>
      </table></div></div>
    </div>
  );
}


