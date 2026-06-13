import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const formatoFecha = (valor) => {
  if (!valor) return 'Sin fecha';

  try {
    return new Intl.DateTimeFormat('es-NI', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(valor));
  } catch {
    return valor;
  }
};

const fechaInput = (valor) => {
  if (!valor) return '';
  try {
    return new Date(valor).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const normalizar = (valor) =>
  String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function AuditoriaCRM() {
  const {
    auditoriaCRM = [],
    usuariosCRM = [],
    modulosCRMPermisos = [],
    limpiarAuditoriaCRM,
  } = useCore();

  const hoy = new Date().toISOString().slice(0, 10);

  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    usuario: '',
    modulo: '',
    accion: '',
    texto: '',
  });

  const cambiarFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      desde: '',
      hasta: '',
      usuario: '',
      modulo: '',
      accion: '',
      texto: '',
    });
  };

  const auditoriaFiltrada = useMemo(() => {
    const desde = filtros.desde ? new Date(`${filtros.desde}T00:00:00`) : null;
    const hasta = filtros.hasta ? new Date(`${filtros.hasta}T23:59:59`) : null;
    const texto = normalizar(filtros.texto);

    return auditoriaCRM.filter((registro) => {
      const fecha = registro.fecha ? new Date(registro.fecha) : null;

      if (desde && fecha && fecha < desde) return false;
      if (hasta && fecha && fecha > hasta) return false;
      if (filtros.usuario && registro.usuarioId !== filtros.usuario) return false;
      if (filtros.modulo && registro.modulo !== filtros.modulo) return false;
      if (filtros.accion && registro.accion !== filtros.accion) return false;

      if (texto) {
        const contenido = normalizar(
          [
            registro.usuarioNombre,
            registro.usuarioCorreo,
            registro.usuarioRol,
            registro.unidadNegocio,
            registro.modulo,
            registro.accion,
            registro.detalle,
            registro.entidadId,
            registro.entidadTipo,
          ].join(' ')
        );

        if (!contenido.includes(texto)) return false;
      }

      return true;
    });
  }, [auditoriaCRM, filtros]);

  const resumen = useMemo(() => {
    const total = auditoriaFiltrada.length;
    const accionesHoy = auditoriaCRM.filter((registro) => fechaInput(registro.fecha) === hoy).length;
    const usuariosActivos = new Set(auditoriaFiltrada.map((registro) => registro.usuarioId)).size;
    const modulosAfectados = new Set(auditoriaFiltrada.map((registro) => registro.modulo)).size;

    const porUsuario = auditoriaFiltrada.reduce((acc, registro) => {
      const clave = registro.usuarioNombre || 'Sin usuario';
      acc[clave] = (acc[clave] || 0) + 1;
      return acc;
    }, {});

    const porModulo = auditoriaFiltrada.reduce((acc, registro) => {
      const clave = registro.modulo || 'Sin módulo';
      acc[clave] = (acc[clave] || 0) + 1;
      return acc;
    }, {});

    const usuarioMasActivo =
      Object.entries(porUsuario).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin movimientos';

    const moduloMasMovido =
      Object.entries(porModulo).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin movimientos';

    return {
      total,
      accionesHoy,
      usuariosActivos,
      modulosAfectados,
      usuarioMasActivo,
      moduloMasMovido,
    };
  }, [auditoriaCRM, auditoriaFiltrada, hoy]);

  const modulosDisponibles = useMemo(() => {
    const desdeAuditoria = auditoriaCRM
      .map((registro) => registro.modulo)
      .filter(Boolean);

    const desdePermisos = modulosCRMPermisos
      .map((modulo) => modulo.label)
      .filter(Boolean);

    return Array.from(new Set([...desdeAuditoria, ...desdePermisos])).sort();
  }, [auditoriaCRM, modulosCRMPermisos]);

  const accionesDisponibles = useMemo(
    () => Array.from(new Set(auditoriaCRM.map((registro) => registro.accion).filter(Boolean))).sort(),
    [auditoriaCRM]
  );

  const confirmarLimpiar = () => {
    const confirmar = window.confirm(
      '¿Deseás limpiar el historial de auditoría? Esta acción dejará registro de limpieza.'
    );

    if (confirmar && typeof limpiarAuditoriaCRM === 'function') {
      limpiarAuditoriaCRM();
    }
  };

  return (
    <div className="auditoria-crm">
      <style>
        {`
          .auditoria-crm {
            display: grid;
            gap: 18px;
          }

          .auditoria-header {
            background: #ffffff;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: flex-start;
          }

          .auditoria-header h2 {
            margin: 0;
            font-size: 24px;
            color: #111827;
          }

          .auditoria-header p {
            margin: 8px 0 0;
            color: #6b7280;
            line-height: 1.5;
          }

          .auditoria-badge {
            background: #eef2ff;
            color: #3730a3;
            padding: 10px 14px;
            border-radius: 999px;
            font-weight: 900;
            white-space: nowrap;
          }

          .auditoria-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 14px;
          }

          .auditoria-card {
            background: #ffffff;
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
            border: 1px solid #eef2f7;
          }

          .auditoria-card span {
            display: block;
            color: #6b7280;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .auditoria-card strong {
            display: block;
            margin-top: 8px;
            color: #111827;
            font-size: 24px;
          }

          .auditoria-card small {
            display: block;
            margin-top: 6px;
            color: #64748b;
            font-weight: 700;
          }

          .auditoria-panel {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          }

          .auditoria-panel h3 {
            margin: 0 0 14px;
            color: #111827;
          }

          .auditoria-filtros {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 12px;
            align-items: end;
          }

          .auditoria-field {
            display: grid;
            gap: 6px;
          }

          .auditoria-field label {
            color: #374151;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .auditoria-field input,
          .auditoria-field select {
            width: 100%;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
            padding: 10px 12px;
            background: #ffffff;
            color: #111827;
            font-weight: 700;
            outline: none;
          }

          .auditoria-field input:focus,
          .auditoria-field select:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }

          .auditoria-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            flex-wrap: wrap;
          }

          .auditoria-btn {
            border: 0;
            border-radius: 12px;
            padding: 10px 14px;
            font-weight: 900;
            cursor: pointer;
            background: #e5e7eb;
            color: #111827;
          }

          .auditoria-btn.primary {
            background: #1d4ed8;
            color: #ffffff;
          }

          .auditoria-btn.danger {
            background: #fee2e2;
            color: #991b1b;
          }

          .auditoria-table-wrap {
            overflow-x: auto;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
          }

          .auditoria-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 980px;
          }

          .auditoria-table th {
            background: #f8fafc;
            color: #475569;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 13px 12px;
            border-bottom: 1px solid #e5e7eb;
          }

          .auditoria-table td {
            padding: 13px 12px;
            border-bottom: 1px solid #eef2f7;
            color: #1f2937;
            vertical-align: top;
            font-size: 14px;
          }

          .auditoria-table tr:last-child td {
            border-bottom: 0;
          }

          .auditoria-tag {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 5px 9px;
            font-size: 12px;
            font-weight: 900;
            background: #eef2ff;
            color: #3730a3;
            white-space: nowrap;
          }

          .auditoria-tag.crear,
          .auditoria-tag.crear_usuario,
          .auditoria-tag.crear_rol {
            background: #dcfce7;
            color: #166534;
          }

          .auditoria-tag.editar,
          .auditoria-tag.editar_usuario,
          .auditoria-tag.editar_rol {
            background: #fef9c3;
            color: #854d0e;
          }

          .auditoria-tag.eliminar,
          .auditoria-tag.eliminar_usuario,
          .auditoria-tag.eliminar_rol {
            background: #fee2e2;
            color: #991b1b;
          }

          .auditoria-empty {
            padding: 30px;
            text-align: center;
            color: #64748b;
            font-weight: 800;
          }

          .auditoria-detail {
            max-width: 360px;
            color: #334155;
            line-height: 1.45;
          }

          @media (max-width: 1100px) {
            .auditoria-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .auditoria-filtros {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .auditoria-header {
              display: block;
            }

            .auditoria-badge {
              display: inline-flex;
              margin-top: 12px;
            }

            .auditoria-grid,
            .auditoria-filtros {
              grid-template-columns: 1fr;
            }

            .auditoria-actions {
              justify-content: stretch;
            }

            .auditoria-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="auditoria-header">
        <div>
          <h2>Auditoría de Movimientos</h2>
          <p>
            Registro interno para saber quién creó, editó, eliminó o cambió información dentro del CRM Central ELANKAV.
          </p>
        </div>

        <div className="auditoria-badge">FASE 7.1</div>
      </section>

      <section className="auditoria-grid">
        <div className="auditoria-card">
          <span>Movimientos filtrados</span>
          <strong>{resumen.total}</strong>
          <small>Según filtros activos</small>
        </div>

        <div className="auditoria-card">
          <span>Acciones hoy</span>
          <strong>{resumen.accionesHoy}</strong>
          <small>{hoy}</small>
        </div>

        <div className="auditoria-card">
          <span>Usuarios activos</span>
          <strong>{resumen.usuariosActivos}</strong>
          <small>Con movimientos</small>
        </div>

        <div className="auditoria-card">
          <span>Módulos afectados</span>
          <strong>{resumen.modulosAfectados}</strong>
          <small>Con actividad</small>
        </div>

        <div className="auditoria-card">
          <span>Usuario más activo</span>
          <strong style={{ fontSize: 16 }}>{resumen.usuarioMasActivo}</strong>
          <small>Mayor cantidad de registros</small>
        </div>

        <div className="auditoria-card">
          <span>Módulo más movido</span>
          <strong style={{ fontSize: 16 }}>{resumen.moduloMasMovido}</strong>
          <small>Más acciones registradas</small>
        </div>
      </section>

      <section className="auditoria-panel">
        <h3>Filtros</h3>

        <div className="auditoria-filtros">
          <div className="auditoria-field">
            <label>Desde</label>
            <input type="date" name="desde" value={filtros.desde} onChange={cambiarFiltro} />
          </div>

          <div className="auditoria-field">
            <label>Hasta</label>
            <input type="date" name="hasta" value={filtros.hasta} onChange={cambiarFiltro} />
          </div>

          <div className="auditoria-field">
            <label>Usuario</label>
            <select name="usuario" value={filtros.usuario} onChange={cambiarFiltro}>
              <option value="">Todos</option>
              {usuariosCRM.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre || usuario.usuario || usuario.id}
                </option>
              ))}
            </select>
          </div>

          <div className="auditoria-field">
            <label>Módulo</label>
            <select name="modulo" value={filtros.modulo} onChange={cambiarFiltro}>
              <option value="">Todos</option>
              {modulosDisponibles.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>
          </div>

          <div className="auditoria-field">
            <label>Acción</label>
            <select name="accion" value={filtros.accion} onChange={cambiarFiltro}>
              <option value="">Todas</option>
              {accionesDisponibles.map((accion) => (
                <option key={accion} value={accion}>
                  {accion}
                </option>
              ))}
            </select>
          </div>

          <div className="auditoria-field">
            <label>Buscar</label>
            <input
              type="text"
              name="texto"
              value={filtros.texto}
              onChange={cambiarFiltro}
              placeholder="Usuario, módulo, detalle..."
            />
          </div>
        </div>

        <div className="auditoria-actions" style={{ marginTop: 14 }}>
          <button type="button" className="auditoria-btn" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>

          <button type="button" className="auditoria-btn danger" onClick={confirmarLimpiar}>
            Limpiar auditoría
          </button>
        </div>
      </section>

      <section className="auditoria-panel">
        <h3>Últimos movimientos</h3>

        <div className="auditoria-table-wrap">
          <table className="auditoria-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Unidad</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Detalle</th>
                <th>Entidad</th>
              </tr>
            </thead>

            <tbody>
              {auditoriaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="auditoria-empty">
                      No hay movimientos registrados con los filtros actuales.
                    </div>
                  </td>
                </tr>
              ) : (
                auditoriaFiltrada.slice(0, 100).map((registro) => (
                  <tr key={registro.id}>
                    <td>{formatoFecha(registro.fecha)}</td>
                    <td>
                      <strong>{registro.usuarioNombre || 'Sin usuario'}</strong>
                      <br />
                      <small>{registro.usuarioCorreo || 'Sin correo'}</small>
                    </td>
                    <td>{registro.usuarioRol || 'Sin rol'}</td>
                    <td>{registro.unidadNegocio || 'Corporativo'}</td>
                    <td>{registro.modulo || 'Sistema'}</td>
                    <td>
                      <span className={`auditoria-tag ${normalizar(registro.accion).replace(/\s+/g, '_')}`}>
                        {registro.accion || 'MOVIMIENTO'}
                      </span>
                    </td>
                    <td>
                      <div className="auditoria-detail">
                        {registro.detalle || 'Sin detalle'}
                      </div>
                    </td>
                    <td>
                      <small>{registro.entidadTipo || 'N/A'}</small>
                      <br />
                      <strong>{registro.entidadId || 'N/A'}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
