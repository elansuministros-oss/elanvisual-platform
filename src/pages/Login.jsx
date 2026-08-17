import React, { useEffect, useState } from 'react';
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
  const vendedorId = row.vendedor_id || '';
  return {
    id: row.id,
    nombre: row.nombre || row.usuario || row.email || '',
    usuario: row.usuario || '',
    email: row.email || '',
    whatsapp: row.whatsapp || row.telefono || '',
    telefono: row.telefono || row.whatsapp || '',
    rol: normalizar(row.rol),
    clienteId: row.cliente_id || vendedorId || row.veterinaria_id || '',
    vendedorId,
    vendedor_id: vendedorId,
    codigoVendedor: row.codigo_vendedor || '',
    codigo_vendedor: row.codigo_vendedor || '',
    cargo: row.cargo || '',
    comisionPorcentaje: row.comision_porcentaje ?? null,
    debeCambiarPassword: row.debe_cambiar_password === true,
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

  return supabase
    .from('usuarios')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();
}

function rutaRetornoActual() {
  const actual = `${window.location.pathname || '/'}${window.location.search || ''}${window.location.hash || ''}`;

  if (!window.location.pathname.startsWith('/login')) {
    return actual;
  }

  const params = new URLSearchParams(window.location.search);
  const returnTo = String(params.get('returnTo') || '').trim();

  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  return '';
}

function destinoPermitido(perfil, destino) {
  if (!destino) return true;
  if (destino === 'admin') return perfil.rol === 'admin';
  if (destino === 'produccion') return ['admin', 'produccion'].includes(perfil.rol);
  if (destino === 'ventas') return ['admin', 'ventas'].includes(perfil.rol);
  if (destino === 'clientes') return ['admin', 'ventas'].includes(perfil.rol);
  if (destino === 'pedidos') return ['admin', 'ventas', 'produccion'].includes(perfil.rol);
  if (destino === 'materiales') return perfil.rol === 'admin';
  if (destino === 'crm') return perfil.rol === 'admin';
  return true;
}

export default function Login({ destino }) {
  const { usuariosCRM = [], cambiarUsuarioActivoCRM } = useCore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [restaurandoSesion, setRestaurandoSesion] = useState(true);

  const sincronizarUsuarioCRM = (res) => {
    const entrada = normalizar(email || res?.email || res?.usuario || res?.nombre);
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

  const completarAcceso = (perfil) => {
    sincronizarUsuarioCRM(perfil);
    localStorage.setItem('elanvisual_usuario_actual', JSON.stringify(perfil));

    if (perfil.debeCambiarPassword) {
      window.location.replace('/mi-cuenta');
      return;
    }

    const retorno = rutaRetornoActual();
    const destinoFinal = destino || destinoPorRol(perfil.rol);
    window.location.replace(retorno || rutaPorDestino(destinoFinal));
  };

  useEffect(() => {
    let activo = true;

    const restaurar = async () => {
      if (!supabase) {
        if (activo) setRestaurandoSesion(false);
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        const authUserId = data?.session?.user?.id;

        if (sessionError || !authUserId) {
          if (activo) setRestaurandoSesion(false);
          return;
        }

        const { data: perfilData, error: perfilError } = await buscarPerfilOperativo(authUserId);
        if (perfilError || !perfilData) {
          await supabase.auth.signOut();
          if (activo) setRestaurandoSesion(false);
          return;
        }

        const perfil = mapPerfil(perfilData);
        if (!perfil.activo || !destinoPermitido(perfil, destino)) {
          if (activo) setRestaurandoSesion(false);
          return;
        }

        completarAcceso(perfil);
      } catch (sessionRestoreError) {
        console.error('Error restaurando sesión ELANVISUAL:', sessionRestoreError);
        if (activo) setRestaurandoSesion(false);
      }
    };

    restaurar();

    return () => {
      activo = false;
    };
  }, [destino]);

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

      if (!destinoPermitido(perfil, destino)) {
        await supabase.auth.signOut();
        setError('Este usuario no tiene permisos para este módulo.');
        return;
      }

      completarAcceso(perfil);
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
          {restaurandoSesion
            ? 'Restaurando tu sesión segura…'
            : 'Acceso para administración, CRM, producción y operaciones internas de ELANVISUAL.'}
        </p>

        {!restaurandoSesion && (
          <form onSubmit={entrar}>
            <label>
              Correo autorizado
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="correo@empresa.com"
              />
            </label>

            <label>
              Contraseña
              <div className="password-wrap">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarPassword((actual) => !actual)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? 'OCULTAR' : 'VER'}
                </button>
              </div>
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="primary-btn" disabled={enviando}>
              <LockKeyhole size={18} />
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <Building2 size={18} />
          <span>ELANVISUAL · CRM · Producción · Seguimiento</span>
        </div>
      </section>
    </main>
  );
}
