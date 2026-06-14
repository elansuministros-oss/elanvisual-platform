import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const estadoInicialUsuario = {
  nombre: '',
  correo: '',
  usuario: '',
  telefono: '',
  cargo: '',
  rolId: 'rol-ventas',
  unidadNegocio: 'ELANVISUAL',
  estado: 'Activo',
  notas: '',
};

const estadoInicialRol = {
  nombre: '',
  descripcion: '',
  nivel: 'Operativo',
  estado: 'Activo',
  permisos: ['dashboard'],
};

export default function UsuariosPermisos() {
  const {
    usuariosCRM,
    rolesCRM,
    usuarioActivoCRMId,
    usuarioActivoCRM,
    rolUsuarioActivoCRM,
    modulosCRMPermisos,
    unidadesOficialesCRM,
    crearUsuarioCRM,
    actualizarUsuarioCRM,
    eliminarUsuarioCRM,
    cambiarUsuarioActivoCRM,
    crearRolCRM,
    actualizarRolCRM,
    eliminarRolCRM,
  } = useCore();

  const [usuarioForm, setUsuarioForm] = useState(estadoInicialUsuario);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [rolForm, setRolForm] = useState(estadoInicialRol);
  const [rolEditandoId, setRolEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const rolesActivos = useMemo(
    () => rolesCRM.filter((rol) => rol.estado !== 'Inactivo'),
    [rolesCRM]
  );

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuariosCRM;

    return usuariosCRM.filter((usuario) => {
      const rol = rolesCRM.find((item) => item.id === usuario.rolId);
      return [
        usuario.nombre,
        usuario.correo,
        usuario.usuario,
        usuario.cargo,
        usuario.unidadNegocio,
        usuario.estado,
        rol?.nombre,
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto);
    });
  }, [busqueda, rolesCRM, usuariosCRM]);

  const resumen = useMemo(() => {
    const total = usuariosCRM.length;
    const activos = usuariosCRM.filter((usuario) => usuario.estado === 'Activo').length;
    const inactivos = usuariosCRM.filter((usuario) => usuario.estado === 'Inactivo').length;
    const roles = rolesCRM.length;

    return { total, activos, inactivos, roles };
  }, [rolesCRM, usuariosCRM]);

  const cambiarUsuarioForm = (e) => {
    const { name, value } = e.target;
    setUsuarioForm((prev) => ({ ...prev, [name]: value }));
  };

  const cambiarRolForm = (e) => {
    const { name, value } = e.target;
    setRolForm((prev) => ({ ...prev, [name]: value }));
  };

  const alternarPermiso = (moduloId) => {
    setRolForm((prev) => {
      const permisos = Array.isArray(prev.permisos) ? prev.permisos : [];
      const existe = permisos.includes(moduloId);

      return {
        ...prev,
        permisos: existe
          ? permisos.filter((permiso) => permiso !== moduloId)
          : [...permisos, moduloId],
      };
    });
  };

  const guardarUsuario = (e) => {
    e.preventDefault();

    if (!usuarioForm.nombre.trim()) return;

    const datos = {
      ...usuarioForm,
      nombre: usuarioForm.nombre.trim(),
      correo: usuarioForm.correo.trim(),
      usuario: usuarioForm.usuario.trim(),
      telefono: usuarioForm.telefono.trim(),
      cargo: usuarioForm.cargo.trim(),
      notas: usuarioForm.notas.trim(),
    };

    if (usuarioEditandoId) {
      actualizarUsuarioCRM(usuarioEditandoId, datos);
    } else {
      crearUsuarioCRM(datos);
    }

    setUsuarioForm(estadoInicialUsuario);
    setUsuarioEditandoId(null);
  };

  const editarUsuario = (usuario) => {
    setUsuarioEditandoId(usuario.id);
    setUsuarioForm({
      nombre: usuario.nombre || '',
      correo: usuario.correo || '',
      usuario: usuario.usuario || '',
      telefono: usuario.telefono || '',
      cargo: usuario.cargo || '',
      rolId: usuario.rolId || 'rol-ventas',
      unidadNegocio: usuario.unidadNegocio || 'ELANVISUAL',
      estado: usuario.estado || 'Activo',
      notas: usuario.notas || '',
    });
  };

  const cancelarUsuario = () => {
    setUsuarioForm(estadoInicialUsuario);
    setUsuarioEditandoId(null);
  };

  const guardarRol = (e) => {
    e.preventDefault();

    if (!rolForm.nombre.trim()) return;

    const permisos = Array.isArray(rolForm.permisos) && rolForm.permisos.length
      ? rolForm.permisos
      : ['dashboard'];

    const datos = {
      ...rolForm,
      nombre: rolForm.nombre.trim(),
      descripcion: rolForm.descripcion.trim(),
      permisos,
    };

    if (rolEditandoId) {
      actualizarRolCRM(rolEditandoId, datos);
    } else {
      crearRolCRM(datos);
    }

    setRolForm(estadoInicialRol);
    setRolEditandoId(null);
  };

  const editarRol = (rol) => {
    setRolEditandoId(rol.id);
    setRolForm({
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      nivel: rol.nivel || 'Operativo',
      estado: rol.estado || 'Activo',
      permisos: Array.isArray(rol.permisos) ? rol.permisos : ['dashboard'],
    });
  };

  const cancelarRol = () => {
    setRolForm(estadoInicialRol);
    setRolEditandoId(null);
  };

  const obtenerRol = (rolId) => rolesCRM.find((rol) => rol.id === rolId);

  const modulosPorGrupo = useMemo(() => {
    return modulosCRMPermisos.reduce((grupos, modulo) => {
      const grupo = modulo.grupo || 'General';
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(modulo);
      return grupos;
    }, {});
  }, [modulosCRMPermisos]);

  return (
    <div className="usuarios-permisos-crm">
      <style>
        {`
          .usuarios-permisos-crm {
            display: grid;
            gap: 18px;
          }

          .up-header {
            background: linear-gradient(135deg, #0f2f5f, #1f5fad);
            color: #ffffff;
            border-radius: 20px;
            padding: 22px;
            box-shadow: 0 12px 30px rgba(15, 47, 95, 0.22);
          }

          .up-header h2 {
            margin: 0;
            font-size: 26px;
          }

          .up-header p {
            margin: 8px 0 0;
            opacity: 0.82;
            max-width: 820px;
          }

          .up-cards {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .up-card,
          .up-panel {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          }

          .up-card span {
            display: block;
            color: #64748b;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .up-card strong {
            display: block;
            margin-top: 6px;
            font-size: 26px;
            color: #0f172a;
          }

          .up-grid {
            display: grid;
            grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.4fr);
            gap: 18px;
            align-items: start;
          }

          .up-panel h3 {
            margin: 0 0 14px;
            color: #0f172a;
          }

          .up-form {
            display: grid;
            gap: 12px;
          }

          .up-form label {
            display: grid;
            gap: 6px;
            color: #334155;
            font-size: 13px;
            font-weight: 800;
          }

          .up-form input,
          .up-form select,
          .up-form textarea,
          .up-search {
            width: 100%;
            border: 1px solid #dbe4f0;
            border-radius: 12px;
            padding: 10px 12px;
            font: inherit;
            background: #ffffff;
            color: #0f172a;
            box-sizing: border-box;
          }

          .up-form textarea {
            min-height: 76px;
            resize: vertical;
          }

          .up-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .up-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .up-btn {
            border: 0;
            border-radius: 12px;
            padding: 10px 13px;
            font-weight: 900;
            cursor: pointer;
            background: #1f5fad;
            color: #ffffff;
          }

          .up-btn.secondary {
            background: #eaf2ff;
            color: #1d4f9f;
          }

          .up-btn.danger {
            background: #fee2e2;
            color: #b91c1c;
          }

          .up-btn.dark {
            background: #0f172a;
            color: #ffffff;
          }

          .up-table-wrap {
            overflow-x: auto;
          }

          .up-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 760px;
          }

          .up-table th,
          .up-table td {
            padding: 12px;
            border-bottom: 1px solid #eef2f7;
            text-align: left;
            vertical-align: top;
          }

          .up-table th {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: #64748b;
          }

          .up-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 5px 9px;
            font-size: 12px;
            font-weight: 900;
            background: #ecfdf5;
            color: #047857;
          }

          .up-badge.off {
            background: #f1f5f9;
            color: #64748b;
          }

          .up-current {
            display: grid;
            gap: 7px;
            padding: 12px;
            border-radius: 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            margin-bottom: 14px;
          }

          .up-permisos {
            display: grid;
            gap: 14px;
          }

          .up-permiso-grupo {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px;
            background: #f8fafc;
          }

          .up-permiso-grupo h4 {
            margin: 0 0 10px;
            color: #0f172a;
          }

          .up-checks {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .up-check {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #334155;
          }

          .up-check input {
            width: auto;
          }

          @media (max-width: 980px) {
            .up-cards,
            .up-grid,
            .up-row {
              grid-template-columns: 1fr;
            }

            .up-checks {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="up-header">
        <h2>Usuarios y Permisos Corporativos</h2>
        <p>
          Controla usuarios, roles, unidades de negocio y acceso por mÃ³dulo dentro del CRM Central ELANKAV.
          Este mÃ³dulo deja preparada la base para auditorÃ­a, trazabilidad y operaciÃ³n multiusuario.
        </p>
      </div>

      <div className="up-cards">
        <div className="up-card"><span>Usuarios</span><strong>{resumen.total}</strong></div>
        <div className="up-card"><span>Activos</span><strong>{resumen.activos}</strong></div>
        <div className="up-card"><span>Inactivos</span><strong>{resumen.inactivos}</strong></div>
        <div className="up-card"><span>Roles</span><strong>{resumen.roles}</strong></div>
      </div>

      <div className="up-grid">
        <div className="up-panel">
          <h3>Usuario activo</h3>
          <div className="up-current">
            <strong>{usuarioActivoCRM?.nombre || 'Administrador General'}</strong>
            <span>{rolUsuarioActivoCRM?.nombre || 'Administrador General'} Â· {usuarioActivoCRM?.unidadNegocio || 'Corporativo'}</span>
            <span className={`up-badge ${usuarioActivoCRM?.estado === 'Inactivo' ? 'off' : ''}`}>
              {usuarioActivoCRM?.estado || 'Activo'}
            </span>
          </div>

          <label className="up-form">
            <span>Cambiar vista operativa</span>
            <select value={usuarioActivoCRMId} onChange={(e) => cambiarUsuarioActivoCRM(e.target.value)}>
              {usuariosCRM.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} â€” {obtenerRol(usuario.rolId)?.nombre || 'Sin rol'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="up-panel">
          <h3>{usuarioEditandoId ? 'Editar usuario' : 'Crear usuario'}</h3>
          <form className="up-form" onSubmit={guardarUsuario}>
            <div className="up-row">
              <label>Nombre<input name="nombre" value={usuarioForm.nombre} onChange={cambiarUsuarioForm} /></label>
              <label>Usuario<input name="usuario" value={usuarioForm.usuario} onChange={cambiarUsuarioForm} /></label>
            </div>
            <div className="up-row">
              <label>Correo<input name="correo" value={usuarioForm.correo} onChange={cambiarUsuarioForm} /></label>
              <label>TelÃ©fono<input name="telefono" value={usuarioForm.telefono} onChange={cambiarUsuarioForm} /></label>
            </div>
            <div className="up-row">
              <label>Cargo<input name="cargo" value={usuarioForm.cargo} onChange={cambiarUsuarioForm} /></label>
              <label>Estado
                <select name="estado" value={usuarioForm.estado} onChange={cambiarUsuarioForm}>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </label>
            </div>
            <div className="up-row">
              <label>Rol
                <select name="rolId" value={usuarioForm.rolId} onChange={cambiarUsuarioForm}>
                  {rolesActivos.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                </select>
              </label>
              <label>Unidad
                <select name="unidadNegocio" value={usuarioForm.unidadNegocio} onChange={cambiarUsuarioForm}>
                  {unidadesOficialesCRM.map((unidad) => <option key={unidad}>{unidad}</option>)}
                </select>
              </label>
            </div>
            <label>Notas<textarea name="notas" value={usuarioForm.notas} onChange={cambiarUsuarioForm} /></label>
            <div className="up-actions">
              <button className="up-btn" type="submit">{usuarioEditandoId ? 'Guardar usuario' : 'Crear usuario'}</button>
              {usuarioEditandoId && <button className="up-btn secondary" type="button" onClick={cancelarUsuario}>Cancelar</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="up-panel">
        <h3>Usuarios registrados</h3>
        <input className="up-search" placeholder="Buscar por nombre, rol, unidad o estado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <div className="up-table-wrap">
          <table className="up-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => {
                const rol = obtenerRol(usuario.rolId);
                return (
                  <tr key={usuario.id}>
                    <td><strong>{usuario.nombre}</strong><br /><span>{usuario.correo || usuario.usuario || 'Sin correo'}</span></td>
                    <td>{rol?.nombre || 'Sin rol'}</td>
                    <td>{usuario.unidadNegocio || 'Corporativo'}</td>
                    <td><span className={`up-badge ${usuario.estado === 'Inactivo' ? 'off' : ''}`}>{usuario.estado || 'Activo'}</span></td>
                    <td>
                      <div className="up-actions">
                        <button className="up-btn secondary" type="button" onClick={() => editarUsuario(usuario)}>Editar</button>
                        <button className="up-btn dark" type="button" onClick={() => cambiarUsuarioActivoCRM(usuario.id)}>Usar</button>
                        {usuario.id !== 'usuario-admin-general' && (
                          <button className="up-btn danger" type="button" onClick={() => eliminarUsuarioCRM(usuario.id)}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="up-grid">
        <div className="up-panel">
          <h3>{rolEditandoId ? 'Editar rol' : 'Crear rol'}</h3>
          <form className="up-form" onSubmit={guardarRol}>
            <label>Nombre del rol<input name="nombre" value={rolForm.nombre} onChange={cambiarRolForm} /></label>
            <div className="up-row">
              <label>Nivel
                <select name="nivel" value={rolForm.nivel} onChange={cambiarRolForm}>
                  <option>Total</option>
                  <option>Gerencial</option>
                  <option>Financiero</option>
                  <option>Operativo</option>
                  <option>Consulta</option>
                </select>
              </label>
              <label>Estado
                <select name="estado" value={rolForm.estado} onChange={cambiarRolForm}>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </label>
            </div>
            <label>DescripciÃ³n<textarea name="descripcion" value={rolForm.descripcion} onChange={cambiarRolForm} /></label>

            <div className="up-permisos">
              {Object.entries(modulosPorGrupo).map(([grupo, modulos]) => (
                <div className="up-permiso-grupo" key={grupo}>
                  <h4>{grupo}</h4>
                  <div className="up-checks">
                    {modulos.map((modulo) => (
                      <label className="up-check" key={modulo.id}>
                        <input
                          type="checkbox"
                          checked={rolForm.permisos.includes(modulo.id)}
                          onChange={() => alternarPermiso(modulo.id)}
                        />
                        {modulo.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="up-actions">
              <button className="up-btn" type="submit">{rolEditandoId ? 'Guardar rol' : 'Crear rol'}</button>
              {rolEditandoId && <button className="up-btn secondary" type="button" onClick={cancelarRol}>Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="up-panel">
          <h3>Roles disponibles</h3>
          <div className="up-table-wrap">
            <table className="up-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Nivel</th>
                  <th>Permisos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rolesCRM.map((rol) => (
                  <tr key={rol.id}>
                    <td><strong>{rol.nombre}</strong><br /><span>{rol.descripcion}</span></td>
                    <td>{rol.nivel}</td>
                    <td>{Array.isArray(rol.permisos) ? rol.permisos.length : 0}</td>
                    <td><span className={`up-badge ${rol.estado === 'Inactivo' ? 'off' : ''}`}>{rol.estado || 'Activo'}</span></td>
                    <td>
                      <div className="up-actions">
                        <button className="up-btn secondary" type="button" onClick={() => editarRol(rol)}>Editar</button>
                        {rol.id !== 'rol-admin-general' && (
                          <button className="up-btn danger" type="button" onClick={() => eliminarRolCRM(rol.id)}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

