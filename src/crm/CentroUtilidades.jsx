import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = [
  'ELANPET',
  'ELANKAV VISUAL',
  'ELANKAV CENTER',
  'ELANKAV SOLAR',
  'ELAN AI',
];

const fechaActual = () => new Date().toISOString().slice(0, 10);

const primerDiaMes = () => {
  const fecha = new Date();
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().slice(0, 10);
};

const numero = (valor) => Number(valor || 0);

const moneda = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
  }).format(numero(valor));

const porcentaje = (valor) => `${numero(valor).toFixed(2)}%`;

const unidadRegistro = (item = {}) => item.unidadNegocio || item.unidad || 'ELANKAV VISUAL';

const fechaRegistro = (item = {}) =>
  item.fecha ||
  item.fechaCobro ||
  item.fechaEmision ||
  item.fechaRegistro ||
  item.fechaInicio ||
  item.fechaEntrega ||
  item.actualizado ||
  '';

const dentroRango = (item, inicio, fin) => {
  const fecha = String(fechaRegistro(item)).slice(0, 10);

  if (!fecha) return true;
  if (inicio && fecha < inicio) return false;
  if (fin && fecha > fin) return false;

  return true;
};

const sumar = (lista = [], selector) =>
  lista.reduce((total, item) => total + numero(selector(item)), 0);

const ventaRegistro = (item = {}) =>
  numero(item.montoFactura || item.total || item.valorVenta || item.precioVenta || item.monto || item.subtotal);

const compraRegistro = (item = {}) =>
  numero(item.total || item.subtotal || item.monto || item.valor || item.costoTotal);

const cobroRegistro = (item = {}) =>
  numero(item.montoCobrado || item.netoRecibido || item.monto || item.total || item.abono);

const saldoRegistro = (item = {}) =>
  numero(item.saldoPendiente || item.saldo || item.pendiente || item.montoPendiente || item.totalPendiente);

const costoProduccionRegistro = (item = {}) => {
  const costoDirecto = numero(item.costoTotal);

  if (costoDirecto > 0) return costoDirecto;

  return (
    numero(item.costoMateriales) +
    numero(item.costoManoObra) +
    numero(item.costoTransporte) +
    numero(item.costoInstalacion) +
    numero(item.otrosCostos)
  );
};

const styles = {
  page: { display: 'grid', gap: 18 },
  header: {
    background: '#fff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 8px 24px rgba(15,23,42,.08)',
  },
  title: { margin: 0, color: '#111827' },
  subtitle: { margin: '6px 0 0', color: '#6b7280' },
  card: {
    background: '#fff',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,.08)',
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    alignItems: 'end',
  },
  label: { display: 'grid', gap: 6, fontWeight: 800, color: '#374151', fontSize: 13 },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 14,
    background: '#fff',
    boxSizing: 'border-box',
  },
  button: {
    border: 0,
    borderRadius: 12,
    padding: '11px 15px',
    background: '#1f5fad',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
  },
  secondary: {
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '11px 15px',
    background: '#fff',
    color: '#374151',
    fontWeight: 900,
    cursor: 'pointer',
  },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 },
  stat: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14 },
  statLabel: { color: '#6b7280', fontSize: 12, fontWeight: 800 },
  statValue: { display: 'block', marginTop: 6, fontSize: 20, color: '#111827', fontWeight: 950 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 1180 },
  th: {
    textAlign: 'left',
    padding: 11,
    background: '#f3f6fb',
    color: '#374151',
    fontSize: 12,
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: { padding: 11, borderBottom: '1px solid #e5e7eb', fontSize: 13, verticalAlign: 'top', whiteSpace: 'nowrap' },
  badge: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '5px 9px',
    fontWeight: 900,
    fontSize: 12,
    background: '#eef2ff',
    color: '#3730a3',
  },
  positive: { color: '#047857', fontWeight: 950 },
  negative: { color: '#dc2626', fontWeight: 950 },
  rankGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  rankItem: { border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#f8fafc' },
  rankTop: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  rankNumber: { width: 34, height: 34, borderRadius: 999, background: '#1f5fad', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 950 },
  muted: { color: '#6b7280', fontSize: 12, margin: '6px 0 0' },
};

