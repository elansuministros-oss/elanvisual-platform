import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = ['Todas', 'ELANPET', 'ELANKAV VISUAL', 'ELANKAV CENTER', 'ELANKAV SOLAR', 'ELAN AI'];

const numero = (valor) => Number(valor) || 0;
const moneda = (valor) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', minimumFractionDigits: 2 }).format(numero(valor));

const fechaRegistro = (item) =>
  item?.fecha ||
  item?.fechaCobro ||
  item?.fechaEmision ||
  item?.fechaRegistro ||
  item?.actualizado ||
  item?.createdAt ||
  '';

const dentroRango = (item, inicio, fin) => {
  const fecha = fechaRegistro(item);
  if (!fecha) return true;
  const valor = String(fecha).slice(0, 10);
  if (inicio && valor < inicio) return false;
  if (fin && valor > fin) return false;
  return true;
};

const porUnidad = (item, unidad) => unidad === 'Todas' || (item?.unidadNegocio || 'ELANKAV VISUAL') === unidad;

const sumar = (lista, selector) => lista.reduce((total, item) => total + numero(selector(item)), 0);

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
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  stat: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14 },
  statLabel: { color: '#6b7280', fontSize: 12, fontWeight: 800 },
  statValue: { display: 'block', marginTop: 6, fontSize: 20, color: '#111827', fontWeight: 950 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 980 },
  th: { textAlign: 'left', padding: 11, background: '#f3f6fb', color: '#374151', fontSize: 12, borderBottom: '1px solid #e5e7eb' },
  td: { padding: 11, borderBottom: '1px solid #e5e7eb', fontSize: 13, verticalAlign: 'top' },
  badge: { display: 'inline-flex', borderRadius: 999, padding: '5px 9px', fontWeight: 900, fontSize: 12, background: '#eef2ff', color: '#3730a3' },
};

