import React, { useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const roles = [
  'SuperAdmin',
  'Administrador',
  'Vendedor',
  'Producción',
  'Instalador',
  'Proveedor',
  'Cliente',
];

const formInicial = {
  id: '',
  nombre: '',
  correo: '',
  password: '',
  rol: 'Vendedor',
  estado: 'Activo',
};

export default function UsuariosPermisos() {
  const {
    usuarios = [],
    guardarUsuario,
    actualizarUsuario,
    eliminarUsuario,
  } = useElan();

  const [form, setForm] = useState(formInicial);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiar = () => {
    setForm(formInicial);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert('Ingrese el nombre del usuario');
      return;
    }

    if (!form.correo.trim()) {
      alert('Ingrese el correo');
      return;
    }

    if (form.id) {
      actualizarUsuario(form.id, form);
    } else {
      guardarUsuario(form);
    }

    limpiar();
  };

  const editar = (usuario) => {
    setForm({
      id: usuario.id || '',
      nombre: usuario.nombre || '',
      correo: usuario.correo || '',
      password: usuario.password || '',
      rol: usuario.rol || 'Vendedor',
      estado: usuario.estado || 'Activo',
    });
  };

  const eliminar = (usuario) => {
    const ok = window.confirm(
      `¿Eliminar usuario ${usuario.nombre}?`
    );

    if (!ok) return;

    eliminarUsuario(usuario.id);

    if (form.id === usuario.id) {
      limpiar();
    }
  };

  return (
    <div>
      <h2>Usuarios y Permisos</h2>

      <p>
        Administración de usuarios internos de ELANVISUAL.
      </p>

      <form
        onSubmit={guardar}
        style={{
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
        }}
      >
        <h3>
          {form.id
            ? 'Editar usuario'
            : 'Nuevo usuario'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2,minmax(0,1fr))',
            gap: 10,
          }}
        >
          <label>
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Correo
            <input
              name="correo"
              value={form.correo}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Contraseña
            <input
              name="password"
              value={form.password}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Rol
            <select
              name="rol"
              value={form.rol}
              onChange={cambiar}
              style={{ width: '100%' }}
            >
              {roles.map((rol) => (
                <option
                  key={rol}
                  value={rol}
                >
                  {rol}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 12,
          }}
        >
          <button type="submit">
            {form.id
              ? 'Guardar cambios'
              : 'Crear usuario'}
          </button>

          {form.id && (
            <button
              type="button"
              onClick={limpiar}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          display: 'grid',
          gap: 10,
        }}
      >
        {usuarios.map((usuario) => (
          <div
            key={usuario.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <strong>{usuario.nombre}</strong>

            <p>
              {usuario.correo}
            </p>

            <small>
              Rol: {usuario.rol}
            </small>

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 10,
              }}
            >
              <button
                onClick={() =>
                  editar(usuario)
                }
              >
                Editar
              </button>

              <button
                onClick={() =>
                  eliminar(usuario)
                }
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}