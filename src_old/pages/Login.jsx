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
    <main className="login elan-login-page">
      <style>
        {`
          .elan-login-page {
            min-height: calc(100vh - 90px) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 42px 18px !important;
            background: #f4f6f8 !important;
          }

          .elan-login-card {
            width: min(520px, 92vw) !important;
            padding: 42px 34px !important;
            border-radius: 28px !important;
            background: #ffffff !important;
          }

          .elan-login-card h1 {
            font-size: 42px !important;
            line-height: 1 !important;
            font-weight: 950 !important;
            margin: 0 0 14px !important;
            color: #101826 !important;
          }

          .elan-login-card p {
            font-size: 20px !important;
            line-height: 1.25 !important;
            margin: 0 0 30px !important;
            color: #667085 !important;
          }

          .elan-login-card input {
            width: 100% !important;
            min-height: 58px !important;
            font-size: 20px !important;
            padding: 16px 18px !important;
            border-radius: 16px !important;
            box-sizing: border-box !important;
          }

          .elan-login-card button[type="submit"] {
            width: 100% !important;
            min-height: 62px !important;
            font-size: 22px !important;
            font-weight: 900 !important;
            border-radius: 18px !important;
          }

          .elan-password-wrap {
            position: relative !important;
            width: 100% !important;
          }

          .elan-password-wrap input {
            padding-right: 74px !important;
          }

          .elan-password-eye {
            position: absolute !important;
            right: 8px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: 54px !important;
            height: 54px !important;
            min-width: 54px !important;
            min-height: 54px !important;
            padding: 0 !important;
            border-radius: 14px !important;
            font-size: 24px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          @media (max-width: 850px) {
            .elan-login-page {
              min-height: 100vh !important;
              padding: 36px 24px !important;
              align-items: flex-start !important;
              padding-top: 150px !important;
            }

            .elan-login-card {
              width: 100% !important;
              padding: 54px 34px !important;
              border-radius: 34px !important;
            }

            .elan-login-card h1 {
              font-size: 60px !important;
              margin-bottom: 20px !important;
            }

            .elan-login-card p {
              font-size: 32px !important;
              line-height: 1.18 !important;
              margin-bottom: 42px !important;
            }

            .elan-login-card input {
              min-height: 92px !important;
              font-size: 34px !important;
              padding: 24px 26px !important;
              border-radius: 24px !important;
            }

            .elan-password-wrap input {
              padding-right: 118px !important;
            }

            .elan-password-eye {
              width: 84px !important;
              height: 84px !important;
              min-width: 84px !important;
              min-height: 84px !important;
              right: 8px !important;
              border-radius: 22px !important;
              font-size: 38px !important;
            }

            .elan-login-card button[type="submit"] {
              min-height: 96px !important;
              font-size: 38px !important;
              border-radius: 26px !important;
              margin-top: 10px !important;
            }
          }
        `}
      </style>

      <form className="card form elan-login-card" onSubmit={go}>
        <h1>ELANVISUAL</h1>
        <p>Acceso privado del sistema</p>

        <input
          placeholder="Correo"
          type="email"
          autoComplete="username"
          value={f.correo}
          onChange={(e) => setF({ ...f, correo: e.target.value })}
        />

        <div className="password-wrap elan-password-wrap">
          <input
            placeholder="Contraseña"
            type={verPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />

          <button
            type="button"
            className="password-eye elan-password-eye"
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