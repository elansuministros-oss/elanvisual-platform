import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';


const UNIDADES_NEGOCIO = ['ELANPET', 'ELANKAV VISUAL', 'ELANKAV CENTER', 'ELANKAV SOLAR', 'ELAN AI'];
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


const ESTADOS = ['Pendiente', 'Parcial', 'Pagada', 'Anulada'];
const CATEGORIAS = ['Materiales', 'Mano de obra', 'Transporte', 'Servicios', 'Herramientas', 'Gasto operativo', 'Otro'];

const inicial = {
  codigo: '',
  proveedorId: '',
  proveedor: '',
  factura: '',
  fecha: hoyISO(),
  unidadNegocio: 'ELANKAV VISUAL',
  tipoFiscal: 'Con IVA',
  facturaFiscal: 'Sí',
  subtotal: '',
  iva: '',
  total: '',
  estado: 'Pendiente',
  categoria: 'Materiales',
  observaciones: '',
};

export default function Compras() {
  const { proveedores = [], compras = [], crearCompra, actualizarCompra, eliminarCompra } = useCore();
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(inicial);

  const limpiar = () => { setForm(inicial); setEditandoId(null); };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };

      if (name === 'proveedorId') {
        const proveedor = proveedores.find((item) => item.id === value);
        nuevo.proveedor = proveedor?.nombre || '';
      }

      if (name === 'tipoFiscal') {
        nuevo.facturaFiscal = value === 'Con IVA' ? 'Sí' : 'No';
      }

      const fiscal = fiscalCompra(nuevo.subtotal, nuevo.tipoFiscal);
      nuevo.iva = fiscal.iva.toFixed(2);
      nuevo.total = fiscal.total.toFixed(2);

      return nuevo;
    });
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!form.proveedor.trim() && !form.proveedorId) return;

    const proveedor = proveedores.find((item) => item.id === form.proveedorId);
    const fiscal = fiscalCompra(form.subtotal, form.tipoFiscal);

    const datos = {
      ...form,
      id: editandoId || `compra-${Date.now()}`,
      codigo: form.codigo.trim() || `COMPR-${Date.now()}`,
      proveedorId: form.proveedorId,
      proveedor: proveedor?.nombre || form.proveedor.trim(),
      factura: form.factura.trim(),
      fecha: form.fecha || hoyISO(),
      unidadNegocio: form.unidadNegocio || 'ELANKAV VISUAL',
      tipoFiscal: form.tipoFiscal || 'Con IVA',
      facturaFiscal: form.tipoFiscal === 'Con IVA' ? 'Sí' : form.facturaFiscal || 'No',
      subtotal: fiscal.subtotal,
      iva: fiscal.iva,
      ivaCredito: form.tipoFiscal === 'Con IVA' ? fiscal.iva : 0,
      total: fiscal.total,
      estado: form.estado || 'Pendiente',
      categoria: form.categoria || 'Materiales',
      observaciones: form.observaciones.trim(),
      actualizado: new Date().toISOString(),
    };

    if (editandoId) actualizarCompra(editandoId, datos);
    else crearCompra(datos);

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm({
      codigo: item.codigo || '',
      proveedorId: item.proveedorId || '',
      proveedor: item.proveedor || '',
      factura: item.factura || '',
      fecha: item.fecha || hoyISO(),
      unidadNegocio: item.unidadNegocio || 'ELANKAV VISUAL',
      tipoFiscal: item.tipoFiscal || (numero(item.iva) > 0 ? 'Con IVA' : 'Sin factura'),
      facturaFiscal: item.facturaFiscal || (numero(item.iva) > 0 ? 'Sí' : 'No'),
      subtotal: String(item.subtotal || ''),
      iva: String(item.ivaCredito || item.iva || ''),
      total: String(item.total || ''),
      estado: item.estado || 'Pendiente',
      categoria: item.categoria || 'Materiales',
      observaciones: item.observaciones || '',
    });
  };

  const resumen = useMemo(() => compras.reduce((acc, item) => {
    if (item.estado === 'Anulada') return acc;
    acc.subtotal += numero(item.subtotal);
    acc.ivaCredito += item.tipoFiscal === 'Con IVA' ? numero(item.ivaCredito || item.iva) : 0;
    acc.total += numero(item.total || item.subtotal);
    acc.sinFactura += item.tipoFiscal === 'Sin factura' ? numero(item.total || item.subtotal) : 0;
    return acc;
  }, { subtotal: 0, ivaCredito: 0, total: 0, sinFactura: 0 }), [compras]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Compras</h2>
        <p style={styles.subtitle}>Compras con control fiscal: IVA crédito, compras sin factura y gasto interno real.</p>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Subtotal</span><strong style={styles.statValue}>{moneda(resumen.subtotal)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA crédito</span><strong style={styles.statValue}>{moneda(resumen.ivaCredito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Total compras</span><strong style={styles.statValue}>{moneda(resumen.total)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Sin factura</span><strong style={styles.statValue}>{moneda(resumen.sinFactura)}</strong></div>
      </div>

      <form style={styles.card} onSubmit={guardar}>
        <div style={styles.grid}>
          <label style={styles.label}>Código<input style={styles.input} name="codigo" value={form.codigo} onChange={cambiar} /></label>
          <label style={styles.label}>Proveedor registrado<select style={styles.select} name="proveedorId" value={form.proveedorId} onChange={cambiar}><option value="">Manual</option>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <label style={styles.label}>Proveedor<input style={styles.input} name="proveedor" value={form.proveedor} onChange={cambiar} /></label>
          <label style={styles.label}>Factura<input style={styles.input} name="factura" value={form.factura} onChange={cambiar} /></label>
          <label style={styles.label}>Fecha<input style={styles.input} type="date" name="fecha" value={form.fecha} onChange={cambiar} /></label>
          <label style={styles.label}>Unidad<select style={styles.select} name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>{UNIDADES_NEGOCIO.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
          <label style={styles.label}>Tipo fiscal<select style={styles.select} name="tipoFiscal" value={form.tipoFiscal} onChange={cambiar}>{TIPOS_FISCALES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label style={styles.label}>Factura fiscal<select style={styles.select} name="facturaFiscal" value={form.facturaFiscal} onChange={cambiar}><option>Sí</option><option>No</option></select></label>
          <label style={styles.label}>Subtotal<input style={styles.input} type="number" step="0.01" name="subtotal" value={form.subtotal} onChange={cambiar} /></label>
          <label style={styles.label}>IVA<input style={styles.input} type="number" step="0.01" name="iva" value={form.iva} readOnly /></label>
          <label style={styles.label}>Total<input style={styles.input} type="number" step="0.01" name="total" value={form.total} readOnly /></label>
          <label style={styles.label}>Estado<select style={styles.select} name="estado" value={form.estado} onChange={cambiar}>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
          <label style={styles.label}>Categoría<select style={styles.select} name="categoria" value={form.categoria} onChange={cambiar}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        </div>
        <label style={{ ...styles.label, marginTop: 12 }}>Observaciones<textarea style={styles.textarea} name="observaciones" value={form.observaciones} onChange={cambiar} /></label>
        <div style={styles.actions}><button style={styles.primary} type="submit">{editandoId ? 'Actualizar compra' : 'Guardar compra'}</button><button style={styles.secondary} type="button" onClick={limpiar}>Limpiar</button></div>
      </form>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Código</th><th style={styles.th}>Proveedor</th><th style={styles.th}>Unidad</th><th style={styles.th}>Fiscal</th><th style={styles.th}>Subtotal</th><th style={styles.th}>IVA</th><th style={styles.th}>Total</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
            <tbody>{compras.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{item.fecha}</td><td style={styles.td}>{item.codigo}</td><td style={styles.td}>{item.proveedor}</td><td style={styles.td}>{item.unidadNegocio}</td><td style={styles.td}><span style={styles.badge}>{item.tipoFiscal || 'Sin clasificar'}</span></td><td style={styles.td}>{moneda(item.subtotal)}</td><td style={styles.td}>{moneda(item.ivaCredito || item.iva)}</td><td style={styles.td}>{moneda(item.total || item.subtotal)}</td><td style={styles.td}>{item.estado}</td><td style={styles.td}><button style={styles.edit} type="button" onClick={() => editar(item)}>Editar</button> <button style={styles.danger} type="button" onClick={() => eliminarCompra(item.id)}>Eliminar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
