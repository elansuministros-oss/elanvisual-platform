import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

export default function Comisiones() {
  const { comisiones, pedidos, crearComisionDesdePedido } = useElan();

  const [pedidoId, setPedidoId] = useState('');
  const [porcentaje, setPorcentaje] = useState('10');

  const resumen = useMemo(() => {
    const total = comisiones.reduce(
      (acc, item) => acc + Number(item.monto || item.comision || 0),
      0
    );

    const pendientes = comisiones.filter(
      (item) => item.estado === 'Pendiente'
    ).length;

    return {
      registros: comisiones.length,
      total,
      pendientes,
    };
  }, [comisiones]);

  const generar = (e) => {
    e.preventDefault();

    if (!pedidoId) return;

    crearComisionDesdePedido(pedidoId, {
      porcentaje: Number(porcentaje || 10),
      estado: 'Pendiente',
    });

    setPedidoId('');
    setPorcentaje('10');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Comisiones</h2>
          <p>Control de comisiones generadas desde pedidos aprobados.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Registros</span>
          <strong>{resumen.registros}</strong>
        </div>

        <div className="crm-card">
          <span>Total comisiones</span>
          <strong>C$ {resumen.total.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={generar}>
        <h3>Generar comisión desde pedido</h3>

        <div className="form-grid">
          <label>
            Pedido
            <select
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
            >
              <option value="">Seleccionar pedido</option>
              {pedidos.map((pedido) => (
                <option key={pedido.id} value={pedido.id}>
                  {pedido.codigo || pedido.id} -{' '}
                  {pedido.clienteNombre || pedido.cliente || 'Sin cliente'} - C${' '}
                  {Number(pedido.total || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Porcentaje
            <input
              type="number"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit">Generar comisión</button>
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Pedido</th>
              <th>Vendedor</th>
              <th>Cliente</th>
              <th>Base</th>
              <th>%</th>
              <th>Comisión</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {comisiones.length === 0 ? (
              <tr>
                <td colSpan="8">No hay comisiones registradas.</td>
              </tr>
            ) : (
              comisiones.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo}</td>
                  <td>{item.pedidoId}</td>
                  <td>{item.vendedorId || 'Sin vendedor'}</td>
                  <td>{item.clienteNombre || 'Sin cliente'}</td>
                  <td>C$ {Number(item.base || 0).toFixed(2)}</td>
                  <td>{Number(item.porcentaje || 0).toFixed(2)}%</td>
                  <td>C$ {Number(item.monto || 0).toFixed(2)}</td>
                  <td>{item.estado || 'Pendiente'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}