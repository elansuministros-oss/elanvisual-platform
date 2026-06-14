import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = [
  'ELANVISUAL',
  'ELANVISUAL',
  'ELANKAV CENTER',
  'ELANHOME',
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

const unidadRegistro = (item = {}) => item.unidadNegocio || item.unidad || 'ELANVISUAL';

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

const tipoMovimientoCaja = (item = {}) =>
  String(item.tipo || item.categoria || item.movimiento || item.naturaleza || '').toLowerCase();

const montoFlujoCaja = (item = {}) =>
  numero(item.monto || item.total || item.valor || item.importe || item.cantidad);

const esIngresoCaja = (item = {}) => {
  const tipo = tipoMovimientoCaja(item);
  return tipo.includes('ingreso') || tipo.includes('entrada') || tipo.includes('cobro');
};

const esEgresoCaja = (item = {}) => {
  const tipo = tipoMovimientoCaja(item);
  return tipo.includes('egreso') || tipo.includes('salida') || tipo.includes('pago') || tipo.includes('gasto');
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
  secondary: {
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '11px 15px',
    background: '#fff',
    color: '#374151',
    fontWeight: 900,
    cursor: 'pointer',
  },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  stat: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14 },
  statLabel: { color: '#6b7280', fontSize: 12, fontWeight: 800 },
  statValue: { display: 'block', marginTop: 6, fontSize: 20, color: '#111827', fontWeight: 950 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 1120 },
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
  warning: { color: '#b45309', fontWeight: 950 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 },
  muted: { color: '#6b7280', fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 },
};

