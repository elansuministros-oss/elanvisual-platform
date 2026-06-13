import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const IVA = 0.15;

const UNIDADES_NEGOCIO = [
  'Todas',
  'ELANPET',
  'ELANKAV VISUAL',
  'ELANKAV CENTER',
  'ELANKAV SOLAR',
  'ELAN AI',
];

const numero = (valor) => {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
};

const moneda = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
  }).format(numero(valor));

const fechaRegistro = (item = {}) =>
  item.fecha ||
  item.fechaPago ||
  item.fechaCompra ||
  item.fechaFactura ||
  item.fechaVencimiento ||
  item.fechaRegistro ||
  item.createdAt ||
  item.actualizado ||
  '';

const normalizarFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha;
};

const dentroRango = (item, fechaInicio, fechaFin) => {
  const fecha = normalizarFecha(fechaRegistro(item));
  if (!fecha) return true;

  if (fechaInicio) {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    if (fecha < inicio) return false;
  }

  if (fechaFin) {
    const fin = new Date(`${fechaFin}T23:59:59`);
    if (fecha > fin) return false;
  }

  return true;
};

const unidadRegistro = (item = {}) => item.unidadNegocio || item.unidad || 'ELANKAV VISUAL';

const porUnidad = (item, unidad) => unidad === 'Todas' || unidadRegistro(item) === unidad;

const filtrarRegistros = (lista = [], filtros) =>
  lista.filter((item) => dentroRango(item, filtros.fechaInicio, filtros.fechaFin) && porUnidad(item, filtros.unidadNegocio));

const sumar = (lista = [], obtenerValor) =>
  lista.reduce((total, item) => total + numero(obtenerValor(item)), 0);

const esConIVA = (item = {}) => item.tipoFiscal === 'Con IVA' || item.facturaFiscal === 'Sí' || numero(item.ivaDebito || item.ivaCredito || item.iva) > 0;
const esSinFactura = (item = {}) => item.tipoFiscal === 'Sin factura' || item.facturaFiscal === 'No';
const esExento = (item = {}) => item.tipoFiscal === 'Exento';

const montoVenta = (item = {}) => numero(item.montoFactura || item.monto || item.total || item.importe || item.valor);
const montoCobrado = (item = {}) => numero(item.montoCobrado || item.abonado || item.pagado || item.monto || item.total);
const montoCompra = (item = {}) => numero(item.total || item.monto || item.importe || item.valor || item.subtotal);
const baseCompra = (item = {}) => numero(item.subtotal || item.baseImponible || item.monto || item.total);
const baseVenta = (item = {}) => numero(item.subtotal || item.baseImponible || item.montoFactura || item.monto || item.total);

const ivaDebito = (item = {}) => {
  if (!esConIVA(item)) return 0;
  if (item.ivaDebito !== undefined) return numero(item.ivaDebito);
  if (item.iva !== undefined) return numero(item.iva);
  return montoVenta(item) - montoVenta(item) / (1 + IVA);
};

const ivaCredito = (item = {}) => {
  if (!esConIVA(item)) return 0;
  if (item.ivaCredito !== undefined) return numero(item.ivaCredito);
  if (item.iva !== undefined) return numero(item.iva);
  return baseCompra(item) * IVA;
};

const etiquetaPeriodo = (filtros) => {
  if (filtros.fechaInicio && filtros.fechaFin) return `${filtros.fechaInicio} al ${filtros.fechaFin}`;
  if (filtros.fechaInicio) return `Desde ${filtros.fechaInicio}`;
  if (filtros.fechaFin) return `Hasta ${filtros.fechaFin}`;
  return 'Todos los registros';
};

