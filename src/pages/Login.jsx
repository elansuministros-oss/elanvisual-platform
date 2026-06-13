import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

function destinoPorRol(rol) {
  if (rol === 'admin') return 'admin';
  if (rol === 'produccion') return 'produccion';
  return 'vet';
}

export default function Login({ setPage, destino }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');

  const entrar = (e) => {
    e.preventDefault();

    const res = login({ email, password });

    if (!res.ok) {
      return setError('Usuario o contraseña incorrectos.');
    }

    if (destino === 'admin' && res.rol !== 'admin') {
      return setError('Este usuario no tiene permiso de administrador.');
    }

    if (destino === 'vet' && res.rol !== 'veterinaria') {
      return setError('Este usuario no tiene permiso de veterinaria.');
    }

    if (destino === 'produccion' && !['admin', 'produccion'].includes(res.rol)) {
      return setError('Este usuario no tiene permiso de producción.');
    }

    setError('');
    setPage(destino || destinoPorRol(res.rol));
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <span className="badge">
          <ShieldCheck size={15} /> Acceso privado
        </span>

        <h1>Portal ELANPET</h1>
        <p>Este acceso es solo para administrador ELAN, producción y veterinarias afiliadas.</p>

        <form onSubmit={entrar}>
          <label>Usuario o correo</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin, produccion, vetdemo o correo"
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
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {mostrarPassword ? 'OCULTAR' : 'VER'}
            </button>
          </div>

          {error && <small className="error-text">{error}</small>}

          <button type="submit">
            <LockKeyhole size={18} /> Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
