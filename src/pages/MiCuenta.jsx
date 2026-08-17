import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, QrCode, Save, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

const limpiar = (v = '') =>
  String(v)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

const codigoVendedor = (usuario = {}) => {
  if (usuario.codigoVendedor) return usuario.codigoVendedor;
  if (usuario.codigoQR) return usuario.codigoQR;
  if (usuario.rol === 'ventas') return `VEN-${String(usuario.usuario || usuario.id || '001').toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  if (usuario.usuario === 'admin') return 'ERICK-001';
  return String(usuario.id || 'USR-001').toUpperCase();
};

function PasswordField({ label, value, onChange, visible, onToggle, autoComplete }) {
  return (
    <label>
      {label}
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{ paddingRight: '3.5rem', width: '100%' }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            border: 0,
            background: 'transparent',
            padding: '0.45rem',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: 'inherit'
          }}
        >
          {visible ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      </div>
    </label>
  );
}

export default function MiCuenta({ setPage }) {
  const { usuario, usuarios = [], actualizarUsuario } = useApp();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const codigo = useMemo(() => codigoVendedor(usuario || {}), [usuario]);

  const linkQR = useMemo(() => {
    const base = window.location.origin || 'https://visual.elankav.com';
    return `${base}/?ref=${encodeURIComponent(codigo)}`;
  }, [codigo]);

  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(linkQR)}`;

  const guardarPassword = () => {
    setMensaje('');

    if (!usuario) {
      setMensaje('No hay usuario activo.');
      return;
    }

    if (String(usuario.password || '') !== actual) {
      setMensaje('La contraseña actual no coincide.');
      return;
    }

    if (nueva.length < 8) {
      setMensaje('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nueva !== confirmar) {
      setMensaje('La confirmación no coincide.');
      return;
    }

    actualizarUsuario({
      ...usuario,
      password: nueva,
      debeCambiarPassword: false,
      codigoVendedor: codigo,
      linkQR,
      actualizadoEn: new Date().toISOString(),
    });

    setActual('');
    setNueva('');
    setConfirmar('');
    setVerActual(false);
    setVerNueva(false);
    setVerConfirmar(false);
    setMensaje('Contraseña actualizada correctamente.');
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkQR);
      setMensaje('Link QR copiado.');
    } catch {
      setMensaje(linkQR);
    }
  };

  if (!usuario) {
    return (
      <main className="mi-cuenta-page">
        <section className="mi-cuenta-card">
          <h1>Mi Cuenta</h1>
          <p>Iniciá sesión para ver tu perfil.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mi-cuenta-page">
      <section className="mi-cuenta-hero">
        <span>ELANVISUAL · PERFIL</span>
        <h1>Mi Cuenta</h1>
        <p>Contraseña, QR comercial y acceso operativo.</p>
      </section>

      <section className="mi-cuenta-grid">
        <article className="mi-cuenta-card">
          <div className="mi-cuenta-title">
            <UserRound size={22} />
            <h2>Usuario</h2>
          </div>

          <div className="mi-info">
            <p><span>Usuario</span><b>{usuario.usuario}</b></p>
            <p><span>Correo</span><b>{usuario.email}</b></p>
            <p><span>Rol</span><b>{usuario.rol}</b></p>
            <p><span>Código</span><b>{codigo}</b></p>
          </div>

          <button type="button" className="secondary-btn" onClick={() => setPage?.('home')}>
            Ir al inicio público
          </button>
        </article>

        <article className="mi-cuenta-card">
          <div className="mi-cuenta-title">
            <KeyRound size={22} />
            <h2>Cambiar contraseña</h2>
          </div>

          <PasswordField
            label="Contraseña actual"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            visible={verActual}
            onToggle={() => setVerActual((value) => !value)}
            autoComplete="current-password"
          />

          <PasswordField
            label="Nueva contraseña"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            visible={verNueva}
            onToggle={() => setVerNueva((value) => !value)}
            autoComplete="new-password"
          />

          <PasswordField
            label="Confirmar nueva contraseña"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            visible={verConfirmar}
            onToggle={() => setVerConfirmar((value) => !value)}
            autoComplete="new-password"
          />

          <small>
            Podés tocar el ojo para verificar cada contraseña antes de guardarla.
          </small>

          <button type="button" className="primary-btn" onClick={guardarPassword}>
            <Save size={18} />
            Guardar contraseña
          </button>

          {mensaje && <p className="mi-msg">{mensaje}</p>}
        </article>

        <article className="mi-cuenta-card">
          <div className="mi-cuenta-title">
            <QrCode size={22} />
            <h2>QR comercial</h2>
          </div>

          <div className="qr-box">
            <img src={qrImg} alt="QR vendedor ELANVISUAL" />
          </div>

          <p className="qr-link">{linkQR}</p>

          <button type="button" className="secondary-btn" onClick={copiar}>
            Copiar link
          </button>

          <small>
            Cuando un cliente entra por este QR, el pedido queda marcado con este código vendedor.
          </small>
        </article>
      </section>
    </main>
  );
}