const styles = {
  page: { display: 'grid', gap: 16 },
  header: {
    background: 'linear-gradient(135deg, #0f2f5f 0%, #123f7a 100%)',
    color: '#ffffff',
    borderRadius: 20,
    padding: 22,
    boxShadow: '0 10px 28px rgba(15, 47, 95, 0.22)',
  },
  pretitle: { margin: 0, fontSize: 12, fontWeight: 900, opacity: 0.78, letterSpacing: 1 },
  title: { margin: '6px 0 6px', fontSize: 28, lineHeight: 1.1 },
  subtitle: { margin: 0, opacity: 0.84, maxWidth: 860 },
  card: { background: '#ffffff', borderRadius: 18, padding: 18, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 },
  label: { display: 'grid', gap: 7, fontSize: 13, color: '#374151', fontWeight: 800 },
  input: { width: '100%', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: 12, boxSizing: 'border-box' },
  select: { width: '100%', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: 12, boxSizing: 'border-box', background: '#ffffff' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 },
  stat: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 15, boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)' },
  statLabel: { display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 900 },
  statValue: { display: 'block', marginTop: 7, fontSize: 22, color: '#111827', fontWeight: 950 },
  statHelp: { display: 'block', marginTop: 5, fontSize: 12, color: '#6b7280' },
  sectionTitle: { margin: '0 0 4px', color: '#111827' },
  sectionText: { margin: '0 0 14px', color: '#6b7280', fontSize: 13 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 1040 },
  th: { textAlign: 'left', padding: 11, background: '#f3f6fb', color: '#374151', fontSize: 12, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
  td: { padding: 11, borderBottom: '1px solid #e5e7eb', fontSize: 13, verticalAlign: 'top', whiteSpace: 'nowrap' },
  badge: { display: 'inline-flex', borderRadius: 999, padding: '5px 9px', fontWeight: 900, fontSize: 12, background: '#eef2ff', color: '#3730a3' },
  warning: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 16, padding: 14, fontSize: 13, lineHeight: 1.5 },
};

