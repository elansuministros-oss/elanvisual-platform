import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const fechaActual = () => new Date().toISOString().slice(0, 10);

export default function Pedidos() {
  const {
    cotizaciones,
    pedidos,
    crearPedidoDesdeCotizacion,
    actualizarPedido,
    crearOrdenDesdePedido,
  } = useElan();

  const [cotizacionId, setCotizacionId] = useState('');
  const [anticipo, setAnticipo] = useState('');
  const [notas, setNotas] = useState('');

  const resumen = useMemo(() => {
    const totalVentas = pedidos.reduce(
      (acc, item) => acc + Number(item.total || 0),
      0
    );

    const totalPagado = pedidos.reduce(
      (acc, item) => acc + Number(item.pagado || item.anticipo || 0),
      0
    );

    return {
      totalPedidos: pedidos.length,
      totalVentas,
      totalPagado,
      saldo: totalVentas - totalPagado,
    };
  }, [pedidos]);

  const generarPedido = (e) => {
    e.preventDefault();
    if (!cotizacionId) return;

    crearPedidoDesdeCotizacion(cotizacionId, {
      anticipo: Number(anticipo || 0),
      notas,
      fechaPedido: fechaActual(),
    });

    setCotizacionId('');
    setAnticipo('');
    setNotas('');
  };

  const cambiarEstado = (pedido, estado) => {
    actualizarPedido(pedido.id, { estado });
  };

  const generarOT = (pedido) => {
    crearOrdenDesdePedido(pedido.id, {
      responsable: '',
      prioridad: 'Normal',
      instrucciones: pedido.notas || '',
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Pedidos</h2>
          <p>Pedidos generados desde cotizaciones aprobadas.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Total pedidos</span>
          <strong>{resumen.totalPedidos}</strong>
        </div>

        <div className="crm-card">
          <span>Ventas</span>
          <strong>C$ {resumen.totalVentas.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Pagado / anticipos</span>
          <strong>C$ {resumen.totalPagado.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Saldo</span>
          <strong>C$ {resumen.saldo.toFixed(2)}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={generarPedido}>
        <h3>Crear pedido desde cotización</h3>

        <div className="form-grid">
          <label>
            Cotización
            <select
              value={cotizacionId}
              onChange={(e) => setCotizacionId(e.target.value)}
            >
              <option value="">Seleccionar cotización</option>
              {cotizaciones.map((cotizacion) => (
                <option key={cotizacion.id} value={cotizacion.id}>
                  {cotizacion.codigo || cotizacion.id} -{' '}
                  {cotizacion.clienteNombre || cotizacion.cliente || 'Sin cliente'} - C${' '}
                  {Number(cotizacion.total || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Anticipo
            <input
              type="number"
              value={anticipo}
              onChange={(e) => setAnticipo(e.target.value)}
              placeholder="0.00"
            />
          </label>
        </div>

        <label>
          Notas
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows="3"
            placeholder="Instrucciones internas del pedido"
          />
        </label>

        <div className="form-actions">
          <button type="submit">Crear pedido</button>
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>OT</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="8">No hay pedidos registrados.</td>
              </tr>
            ) : (
              pedidos.map((pedido) => {
                const pagado = Number(pedido.pagado || pedido.anticipo || 0);
                const total = Number(pedido.total || 0);
                const saldo = Number(pedido.saldo ?? total - pagado);

                return (
                  <tr key={pedido.id}>
                    <td>{pedido.codigo}</td>
                    <td>{pedido.clienteNombre || pedido.cliente || 'Sin cliente'}</td>
                    <td>C$ {total.toFixed(2)}</td>
                    <td>C$ {pagado.toFixed(2)}</td>
                    <td>C$ {saldo.toFixed(2)}</td>
                    <td>{pedido.estado || 'Nuevo'}</td>
                    <td>{pedido.ordenId ? 'Generada' : 'Pendiente'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(pedido, 'Aprobado')}
                      >
                        Aprobar
                      </button>

                      <button
                        type="button"
                        onClick={() => generarOT(pedido)}
                        disabled={Boolean(pedido.ordenId)}
                      >
                        Crear OT
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}