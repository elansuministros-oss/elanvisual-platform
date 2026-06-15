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


const TIPOS = ['Ingreso', 'Egreso'];
const ESTADOS = ['Registrado', 'Pendiente', 'Anulado'];

const inicial = {
  fecha: hoyISO(),
  tipo: 'Ingreso',
  concepto: '',
  unidadNegocio: 'ELANVISUAL',
  tipoFiscal: 'Sin factura',
  facturaFiscal: 'No',
  monto: '',
  estado: 'Registrado',
  referencia: '',
  observaciones: '',
};

export default function FlujoCaja() {
  const {
    cobros = [],
    compras = [],
    cuentasPorCobrar = [],
    cuentasPorPagar = [],
    flujoCaja = [],
    crearMovimientoFlujoCaja,
    actualizarMovimientoFlujoCaja,
    eliminarMovimientoFlujoCaja,
  } = useCore();

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(inicial);

  const limpiar = () => { setForm(inicial); setEditandoId(null); };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };
      if (name === 'tipoFiscal') nuevo.facturaFiscal = value === 'Con IVA' ? 'Si' : 'No';
      return nuevo;
    });
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!form.concepto.trim()) return;

    const datos = {
      ...form,
      id: editandoId || `flujo-${Date.now()}`,
      fecha: form.fecha || hoyISO(),
      tipo: form.tipo || 'Ingreso',
      concepto: form.concepto.trim(),
      unidadNegocio: form.unidadNegocio || 'ELANVISUAL',
      tipoFiscal: form.tipoFiscal || 'Sin factura',
      facturaFiscal: form.tipoFiscal === 'Con IVA' ? 'Si' : form.facturaFiscal || 'No',
      monto: numero(form.monto),
      estado: form.estado || 'Registrado',
      referencia: form.referencia.trim(),
      observaciones: form.observaciones.trim(),
      actualizado: new Date().toISOString(),
    };

    if (editandoId) actualizarMovimientoFlujoCaja(editandoId, datos);
    else crearMovimientoFlujoCaja(datos);

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm({
      fecha: item.fecha || hoyISO(),
      tipo: item.tipo || 'Ingreso',
      concepto: item.concepto || '',
      unidadNegocio: item.unidadNegocio || 'ELANVISUAL',
      tipoFiscal: item.tipoFiscal || 'Sin factura',
      facturaFiscal: item.facturaFiscal || 'No',
      monto: String(item.monto || ''),
      estado: item.estado || 'Registrado',
      referencia: item.referencia || '',
      observaciones: item.observaciones || '',
    });
  };

  const resumen = useMemo(() => {
    const ingresosCobros = cobros
      .filter((item) => item.estado !== 'Anulado')
      .reduce((total, item) => total + numero(item.montoCobrado), 0);

    const egresosCompras = compras
      .filter((item) => item.estado !== 'Anulada')
      .reduce((total, item) => total + numero(item.total || item.subtotal), 0);

    const ingresosManuales = flujoCaja
      .filter((item) => item.tipo === 'Ingreso' && item.estado !== 'Anulado')
      .reduce((total, item) => total + numero(item.monto), 0);

    const egresosManuales = flujoCaja
      .filter((item) => item.tipo === 'Egreso' && item.estado !== 'Anulado')
      .reduce((total, item) => total + numero(item.monto), 0);

    const porCobrar = cuentasPorCobrar
      .filter((item) => item.estado !== 'Anulada')
      .reduce((total, item) => total + numero(item.saldo || item.saldoPendiente), 0);

    const porPagar = cuentasPorPagar
      .filter((item) => item.estado !== 'Anulada')
      .reduce((total, item) => total + numero(item.saldo || item.saldoPendiente), 0);

    const ivaDebito = cobros.reduce((total, item) => total + (item.tipoFiscal === 'Con IVA' ? numero(item.ivaDebito || item.iva) : 0), 0);
    const ivaCredito = compras.reduce((total, item) => total + (item.tipoFiscal === 'Con IVA' ? numero(item.ivaCredito || item.iva) : 0), 0);
    const ingresosSinFactura = cobros.reduce((total, item) => total + (item.tipoFiscal === 'Sin factura' ? numero(item.montoCobrado || item.montoFactura) : 0), 0);
    const egresosSinFactura = compras.reduce((total, item) => total + (item.tipoFiscal === 'Sin factura' ? numero(item.total || item.subtotal) : 0), 0);

    const ingresosTotales = ingresosCobros + ingresosManuales;
    const egresosTotales = egresosCompras + egresosManuales;

    return {
      ingresosCobros,
      ingresosManuales,
      ingresosTotales,
      egresosCompras,
      egresosManuales,
      egresosTotales,
      porCobrar,
      porPagar,
      saldoOperativo: ingresosTotales - egresosTotales,
      posicionFinanciera: ingresosTotales + porCobrar - egresosTotales - porPagar,
      ivaDebito,
      ivaCredito,
      ivaNeto: Math.max(ivaDebito - ivaCredito, 0),
      saldoFiscal: ivaDebito - ivaCredito,
      ingresosSinFactura,
      egresosSinFactura,
      utilidadInternaSinFactura: ingresosSinFactura - egresosSinFactura,
    };
  }, [cobros, compras, cuentasPorCobrar, cuentasPorPagar, flujoCaja]);

  const resumenUnidad = useMemo(() => UNIDADES_NEGOCIO.map((unidad) => {
    const ingresos = cobros.filter((i) => i.unidadNegocio === unidad).reduce((t, i) => t + numero(i.montoCobrado), 0)
      + flujoCaja.filter((i) => i.unidadNegocio === unidad && i.tipo === 'Ingreso').reduce((t, i) => t + numero(i.monto), 0);
    const egresos = compras.filter((i) => i.unidadNegocio === unidad).reduce((t, i) => t + numero(i.total || i.subtotal), 0)
      + flujoCaja.filter((i) => i.unidadNegocio === unidad && i.tipo === 'Egreso').reduce((t, i) => t + numero(i.monto), 0);
    return { unidad, ingresos, egresos, saldo: ingresos - egresos };
  }), [cobros, compras, flujoCaja]);

  return (
    <div style={styles.page}>
      <div style={styles.header}><h2 style={styles.title}>Flujo de Caja</h2><p style={styles.subtitle}>Caja real + lectura fiscal: IVA neto, ingresos sin factura y egresos sin factura.</p></div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Ingresos totales</span><strong style={styles.statValue}>{moneda(resumen.ingresosTotales)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Egresos totales</span><strong style={styles.statValue}>{moneda(resumen.egresosTotales)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Saldo operativo</span><strong style={styles.statValue}>{moneda(resumen.saldoOperativo)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Por cobrar</span><strong style={styles.statValue}>{moneda(resumen.porCobrar)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Por pagar</span><strong style={styles.statValue}>{moneda(resumen.porPagar)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA debito</span><strong style={styles.statValue}>{moneda(resumen.ivaDebito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA credito</span><strong style={styles.statValue}>{moneda(resumen.ivaCredito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA neto estimado</span><strong style={styles.statValue}>{moneda(resumen.ivaNeto)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Ingresos sin factura</span><strong style={styles.statValue}>{moneda(resumen.ingresosSinFactura)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Egresos sin factura</span><strong style={styles.statValue}>{moneda(resumen.egresosSinFactura)}</strong></div>
      </div>

      <form style={styles.card} onSubmit={guardar}>
        <div style={styles.grid}>
          <label style={styles.label}>Fecha<input style={styles.input} type="date" name="fecha" value={form.fecha} onChange={cambiar} /></label>
          <label style={styles.label}>Tipo<select style={styles.select} name="tipo" value={form.tipo} onChange={cambiar}>{TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label style={styles.label}>Concepto<input style={styles.input} name="concepto" value={form.concepto} onChange={cambiar} /></label>
          <label style={styles.label}>Unidad<select style={styles.select} name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>{UNIDADES_NEGOCIO.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
          <label style={styles.label}>Tipo fiscal<select style={styles.select} name="tipoFiscal" value={form.tipoFiscal} onChange={cambiar}>{TIPOS_FISCALES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label style={styles.label}>Factura fiscal<select style={styles.select} name="facturaFiscal" value={form.facturaFiscal} onChange={cambiar}><option>Si</option><option>No</option></select></label>
          <label style={styles.label}>Monto<input style={styles.input} type="number" step="0.01" name="monto" value={form.monto} onChange={cambiar} /></label>
          <label style={styles.label}>Estado<select style={styles.select} name="estado" value={form.estado} onChange={cambiar}>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
          <label style={styles.label}>Referencia<input style={styles.input} name="referencia" value={form.referencia} onChange={cambiar} /></label>
        </div>
        <label style={{ ...styles.label, marginTop: 12 }}>Observaciones<textarea style={styles.textarea} name="observaciones" value={form.observaciones} onChange={cambiar} /></label>
        <div style={styles.actions}><button style={styles.primary} type="submit">{editandoId ? 'Actualizar movimiento' : 'Guardar movimiento'}</button><button style={styles.secondary} type="button" onClick={limpiar}>Limpiar</button></div>
      </form>

      <div style={styles.card}>
        <h3>Resumen por unidad</h3>
        <div style={styles.tableWrap}><table style={styles.table}>
          <thead><tr><th style={styles.th}>Unidad</th><th style={styles.th}>Ingresos</th><th style={styles.th}>Egresos</th><th style={styles.th}>Saldo</th></tr></thead>
          <tbody>{resumenUnidad.map((item) => <tr key={item.unidad}><td style={styles.td}>{item.unidad}</td><td style={styles.td}>{moneda(item.ingresos)}</td><td style={styles.td}>{moneda(item.egresos)}</td><td style={styles.td}>{moneda(item.saldo)}</td></tr>)}</tbody>
        </table></div>
      </div>

      <div style={styles.card}>
        <h3>Movimientos manuales</h3>
        <div style={styles.tableWrap}><table style={styles.table}>
          <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Tipo</th><th style={styles.th}>Concepto</th><th style={styles.th}>Unidad</th><th style={styles.th}>Fiscal</th><th style={styles.th}>Monto</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
          <tbody>{flujoCaja.map((item) => <tr key={item.id}><td style={styles.td}>{item.fecha}</td><td style={styles.td}>{item.tipo}</td><td style={styles.td}>{item.concepto}</td><td style={styles.td}>{item.unidadNegocio}</td><td style={styles.td}><span style={styles.badge}>{item.tipoFiscal || 'Sin clasificar'}</span></td><td style={styles.td}>{moneda(item.monto)}</td><td style={styles.td}>{item.estado}</td><td style={styles.td}><button style={styles.edit} type="button" onClick={() => editar(item)}>Editar</button> <button style={styles.danger} type="button" onClick={() => eliminarMovimientoFlujoCaja(item.id)}>Eliminar</button></td></tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}


