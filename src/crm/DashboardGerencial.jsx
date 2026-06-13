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

const fmt = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 2,
  }).format(numero(valor));

const unidades = [
  'Corporativo',
  'ELANPET',
  'ELANKAV VISUAL',
  'ELANKAV CENTER',
  'ELANKAV SOLAR',
  'ELAN AI',
];

const unidadDe = (item = {}) =>
  item.unidadNegocio || item.unidad || item.area || 'Corporativo';

const tarjeta = {
  background: '#fff',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 10px 24px rgba(15,23,42,.08)',
  border: '1px solid #e5e7eb',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
};

const fila = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #eef2f7',
};

export default function DashboardGerencial() {
  const {
    cotizaciones = [],
    pedidos = [],
    compras = [],
    cobros = [],
    produccion = [],
    cuentasPorCobrar = [],
    cuentasPorPagar = [],
    notificacionesInternasCRM = [],
  } = useCore();

  const data = useMemo(() => {
    const ventas = [...cotizaciones, ...pedidos].reduce(
      (acc, item) => acc + montoRegistro(item),
      0
    );

    const cobrado = cobros.reduce(
      (acc, item) => acc + montoRegistro(item),
      0
    );

    const comprado = compras.reduce(
      (acc, item) => acc + montoRegistro(item),
      0
    );

    const costoProduccion = produccion.reduce(
      (acc, item) => acc + (numero(item.costoTotal) || montoRegistro(item)),
      0
    );

    const cxc = cuentasPorCobrar.reduce(
      (acc, item) => acc + (numero(item.saldo) || montoRegistro(item)),
      0
    );

    const cxp = cuentasPorPagar.reduce(
      (acc, item) => acc + (numero(item.saldo) || montoRegistro(item)),
      0
    );

    const utilidad = ventas - comprado - costoProduccion;
    const margen = ventas > 0 ? (utilidad / ventas) * 100 : 0;

    const ranking = unidades
      .map((unidad) => {
        const ventaUnidad = [...cotizaciones, ...pedidos]
          .filter((item) => unidadDe(item) === unidad)
          .reduce((acc, item) => acc + montoRegistro(item), 0);

        const compraUnidad = compras
          .filter((item) => unidadDe(item) === unidad)
          .reduce((acc, item) => acc + montoRegistro(item), 0);

        const produccionUnidad = produccion
          .filter((item) => unidadDe(item) === unidad)
          .reduce(
            (acc, item) => acc + (numero(item.costoTotal) || montoRegistro(item)),
            0
          );

        return {
          unidad,
          venta: ventaUnidad,
          utilidad: ventaUnidad - compraUnidad - produccionUnidad,
        };
      })
      .sort((a, b) => b.utilidad - a.utilidad);

    return {
      ventas,
      cobrado,
      comprado,
      costoProduccion,
      cxc,
      cxp,
      utilidad,
      margen,
      ranking,
    };
  }, [
    cotizaciones,
    pedidos,
    compras,
    cobros,
    produccion,
    cuentasPorCobrar,
    cuentasPorPagar,
  ]);

  const cards = [
    ['Ventas registradas', data.ventas],
    ['Cobros recibidos', data.cobrado],
    ['Compras', data.comprado],
    ['Costos producción', data.costoProduccion],
    ['Cuentas por cobrar', data.cxc],
    ['Cuentas por pagar', data.cxp],
    ['Utilidad estimada', data.utilidad],
    ['Margen', `${data.margen.toFixed(1)}%`],
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard Gerencial Corporativo</h2>

      <p style={{ color: '#6b7280' }}>
        Vista ejecutiva del estado operativo, financiero y comercial de ELANKAV GROUP.
      </p>

      <div style={grid}>
        {cards.map(([label, value]) => (
          <div key={label} style={tarjeta}>
            <strong>{label}</strong>
            <h3 style={{ margin: '10px 0 0' }}>
              {typeof value === 'number' ? fmt(value) : value}
            </h3>
          </div>
        ))}
      </div>

      <div style={{ ...tarjeta, marginTop: 18 }}>
        <h3>Ranking de unidades por utilidad</h3>

        {data.ranking.map((registro, index) => (
          <div key={registro.unidad} style={fila}>
            <span>
              {index + 1}. {registro.unidad}
            </span>
            <strong>{fmt(registro.utilidad)}</strong>
          </div>
        ))}
      </div>

      <div style={{ ...tarjeta, marginTop: 18 }}>
        <h3>Alertas recientes</h3>

        {(notificacionesInternasCRM || []).slice(0, 6).map((notificacion) => (
          <p key={notificacion.id}>
            🔔 {notificacion.titulo || notificacion.detalle}
          </p>
        ))}

        {(!notificacionesInternasCRM || notificacionesInternasCRM.length === 0) && (
          <p>Sin alertas internas pendientes.</p>
        )}
      </div>
    </div>
  );
}
