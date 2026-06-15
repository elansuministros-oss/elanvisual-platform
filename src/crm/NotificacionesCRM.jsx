import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const formatearFecha = (valor) => {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
  return fecha.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const prioridadClase = (prioridad) => {
  if (prioridad === 'Alta') return 'alta';
  if (prioridad === 'Media') return 'media';
  return 'baja';
};

export default function NotificacionesCRM() {
  const {
    notificacionesInternasCRM = [],
    resumenNotificacionesCRM = { total: 0, noLeidas: 0, altaPrioridad: 0, porUnidad: {} },
    unidadesOficialesCRM = [],
    marcarNotificacionCRMLeida,
    archivarNotificacionCRM,
    marcarTodasNotificacionesCRMLeidas,
  } = useCore();

  const [filtros, setFiltros] = useState({
    unidad: 'Todas',
    modulo: 'Todos',
    prioridad: 'Todas',
    estado: 'Todas',
    busqueda: '',
  });

  const modulosDisponibles = useMemo(
    () => Array.from(new Set(notificacionesInternasCRM.map((item) => item.modulo).filter(Boolean))).sort(),
    [notificacionesInternasCRM]
  );

  const notificacionesFiltradas = useMemo(() => {
    const texto = filtros.busqueda.trim().toLowerCase();

    return notificacionesInternasCRM.filter((item) => {
      const coincideUnidad = filtros.unidad === 'Todas' || item.unidadNegocio === filtros.unidad;
      const coincideModulo = filtros.modulo === 'Todos' || item.modulo === filtros.modulo;
      const coincidePrioridad = filtros.prioridad === 'Todas' || item.prioridad === filtros.prioridad;
      const coincideEstado =
        filtros.estado === 'Todas' ||
        (filtros.estado === 'No leidas' && !item.leida) ||
        (filtros.estado === 'Leidas' && item.leida);
      const coincideBusqueda =
        !texto ||
        `${item.titulo} ${item.detalle} ${item.modulo} ${item.tipo} ${item.unidadNegocio}`
          .toLowerCase()
          .includes(texto);

      return coincideUnidad && coincideModulo && coincidePrioridad && coincideEstado && coincideBusqueda;
    });
  }, [filtros, notificacionesInternasCRM]);

  const resumenPorModulo = useMemo(() => {
    return notificacionesInternasCRM.reduce((acc, item) => {
      const modulo = item.modulo || 'Sistema';
      acc[modulo] = (acc[modulo] || 0) + 1;
      return acc;
    }, {});
  }, [notificacionesInternasCRM]);

  const cambiarFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="notificaciones-crm">
      <style>
        {`
          .notificaciones-crm {
            display: grid;
            gap: 18px;
          }

          .noti-header {
            background: linear-gradient(135deg, #102f5f, #1f5fad);
            color: #ffffff;
            border-radius: 20px;
            padding: 22px;
            box-shadow: 0 12px 28px rgba(15, 47, 95, 0.22);
          }

          .noti-header h2 {
            margin: 0;
            font-size: 24px;
          }

          .noti-header p {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.78);
          }

          .noti-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .noti-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
            border: 1px solid #e5e7eb;
          }

          .noti-card span {
            display: block;
            font-size: 12px;
            color: #6b7280;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .5px;
          }

          .noti-card strong {
            display: block;
            margin-top: 8px;
            font-size: 28px;
            color: #111827;
          }

          .noti-panel {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
            border: 1px solid #e5e7eb;
          }

          .noti-filtros {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
            align-items: end;
          }

          .noti-field label {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: #374151;
            margin-bottom: 6px;
          }

          .noti-field input,
          .noti-field select {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 10px 12px;
            outline: none;
            font: inherit;
            background: #ffffff;
          }

          .noti-actions {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            margin-top: 14px;
          }

          .noti-btn {
            border: 0;
            border-radius: 12px;
            padding: 10px 14px;
            cursor: pointer;
            font-weight: 800;
            background: #123f7a;
            color: #ffffff;
          }

          .noti-btn.secundario {
            background: #eef2ff;
            color: #1d4ed8;
          }

          .noti-lista {
            display: grid;
            gap: 12px;
          }

          .noti-item {
            background: #ffffff;
            border-radius: 18px;
            padding: 16px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
            display: grid;
            gap: 10px;
          }

          .noti-item.no-leida {
            border-left: 6px solid #1f5fad;
          }

          .noti-top {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
          }

          .noti-top h3 {
            margin: 0;
            color: #111827;
            font-size: 18px;
          }

          .noti-top p {
            margin: 6px 0 0;
            color: #4b5563;
            line-height: 1.45;
          }

          .noti-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .noti-badge {
            border-radius: 999px;
            padding: 6px 10px;
            background: #f3f4f6;
            color: #374151;
            font-size: 12px;
            font-weight: 800;
          }

          .noti-badge.alta {
            background: #fee2e2;
            color: #991b1b;
          }

          .noti-badge.media {
            background: #fef3c7;
            color: #92400e;
          }

          .noti-badge.baja {
            background: #dcfce7;
            color: #166534;
          }

          .noti-footer {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            border-top: 1px solid #f3f4f6;
            padding-top: 10px;
          }

          .noti-footer small {
            color: #6b7280;
            font-weight: 700;
          }

          .noti-empty {
            text-align: center;
            padding: 34px 18px;
            color: #6b7280;
          }

          @media (max-width: 1000px) {
            .noti-grid,
            .noti-filtros {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 640px) {
            .noti-grid,
            .noti-filtros {
              grid-template-columns: 1fr;
            }

            .noti-top,
            .noti-footer,
            .noti-actions {
              display: grid;
            }
          }
        `}
      </style>

      <section className="noti-header">
        <h2>ðŸ”” Notificaciones Internas</h2>
        <p>Centro automatico de alertas para cobros, pagos, produccion, ordenes, compras e inventario.</p>
      </section>

      <section className="noti-grid">
        <div className="noti-card">
          <span>Total alertas</span>
          <strong>{resumenNotificacionesCRM.total}</strong>
        </div>
        <div className="noti-card">
          <span>No leidas</span>
          <strong>{resumenNotificacionesCRM.noLeidas}</strong>
        </div>
        <div className="noti-card">
          <span>Alta prioridad</span>
          <strong>{resumenNotificacionesCRM.altaPrioridad}</strong>
        </div>
        <div className="noti-card">
          <span>Modulos con alerta</span>
          <strong>{Object.keys(resumenPorModulo).length}</strong>
        </div>
      </section>

      <section className="noti-panel">
        <div className="noti-filtros">
          <div className="noti-field">
            <label>Unidad</label>
            <select name="unidad" value={filtros.unidad} onChange={cambiarFiltro}>
              <option>Todas</option>
              {unidadesOficialesCRM.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </div>

          <div className="noti-field">
            <label>Modulo</label>
            <select name="modulo" value={filtros.modulo} onChange={cambiarFiltro}>
              <option>Todos</option>
              {modulosDisponibles.map((modulo) => (
                <option key={modulo} value={modulo}>{modulo}</option>
              ))}
            </select>
          </div>

          <div className="noti-field">
            <label>Prioridad</label>
            <select name="prioridad" value={filtros.prioridad} onChange={cambiarFiltro}>
              <option>Todas</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
          </div>

          <div className="noti-field">
            <label>Estado</label>
            <select name="estado" value={filtros.estado} onChange={cambiarFiltro}>
              <option>Todas</option>
              <option>No leidas</option>
              <option>Leidas</option>
            </select>
          </div>

          <div className="noti-field">
            <label>Buscar</label>
            <input
              name="busqueda"
              value={filtros.busqueda}
              onChange={cambiarFiltro}
              placeholder="Cliente, modulo, detalle..."
            />
          </div>
        </div>

        <div className="noti-actions">
          <strong>{notificacionesFiltradas.length} alerta(s) visibles</strong>
          <button type="button" className="noti-btn" onClick={marcarTodasNotificacionesCRMLeidas}>
            Marcar visibles como leidas
          </button>
        </div>
      </section>

      <section className="noti-lista">
        {notificacionesFiltradas.length === 0 ? (
          <div className="noti-panel noti-empty">
            <h3>Sin alertas activas</h3>
            <p>No hay notificaciones internas con los filtros seleccionados.</p>
          </div>
        ) : (
          notificacionesFiltradas.map((item) => (
            <article key={item.id} className={`noti-item ${item.leida ? '' : 'no-leida'}`}>
              <div className="noti-top">
                <div>
                  <h3>{item.titulo}</h3>
                  <p>{item.detalle}</p>
                </div>
                <span className={`noti-badge ${prioridadClase(item.prioridad)}`}>{item.prioridad}</span>
              </div>

              <div className="noti-badges">
                <span className="noti-badge">{item.tipo}</span>
                <span className="noti-badge">{item.modulo}</span>
                <span className="noti-badge">{item.unidadNegocio}</span>
                <span className="noti-badge">Fecha: {formatearFecha(item.fechaObjetivo)}</span>
                <span className="noti-badge">{item.leida ? 'Leida' : 'No leida'}</span>
              </div>

              <div className="noti-footer">
                <small>Accion sugerida: {item.accionSugerida}</small>
                <div className="noti-badges">
                  {!item.leida && (
                    <button type="button" className="noti-btn secundario" onClick={() => marcarNotificacionCRMLeida(item.id)}>
                      Marcar leida
                    </button>
                  )}
                  <button type="button" className="noti-btn" onClick={() => archivarNotificacionCRM(item.id)}>
                    Archivar
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

