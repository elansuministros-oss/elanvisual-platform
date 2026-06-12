import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElan } from '../core/context/ElanContext.jsx';

export default function Login() {
  const { login } = useElan();
  const nav = useNavigate();

  const [f, setF] = useState({
    correo: '',
    password: '',
  });

  const [verPassword, setVerPassword] = useState(false);

  function go(e) {
    e?.preventDefault();

    const u = login(f.correo.trim(), f.password);

    if (!u) {
      alert('Credenciales incorrectas');
      return;
    }

    if (u.rol === 'admin') nav('/admin');
    else if (u.rol === 'vendedor') nav('/vendedor-panel');
    else if (u.rol === 'produccion') nav('/produccion');
    else nav('/');
  }

  return (
    <main className="login">
      <form className="card form" onSubmit={go}>
        <h1>ELANVISUAL</h1>
        <p>Acceso privado del sistema</p>

        <input
          placeholder="Correo"
          type="email"
          autoComplete="username"
          value={f.correo}
          onChange={(e) => setF({ ...f, correo: e.target.value })}
        />

        <div className="password-wrap">
          <input
            placeholder="Contraseña"
            type={verPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />

          <button
            type="button"
            className="password-eye"
            onClick={() => setVerPassword(!verPassword)}
            title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {verPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}