export default function FiscalCRM() {
  const {
    compras = [],
    cobros = [],
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

  const fiscal = useMemo(() => {
    const comprasFiltradas = filtrarRegistros(compras, filtros);
    const cobrosFiltrados = filtrarRegistros(cobros, filtros);
    const cxcFiltradas = filtrarRegistros(cuentasPorCobrar, filtros);
    const cxpFiltradas = filtrarRegistros(cuentasPorPagar, filtros);
    const flujoFiltrado = filtrarRegistros(flujoCaja, filtros);

    const ventasConIva = cobrosFiltrados.filter(esConIVA);
    const ventasSinFactura = cobrosFiltrados.filter(esSinFactura);
    const ventasExentas = cobrosFiltrados.filter(esExento);

    const comprasConIva = comprasFiltradas.filter(esConIVA);
    const comprasSinFactura = comprasFiltradas.filter(esSinFactura);
    const comprasExentas = comprasFiltradas.filter(esExento);

    const cxcConIva = cxcFiltradas.filter(esConIVA);
    const cxpConIva = cxpFiltradas.filter(esConIVA);

    const ingresosCaja = flujoFiltrado.filter((item) => item.tipo === 'Ingreso');
    const egresosCaja = flujoFiltrado.filter((item) => item.tipo === 'Egreso');

    const ventasGravadas = sumar(ventasConIva, montoVenta);
    const ventasNoDeclaradas = sumar(ventasSinFactura, montoVenta);
    const ventasExentasTotal = sumar(ventasExentas, montoVenta);
    const totalFacturado = sumar(cobrosFiltrados, montoVenta);
    const totalCobrado = sumar(cobrosFiltrados, montoCobrado);

    const comprasDeclaradas = sumar(comprasConIva, montoCompra);
    const comprasNoDeclaradas = sumar(comprasSinFactura, montoCompra);
    const comprasExentasTotal = sumar(comprasExentas, montoCompra);
    const totalCompras = sumar(comprasFiltradas, montoCompra);

    const debitoCobros = sumar(ventasConIva, ivaDebito);
    const debitoPendiente = sumar(cxcConIva, ivaDebito);
    const creditoCompras = sumar(comprasConIva, ivaCredito);
    const creditoPendiente = sumar(cxpConIva, ivaCredito);

    const retencionesCobros = sumar(cobrosFiltrados, (item) => item.retencionMonto);
    const retencionesCxc = sumar(cxcFiltradas, (item) => item.retencionMonto);
    const retencionesTotales = retencionesCobros + retencionesCxc;

    const ingresosNoOperativos = sumar(ingresosCaja, (item) => item.monto);
    const egresosNoOperativos = sumar(egresosCaja, (item) => item.monto);

    const ivaNetoCaja = debitoCobros - creditoCompras;
    const ivaNetoComprometido = debitoCobros + debitoPendiente - creditoCompras - creditoPendiente;

    const utilidadFiscal = ventasGravadas + ventasExentasTotal - comprasDeclaradas - comprasExentasTotal;
    const utilidadReal = totalFacturado + ingresosNoOperativos - totalCompras - egresosNoOperativos;
    const flujoReal = totalCobrado + ingresosNoOperativos - totalCompras - egresosNoOperativos;

    const unidades = UNIDADES_NEGOCIO.filter((u) => u !== 'Todas').map((unidad) => {
      const cobrosUnidad = cobrosFiltrados.filter((item) => unidadRegistro(item) === unidad);
      const comprasUnidad = comprasFiltradas.filter((item) => unidadRegistro(item) === unidad);
      const flujoUnidad = flujoFiltrado.filter((item) => unidadRegistro(item) === unidad);

      const ingresosUnidad = flujoUnidad.filter((item) => item.tipo === 'Ingreso');
      const egresosUnidad = flujoUnidad.filter((item) => item.tipo === 'Egreso');

      const ventasUnidad = sumar(cobrosUnidad, montoVenta);
      const comprasUnidadTotal = sumar(comprasUnidad, montoCompra);
      const ivaDebitoUnidad = sumar(cobrosUnidad.filter(esConIVA), ivaDebito);
      const ivaCreditoUnidad = sumar(comprasUnidad.filter(esConIVA), ivaCredito);
      const retencionesUnidad = sumar(cobrosUnidad, (item) => item.retencionMonto);

      return {
        unidad,
        ventas: ventasUnidad,
        compras: comprasUnidadTotal,
        ivaDebito: ivaDebitoUnidad,
        ivaCredito: ivaCreditoUnidad,
        ivaNeto: ivaDebitoUnidad - ivaCreditoUnidad,
        retenciones: retencionesUnidad,
        sinFactura: sumar(cobrosUnidad.filter(esSinFactura), montoVenta) + sumar(comprasUnidad.filter(esSinFactura), montoCompra),
        utilidadReal: ventasUnidad + sumar(ingresosUnidad, (item) => item.monto) - comprasUnidadTotal - sumar(egresosUnidad, (item) => item.monto),
      };
    });

    return {
      comprasFiltradas,
      cobrosFiltrados,
      cxcFiltradas,
      cxpFiltradas,
      flujoFiltrado,
      ventasGravadas,
      ventasNoDeclaradas,
      ventasExentasTotal,
      totalFacturado,
      totalCobrado,
      comprasDeclaradas,
      comprasNoDeclaradas,
      comprasExentasTotal,
      totalCompras,
      debitoCobros,
      debitoPendiente,
      creditoCompras,
      creditoPendiente,
      ivaNetoCaja,
      ivaNetoComprometido,
      retencionesCobros,
      retencionesCxc,
      retencionesTotales,
      utilidadFiscal,
      utilidadReal,
      flujoReal,
      ingresosNoOperativos,
      egresosNoOperativos,
      unidades,
    };
  }, [compras, cobros, cuentasPorCobrar, cuentasPorPagar, flujoCaja, filtros]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.pretitle}>FASE 5.2 · MÓDULO FISCAL CORPORATIVO</p>
        <h2 style={styles.title}>Fiscal CRM</h2>
        <p style={styles.subtitle}>
          Control separado entre declaración fiscal y realidad interna: IVA débito, IVA crédito,
          retenciones, facturación, compras sin factura y utilidad real por unidad de negocio.
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.grid}>
          <label style={styles.label}>
            Fecha inicio
            <input style={styles.input} type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={cambiar} />
          </label>

          <label style={styles.label}>
            Fecha fin
            <input style={styles.input} type="date" name="fechaFin" value={filtros.fechaFin} onChange={cambiar} />
          </label>

          <label style={styles.label}>
            Unidad de negocio
            <select style={styles.select} name="unidadNegocio" value={filtros.unidadNegocio} onChange={cambiar}>
              {UNIDADES_NEGOCIO.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>IVA débito cobrado</span><strong style={styles.statValue}>{moneda(fiscal.debitoCobros)}</strong><span style={styles.statHelp}>Ventas con IVA registradas en cobros.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA crédito compras</span><strong style={styles.statValue}>{moneda(fiscal.creditoCompras)}</strong><span style={styles.statHelp}>Compras con factura fiscal.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA neto caja</span><strong style={styles.statValue}>{moneda(fiscal.ivaNetoCaja)}</strong><span style={styles.statHelp}>Débito cobrado menos crédito de compras.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>Retenciones totales</span><strong style={styles.statValue}>{moneda(fiscal.retencionesTotales)}</strong><span style={styles.statHelp}>Cobros + cuentas por cobrar.</span></div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas gravadas</span><strong style={styles.statValue}>{moneda(fiscal.ventasGravadas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas sin factura</span><strong style={styles.statValue}>{moneda(fiscal.ventasNoDeclaradas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Ventas exentas</span><strong style={styles.statValue}>{moneda(fiscal.ventasExentasTotal)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Total facturado interno</span><strong style={styles.statValue}>{moneda(fiscal.totalFacturado)}</strong></div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Compras con factura</span><strong style={styles.statValue}>{moneda(fiscal.comprasDeclaradas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Compras sin factura</span><strong style={styles.statValue}>{moneda(fiscal.comprasNoDeclaradas)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Compras exentas</span><strong style={styles.statValue}>{moneda(fiscal.comprasExentasTotal)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Total compras internas</span><strong style={styles.statValue}>{moneda(fiscal.totalCompras)}</strong></div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>IVA débito pendiente</span><strong style={styles.statValue}>{moneda(fiscal.debitoPendiente)}</strong><span style={styles.statHelp}>CxC con IVA, aún no cobrada total o parcialmente.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA crédito pendiente</span><strong style={styles.statValue}>{moneda(fiscal.creditoPendiente)}</strong><span style={styles.statHelp}>CxP con factura fiscal pendiente.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>IVA neto comprometido</span><strong style={styles.statValue}>{moneda(fiscal.ivaNetoComprometido)}</strong><span style={styles.statHelp}>Incluye cobros, CxC, compras y CxP.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>Flujo real interno</span><strong style={styles.statValue}>{moneda(fiscal.flujoReal)}</strong><span style={styles.statHelp}>Cobrado + ingresos caja - compras - egresos caja.</span></div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad fiscal estimada</span><strong style={styles.statValue}>{moneda(fiscal.utilidadFiscal)}</strong><span style={styles.statHelp}>Solo operación con soporte fiscal o exenta.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>Utilidad real interna</span><strong style={styles.statValue}>{moneda(fiscal.utilidadReal)}</strong><span style={styles.statHelp}>Incluye movimientos con y sin factura.</span></div>
        <div style={styles.stat}><span style={styles.statLabel}>Ingresos caja extra</span><strong style={styles.statValue}>{moneda(fiscal.ingresosNoOperativos)}</strong></div>
        <div style={styles.stat}><span style={styles.statLabel}>Egresos caja extra</span><strong style={styles.statValue}>{moneda(fiscal.egresosNoOperativos)}</strong></div>
      </div>

      <div style={styles.warning}>
        <strong>Nota operativa:</strong> este módulo separa control fiscal y control real interno. Los valores son estimaciones administrativas del CRM; antes de declarar, deben compararse con facturas oficiales, retenciones emitidas por clientes y criterios del contador.
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Resumen fiscal por unidad</h3>
        <p style={styles.sectionText}>Periodo: {etiquetaPeriodo(filtros)} · Unidad seleccionada: {filtros.unidadNegocio}</p>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Unidad</th>
                <th style={styles.th}>Ventas</th>
                <th style={styles.th}>Compras</th>
                <th style={styles.th}>IVA débito</th>
                <th style={styles.th}>IVA crédito</th>
                <th style={styles.th}>IVA neto</th>
                <th style={styles.th}>Retenciones</th>
                <th style={styles.th}>Mov. sin factura</th>
                <th style={styles.th}>Utilidad real</th>
              </tr>
            </thead>
            <tbody>
              {fiscal.unidades.map((item) => (
                <tr key={item.unidad}>
                  <td style={styles.td}><span style={styles.badge}>{item.unidad}</span></td>
                  <td style={styles.td}>{moneda(item.ventas)}</td>
                  <td style={styles.td}>{moneda(item.compras)}</td>
                  <td style={styles.td}>{moneda(item.ivaDebito)}</td>
                  <td style={styles.td}>{moneda(item.ivaCredito)}</td>
                  <td style={styles.td}>{moneda(item.ivaNeto)}</td>
                  <td style={styles.td}>{moneda(item.retenciones)}</td>
                  <td style={styles.td}>{moneda(item.sinFactura)}</td>
                  <td style={styles.td}>{moneda(item.utilidadReal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Lectura rápida</h3>
        <p style={styles.sectionText}>
          IVA neto caja indica lo que ya se mueve con documentos registrados en cobros y compras.
          IVA neto comprometido agrega cuentas por cobrar y cuentas por pagar para anticipar carga fiscal futura.
          La utilidad fiscal excluye movimientos sin factura; la utilidad real interna sí los incluye para que el negocio no pierda control de dinero.
        </p>
      </div>
    </div>
  );
}
