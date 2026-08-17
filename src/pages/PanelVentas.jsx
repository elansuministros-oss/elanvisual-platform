import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { filterForSeller } from '../services/sellerOwnership';

const money = (value) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const totalPedido = (pedido) => Number(pedido?.resumen?.total || pedido?.total || 0);
const pagadoPedido = (pedido) => {
  const historial = Array.isArray(pedido?.pagos?.historial) ? pedido.pagos.historial : [];
  const totalHistorial = historial.reduce(
    (total, pago) => total + Number(pago?.montoUSD || pago?.monto || 0),
    0
  );
  return totalHistorial || Number(pedido?.anticipoRecibido || pedido?.pagos?.pagadoUSD || 0);
};

const comisionPedido = (pedido) => Number(
  pedido?.comision?.comisionVendedor ??
  pedido?.comisiones?.comisionVendedor ??
  pedido?.comisionVendedor ??
  0
);

const comisionPagada = (pedido) => {
  const pagada = pedido?.comision?.pagada ?? pedido?.comisiones?.pagada ?? pedido?.comisionPagada;
  return pagada ? comisionPedido(pedido) : 0;
};

const accesos = [
  { id: 'clientes', titulo: 'Clientes', descripcion: 'Ver y gestionar mis clientes.' },
  { id: 'capturaInteligente', titulo: 'Captura Inteligente', descripcion: 'Registrar cliente nuevo rápidamente.' },
  { id: 'aiStudio', titulo: 'AI Studio', descripcion: 'Conversar con IA, crear proyectos y generar borradores de cotización.' },
  { id: 'cotizador', titulo: 'Cotizador', descripcion: 'Cotizar con precios autorizados del sistema.' },
  { id: 'pedidos', titulo: 'Pedidos', descripcion: 'Consultar únicamente mis pedidos y OT.' },
  { id: 'seguimiento', titulo: 'Seguimiento', descripcion: 'Ver avances comerciales.' },
];

export default function PanelVentas({ setPage }) {
  const { usuario, pedidos = [] } = useApp();
  const propios = useMemo(() => filterForSeller(pedidos, usuario), [pedidos, usuario]);

  const resumen = useMemo(() => {
    const ventas = propios.reduce((suma, pedido) => suma + totalPedido(pedido), 0);
    const cobrado = propios.reduce((suma, pedido) => suma + pagadoPedido(pedido), 0);
    const comision = propios.reduce((suma, pedido) => suma + comisionPedido(pedido), 0);
    const pagada = propios.reduce((suma, pedido) => suma + comisionPagada(pedido), 0);
    return {
      ventas,
      cobrado,
      saldo: Math.max(ventas - cobrado, 0),
      comision,
      pagada,
      pendiente: Math.max(comision - pagada, 0),
      pedidos: propios.length,
    };
  }, [propios]);

  const metricas = [
    ['Ventas propias', money(resumen.ventas)],
    ['Cobrado', money(resumen.cobrado)],
    ['Saldo clientes', money(resumen.saldo)],
    ['Comisión estimada', money(resumen.comision)],
    ['Comisión pagada', money(resumen.pagada)],
    ['Comisión pendiente', money(resumen.pendiente)],
  ];

  return (
    <main style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.75rem, 6vw, 2.35rem)' }}>Panel Comercial</h2>
        <p style={{ margin: '0.65rem 0 0', lineHeight: 1.45 }}>
          Tus clientes, cotizaciones, pedidos, ventas y comisiones. Solo información vinculada a tu cuenta.
        </p>
      </header>

      <section aria-label="Mis resultados" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.7rem' }}>
          <h3 style={{ margin: 0 }}>Mis resultados</h3>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{resumen.pedidos} pedido{resumen.pedidos === 1 ? '' : 's'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem' }}>
          {metricas.map(([label, value]) => (
            <article key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '0.9rem' }}>
              <small style={{ display: 'block', color: '#64748b', marginBottom: '0.25rem' }}>{label}</small>
              <strong style={{ display: 'block', fontSize: '1.05rem' }}>{value}</strong>
            </article>
          ))}
        </div>
        {!propios.length && (
          <p style={{ margin: '0.75rem 0 0', color: '#64748b' }}>
            Tu cuenta todavía no tiene ventas, pedidos ni comisiones registradas.
          </p>
        )}
      </section>

      <section aria-label="Accesos comerciales" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '0.8rem', width: '100%' }}>
        {accesos.map((acceso) => (
          <button
            key={acceso.id}
            type="button"
            onClick={() => setPage(acceso.id)}
            style={{
              width: '100%', minHeight: 92, margin: 0, padding: '1.15rem 1.25rem', border: 0,
              borderRadius: 20, background: 'var(--azul, #111827)', color: '#fff', display: 'grid',
              gridTemplateColumns: 'minmax(120px, 0.42fr) minmax(0, 0.58fr)', alignItems: 'center', gap: '1rem',
              textAlign: 'left', boxSizing: 'border-box', cursor: 'pointer',
            }}
          >
            <strong style={{ fontSize: '1.08rem', lineHeight: 1.2 }}>{acceso.titulo}</strong>
            <span style={{ fontSize: '0.98rem', lineHeight: 1.35, opacity: 0.96 }}>{acceso.descripcion}</span>
          </button>
        ))}
      </section>
    </main>
  );
}
