import fs from 'fs';

const appPath = 'src/App.jsx';
const ctxPath = 'src/context/AppContext.jsx';
const cuentaPath = 'src/pages/MiCuenta.jsx';

/* =========================
   CREAR MI CUENTA
========================= */

const miCuenta = `
import React, { useMemo, useState } from 'react';
import { KeyRound, QrCode, Save, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

const limpiar = (v = '') =>
  String(v)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

const codigoVendedor = (usuario = {}) => {
  if (usuario.codigoVendedor) return usuario.codigoVendedor;
  if (usuario.codigoQR) return usuario.codigoQR;
  if (usuario.rol === 'ventas') return \`VEN-\${String(usuario.usuario || usuario.id || '001').toUpperCase().replace(/[^A-Z0-9]/g, '')}\`;
  if (usuario.usuario === 'admin') return 'ERICK-001';
  return String(usuario.id || 'USR-001').toUpperCase();
};

export default function MiCuenta({ setPage }) {
  const { usuario, usuarios = [], actualizarUsuario } = useApp();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');

  const codigo = useMemo(() => codigoVendedor(usuario || {}), [usuario]);

  const linkQR = useMemo(() => {
    const base = window.location.origin || 'https://visual.elankav.com';
    return \`\${base}/?ref=\${encodeURIComponent(codigo)}\`;
  }, [codigo]);

  const qrImg = \`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=\${encodeURIComponent(linkQR)}\`;

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

          <label>
            Contraseña actual
            <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} />
          </label>

          <label>
            Nueva contraseña
            <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          </label>

          <label>
            Confirmar nueva contraseña
            <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </label>

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
`;

fs.writeFileSync(cuentaPath, miCuenta.trim() + '\n', 'utf8');

/* =========================
   PATCH APP.JSX
========================= */

let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes("import MiCuenta from './pages/MiCuenta';")) {
  app = app.replace(
    "import DashboardERP from './pages/DashboardERP';",
    "import DashboardERP from './pages/DashboardERP';\nimport MiCuenta from './pages/MiCuenta';"
  );
}

if (!app.includes("pathInicial.startsWith('/mi-cuenta')")) {
  app = app.replace(
    "if (pathInicial.startsWith('/erp')) return 'dashboard';",
    "if (pathInicial.startsWith('/erp')) return 'dashboard';\n    if (pathInicial.startsWith('/mi-cuenta')) return 'miCuenta';"
  );
}

if (!app.includes("miCuenta: '/mi-cuenta'")) {
  app = app.replace(
    "reportes: '/reportes',",
    "reportes: '/reportes',\n        miCuenta: '/mi-cuenta',"
  );
}

if (!app.includes("erp-floating-actions")) {
  app = app.replace(
    "<Header page={page} setPage={ir} />",
    `<Header page={page} setPage={ir} />

        {usuario && page !== 'home' && (
          <div className="erp-floating-actions">
            <button type="button" onClick={() => ir('home')}>🏠 Inicio</button>
            <button type="button" onClick={() => ir('miCuenta')}>👤 Mi cuenta</button>
          </div>
        )}`
  );
}

if (!app.includes("page === 'miCuenta'")) {
  app = app.replace(
    "{page === 'dashboard' &&",
    `{page === 'miCuenta' &&
        (usuario ? <MiCuenta setPage={ir} /> : <Login setPage={ir} destino="miCuenta" />)}

      {page === 'dashboard' &&`
  );
}

fs.writeFileSync(appPath, app, 'utf8');

/* =========================
   PATCH APPCONTEXT
========================= */

let ctx = fs.readFileSync(ctxPath, 'utf8');

