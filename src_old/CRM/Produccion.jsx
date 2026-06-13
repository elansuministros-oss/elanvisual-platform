import React, { useMemo } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

export default function Produccion() {
  const {
    producciones,
    actualizarProduccion,
    crearComisionDesdePedido,
  } = useElan();

  const resumen = useMemo(() => {
    return {
      total: producciones.length,
      cola: producciones.filter((x) => x.estado === 'En cola').length,
      proceso: producciones.filter((x) => x.estado === 'En proceso').length,
      terminadas: producciones.filter((x) => x.estado === 'Terminada').length,
      entregadas: producciones.filter((x) => x.estado === 'Entregada').length,
    };
  }, [producciones]);

  const cambiarEstado = (item, estado, avance) => {
    actualizarProduccion(item.id, {
      estado,
      avance: avance ?? item.avance ?? 0,
    });
  };

  const generarComision = (item) => {
    if (!item.pedidoId) return;

    crearComisionDesdePedido(item.pedidoId, {
      porcentaje: 10,
      estado: 'Pendiente',
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Producción</h2>
          <p>Seguimiento de fabricación, avance, entrega y cierre operativo.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Total</span>
          <strong>{resumen.total}</strong>
        </div>

        <div className="crm-card">
          <span>En cola</span>
          <strong>{resumen.cola}</strong>
        </div>

        <div className="crm-card">
          <span>En proceso</span>
          <strong>{resumen.proceso}</strong>
        </div>

        <div className="crm-card">
          <span>Terminadas</span>
          <strong>{resumen.terminadas}</strong>
        </div>

        <div className="crm-card">
          <span>Entregadas</span>
          <strong>{resumen.entregadas}</strong>
        </div>
      </div>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>OT</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th>Avance</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {producciones.length === 0 ? (
              <tr>
                <td colSpan="8">No hay trabajos en producción.</td>
              </tr>
            ) : (
              producciones.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo}</td>
                  <td>{item.clienteNombre || 'Sin cliente'}</td>
                  <td>{item.ordenId}</td>
                  <td>{item.responsable || 'Sin asignar'}</td>
                  <td>{item.estado || 'En cola'}</td>
                  <td>{Number(item.avance || 0)}%</td>
                  <td>{item.observaciones || '-'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(item, 'En proceso', 35)}
                    >
                      Proceso
                    </button>

                    <button
                      type="button"
                      onClick={() => cambiarEstado(item, 'Terminada', 100)}
                    >
                      Terminar
                    </button>

                    <button
                      type="button"
                      onClick={() => cambiarEstado(item, 'Entregada', 100)}
                    >
                      Entregar
                    </button>

                    <button
                      type="button"
                      onClick={() => generarComision(item)}
                    >
                      Comisión
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