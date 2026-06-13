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
const sumarDias = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
};

const inicial = {
  codigo: '',
  proveedorId: '',
  proveedor: '',
  compraId: '',
  factura: '',
  fechaEmision: hoyISO(),
  fechaVencimiento: sumarDias(15),
  unidadNegocio: 'ELANKAV VISUAL',
  tipoFiscal: 'Con IVA',
  facturaFiscal: 'Sí',
  subtotal: '',
  iva: '',
  monto: '',
  abonado: '',
  saldo: '',
  estado: 'Pendiente',
  observaciones: '',
};

const vencida = (fecha, estado) => fecha && !['Pagada', 'Anulada'].includes(estado) && new Date(fecha) < new Date(hoyISO());

export default function CuentasPorPagar() {
  const { proveedores = [], compras = [], cuentasPorPagar = [], crearCuentaPorPagar, actualizarCuentaPorPagar, eliminarCuentaPorPagar } = useCore();
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(inicial);

  const limpiar = () => { setForm(inicial); setEditandoId(null); };

  const recalcular = (base) => {
    const saldo = Math.max(numero(base.monto) - numero(base.abonado), 0);
    const estado = saldo <= 0 && numero(base.monto) > 0 ? 'Pagada' : numero(base.abonado) > 0 ? 'Parcial' : base.estado;
    return { ...base, saldo: saldo.toFixed(2), estado };
  };

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let nuevo = { ...prev, [name]: value };

      if (name === 'proveedorId') {
        const proveedor = proveedores.find((item) => item.id === value);
        nuevo.proveedor = proveedor?.nombre || '';
      }

      if (name === 'compraId') {
        const compra = compras.find((item) => item.id === value);
        if (compra) {
          nuevo = {
            ...nuevo,
            proveedorId: compra.proveedorId || '',
            proveedor: compra.proveedor || '',
            factura: compra.factura || '',
            unidadNegocio: compra.unidadNegocio || 'ELANKAV VISUAL',
            tipoFiscal: compra.tipoFiscal || 'Con IVA',
            facturaFiscal: compra.facturaFiscal || 'Sí',
            subtotal: String(compra.subtotal || ''),
            iva: String(compra.ivaCredito || compra.iva || ''),
            monto: String(compra.total || compra.subtotal || ''),
            abonado: compra.estado === 'Pagada' ? String(compra.total || compra.subtotal || '') : '',
          };
        }
      }

      return recalcular(nuevo);
    });
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!form.proveedor.trim() && !form.proveedorId) return;

    const proveedor = proveedores.find((item) => item.id === form.proveedorId);
    const monto = numero(form.monto);
    const abonado = numero(form.abonado);

    const datos = {
      ...form,
      id: editandoId || `cxp-${Date.now()}`,
      codigo: form.codigo.trim() || `CXP-${Date.now()}`,
      proveedorId: form.proveedorId,
      proveedor: proveedor?.nombre || form.proveedor.trim(),
      factura: form.factura.trim(),
      fechaEmision: form.fechaEmision || hoyISO(),
      fechaVencimiento: form.fechaVencimiento || sumarDias(15),
      unidadNegocio: form.unidadNegocio || 'ELANKAV VISUAL',
      tipoFiscal: form.tipoFiscal || 'Con IVA',
      facturaFiscal: form.tipoFiscal === 'Con IVA' ? 'Sí' : form.facturaFiscal || 'No',
      subtotal: numero(form.subtotal),
      iva: numero(form.iva),
      ivaCredito: form.tipoFiscal === 'Con IVA' ? numero(form.iva) : 0,
      monto,
      abonado,
      saldo: Math.max(monto - abonado, 0),
      estado: form.estado,
      observaciones: form.observaciones.trim(),
      actualizado: new Date().toISOString(),
    };

    if (editandoId) actualizarCuentaPorPagar(editandoId, datos);
    else crearCuentaPorPagar(datos);

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm(recalcular({
      codigo: item.codigo || '',
      proveedorId: item.proveedorId || '',
      proveedor: item.proveedor || '',
      compraId: item.compraId || '',
      factura: item.factura || '',
      fechaEmision: item.fechaEmision || hoyISO(),
      fechaVencimiento: item.fechaVencimiento || sumarDias(15),
      unidadNegocio: item.unidadNegocio || 'ELANKAV VISUAL',
      tipoFiscal: item.tipoFiscal || (numero(item.ivaCredito || item.iva) > 0 ? 'Con IVA' : 'Sin factura'),
      facturaFiscal: item.facturaFiscal || (numero(item.ivaCredito || item.iva) > 0 ? 'Sí' : 'No'),
      subtotal: String(item.subtotal || ''),
      iva: String(item.ivaCredito || item.iva || ''),
      monto: String(item.monto || ''),
      abonado: String(item.abonado || ''),
      saldo: String(item.saldo || ''),
      estado: item.estado || 'Pendiente',
      observaciones: item.observaciones || '',
    }));
  };

  const resumen = useMemo(() => cuentasPorPagar.reduce((acc, item) => {
    if (item.estado === 'Anulada') return acc;
    acc.monto += numero(item.monto);
    acc.abonado += numero(item.abonado);
    acc.saldo += numero(item.saldo);
    acc.ivaCredito += item.tipoFiscal === 'Con IVA' ? numero(item.ivaCredito || item.iva) : 0;
    acc.sinFactura += item.tipoFiscal === 'Sin factura' ? numero(item.monto) : 0;
    acc.vencidas += vencida(item.fechaVencimiento, item.estado) ? 1 : 0;
    return acc;
  }, { monto: 0, abonado: 0, saldo: 0, ivaCredito: 0, sinFactura: 0, vencidas: 0 }), [cuentasPorPagar]);

  return (
    <div style={styles.page}>
      <div style={styles.header}><h2 style={styles.title}>Cuentas por Pagar</h2><p style={styles.subtitle}>Control de proveedores, IVA crédito pendiente y pagos sin factura fiscal.</p></div>
      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Total por pagar</span><strong style={styles.statValue}>{moneda(resumen.monto)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Abonado</span><strong style={styles.statValue}>{moneda(resumen.abonado)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Saldo</span><strong style={styles.statValue}>{moneda(resumen.saldo)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA crédito</span><strong style={styles.statValue}>{moneda(resumen.ivaCredito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Sin factura</span><strong style={styles.statValue}>{moneda(resumen.sinFactura)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Vencidas</span><strong style={styles.statValue}>{resumen.vencidas}</strong></div>
      </div>

      <form style={styles.card} onSubmit={guardar}>
        <div style={styles.grid}>
          <label style={styles.label}>Código<input style={styles.input} name="codigo" value={form.codigo} onChange={cambiar} /></label>
          <label style={styles.label}>Proveedor<select style={styles.select} name="proveedorId" value={form.proveedorId} onChange={cambiar}><option value="">Manual</option>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <label style={styles.label}>Compra<select style={styles.select} name="compraId" value={form.compraId} onChange={cambiar}><option value="">Manual</option>{compras.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.proveedor}</option>)}</select></label>
          <label style={styles.label}>Proveedor manual<input style={styles.input} name="proveedor" value={form.proveedor} onChange={cambiar} /></label>
          <label style={styles.label}>Factura<input style={styles.input} name="factura" value={form.factura} onChange={cambiar} /></label>
          <label style={styles.label}>Emisión<input style={styles.input} type="date" name="fechaEmision" value={form.fechaEmision} onChange={cambiar} /></label>
          <label style={styles.label}>Vencimiento<input style={styles.input} type="date" name="fechaVencimiento" value={form.fechaVencimiento} onChange={cambiar} /></label>
          <label style={styles.label}>Unidad<select style={styles.select} name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>{UNIDADES_NEGOCIO.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
          <label style={styles.label}>Tipo fiscal<select style={styles.select} name="tipoFiscal" value={form.tipoFiscal} onChange={cambiar}>{TIPOS_FISCALES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label style={styles.label}>Factura fiscal<select style={styles.select} name="facturaFiscal" value={form.facturaFiscal} onChange={cambiar}><option>Sí</option><option>No</option></select></label>
          <label style={styles.label}>Subtotal<input style={styles.input} type="number" step="0.01" name="subtotal" value={form.subtotal} onChange={cambiar} /></label>
          <label style={styles.label}>IVA<input style={styles.input} type="number" step="0.01" name="iva" value={form.iva} onChange={cambiar} /></label>
          <label style={styles.label}>Monto<input style={styles.input} type="number" step="0.01" name="monto" value={form.monto} onChange={cambiar} /></label>
          <label style={styles.label}>Abonado<input style={styles.input} type="number" step="0.01" name="abonado" value={form.abonado} onChange={cambiar} /></label>
          <label style={styles.label}>Saldo<input style={styles.input} type="number" step="0.01" name="saldo" value={form.saldo} readOnly /></label>
          <label style={styles.label}>Estado<select style={styles.select} name="estado" value={form.estado} onChange={cambiar}>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
        </div>
        <label style={{ ...styles.label, marginTop: 12 }}>Observaciones<textarea style={styles.textarea} name="observaciones" value={form.observaciones} onChange={cambiar} /></label>
        <div style={styles.actions}><button style={styles.primary} type="submit">{editandoId ? 'Actualizar cuenta' : 'Guardar cuenta'}</button><button style={styles.secondary} type="button" onClick={limpiar}>Limpiar</button></div>
      </form>

      <div style={styles.card}><div style={styles.tableWrap}><table style={styles.table}>
        <thead><tr><th style={styles.th}>Vence</th><th style={styles.th}>Código</th><th style={styles.th}>Proveedor</th><th style={styles.th}>Unidad</th><th style={styles.th}>Fiscal</th><th style={styles.th}>Monto</th><th style={styles.th}>Abonado</th><th style={styles.th}>Saldo</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
        <tbody>{cuentasPorPagar.map((item) => <tr key={item.id}>
          <td style={styles.td}>{item.fechaVencimiento}</td><td style={styles.td}>{item.codigo}</td><td style={styles.td}>{item.proveedor}</td><td style={styles.td}>{item.unidadNegocio}</td><td style={styles.td}><span style={styles.badge}>{item.tipoFiscal || 'Sin clasificar'}</span></td><td style={styles.td}>{moneda(item.monto)}</td><td style={styles.td}>{moneda(item.abonado)}</td><td style={styles.td}>{moneda(item.saldo)}</td><td style={styles.td}>{item.estado}</td><td style={styles.td}><button style={styles.edit} type="button" onClick={() => editar(item)}>Editar</button> <button style={styles.danger} type="button" onClick={() => eliminarCuentaPorPagar(item.id)}>Eliminar</button></td>
        </tr>)}</tbody>
      </table></div></div>
    </div>
  );
}
