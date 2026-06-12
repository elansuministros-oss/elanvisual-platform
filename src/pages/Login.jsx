import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElan } from '../core/context/ElanContext.jsx';

export default function Login() {
  const { login } = useElan();
  const nav = useNavigate();

  const [f, setF] = useState({
    correo: 'admin@elanvisual.com',
    password: 'admin123',
  });

  function go() {
    const u = login(f.correo, f.password);

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
      <section className="card form">
        <h1>ELANVISUAL</h1>

        <p>Admin: admin@elanvisual.com / admin123</p>
        <p>Vendedor: vendedor@elanvisual.com / vend123</p>
        <p>Producción: produccion@elanvisual.com / prod123</p>

        <input
          placeholder="Correo"
          value={f.correo}
          onChange={(e) => setF({ ...f, correo: e.target.value })}
        />

        <input
          placeholder="Contraseña"
          type="password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />

        <button onClick={go}>Entrar</button>
      </section>
    </main>
  );
}