import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  OTResumen,
  OTComercial,
  OTCompras,
  OTProduccion,
  OTCostos,
  OTRentabilidad,
  OTDocumentos,
  OTIA,
} from '../components/ot';

const n = (v) => Number(v || 0);

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n(v));

const getTotal = (pedido) => n(pedido?.resumen?.total || pedido?.total);

const getAnticipo = (pedido) => {
  const historial = Array.isArray(pedido?.pagos?.historial)
    ? pedido.pagos.historial
    : [];

  return historial.reduce(
    (total, pago) => total + n(pago.montoUSD || pago.monto || 0),
    0
  );
};

const getSaldo = (pedido) => Math.max(getTotal(pedido) - getAnticipo(pedido), 0);

const getOT = (pedido) =>
  pedido?.numeroOT ||
  pedido?.ordenTrabajo?.codigoOT ||
  `OT-${String(pedido?.id || '').slice(-6)}`;

const tabs = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'compras', label: 'Compras' },
  { id: 'produccion', label: 'Producción' },
  { id: 'costos', label: 'Costos' },
  { id: 'rentabilidad', label: 'Rentabilidad' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'ia', label: 'IA' },
];

export default function OrdenTrabajo() {
  const { usuario, pedidos = [], actualizarPedido } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [pedidoActivoId, setPedidoActivoId] = useState('');
  const [tab, setTab] = useState('resumen');

  const tieneAcceso =
    usuario?.rol === 'admin' ||
    usuario?.rol === 'ventas' ||
    usuario?.rol === 'produccion';

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();

    return pedidos.filter((pedido) => {
      const texto = `
        ${pedido.numeroPedido || pedido.numero || ''}
        ${getOT(pedido)}
        ${pedido.cliente?.empresa || ''}
        ${pedido.cliente?.nombre || ''}
        ${pedido.cliente?.contacto || ''}
        ${pedido.estado || ''}
      `.toLowerCase();

      return texto.includes(q);
    });
  }, [pedidos, busqueda]);

  const pedidoActivo = useMemo(() => {
    return pedidos.find((pedido) => String(pedido.id) === String(pedidoActivoId)) || null;
  }, [pedidos, pedidoActivoId]);

  if (!tieneAcceso) {
    return (
      <main className="page-shell">
        <section className="card">
          <h1>Orden de Trabajo</h1>
          <p>No tenés acceso a este módulo.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">AI-10</p>
          <h1>Orden de Trabajo</h1>
          <p>Arquitectura modular OT: Comercial, Compras, Producción, Costos, Rentabilidad, Documentos e IA.</p>
        </div>
      </section>

      <section className="card">
        <label>
          Buscar pedido u OT
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Cliente, pedido, OT, estado..."
          />
        </label>

        <div className="ot-list">
          {pedidosFiltrados.map((pedido) => (
            <button
              key={pedido.id}
              type="button"
              className={String(pedido.id) === String(pedidoActivoId) ? 'active' : ''}
              onClick={() => setPedidoActivoId(pedido.id)}
            >
              <strong>{getOT(pedido)}</strong>
              <span>{pedido.cliente?.empresa || pedido.cliente?.nombre || 'Cliente sin nombre'}</span>
              <small>Total {money(getTotal(pedido))} · Saldo {money(getSaldo(pedido))}</small>
            </button>
          ))}

          {pedidosFiltrados.length === 0 && (
            <p>No hay pedidos que coincidan con la búsqueda.</p>
          )}
        </div>
      </section>

      {pedidoActivo && (
        <>
          <nav className="ot-tabs">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? 'active' : ''}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {tab === 'resumen' && <OTResumen pedido={pedidoActivo} />}
          {tab === 'comercial' && <OTComercial pedido={pedidoActivo} actualizarPedido={actualizarPedido} />}
          {tab === 'compras' && <OTCompras pedido={pedidoActivo} actualizarPedido={actualizarPedido} />}
          {tab === 'produccion' && <OTProduccion pedido={pedidoActivo} />}
          {tab === 'costos' && <OTCostos pedido={pedidoActivo} />}
          {tab === 'rentabilidad' && <OTRentabilidad pedido={pedidoActivo} />}
          {tab === 'documentos' && <OTDocumentos pedido={pedidoActivo} />}
          {tab === 'ia' && <OTIA pedido={pedidoActivo} />}
        </>
      )}
    </main>
  );
}