if (!ctx.includes('function codigoVendedorElanvisual')) {
  ctx = ctx.replace(
    'function mapUsuarioFromDb(row) {',
    `
function codigoVendedorElanvisual(usuario = {}) {
  if (usuario.codigoVendedor) return usuario.codigoVendedor;
  if (usuario.codigoQR) return usuario.codigoQR;
  if (usuario.usuario === 'admin') return 'ERICK-001';
  if (usuario.rol === 'ventas') {
    return \`VEN-\${String(usuario.usuario || usuario.id || '001')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')}\`;
  }
  return String(usuario.id || 'USR-001').toUpperCase();
}

function obtenerReferenciaVendedorElanvisual(usuarios = [], usuarioActivo = null) {
  const ref = String(localStorage.getItem('elanvisual_ref_vendedor') || '').trim();

  const buscar = (valor) => {
    const normal = String(valor || '').toLowerCase().trim();
    if (!normal) return null;

    return usuarios.find((u) => {
      const codigo = codigoVendedorElanvisual(u).toLowerCase();
      return (
        codigo === normal ||
        String(u.usuario || '').toLowerCase() === normal ||
        String(u.email || '').toLowerCase() === normal ||
        String(u.id || '').toLowerCase() === normal
      );
    });
  };

  const desdeRef = buscar(ref);
  if (desdeRef) {
    return {
      id: desdeRef.id,
      nombre: desdeRef.nombre || desdeRef.usuario || desdeRef.email,
      usuario: desdeRef.usuario,
      email: desdeRef.email,
      codigo: codigoVendedorElanvisual(desdeRef),
      rol: desdeRef.rol,
    };
  }

  if (usuarioActivo?.rol === 'ventas' || usuarioActivo?.usuario === 'admin') {
    return {
      id: usuarioActivo.id,
      nombre: usuarioActivo.nombre || usuarioActivo.usuario || usuarioActivo.email,
      usuario: usuarioActivo.usuario,
      email: usuarioActivo.email,
      codigo: codigoVendedorElanvisual(usuarioActivo),
      rol: usuarioActivo.rol,
    };
  }

  return null;
}

function crearComisionInicialElanvisual({ total = 0, costoProduccion = 0, vendedor = null }) {
  const venta = Number(total || 0);
  const costo = Number(costoProduccion || 0);
  const utilidadRealEstimada = Math.max(venta - costo, 0);
  const fondoComunitario = utilidadRealEstimada * 0.05;
  const direccionGeneral = utilidadRealEstimada * 0.05;
  const baseDistribuible = Math.max(utilidadRealEstimada - fondoComunitario - direccionGeneral, 0);
  const comisionVendedor = vendedor ? baseDistribuible * 0.4 : 0;
  const elanvisual = baseDistribuible - comisionVendedor;
  const fondoIncentivoVendedor = vendedor ? elanvisual * 0.05 : 0;

  return {
    estado: 'en_proceso',
    vendedorId: vendedor?.id || '',
    vendedorCodigo: vendedor?.codigo || '',
    vendedorNombre: vendedor?.nombre || '',
    utilidadRealEstimada,
    fondoComunitario,
    direccionGeneral,
    baseDistribuible,
    comisionVendedor,
    fondoIncentivoVendedor,
    utilidadElanvisual: Math.max(elanvisual - fondoIncentivoVendedor, 0),
    pagada: false,
    pagoSolicitado: false,
    historial: [
      {
        estado: 'en_proceso',
        fecha: new Date().toISOString(),
        nota: 'Comisión creada en proceso. Se valida hasta trabajo finalizado y pago cancelado.',
      },
    ],
  };
}

function mapUsuarioFromDb(row) {`
  );
}

if (!ctx.includes('const vendedorReferencia = obtenerReferenciaVendedorElanvisual')) {
  ctx = ctx.replace(
    "const total = Number(pedidoBase.resumen?.total || pedidoBase.total || 0);",
    `const total = Number(pedidoBase.resumen?.total || pedidoBase.total || 0);
    const costoProduccionEstimado = items.reduce(
      (acc, item) =>
        acc +
        Number(item.costoProduccion || 0) +
        (Array.isArray(item.accesoriosProduccion)
          ? item.accesoriosProduccion.reduce((suma, accItem) => suma + Number(accItem.total || accItem.precio || 0), 0)
          : 0),
      0
    );
    const vendedorReferencia =
      pedidoBase.vendedor ||
      pedidoBase.origenComercial ||
      obtenerReferenciaVendedorElanvisual(usuarios, usuario);
    const comisionInicial = crearComisionInicialElanvisual({
      total,
      costoProduccion: costoProduccionEstimado,
      vendedor: vendedorReferencia,
    });`
  );
}

