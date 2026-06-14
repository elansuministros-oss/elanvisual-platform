import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

export default function SeguimientoCRM() {
  const {
    empresas,
    contactos,
    seguimiento,
    crearSeguimiento,
    actualizarSeguimiento,
    eliminarSeguimiento,
  } = useCore();

  const [formulario, setFormulario] = useState({
    empresaId: '',
    contactoId: '',
    tipo: 'Llamada',
    fecha: '',
    estado: 'Pendiente',
    prioridad: 'Media',
    responsable: '',
    nota: '',
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [editandoId, setEditandoId] = useState(null);

  const obtenerEmpresa = (id) =>
    empresas.find((empresa) => empresa.id === id)?.nombre || 'Sin empresa';

  const obtenerContacto = (id) =>
    contactos.find((contacto) => contacto.id === id)?.nombre || 'Sin contacto';

  const contactosFiltrados = contactos.filter(
    (contacto) =>
      !formulario.empresaId || contacto.empresaId === formulario.empresaId
  );

  const actividadesFiltradas = useMemo(() => {
    return seguimiento.filter((actividad) => {
      const empresaNombre = obtenerEmpresa(actividad.empresaId);
      const contactoNombre = obtenerContacto(actividad.contactoId);

      const texto = `${empresaNombre} ${contactoNombre} ${actividad.tipo} ${actividad.responsable} ${actividad.nota}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      const coincideEstado =
        filtroEstado === 'Todos' || actividad.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [seguimiento, empresas, contactos, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    return {
      total: seguimiento.length,
      pendientes: seguimiento.filter((a) => a.estado === 'Pendiente').length,
      proceso: seguimiento.filter((a) => a.estado === 'En proceso').length,
      completadas: seguimiento.filter((a) => a.estado === 'Completado').length,
    };
  }, [seguimiento]);

  const limpiarFormulario = () => {
    setFormulario({
      empresaId: '',
      contactoId: '',
      tipo: 'Llamada',
      fecha: '',
      estado: 'Pendiente',
      prioridad: 'Media',
      responsable: '',
      nota: '',
    });

    setEditandoId(null);
  };

  const guardarActividad = (e) => {
    e.preventDefault();

    if (!formulario.empresaId || !formulario.contactoId) {
      alert('DebÃ©s seleccionar empresa y contacto.');
      return;
    }

    if (editandoId) {
      actualizarSeguimiento(editandoId, formulario);
    } else {
      crearSeguimiento(formulario);
    }

    limpiarFormulario();
  };

  const editarActividad = (actividad) => {
    setFormulario({
      empresaId: actividad.empresaId || '',
      contactoId: actividad.contactoId || '',
      tipo: actividad.tipo || 'Llamada',
      fecha: actividad.fecha || '',
      estado: actividad.estado || 'Pendiente',
      prioridad: actividad.prioridad || 'Media',
      responsable: actividad.responsable || '',
      nota: actividad.nota || '',
    });

    setEditandoId(actividad.id);
  };

  const eliminarActividad = (id) => {
    const confirmar = window.confirm(
      'Â¿Seguro que querÃ©s eliminar este seguimiento?'
    );

    if (!confirmar) return;

    eliminarSeguimiento(id);

    if (editandoId === id) {
      limpiarFormulario();
    }
  };

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Seguimiento CRM</h2>
          <p>
            Control de llamadas, visitas, notas y actividades comerciales por
            empresa y contacto.
          </p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Total</span>
          <strong>{resumen.total}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </div>

        <div className="crm-stat-card">
          <span>En proceso</span>
          <strong>{resumen.proceso}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Completadas</span>
          <strong>{resumen.completadas}</strong>
        </div>
      </div>

      <div className="crm-grid">
        <form className="crm-card" onSubmit={guardarActividad}>
          <h3>{editandoId ? 'Editar seguimiento' : 'Nuevo seguimiento'}</h3>

          <label>
            Empresa
            <select
              value={formulario.empresaId}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  empresaId: e.target.value,
                  contactoId: '',
                })
              }
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Contacto
            <select
              value={formulario.contactoId}
              onChange={(e) =>
                setFormulario({ ...formulario, contactoId: e.target.value })
              }
            >
              <option value="">Seleccionar contacto</option>
              {contactosFiltrados.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo de actividad
            <select
              value={formulario.tipo}
              onChange={(e) =>
                setFormulario({ ...formulario, tipo: e.target.value })
              }
            >
              <option>Llamada</option>
              <option>Visita</option>
              <option>Nota</option>
              <option>WhatsApp</option>
              <option>Correo</option>
              <option>ReuniÃ³n</option>
            </select>
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={formulario.fecha}
              onChange={(e) =>
                setFormulario({ ...formulario, fecha: e.target.value })
              }
            />
          </label>

          <label>
            Estado
            <select
              value={formulario.estado}
              onChange={(e) =>
                setFormulario({ ...formulario, estado: e.target.value })
              }
            >
              <option>Pendiente</option>
              <option>En proceso</option>
              <option>Completado</option>
              <option>Cancelado</option>
            </select>
          </label>

          <label>
            Prioridad
            <select
              value={formulario.prioridad}
              onChange={(e) =>
                setFormulario({ ...formulario, prioridad: e.target.value })
              }
            >
              <option>Baja</option>
              <option>Media</option>
              <option>Alta</option>
              <option>Urgente</option>
            </select>
          </label>

          <label>
            Responsable
            <input
              type="text"
              value={formulario.responsable}
              onChange={(e) =>
                setFormulario({ ...formulario, responsable: e.target.value })
              }
              placeholder="Ej: Erick Cano"
            />
          </label>

          <label>
            Nota / seguimiento
            <textarea
              value={formulario.nota}
              onChange={(e) =>
                setFormulario({ ...formulario, nota: e.target.value })
              }
              placeholder="Detalle de la llamada, visita o actividad..."
              rows="4"
            />
          </label>

          <div className="crm-actions">
            <button type="submit">
              {editandoId ? 'Guardar cambios' : 'Agregar seguimiento'}
            </button>

            {editandoId && (
              <button type="button" onClick={limpiarFormulario}>
                Cancelar ediciÃ³n
              </button>
            )}
          </div>
        </form>

        <div className="crm-card">
          <div className="crm-toolbar">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por empresa, contacto o nota..."
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option>Todos</option>
              <option>Pendiente</option>
              <option>En proceso</option>
              <option>Completado</option>
              <option>Cancelado</option>
            </select>
          </div>

          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Responsable</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {actividadesFiltradas.length > 0 ? (
                  actividadesFiltradas.map((actividad) => (
                    <tr key={actividad.id}>
                      <td>{obtenerEmpresa(actividad.empresaId)}</td>
                      <td>{obtenerContacto(actividad.contactoId)}</td>
                      <td>{actividad.tipo}</td>
                      <td>{actividad.fecha || 'Sin fecha'}</td>
                      <td>{actividad.estado}</td>
                      <td>{actividad.prioridad}</td>
                      <td>{actividad.responsable || 'Sin asignar'}</td>
                      <td>{actividad.nota}</td>
                      <td>
                        <div className="crm-row-actions">
                          <button
                            type="button"
                            onClick={() => editarActividad(actividad)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarActividad(actividad.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">
                      No hay actividades registradas con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
