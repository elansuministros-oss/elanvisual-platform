import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
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
  const historialTotal = historial.reduce(
    (total, pago) => total + Number(pago?.montoUSD || pago?.monto || 0),
    0
  );
  return historialTotal || Number(pedido?.anticipoRecibido || pedido?.pagos?.pagadoUSD || 0);
};

export default function PedidosVendedorSeguro() {
  const { usuario, pedidos = [] } = useApp();
  const propios = useMemo(() => filterForSeller(pedidos, usuario), [pedidos, usuario]);

  return (
    <main style={{ padding: '20px', maxWidth: '760px', margin: '0 auto' }}>
      <header style={{ marginBottom: '18px' }}>
        <h1 style={{ marginBottom: '6px' }}>Mis pedidos</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Solo aparecen pedidos y órdenes vinculados explícitamente a tu identidad de vendedor.
        </p>
      </header>

      {!propios.length ? (
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '28px', textAlign: 'center' }}>
          <ClipboardList size={34} style={{ margin: '0 auto 10px' }} />
          <h2 style={{ margin: '0 0 8px' }}>No tenés pedidos asignados</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Cuando una venta tuya genere un pedido u OT, aparecerá aquí automáticamente.
          </p>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {propios.map((pedido) => {
            const total = totalPedido(pedido);
            const pagado = pagadoPedido(pedido);
            const saldo = Math.max(total - pagado, 0);
            return (
              <article key={pedido.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '18px' }}>
                <strong>{pedido.numeroPedido || pedido.numero || pedido.numeroOT || 'Pedido'}</strong>
                <p style={{ margin: '6px 0 12px', color: '#475569' }}>
                  {pedido.cliente?.empresa || pedido.cliente?.nombre || pedido.cliente?.contacto || 'Cliente'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div><small>Total</small><b style={{ display: 'block' }}>{money(total)}</b></div>
                  <div><small>Pagado</small><b style={{ display: 'block' }}>{money(pagado)}</b></div>
                  <div><small>Saldo</small><b style={{ display: 'block' }}>{money(saldo)}</b></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
