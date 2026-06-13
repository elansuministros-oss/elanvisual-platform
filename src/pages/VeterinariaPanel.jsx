import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { etiquetasEstado, useApp } from '../context/AppContext';

const formatoC$ = (valor) => {
  const numero = Number(valor || 0);
  return `C$ ${numero.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function VeterinariaPanel() {
  const { veterinaria, pedidos, usuario, actualizarUsuario } = useApp();

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  if (!usuario || usuario.rol !== 'veterinaria') {
    return (
      <main>
        <section className="panel">
          <h1>Acceso restringido</h1>
          <p>Este panel es solo para usuarios de veterinaria.</p>
        </section>
      </main>
    );
  }

  if (!veterinaria?.id) {
    return (
      <main>
        <section className="panel">
          <h1>Veterinaria no asignada</h1>
          <p>Este usuario no tiene una veterinaria activa asignada.</p>
        </section>
      </main>
    );
  }

  const cambiarMiPassword = async (e) => {
    e.preventDefault();

    setMensajePassword('');
    setErrorPassword('');

    if (String(passwordActual).trim() !== String(usuario.password).trim()) {
      setErrorPassword('La contraseña actual no coincide.');
      return;
    }

    if (String(passwordNueva).trim().length < 6) {
      setErrorPassword('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    const res = await actualizarUsuario({
      ...usuario,
      password: String(passwordNueva).trim(),
      debeCambiarPassword: false,
    });

    if (res?.ok === false) {
      setErrorPassword(res.error || 'No se pudo actualizar la contraseña.');
      return;
    }

    setPasswordActual('');
    setPasswordNueva('');
    setPasswordConfirmar('');
    setMensajePassword('Contraseña actualizada correctamente.');
  };

  const url = `https://pet.elankav.com/v/${veterinaria.codigo}`;
  const misPedidos = pedidos.filter((p) => {
    const vetIdPedido = p.veterinariaId || p.veterinaria?.id || '';
    const vetCodigoPedido = p.veterinariaCodigo || p.veterinaria?.codigo || '';

    return (
      vetIdPedido === veterinaria.id ||
      vetCodigoPedido === veterinaria.codigo ||
      p.veterinaria?.slug === veterinaria.slug
    );
  });
  const entregados = misPedidos.filter((p) => p.estado === 'entregado');

  const comisionesPendientes = entregados.filter(
    (p) => p.comisionEstado === 'pendiente'
  );

  const comisionesPagadas = entregados.filter(
    (p) => p.comisionEstado === 'pagada'
  );

  const totalVendido = entregados.reduce(
    (a, p) => a + (p.resumen?.total || 0),
    0
  );

  const totalComisionPendiente = comisionesPendientes.reduce(
    (a, p) => a + (p.resumen?.comision || 0),
    0
  );

  const totalComisionPagada = comisionesPagadas.reduce(
    (a, p) => a + (p.resumen?.comision || 0),
    0
  );

  return (
    <main>
      <h1>Mi Panel Veterinaria</h1>

      <div className="dashboard">
        <section className="panel">
          <h2>{veterinaria.nombre}</h2>
          <p>
            Código: <b>{veterinaria.codigo}</b>
          </p>
          <QRCodeCanvas value={url} size={180} />
          <p>{url}</p>
        </section>

        <section className="panel">
          <h2>Mis resultados</h2>
          <div className="stats">
            <b>{misPedidos.length}</b>
            <span>Pedidos generados</span>

            <b>{entregados.length}</b>
            <span>Ventas entregadas</span>

            <b>{formatoC$(totalVendido)}</b>
            <span>Total vendido entregado</span>

            <b>{formatoC$(totalComisionPendiente)}</b>
            <span>Comisión pendiente</span>

            <b>{formatoC$(totalComisionPagada)}</b>
            <span>Comisión pagada</span>
          </div>
          <p className="note">
            La comisión se muestra como pendiente únicamente cuando el pedido fue
            entregado.
          </p>
        </section>
      </div>

      <section className="panel section-block">
        <h2>
          <LockKeyhole size={20} /> Cambiar mi contraseña
        </h2>

        <form className="form-grid" onSubmit={cambiarMiPassword}>
          <label>
            Contraseña actual
            <div className="password-field">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Contraseña actual"
              />
            </div>
          </label>

          <label>
            Nueva contraseña
            <div className="password-field">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Nueva contraseña"
              />
            </div>
          </label>

          <label>
            Confirmar nueva contraseña
            <div className="password-field">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setMostrarPassword((prev) => !prev)}
              >
                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit">Guardar contraseña</button>
        </form>

        {mensajePassword && <p className="success-msg">{mensajePassword}</p>}
        {errorPassword && <p className="error-text">{errorPassword}</p>}
      </section>

      <section className="panel section-block">
        <h2>Pedidos referidos</h2>

        {misPedidos.length === 0 ? (
          <p>No hay pedidos generados por este QR todavía.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Comisión</th>
              </tr>
            </thead>
            <tbody>
              {misPedidos.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigoSeguimiento || p.numero}</td>
                  <td>{p.cliente?.nombre}</td>
                  <td>{formatoC$(p.resumen?.total || 0)}</td>
                  <td>
                    {etiquetasEstado[p.estadoProduccion] ||
                      etiquetasEstado[p.estado] ||
                      p.estado}
                  </td>
                  <td>
                    {p.comisionEstado === 'pendiente' ||
                    p.comisionEstado === 'pagada'
                      ? formatoC$(p.resumen?.comision || 0)
                      : 'No generada'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