if (!ctx.includes('codigoVendedor: vendedorReferencia?.codigo')) {
  ctx = ctx.replace(
    "...pedidoBase,",
    `...pedidoBase,
      vendedor: vendedorReferencia || pedidoBase.vendedor || null,
      vendedorId: vendedorReferencia?.id || pedidoBase.vendedorId || '',
      vendedorNombre: vendedorReferencia?.nombre || pedidoBase.vendedorNombre || '',
      codigoVendedor: vendedorReferencia?.codigo || pedidoBase.codigoVendedor || '',
      costos: {
        ...(pedidoBase.costos || {}),
        produccionEstimada: costoProduccionEstimado,
      },
      comisiones: pedidoBase.comisiones || comisionInicial,
      utilidad: pedidoBase.utilidad || {
        utilidadRealEstimada: comisionInicial.utilidadRealEstimada,
        fondoComunitario: comisionInicial.fondoComunitario,
        direccionGeneral: comisionInicial.direccionGeneral,
        comisionVendedor: comisionInicial.comisionVendedor,
        fondoIncentivoVendedor: comisionInicial.fondoIncentivoVendedor,
        utilidadElanvisual: comisionInicial.utilidadElanvisual,
      },`
  );
}

fs.writeFileSync(ctxPath, ctx, 'utf8');

/* =========================
   PATCH CSS
========================= */

const cssPath = 'src/styles/global.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('erp-floating-actions')) {
  css += `

/* FON-04 / FON-05 / FON-06 APP ERP */
.erp-floating-actions{
  position:fixed;
  right:14px;
  bottom:16px;
  z-index:9999;
  display:flex;
  gap:8px;
  padding:8px;
  border-radius:999px;
  background:rgba(15,23,42,.92);
  backdrop-filter:blur(16px);
  box-shadow:0 18px 45px rgba(0,0,0,.28);
}
.erp-floating-actions button{
  border:0;
  border-radius:999px;
  padding:11px 14px;
  font-weight:900;
  background:#d4af37;
  color:#111827;
  cursor:pointer;
}
.erp-floating-actions button:last-child{
  background:#fff;
  color:#111827;
}

.mi-cuenta-page{
  min-height:100vh;
  background:#f4f6fb;
  padding:14px;
  display:grid;
  gap:14px;
}
.mi-cuenta-hero,
.mi-cuenta-card{
  background:#fff;
  border-radius:24px;
  padding:18px;
  box-shadow:0 14px 35px rgba(15,23,42,.08);
}
.mi-cuenta-hero span{
  font-size:12px;
  font-weight:950;
  color:#b48722;
  text-transform:uppercase;
}
.mi-cuenta-hero h1{
  margin:8px 0;
  font-size:32px;
  color:#111827;
  line-height:1;
}
.mi-cuenta-hero p{
  margin:0;
  color:#64748b;
  font-weight:800;
}
.mi-cuenta-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:14px;
  align-items:start;
}
.mi-cuenta-title{
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:14px;
  color:#111827;
}
.mi-cuenta-title h2{
  margin:0;
}
.mi-info{
  display:grid;
  gap:10px;
  margin-bottom:16px;
}
.mi-info p{
  margin:0;
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:12px;
  border-radius:16px;
  background:#f8fafc;
  color:#64748b;
  font-weight:800;
}
.mi-info b{
  color:#111827;
  text-align:right;
}
.mi-cuenta-card label{
  display:grid;
  gap:7px;
  font-weight:900;
  color:#334155;
  margin-bottom:12px;
}
.mi-cuenta-card input{
  width:100%;
  border:1px solid #cbd5e1;
  border-radius:16px;
  padding:13px;
  font-weight:800;
}
.qr-box{
  display:grid;
  place-items:center;
  background:#f8fafc;
  border:1px dashed #cbd5e1;
  border-radius:20px;
  padding:16px;
}
.qr-box img{
  width:220px;
  height:220px;
  max-width:100%;
}
.qr-link{
  word-break:break-all;
  color:#475569;
  font-weight:800;
}
.mi-msg{
  background:#ecfdf5;
  border:1px solid #bbf7d0;
  color:#065f46;
  border-radius:16px;
  padding:12px;
  font-weight:900;
}
@media(max-width:760px){
  .mi-cuenta-grid{grid-template-columns:1fr}
  .erp-floating-actions{
    left:12px;
    right:12px;
    bottom:12px;
    justify-content:space-between;
  }
  .erp-floating-actions button{
    flex:1;
  }
  .mi-cuenta-page{
    padding-bottom:86px;
  }
}
`;
}

fs.writeFileSync(cssPath, css, 'utf8');

console.log('FON-04/05/06/07 aplicado: navegación ERP, Mi Cuenta, QR vendedor y referencia comercial.');
