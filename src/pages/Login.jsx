import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck, Building2 } from 'lucide-react';
import { useCore } from '../core/context/CoreContext';
import { supabase } from '../lib/supabase';

function destinoPorRol(rol) {
  if (rol === 'admin') return 'admin';
  if (rol === 'produccion') return 'produccion';
  if (rol === 'ventas') return 'ventas';
  return 'home';
}

function rutaPorDestino(destino) {
  const rutas = {
    admin: '/admin',
    produccion: '/produccion',
    ventas: '/ventas',
    clientes: '/clientes',
    crm: '/crm',
    pedidos: '/pedidos',
    materiales: '/materiales',
    miCuenta: '/mi-cuenta',
    home: '/',
  };

  return rutas[destino] || '/';
}

const normalizar = (valor = '') =>
  String(valor || '').trim().toLowerCase();

function mapPerfil(row) {
  return {
    id: row.id,
    nombre: row.nombre || row.usuario || row.email || '',
    usuario: row.usuario || '',
    email: row.email || '',
    rol: normalizar(row.rol),
    clienteId: row.cliente_id || row.vendedor_id || row.veterinaria_id || '',
    activo: row.activo !== false,
  };
}

async function buscarPerfilOperativo(authUserId) {
  const porAuth = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (porAuth.data) return { data: porAuth.data, error: null };
  if (porAuth.error && porAuth.error.code !== 'PGRST116') return porAuth;

  // Compatibilidad con el administrador histórico, cuyo id de perfil coincide
  // con auth.users.id. Los vendedores nuevos/migrados usan auth_user_id.
  return supabase
    .from('usuarios')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();
}

export default function Login({ destino }) {
  const { usuariosCRM = [], cambiarUsuarioActivoCRM } = useCore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

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

  const entrar = async (e) => {
    e.preventDefault();
    setError('');

    const correo = normalizar(email);
    if (!correo || !password) {
      setError('Ingresá tu correo y contraseña.');
      return;
    }

    if (!supabase) {
      setError('El servicio de autenticación no está configurado.');
      return;
    }

    setEnviando(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (authError || !authData?.user?.id) {
        setError('Correo o contraseña incorrectos.');
        return;
      }

      const { data: perfilData, error: perfilError } = await buscarPerfilOperativo(authData.user.id);

      if (perfilError || !perfilData) {
        await supabase.auth.signOut();
        setError('Tu identidad no tiene un perfil operativo autorizado.');
        return;
      }

      const perfil = mapPerfil(perfilData);

      if (!perfil.activo) {
        await supabase.auth.signOut();
        setError('Este usuario está inactivo.');
        return;
      }

      if (destino === 'admin' && perfil.rol !== 'admin') {
        await supabase.auth.signOut();
        setError('Este usuario no tiene permisos de administrador.');
        return;
      }

      if (destino === 'produccion' && !['admin', 'produccion'].includes(perfil.rol)) {
        await supabase.auth.signOut();
        setError('Este usuario no tiene permisos de producción.');
        return;
      }

      sincronizarUsuarioCRM(perfil);
      localStorage.setItem('elanvisual_usuario_actual', JSON.stringify(perfil));

      const destinoFinal = destino || destinoPorRol(perfil.rol);
      window.location.assign(rutaPorDestino(destinoFinal));
    } catch (loginError) {
      console.error('Error iniciando sesión con Supabase Auth:', loginError);
      setError('No se pudo iniciar sesión. Intentá nuevamente.');
    } finally {
      setEnviando(false);
    }
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
          <label>Correo autorizado</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo autorizado"
            autoComplete="username"
            disabled={enviando}
          />

          <label>Contraseña</label>

          <div className="password-field">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              disabled={enviando}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarPassword((prev) => !prev)}
              disabled={enviando}
            >
              {mostrarPassword ? 'OCULTAR' : 'VER'}
            </button>
          </div>

          {error && <small className="error-text">{error}</small>}

          <button type="submit" disabled={enviando}>
            <LockKeyhole size={18} />
            {enviando ? 'Validando…' : 'Entrar'}
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