export default function CentroUtilidades() {
  const {
    compras = [],
    cobros = [],
    cuentasPorCobrar = [],
    cuentasPorPagar = [],
    produccion = [],
    pedidos = [],
    cotizaciones = [],
  } = useCore();

  const [filtros, setFiltros] = useState({
    fechaInicio: primerDiaMes(),
    fechaFin: fechaActual(),
    unidadNegocio: 'Todas',
  });

  const cambiarFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ fechaInicio: '', fechaFin: '', unidadNegocio: 'Todas' });
  };

  const datos = useMemo(() => {
    const filtrar = (lista) =>
      lista.filter((item) => {
        const coincideFecha = dentroRango(item, filtros.fechaInicio, filtros.fechaFin);
        const coincideUnidad = filtros.unidadNegocio === 'Todas' || unidadRegistro(item) === filtros.unidadNegocio;
        return coincideFecha && coincideUnidad;
      });

    const comprasFiltradas = filtrar(compras);
    const cobrosFiltrados = filtrar(cobros);
    const cxcFiltradas = filtrar(cuentasPorCobrar);
    const cxpFiltradas = filtrar(cuentasPorPagar);
    const produccionFiltrada = filtrar(produccion);
    const pedidosFiltrados = filtrar(pedidos);
    const cotizacionesFiltradas = filtrar(cotizaciones);

    const unidades = UNIDADES_NEGOCIO.map((unidad) => {
      const comprasUnidad = comprasFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const cobrosUnidad = cobrosFiltrados.filter((item) => unidadRegistro(item) === unidad);
      const cxcUnidad = cxcFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const cxpUnidad = cxpFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const produccionUnidad = produccionFiltrada.filter((item) => unidadRegistro(item) === unidad);
      const pedidosUnidad = pedidosFiltrados.filter((item) => unidadRegistro(item) === unidad);
      const cotizacionesUnidad = cotizacionesFiltradas.filter((item) => unidadRegistro(item) === unidad);

      const ventas =
        sumar(cobrosUnidad, ventaRegistro) ||
        sumar(pedidosUnidad, ventaRegistro) ||
        sumar(cotizacionesUnidad, ventaRegistro);
      const comprasTotal = sumar(comprasUnidad, compraRegistro);
      const costosProduccion = sumar(produccionUnidad, costoProduccionRegistro);
      const cobrado = sumar(cobrosUnidad, cobroRegistro);
      const porCobrar = sumar(cxcUnidad, saldoRegistro) + sumar(cobrosUnidad, saldoRegistro);
      const porPagar = sumar(cxpUnidad, saldoRegistro);
      const utilidadBruta = ventas - costosProduccion;
      const utilidadNeta = ventas - comprasTotal - costosProduccion - porPagar;
      const margen = ventas > 0 ? (utilidadNeta / ventas) * 100 : 0;

      return {
        unidad,
        ventas,
        compras: comprasTotal,
        costosProduccion,
        cobrado,
        porCobrar,
        porPagar,
        utilidadBruta,
        utilidadNeta,
        margen,
        registros:
          comprasUnidad.length +
          cobrosUnidad.length +
          cxcUnidad.length +
          cxpUnidad.length +
          produccionUnidad.length +
          pedidosUnidad.length +
          cotizacionesUnidad.length,
      };
    }).filter((item) => filtros.unidadNegocio === 'Todas' || item.unidad === filtros.unidadNegocio);

    const ranking = [...unidades].sort((a, b) => b.utilidadNeta - a.utilidadNeta);

    const totales = unidades.reduce(
      (acc, item) => ({
        ventas: acc.ventas + item.ventas,
        compras: acc.compras + item.compras,
        costosProduccion: acc.costosProduccion + item.costosProduccion,
        cobrado: acc.cobrado + item.cobrado,
        porCobrar: acc.porCobrar + item.porCobrar,
        porPagar: acc.porPagar + item.porPagar,
        utilidadBruta: acc.utilidadBruta + item.utilidadBruta,
        utilidadNeta: acc.utilidadNeta + item.utilidadNeta,
        registros: acc.registros + item.registros,
      }),
      {
        ventas: 0,
        compras: 0,
        costosProduccion: 0,
        cobrado: 0,
        porCobrar: 0,
        porPagar: 0,
        utilidadBruta: 0,
        utilidadNeta: 0,
        registros: 0,
      }
    );

    totales.margen = totales.ventas > 0 ? (totales.utilidadNeta / totales.ventas) * 100 : 0;

    return { unidades, ranking, totales };
  }, [compras, cobros, cuentasPorCobrar, cuentasPorPagar, produccion, pedidos, cotizaciones, filtros]);

  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <h2 style={styles.title}>Centro de Utilidades por Unidad</h2>
        <p style={styles.subtitle}>FASE 6.4 · Rentabilidad consolidada por unidad oficial de ELANKAV GROUP.</p>
      </section>

      <section style={styles.card}>
        <div style={styles.filters}>
          <label style={styles.label}>
            Fecha inicio
            <input style={styles.input} type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={cambiarFiltro} />
          </label>

          <label style={styles.label}>
            Fecha fin
            <input style={styles.input} type="date" name="fechaFin" value={filtros.fechaFin} onChange={cambiarFiltro} />
          </label>

          <label style={styles.label}>
            Unidad
            <select style={styles.select} name="unidadNegocio" value={filtros.unidadNegocio} onChange={cambiarFiltro}>
              <option value="Todas">Todas</option>
              {UNIDADES_NEGOCIO.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </label>

          <button type="button" style={styles.secondary} onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>
      </section>

      <section style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas</span><strong style={styles.statValue}>{moneda(datos.totales.ventas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Compras</span><strong style={styles.statValue}>{moneda(datos.totales.compras)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Costos producción</span><strong style={styles.statValue}>{moneda(datos.totales.costosProduccion)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cobros</span><strong style={styles.statValue}>{moneda(datos.totales.cobrado)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cuentas por cobrar</span><strong style={styles.statValue}>{moneda(datos.totales.porCobrar)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Cuentas por pagar</span><strong style={styles.statValue}>{moneda(datos.totales.porPagar)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad bruta</span><strong style={styles.statValue}>{moneda(datos.totales.utilidadBruta)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad neta</span><strong style={datos.totales.utilidadNeta >= 0 ? styles.positive : styles.negative}>{moneda(datos.totales.utilidadNeta)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Margen neto</span><strong style={styles.statValue}>{porcentaje(datos.totales.margen)}</strong></div>
      </section>

      <section style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Ranking de unidades</h3>
        <div style={styles.rankGrid}>
          {datos.ranking.map((item, index) => (
            <div key={item.unidad} style={styles.rankItem}>
              <div style={styles.rankTop}>
                <div style={styles.rankNumber}>{index + 1}</div>
                <span style={styles.badge}>{item.unidad}</span>
              </div>
              <h3 style={{ margin: '12px 0 0', color: item.utilidadNeta >= 0 ? '#047857' : '#dc2626' }}>{moneda(item.utilidadNeta)}</h3>
              <p style={styles.muted}>Margen: {porcentaje(item.margen)} · Ventas: {moneda(item.ventas)}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Detalle financiero por unidad</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Unidad</th>
                <th style={styles.th}>Ventas</th>
                <th style={styles.th}>Compras</th>
                <th style={styles.th}>Costos producción</th>
                <th style={styles.th}>Cobros</th>
                <th style={styles.th}>CxC</th>
                <th style={styles.th}>CxP</th>
                <th style={styles.th}>Utilidad bruta</th>
                <th style={styles.th}>Utilidad neta</th>
                <th style={styles.th}>Margen</th>
                <th style={styles.th}>Registros</th>
              </tr>
            </thead>
            <tbody>
              {datos.unidades.map((item) => (
                <tr key={item.unidad}>
                  <td style={styles.td}><span style={styles.badge}>{item.unidad}</span></td>
                  <td style={styles.td}>{moneda(item.ventas)}</td>
                  <td style={styles.td}>{moneda(item.compras)}</td>
                  <td style={styles.td}>{moneda(item.costosProduccion)}</td>
                  <td style={styles.td}>{moneda(item.cobrado)}</td>
                  <td style={styles.td}>{moneda(item.porCobrar)}</td>
                  <td style={styles.td}>{moneda(item.porPagar)}</td>
                  <td style={styles.td}>{moneda(item.utilidadBruta)}</td>
                  <td style={{ ...styles.td, ...(item.utilidadNeta >= 0 ? styles.positive : styles.negative) }}>{moneda(item.utilidadNeta)}</td>
                  <td style={styles.td}>{porcentaje(item.margen)}</td>
                  <td style={styles.td}>{item.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
