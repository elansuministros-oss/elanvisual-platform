import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const fechaActual = () => new Date().toISOString().slice(0, 10);

export default function OrdenesTrabajo() {
  const {
    pedidos,
    ordenes,
    crearOrdenDesdePedido,
    actualizarOrden,
    crearProduccionDesdeOT,
  } = useElan();

  const [pedidoId, setPedidoId] = useState('');
  const [responsable, setResponsable] = useState('');
  const [prioridad, setPrioridad] = useState('Normal');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  const resumen = useMemo(() => {
    return {
      total: ordenes.length,
      pendientes: ordenes.filter((x) => x.estado === 'Pendiente').length,
      produccion: ordenes.filter((x) => x.estado === 'En producción').length,
      terminadas: ordenes.filter((x) => x.estado === 'Terminada').length,
    };
  }, [ordenes]);

  const crearOT = (e) => {
    e.preventDefault();
    if (!pedidoId) return;

    crearOrdenDesdePedido(pedidoId, {
      responsable,
      prioridad,
      fechaEntrega,
      instrucciones,
      fechaInicio: fechaActual(),
    });

    setPedidoId('');
    setResponsable('');
    setPrioridad('Normal');
    setFechaEntrega('');
    setInstrucciones('');
  };

  const enviarProduccion = (orden) => {
    crearProduccionDesdeOT(orden.id, {
      responsable: orden.responsable || '',
      avance: 0,
      observaciones: orden.instrucciones || '',
    });
  };

  const cambiarEstado = (orden, estado) => {
    actualizarOrden(orden.id, { estado });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Órdenes de Trabajo</h2>
          <p>Control interno de trabajos aprobados para producción.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Total OT</span>
          <strong>{resumen.total}</strong>
        </div>

        <div className="crm-card">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </div>

        <div className="crm-card">
          <span>En producción</span>
          <strong>{resumen.produccion}</strong>
        </div>

        <div className="crm-card">
          <span>Terminadas</span>
          <strong>{resumen.terminadas}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={crearOT}>
        <h3>Crear orden desde pedido</h3>

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
                  {pedido.clienteNombre || pedido.cliente || 'Sin cliente'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Responsable
            <input
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Diseño / Producción / Instalación"
            />
          </label>

          <label>
            Prioridad
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
            >
              <option>Normal</option>
              <option>Alta</option>
              <option>Urgente</option>
              <option>Baja</option>
            </select>
          </label>

          <label>
            Fecha entrega
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
          </label>
        </div>

        <label>
          Instrucciones de producción
          <textarea
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            rows="3"
            placeholder="Materiales, medidas, instalación, observaciones del cliente"
          />
        </label>

        <div className="form-actions">
          <button type="submit">Crear OT</button>
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Pedido</th>
              <th>Responsable</th>
              <th>Prioridad</th>
              <th>Entrega</th>
              <th>Estado</th>
              <th>Producción</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ordenes.length === 0 ? (
              <tr>
                <td colSpan="9">No hay órdenes de trabajo registradas.</td>
              </tr>
            ) : (
              ordenes.map((orden) => (
                <tr key={orden.id}>
                  <td>{orden.codigo}</td>
                  <td>{orden.clienteNombre || 'Sin cliente'}</td>
                  <td>{orden.pedidoId}</td>
                  <td>{orden.responsable || 'Sin asignar'}</td>
                  <td>{orden.prioridad || 'Normal'}</td>
                  <td>{orden.fechaEntrega || 'Sin fecha'}</td>
                  <td>{orden.estado || 'Pendiente'}</td>
                  <td>{orden.produccionId ? 'Creada' : 'Pendiente'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(orden, 'En proceso')}
                    >
                      Proceso
                    </button>

                    <button
                      type="button"
                      onClick={() => enviarProduccion(orden)}
                      disabled={Boolean(orden.produccionId)}
                    >
                      Producción
                    </button>

                    <button
                      type="button"
                      onClick={() => cambiarEstado(orden, 'Terminada')}
                    >
                      Terminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}