export default function EstadoFinanciero() {
  const {
    compras = [],
    cobros = [],
    cuentasPorCobrar = [],
    cuentasPorPagar = [],
    produccion = [],
    pedidos = [],
    cotizaciones = [],
    flujoCaja = [],
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
    const flujoFiltrado = filtrar(flujoCaja);

    const unidades = UNIDADES_NEGOCIO.map((unidad) => {
      const comprasUnidad = comprasFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const cobrosUnidad = cobrosFiltrados.filter((item) => unidadRegistro(item) === unidad);
      const cxcUnidad = cxcFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const cxpUnidad = cxpFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const produccionUnidad = produccionFiltrada.filter((item) => unidadRegistro(item) === unidad);
      const pedidosUnidad = pedidosFiltrados.filter((item) => unidadRegistro(item) === unidad);
      const cotizacionesUnidad = cotizacionesFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const flujoUnidad = flujoFiltrado.filter((item) => unidadRegistro(item) === unidad);

      const ventas =
        sumar(cobrosUnidad, ventaRegistro) ||
        sumar(pedidosUnidad, ventaRegistro) ||
        sumar(cotizacionesUnidad, ventaRegistro);
      const comprasTotal = sumar(comprasUnidad, compraRegistro);
      const costosProduccion = sumar(produccionUnidad, costoProduccionRegistro);
      const cobrado = sumar(cobrosUnidad, cobroRegistro);
      const cuentasCobrar = sumar(cxcUnidad, saldoRegistro) + sumar(cobrosUnidad, saldoRegistro);
      const cuentasPagar = sumar(cxpUnidad, saldoRegistro);
      const ingresosCaja = sumar(flujoUnidad.filter(esIngresoCaja), montoFlujoCaja);
      const egresosCaja = sumar(flujoUnidad.filter(esEgresoCaja), montoFlujoCaja);
      const cajaNeta = ingresosCaja - egresosCaja;
      const activoCorriente = cajaNeta + cobrado + cuentasCobrar;
      const pasivoCorriente = cuentasPagar;
      const utilidadBruta = ventas - costosProduccion;
      const utilidadNeta = ventas - comprasTotal - costosProduccion - cuentasPagar;
      const patrimonioEstimado = activoCorriente - pasivoCorriente;
      const liquidez = pasivoCorriente > 0 ? activoCorriente / pasivoCorriente : activoCorriente > 0 ? 99 : 0;
      const endeudamiento = activoCorriente > 0 ? (pasivoCorriente / activoCorriente) * 100 : 0;
      const rentabilidad = ventas > 0 ? (utilidadNeta / ventas) * 100 : 0;

      return {
        unidad,
        ventas,
        compras: comprasTotal,
        costosProduccion,
        cobrado,
        cuentasCobrar,
        cuentasPagar,
        ingresosCaja,
        egresosCaja,
        cajaNeta,
        activoCorriente,
        pasivoCorriente,
        utilidadBruta,
        utilidadNeta,
        patrimonioEstimado,
        liquidez,
        endeudamiento,
        rentabilidad,
      };
    }).filter((item) => filtros.unidadNegocio === 'Todas' || item.unidad === filtros.unidadNegocio);

    const totales = unidades.reduce(
      (acc, item) => ({
        ventas: acc.ventas + item.ventas,
        compras: acc.compras + item.compras,
        costosProduccion: acc.costosProduccion + item.costosProduccion,
        cobrado: acc.cobrado + item.cobrado,
        cuentasCobrar: acc.cuentasCobrar + item.cuentasCobrar,
        cuentasPagar: acc.cuentasPagar + item.cuentasPagar,
        ingresosCaja: acc.ingresosCaja + item.ingresosCaja,
        egresosCaja: acc.egresosCaja + item.egresosCaja,
        cajaNeta: acc.cajaNeta + item.cajaNeta,
        activoCorriente: acc.activoCorriente + item.activoCorriente,
        pasivoCorriente: acc.pasivoCorriente + item.pasivoCorriente,
        utilidadBruta: acc.utilidadBruta + item.utilidadBruta,
        utilidadNeta: acc.utilidadNeta + item.utilidadNeta,
        patrimonioEstimado: acc.patrimonioEstimado + item.patrimonioEstimado,
      }),
      {
        ventas: 0,
        compras: 0,
        costosProduccion: 0,
        cobrado: 0,
        cuentasCobrar: 0,
        cuentasPagar: 0,
        ingresosCaja: 0,
        egresosCaja: 0,
        cajaNeta: 0,
        activoCorriente: 0,
        pasivoCorriente: 0,
        utilidadBruta: 0,
        utilidadNeta: 0,
        patrimonioEstimado: 0,
      }
    );

    totales.liquidez = totales.pasivoCorriente > 0 ? totales.activoCorriente / totales.pasivoCorriente : totales.activoCorriente > 0 ? 99 : 0;
    totales.endeudamiento = totales.activoCorriente > 0 ? (totales.pasivoCorriente / totales.activoCorriente) * 100 : 0;
    totales.rentabilidad = totales.ventas > 0 ? (totales.utilidadNeta / totales.ventas) * 100 : 0;

    return { unidades, totales };
  }, [compras, cobros, cuentasPorCobrar, cuentasPorPagar, produccion, pedidos, cotizaciones, flujoCaja, filtros]);

  const saludFinanciera = (() => {
    if (datos.totales.liquidez >= 1.5 && datos.totales.rentabilidad >= 20 && datos.totales.endeudamiento <= 40) return 'Salud financiera fuerte';
    if (datos.totales.liquidez >= 1 && datos.totales.rentabilidad >= 0 && datos.totales.endeudamiento <= 70) return 'Salud financiera estable';
    return 'Requiere atenciÃ³n financiera';
  })();

  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <h2 style={styles.title}>Estado Financiero Corporativo</h2>
        <p style={styles.subtitle}>
          FASE 6.5 estabilizada Â· Activos, pasivos, utilidad, liquidez, endeudamiento y rentabilidad por unidad.
        </p>
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
        <div style={styles.stat}><span style={styles.statLabel}>Activos corrientes</span><strong style={styles.statValue}>{moneda(datos.totales.activoCorriente)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Pasivos corrientes</span><strong style={styles.statValue}>{moneda(datos.totales.pasivoCorriente)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Patrimonio estimado</span><strong style={datos.totales.patrimonioEstimado >= 0 ? styles.positive : styles.negative}>{moneda(datos.totales.patrimonioEstimado)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas</span><strong style={styles.statValue}>{moneda(datos.totales.ventas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad bruta</span><strong style={datos.totales.utilidadBruta >= 0 ? styles.positive : styles.negative}>{moneda(datos.totales.utilidadBruta)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad neta</span><strong style={datos.totales.utilidadNeta >= 0 ? styles.positive : styles.negative}>{moneda(datos.totales.utilidadNeta)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Liquidez</span><strong style={styles.statValue}>{numero(datos.totales.liquidez).toFixed(2)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Endeudamiento</span><strong style={datos.totales.endeudamiento <= 40 ? styles.positive : datos.totales.endeudamiento <= 70 ? styles.warning : styles.negative}>{porcentaje(datos.totales.endeudamiento)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Rentabilidad</span><strong style={datos.totales.rentabilidad >= 0 ? styles.positive : styles.negative}>{porcentaje(datos.totales.rentabilidad)}</strong></div>
      </section>

      <section style={styles.grid2}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Lectura ejecutiva</h3>
          <p style={styles.muted}><strong>Salud:</strong> {saludFinanciera}</p>
          <p style={styles.muted}>Liquidez superior a 1 indica capacidad para cubrir obligaciones corrientes con activos corrientes registrados.</p>
          <p style={styles.muted}>Endeudamiento alto indica presiÃ³n de cuentas por pagar frente a la caja, cobros y cuentas por cobrar.</p>
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Flujo operativo</h3>
          <p style={styles.muted}><strong>Ingresos caja:</strong> {moneda(datos.totales.ingresosCaja)}</p>
          <p style={styles.muted}><strong>Egresos caja:</strong> {moneda(datos.totales.egresosCaja)}</p>
          <p style={styles.muted}><strong>Caja neta:</strong> {moneda(datos.totales.cajaNeta)}</p>
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Estado financiero por unidad</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Unidad</th>
                <th style={styles.th}>Activos</th>
                <th style={styles.th}>Pasivos</th>
                <th style={styles.th}>Patrimonio</th>
                <th style={styles.th}>Ventas</th>
                <th style={styles.th}>Compras</th>
                <th style={styles.th}>Costos prod.</th>
                <th style={styles.th}>Utilidad bruta</th>
                <th style={styles.th}>Utilidad neta</th>
                <th style={styles.th}>Liquidez</th>
                <th style={styles.th}>Endeudamiento</th>
                <th style={styles.th}>Rentabilidad</th>
              </tr>
            </thead>
            <tbody>
              {datos.unidades.map((item) => (
                <tr key={item.unidad}>
                  <td style={styles.td}><span style={styles.badge}>{item.unidad}</span></td>
                  <td style={styles.td}>{moneda(item.activoCorriente)}</td>
                  <td style={styles.td}>{moneda(item.pasivoCorriente)}</td>
                  <td style={{ ...styles.td, ...(item.patrimonioEstimado >= 0 ? styles.positive : styles.negative) }}>{moneda(item.patrimonioEstimado)}</td>
                  <td style={styles.td}>{moneda(item.ventas)}</td>
                  <td style={styles.td}>{moneda(item.compras)}</td>
                  <td style={styles.td}>{moneda(item.costosProduccion)}</td>
                  <td style={{ ...styles.td, ...(item.utilidadBruta >= 0 ? styles.positive : styles.negative) }}>{moneda(item.utilidadBruta)}</td>
                  <td style={{ ...styles.td, ...(item.utilidadNeta >= 0 ? styles.positive : styles.negative) }}>{moneda(item.utilidadNeta)}</td>
                  <td style={styles.td}>{numero(item.liquidez).toFixed(2)}</td>
                  <td style={styles.td}>{porcentaje(item.endeudamiento)}</td>
                  <td style={styles.td}>{porcentaje(item.rentabilidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