export default function ReportesCRM() {
  const {
    cotizaciones = [],
    pedidos = [],
    ordenesTrabajo = [],
    produccion = [],
    cobros = [],
    comisiones = [],
    compras = [],
    cuentasPorCobrar = [],
    cuentasPorPagar = [],
    flujoCaja = [],
  } = useCore();

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    unidadNegocio: 'Todas',
  });

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const filtrar = (lista = []) =>
    lista.filter((item) => dentroRango(item, filtros.fechaInicio, filtros.fechaFin) && porUnidad(item, filtros.unidadNegocio));

  const datos = useMemo(() => {
    const cotizacionesFiltradas = filtrar(cotizaciones);
    const pedidosFiltrados = filtrar(pedidos);
    const otFiltradas = filtrar(ordenesTrabajo);
    const produccionFiltrada = filtrar(produccion);
    const cobrosFiltrados = filtrar(cobros);
    const comisionesFiltradas = filtrar(comisiones);
    const comprasFiltradas = filtrar(compras);
    const cxcFiltradas = filtrar(cuentasPorCobrar);
    const cxpFiltradas = filtrar(cuentasPorPagar);
    const flujoFiltrado = filtrar(flujoCaja);

    const ventas = sumar(cobrosFiltrados, (item) => item.montoFactura);
    const cobrado = sumar(cobrosFiltrados, (item) => item.montoCobrado);
    const comprasTotal = sumar(comprasFiltradas, (item) => item.total || item.subtotal);
    const cxcSaldo = sumar(cxcFiltradas, (item) => item.saldo || item.saldoPendiente);
    const cxpSaldo = sumar(cxpFiltradas, (item) => item.saldo || item.saldoPendiente);
    const comisionesTotal = sumar(comisionesFiltradas, (item) => item.monto || item.comision || item.total);
    const ingresosCaja = sumar(flujoFiltrado.filter((item) => item.tipo === 'Ingreso'), (item) => item.monto);
    const egresosCaja = sumar(flujoFiltrado.filter((item) => item.tipo === 'Egreso'), (item) => item.monto);

    const ivaDebito = sumar(cobrosFiltrados, (item) => item.tipoFiscal === 'Con IVA' ? item.ivaDebito || item.iva : 0);
    const ivaCredito = sumar(comprasFiltradas, (item) => item.tipoFiscal === 'Con IVA' ? item.ivaCredito || item.iva : 0);
    const retenciones = sumar(cobrosFiltrados, (item) => item.retencionMonto);
    const ventasSinFactura = sumar(cobrosFiltrados, (item) => item.tipoFiscal === 'Sin factura' ? item.montoFactura : 0);
    const comprasSinFactura = sumar(comprasFiltradas, (item) => item.tipoFiscal === 'Sin factura' ? item.total || item.subtotal : 0);

    const unidades = ['ELANPET', 'ELANKAV VISUAL', 'ELANKAV CENTER', 'ELANKAV SOLAR', 'ELAN AI'].map((unidad) => {
      const ventasUnidad = sumar(cobrosFiltrados.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad), (item) => item.montoFactura);
      const comprasUnidad = sumar(comprasFiltradas.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad), (item) => item.total || item.subtotal);
      const cobrosUnidad = sumar(cobrosFiltrados.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad), (item) => item.montoCobrado);
      const cxcUnidad = sumar(cxcFiltradas.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad), (item) => item.saldo || item.saldoPendiente);
      const cxpUnidad = sumar(cxpFiltradas.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad), (item) => item.saldo || item.saldoPendiente);
      const produccionUnidad = produccionFiltrada.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad).length;
      const comisionesUnidad = sumar(comisionesFiltradas.filter((item) => (item.unidadNegocio || 'ELANKAV VISUAL') === unidad), (item) => item.monto || item.comision || item.total);

      return {
        unidad,
        ventas: ventasUnidad,
        compras: comprasUnidad,
        cobros: cobrosUnidad,
        cuentasPorCobrar: cxcUnidad,
        cuentasPorPagar: cxpUnidad,
        produccion: produccionUnidad,
        comisiones: comisionesUnidad,
        utilidadOperativa: ventasUnidad - comprasUnidad - comisionesUnidad,
      };
    });

    return {
      cotizaciones: cotizacionesFiltradas.length,
      pedidos: pedidosFiltrados.length,
      ordenesTrabajo: otFiltradas.length,
      produccion: produccionFiltrada.length,
      ventas,
      cobrado,
      comprasTotal,
      cxcSaldo,
      cxpSaldo,
      comisionesTotal,
      ingresosCaja,
      egresosCaja,
      flujoNeto: cobrado + ingresosCaja - comprasTotal - egresosCaja,
      ivaDebito,
      ivaCredito,
      ivaNeto: ivaDebito - ivaCredito,
      retenciones,
      ventasSinFactura,
      comprasSinFactura,
      utilidadRealInterna: ventas + ingresosCaja - comprasTotal - egresosCaja - comisionesTotal,
      unidades,
    };
  }, [
    cotizaciones,
    pedidos,
    ordenesTrabajo,
    produccion,
    cobros,
    comisiones,
    compras,
    cuentasPorCobrar,
    cuentasPorPagar,
    flujoCaja,
    filtros,
  ]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Reportes Corporativos</h2>
        <p style={styles.subtitle}>FASE 5.1 · Reporte financiero, operativo y fiscal por unidad de negocio.</p>
      </div>

      <div style={styles.card}>
        <div style={styles.grid}>
          <label style={styles.label}>Fecha inicio<input style={styles.input} type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={cambiar} /></label>
          <label style={styles.label}>Fecha fin<input style={styles.input} type="date" name="fechaFin" value={filtros.fechaFin} onChange={cambiar} /></label>
          <label style={styles.label}>Unidad de negocio<select style={styles.select} name="unidadNegocio" value={filtros.unidadNegocio} onChange={cambiar}>{UNIDADES_NEGOCIO.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas por unidad</span><strong style={styles.statValue}>{moneda(datos.ventas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Compras por unidad</span><strong style={styles.statValue}>{moneda(datos.comprasTotal)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cobros por unidad</span><strong style={styles.statValue}>{moneda(datos.cobrado)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cuentas por cobrar</span><strong style={styles.statValue}>{moneda(datos.cxcSaldo)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cuentas por pagar</span><strong style={styles.statValue}>{moneda(datos.cxpSaldo)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Flujo de caja</span><strong style={styles.statValue}>{moneda(datos.flujoNeto)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Producción</span><strong style={styles.statValue}>{datos.produccion}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Comisiones</span><strong style={styles.statValue}>{moneda(datos.comisionesTotal)}</strong></div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>IVA generado ventas</span><strong style={styles.statValue}>{moneda(datos.ivaDebito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA acreditable compras</span><strong style={styles.statValue}>{moneda(datos.ivaCredito)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA neto estimado</span><strong style={styles.statValue}>{moneda(datos.ivaNeto)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Retenciones</span><strong style={styles.statValue}>{moneda(datos.retenciones)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas sin factura</span><strong style={styles.statValue}>{moneda(datos.ventasSinFactura)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Compras sin factura</span><strong style={styles.statValue}>{moneda(datos.comprasSinFactura)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad real interna</span><strong style={styles.statValue}>{moneda(datos.utilidadRealInterna)}</strong></div>
      </div>

      <div style={styles.card}>
        <h3>Resumen por unidad</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Unidad</th>
                <th style={styles.th}>Ventas</th>
                <th style={styles.th}>Compras</th>
                <th style={styles.th}>Cobros</th>
                <th style={styles.th}>CxC</th>
                <th style={styles.th}>CxP</th>
                <th style={styles.th}>Producción</th>
                <th style={styles.th}>Comisiones</th>
                <th style={styles.th}>Utilidad operativa</th>
              </tr>
            </thead>
            <tbody>
              {datos.unidades.map((item) => (
                <tr key={item.unidad}>
                  <td style={styles.td}><span style={styles.badge}>{item.unidad}</span></td>
                  <td style={styles.td}>{moneda(item.ventas)}</td>
                  <td style={styles.td}>{moneda(item.compras)}</td>
                  <td style={styles.td}>{moneda(item.cobros)}</td>
                  <td style={styles.td}>{moneda(item.cuentasPorCobrar)}</td>
                  <td style={styles.td}>{moneda(item.cuentasPorPagar)}</td>
                  <td style={styles.td}>{item.produccion}</td>
                  <td style={styles.td}>{moneda(item.comisiones)}</td>
                  <td style={styles.td}>{moneda(item.utilidadOperativa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Lectura ejecutiva</h3>
        <p>
          Este reporte separa el dinero real del control fiscal. Las ventas y compras con IVA alimentan el IVA débito y crédito.
          Los registros sin factura se mantienen visibles como control interno para no perder rentabilidad real.
        </p>
      </div>
    </div>
  );
}
