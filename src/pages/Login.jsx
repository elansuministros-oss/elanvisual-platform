import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCore } from '../core/context/CoreContext';

function destinoPorRol(rol) {
  if (rol === 'admin') return 'admin';
  if (rol === 'produccion') return 'produccion';
  if (rol === 'ventas') return 'ventas';
  return 'home';
}

const normalizar = (valor = '') =>
  String(valor || '').trim().toLowerCase();

export default function Login({ setPage, destino }) {
  const { login } = useApp();
  const { usuariosCRM = [], cambiarUsuarioActivoCRM } = useCore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');

  const sincronizarUsuarioCRM = (res) => {
    const entrada = normalizar(email);
    const rolLogin = normalizar(res?.rol);

    const usuarioEncontrado =
      usuariosCRM.find((usuario) =>
        [usuario.usuario, usuario.correo, usuario.nombre]
          .map(normalizar)
          .includes(entrada)
      ) ||
      usuariosCRM.find((usuario) => {
        const rolId = normalizar(usuario.rolId);
        return rolLogin === 'ventas' && rolId.includes('ventas');
      }) ||
      usuariosCRM.find((usuario) => {
        const rolId = normalizar(usuario.rolId);
        return rolLogin === 'produccion' && rolId.includes('produccion');
      }) ||
      usuariosCRM.find((usuario) => {
        const rolId = normalizar(usuario.rolId);
        return rolLogin === 'admin' && rolId.includes('admin');
      });

    if (usuarioEncontrado?.id) {
      cambiarUsuarioActivoCRM(usuarioEncontrado.id);
      return;
    }

    if (rolLogin === 'admin') {
      cambiarUsuarioActivoCRM('usuario-admin-general');
    }
  };

  const entrar = (e) => {
    e.preventDefault();

    const res = login({ email, password });

    if (!res.ok) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }

    if (destino === 'admin' && res.rol !== 'admin') {
      setError('Este usuario no tiene permisos de administrador.');
      return;
    }

    if (destino === 'produccion' && !['admin', 'produccion'].includes(res.rol)) {
      setError('Este usuario no tiene permisos de producción.');
      return;
    }

    sincronizarUsuarioCRM(res);

    setError('');
    setPage(destino || destinoPorRol(res.rol));
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <span className="badge">
          <ShieldCheck size={15} />
          Acceso Operativo
        </span>

        <h1>Portal ELANVISUAL</h1>

        <p>
          Acceso para administración, CRM, producción y operaciones internas de ELANVISUAL.
        </p>

        <form onSubmit={entrar}>
          <label>Usuario o correo</label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo o usuario autorizado"
            autoComplete="username"
          />

          <label>Contraseña</label>

          <div className="password-field">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarPassword((prev) => !prev)}
            >
              {mostrarPassword ? 'OCULTAR' : 'VER'}
            </button>
          </div>

          {error && <small className="error-text">{error}</small>}

          <button type="submit">
            <LockKeyhole size={18} />
            Entrar
          </button>
        </form>

        <div className="login-footnote">
          <Building2 size={20} />
          <p>ELANVISUAL · CRM · Producción · Seguimiento</p>
        </div>
      </section>
    </main>
  );
}
