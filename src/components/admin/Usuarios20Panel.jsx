import React, { useMemo, useState } from 'react';
import { ShieldCheck, Pencil, Trash2, Eye, EyeOff, KeyRound, Copy, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const baseUsuario = {
  id: '',
  nombre: '',
  usuario: '',
  email: '',
  password: '',
  rol: 'ventas',
  activo: true,
  debeCambiarPassword: true,
  debe_cambiar_password: true,
  codigoVendedor: '',
  codigo_vendedor: '',
  unidadNegocio: 'ELANVISUAL',
  unidad_negocio: 'ELANVISUAL',
  whatsapp: '',
  comisionPorcentaje: 10,
  comision_porcentaje: 10,
  banco: '',
  numeroCuenta: '',
  numero_cuenta: '',
  tipoCuenta: '',
  tipo_cuenta: '',
  titularCuenta: '',
  titular_cuenta: '',
  monedaCuenta: 'NIO',
  moneda_cuenta: 'NIO',
  observaciones: '',
  estadoInformacion: 'pendiente',
};

function valor(usuario, camel, snake, fallback = '') {
  return usuario?.[camel] ?? usuario?.[snake] ?? fallback;
}

function limpiarTexto(v = '') {
  return String(v || '').trim();
}

function generarPasswordTemporal() {
  return `ELAN-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generarUsuario(nombre = '', email = '') {
  if (email && email.includes('@')) return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const partes = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  return `${partes[0][0] || ''}${partes[1] || partes[0] || ''}`.replace(/[^a-z0-9]/g, '');
}

function codigoVendedor(usuario = '') {
  return usuario ? `VEN-${String(usuario).toUpperCase().replace(/[^A-Z0-9]/g, '')}` : '';
}

function detectarBanco(texto = '') {
  const t = texto.toLowerCase();
  if (t.includes('bac')) return 'BAC';
  if (t.includes('banpro')) return 'BANPRO';
  if (t.includes('lafise')) return 'LAFISE';
  if (t.includes('bdf')) return 'BDF';
  if (t.includes('ficohsa')) return 'FICOHSA';
  if (t.includes('avanz')) return 'AVANZ';
  return '';
}

function detectarMoneda(texto = '') {
  const t = texto.toLowerCase();
  if (t.includes('dolar') || t.includes('dólar') || t.includes('usd') || t.includes('$')) return 'USD';
  if (t.includes('cordoba') || t.includes('córdoba') || t.includes('nio') || t.includes('c$')) return 'NIO';
  return 'NIO';
}

function detectarTelefono(texto = '') {
  const matches = texto.match(/(?:\+?505[\s-]?)?(?:[578]\d{3}[\s-]?\d{4})/g);
  if (!matches?.length) return '';
  return matches[0].replace(/[^\d]/g, '').replace(/^505/, '');
}

function detectarEmail(texto = '') {
  return texto.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
}

function detectarCuenta(texto = '') {
  const limpio = texto.replace(/\b505\b/g, '');
  const cuentas = limpio.match(/\b\d{7,20}\b/g) || [];
  const cuenta = cuentas.find((n) => !/^[578]\d{7}$/.test(n));
  return cuenta || '';
}

function detectarCedula(texto = '') {
  return texto.match(/\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]?\b/i)?.[0] || '';
}

function detectarNombre(texto = '', email = '') {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const descartes = /(ced|cedula|cédula|cta|cuenta|bac|banpro|lafise|bdf|ficohsa|cordoba|córdoba|dolar|dólar|whatsapp|tel|correo|@|\d{7,})/i;
  const candidata = lineas.find((l) => !descartes.test(l) && l.split(/\s+/).length >= 2);
  if (candidata) return candidata;
  if (email) return email.split('@')[0].replace(/[._-]/g, ' ');
  return '';
}

function analizarContacto(texto = '') {
  const email = detectarEmail(texto);
  const nombre = detectarNombre(texto, email);
  const usuario = generarUsuario(nombre, email);
  const whatsapp = detectarTelefono(texto);
  const banco = detectarBanco(texto);
  const numeroCuenta = detectarCuenta(texto);
  const monedaCuenta = detectarMoneda(texto);
  const cedula = detectarCedula(texto);
  const password = generarPasswordTemporal();

  const faltantes = [];
  if (!nombre) faltantes.push('nombre');
  if (!whatsapp) faltantes.push('WhatsApp');
  if (!email) faltantes.push('correo');

  return {
    nombre,
    usuario,
    email,
    whatsapp,
    banco,
    numeroCuenta,
    numero_cuenta: numeroCuenta,
    monedaCuenta,
    moneda_cuenta: monedaCuenta,
    titularCuenta: nombre,
    titular_cuenta: nombre,
    password,
    codigoVendedor: codigoVendedor(usuario),
    codigo_vendedor: codigoVendedor(usuario),
    comisionPorcentaje: 10,
    comision_porcentaje: 10,
    rol: 'ventas',
    activo: true,
    debeCambiarPassword: true,
    debe_cambiar_password: true,
    unidadNegocio: 'ELANVISUAL',
    unidad_negocio: 'ELANVISUAL',
    observaciones: [cedula ? `Cédula: ${cedula}` : '', !whatsapp ? 'Pendiente información: falta WhatsApp.' : '']
      .filter(Boolean)
      .join('\n'),
    estadoInformacion: faltantes.length ? 'pendiente' : 'completo',
    faltantes,
  };
}

function normalizarForm(usuario = {}) {
  const codigo = valor(usuario, 'codigoVendedor', 'codigo_vendedor', '');
  const unidad = valor(usuario, 'unidadNegocio', 'unidad_negocio', 'ELANVISUAL');
  const comision = valor(usuario, 'comisionPorcentaje', 'comision_porcentaje', usuario.rol === 'ventas' ? 10 : 0);
  const debeCambiar = valor(usuario, 'debeCambiarPassword', 'debe_cambiar_password', true);
  const numeroCuenta = valor(usuario, 'numeroCuenta', 'numero_cuenta', '');
  const tipoCuenta = valor(usuario, 'tipoCuenta', 'tipo_cuenta', '');
  const titularCuenta = valor(usuario, 'titularCuenta', 'titular_cuenta', '');
  const monedaCuenta = valor(usuario, 'monedaCuenta', 'moneda_cuenta', 'NIO');

  const faltantes = [];
  if (!limpiarTexto(usuario.nombre)) faltantes.push('nombre');
  if (!limpiarTexto(usuario.whatsapp)) faltantes.push('WhatsApp');
  if (!limpiarTexto(usuario.email)) faltantes.push('correo');

  return {
    ...baseUsuario,
    ...usuario,
    activo: usuario.activo !== false,
    debeCambiarPassword: debeCambiar !== false,
    debe_cambiar_password: debeCambiar !== false,
    codigoVendedor: codigo,
    codigo_vendedor: codigo,
    unidadNegocio: unidad,
    unidad_negocio: unidad,
    comisionPorcentaje: Number(comision || 0),
    comision_porcentaje: Number(comision || 0),
    numeroCuenta,
    numero_cuenta: numeroCuenta,
    tipoCuenta,
    tipo_cuenta: tipoCuenta,
    titularCuenta,
    titular_cuenta: titularCuenta,
    monedaCuenta,
    moneda_cuenta: monedaCuenta,
    estadoInformacion: faltantes.length ? 'pendiente' : 'completo',
  };
}

export default function Usuarios20Panel() {
  const { usuarios = [], crearUsuario, actualizarUsuario, eliminarUsuario } = useApp();

  const [form, setForm] = useState(baseUsuario);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [captura, setCaptura] = useState('');
  const [resultadoIA, setResultadoIA] = useState(null);

  const resumen = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter((u) => u.activo !== false).length,
    vendedores: usuarios.filter((u) => u.rol === 'ventas').length,
    pendientes: usuarios.filter((u) => !u.whatsapp || !u.email).length,
  }), [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuarios;

    return usuarios.filter((u) =>
      [u.nombre, u.usuario, u.email, u.rol, u.whatsapp, valor(u, 'codigoVendedor', 'codigo_vendedor'), u.banco, valor(u, 'numeroCuenta', 'numero_cuenta')]
        .join(' ')
        .toLowerCase()
        .includes(texto)
    );
  }, [usuarios, busqueda]);

  const cambiar = (campo, valorCampo) => {
    setForm((prev) => {
      const nuevo = { ...prev, [campo]: valorCampo };

      if (campo === 'usuario') {
        nuevo.codigoVendedor = codigoVendedor(valorCampo);
        nuevo.codigo_vendedor = codigoVendedor(valorCampo);
      }

      if (campo === 'codigoVendedor') nuevo.codigo_vendedor = valorCampo;
      if (campo === 'unidadNegocio') nuevo.unidad_negocio = valorCampo;
      if (campo === 'comisionPorcentaje') nuevo.comision_porcentaje = Number(valorCampo || 0);
      if (campo === 'numeroCuenta') nuevo.numero_cuenta = valorCampo;
      if (campo === 'tipoCuenta') nuevo.tipo_cuenta = valorCampo;
      if (campo === 'titularCuenta') nuevo.titular_cuenta = valorCampo;
      if (campo === 'monedaCuenta') nuevo.moneda_cuenta = valorCampo;
      if (campo === 'debeCambiarPassword') nuevo.debe_cambiar_password = Boolean(valorCampo);

      const faltantes = [];
      if (!limpiarTexto(nuevo.nombre)) faltantes.push('nombre');
      if (!limpiarTexto(nuevo.whatsapp)) faltantes.push('WhatsApp');
      if (!limpiarTexto(nuevo.email)) faltantes.push('correo');
      nuevo.estadoInformacion = faltantes.length ? 'pendiente' : 'completo';

      return nuevo;
    });
  };

  const analizarCaptura = () => {
    if (!captura.trim()) return alert('Pegá primero los datos del contacto.');
    const datos = analizarContacto(captura);
    setResultadoIA(datos);
    setForm((prev) => normalizarForm({ ...prev, ...datos }));
  };

  const limpiar = () => {
    setForm(baseUsuario);
    setEditandoId(null);
    setResultadoIA(null);
  };

  const guardar = () => {
    if (!form.nombre.trim()) return alert('Escribí el nombre completo.');
    if (!form.usuario.trim()) return alert('Escribí el usuario.');
    if (!form.email.trim()) return alert('Escribí el correo.');

    const payload = normalizarForm({
      ...form,
      password: form.password?.trim() || undefined,
      actualizadoEn: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    });

    if (editandoId) {
      actualizarUsuario(payload);
      limpiar();
      return;
    }

    if (!form.password.trim()) return alert('Escribí una contraseña temporal.');

    crearUsuario({
      ...payload,
      id: undefined,
      creadoEn: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    limpiar();
    setCaptura('');
  };

  const editar = (usuario) => {
    setEditandoId(usuario.id);
    setForm(normalizarForm(usuario));
    setResultadoIA(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetPassword = (usuario) => {
    const temporal = generarPasswordTemporal();
    actualizarUsuario({
      ...usuario,
      password: temporal,
      debeCambiarPassword: true,
      debe_cambiar_password: true,
      actualizadoEn: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    });
    navigator.clipboard?.writeText(temporal);
    alert(`Contraseña temporal generada y copiada: ${temporal}`);
  };

  const copiarQR = (usuario) => {
    const codigo = valor(usuario, 'codigoVendedor', 'codigo_vendedor') || codigoVendedor(usuario.usuario || usuario.id);
    const link = `${window.location.origin}/?ref=${encodeURIComponent(codigo)}`;
    navigator.clipboard?.writeText(link);
    alert('Link QR copiado.');
  };

  const estadoActual = form.estadoInformacion === 'completo' ? 'Completo' : 'Pendiente información';

  return (
    <section className="panel usuarios20">
      <style>{`
        .usuarios20-header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px}
        .usuarios20-title{display:grid;gap:4px}.usuarios20-title h2{margin:0;display:flex;align-items:center;gap:8px}.usuarios20-title p{margin:0;color:#64748b;font-size:14px}
        .usuarios20-cards{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:10px;margin-bottom:18px}.usuarios20-card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fff}.usuarios20-card span{display:block;color:#64748b;font-size:12px}.usuarios20-card strong{font-size:24px;color:#0f172a}
        .usuarios20-form{display:grid;gap:16px;margin-bottom:22px}.usuarios20-block{border:1px solid #e2e8f0;border-radius:18px;padding:16px;background:#f8fafc}.usuarios20-block h3{margin:0 0 12px;font-size:15px;color:#0f172a;display:flex;align-items:center;gap:8px}
        .usuarios20-grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:12px}
        .usuarios20-grid input,.usuarios20-grid select,.usuarios20-block textarea,.usuarios20-search{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;font-size:14px;background:#fff}.usuarios20-block textarea{min-height:95px;resize:vertical}.usuarios20-capture{min-height:120px!important}
        .usuarios20-check{display:flex;align-items:center;gap:8px;font-size:14px;color:#334155}.usuarios20-actions{display:flex;gap:10px;flex-wrap:wrap}
        .usuarios20-btn{border:0;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;background:#0f172a;color:#fff}.usuarios20-btn.secondary{background:#e2e8f0;color:#0f172a}.usuarios20-btn.danger{background:#b91c1c;color:#fff}.usuarios20-btn.warn{background:#f59e0b;color:#111827}
        .usuarios20-status{display:inline-flex;width:fit-content;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:800}.usuarios20-status.ok{background:#dcfce7;color:#166534}.usuarios20-status.pending{background:#fef3c7;color:#92400e}
        .usuarios20-list{display:grid;gap:12px;margin-top:14px}.usuarios20-row{border:1px solid #e2e8f0;border-radius:18px;padding:14px;background:#fff;display:grid;grid-template-columns:1.2fr .9fr .9fr auto;gap:14px;align-items:center}.usuarios20-row strong{color:#0f172a}.usuarios20-row span,.usuarios20-row small{display:block;color:#64748b;font-size:13px}
        .usuarios20-row-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.usuarios20-mini{padding:8px 10px;font-size:12px}
        @media(max-width:900px){.usuarios20-cards,.usuarios20-grid,.usuarios20-row{grid-template-columns:1fr}.usuarios20-row-actions{justify-content:flex-start}}
      `}</style>

      <div className="usuarios20-header">
        <div className="usuarios20-title">
          <h2><ShieldCheck size={20} /> Usuarios 2.0</h2>
          <p>Captura inteligente, autollenado, comisión, WhatsApp y datos bancarios.</p>
        </div>
        <button type="button" className="usuarios20-btn secondary" onClick={limpiar}>Nuevo usuario</button>
      </div>

      <div className="usuarios20-cards">
        <div className="usuarios20-card"><span>Total</span><strong>{resumen.total}</strong></div>
        <div className="usuarios20-card"><span>Activos</span><strong>{resumen.activos}</strong></div>
        <div className="usuarios20-card"><span>Vendedores</span><strong>{resumen.vendedores}</strong></div>
        <div className="usuarios20-card"><span>Pendientes</span><strong>{resumen.pendientes}</strong></div>
      </div>

      <div className="usuarios20-form">
        <div className="usuarios20-block">
          <h3><Sparkles size={18} /> Captura inteligente</h3>
          <textarea className="usuarios20-capture" placeholder="Pegá aquí datos copiados de WhatsApp, correo o mensaje del contacto..." value={captura} onChange={(e) => setCaptura(e.target.value)} />
          <div className="usuarios20-actions" style={{ marginTop: 10 }}>
            <button type="button" className="usuarios20-btn" onClick={analizarCaptura}><Sparkles size={16} /> Analizar y llenar</button>
            <span className={`usuarios20-status ${form.estadoInformacion === 'completo' ? 'ok' : 'pending'}`}>
              {form.estadoInformacion === 'completo' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {estadoActual}
            </span>
          </div>
          {resultadoIA?.faltantes?.length > 0 && <small style={{ display: 'block', marginTop: 8, color: '#92400e' }}>Falta: {resultadoIA.faltantes.join(', ')}</small>}
        </div>

        <div className="usuarios20-block">
          <h3>{editandoId ? 'Editar usuario' : 'Crear usuario'}</h3>
          <div className="usuarios20-grid">
            <input placeholder="Nombre completo" value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
            <input placeholder="Usuario" value={form.usuario} onChange={(e) => cambiar('usuario', e.target.value)} />
            <input placeholder="Correo" value={form.email} onChange={(e) => cambiar('email', e.target.value)} />
            <input placeholder="WhatsApp pendiente si no se detecta" value={form.whatsapp} onChange={(e) => cambiar('whatsapp', e.target.value)} />
          </div>
        </div>

        <div className="usuarios20-block">
          <h3>Acceso y comercial</h3>
          <div className="usuarios20-grid">
            <select value={form.rol} onChange={(e) => cambiar('rol', e.target.value)}>
              <option value="admin">admin</option>
              <option value="ventas">ventas</option>
              <option value="produccion">produccion</option>
            </select>
            <input placeholder={editandoId ? 'Nueva contraseña opcional' : 'Contraseña temporal'} value={form.password || ''} onChange={(e) => cambiar('password', e.target.value)} />
            <input type="number" placeholder="Comisión %" value={form.comisionPorcentaje} onChange={(e) => cambiar('comisionPorcentaje', e.target.value)} />
            <input placeholder="Código vendedor automático" value={form.codigoVendedor} onChange={(e) => cambiar('codigoVendedor', e.target.value)} />
            <label className="usuarios20-check"><input type="checkbox" checked={form.activo !== false} onChange={(e) => cambiar('activo', e.target.checked)} /> Usuario activo</label>
          </div>
        </div>

        <div className="usuarios20-block">
          <h3>Datos bancarios</h3>
          <div className="usuarios20-grid">
            <input placeholder="Banco" value={form.banco} onChange={(e) => cambiar('banco', e.target.value)} />
            <input placeholder="Número de cuenta" value={form.numeroCuenta} onChange={(e) => cambiar('numeroCuenta', e.target.value)} />
            <input placeholder="Tipo de cuenta" value={form.tipoCuenta} onChange={(e) => cambiar('tipoCuenta', e.target.value)} />
            <input placeholder="Titular" value={form.titularCuenta} onChange={(e) => cambiar('titularCuenta', e.target.value)} />
            <select value={form.monedaCuenta} onChange={(e) => cambiar('monedaCuenta', e.target.value)}>
              <option value="NIO">NIO</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="usuarios20-block">
          <h3>Observaciones</h3>
          <textarea placeholder="Notas administrativas, cédula o datos pendientes..." value={form.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} />
        </div>

        <div className="usuarios20-actions">
          <button type="button" className="usuarios20-btn" onClick={guardar}>{editandoId ? 'Guardar cambios' : 'Crear usuario'}</button>
          {editandoId && <button type="button" className="usuarios20-btn secondary" onClick={limpiar}>Cancelar edición</button>}
        </div>
      </div>

      <input className="usuarios20-search" placeholder="Buscar usuario, correo, WhatsApp, banco o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      <div className="usuarios20-list">
        {usuariosFiltrados.map((u) => {
          const codigo = valor(u, 'codigoVendedor', 'codigo_vendedor', '');
          const comision = valor(u, 'comisionPorcentaje', 'comision_porcentaje', 0);
          const numeroCuenta = valor(u, 'numeroCuenta', 'numero_cuenta', '');
          const estadoPendiente = !u.whatsapp || !u.email;

          return (
            <article className="usuarios20-row" key={u.id}>
              <div>
                <strong>{u.nombre || u.usuario}</strong>
                <span>{u.usuario} · {u.email || 'Sin correo'}</span>
                <small>{u.whatsapp || 'Pendiente WhatsApp'}</small>
              </div>
              <div>
                <span className={`usuarios20-status ${estadoPendiente ? 'pending' : 'ok'}`}>
                  {estadoPendiente ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  {estadoPendiente ? 'Pendiente información' : 'Completo'}
                </span>
                <small>Rol: {u.rol}</small>
                <small>Comisión: {Number(comision || 0)}%</small>
              </div>
              <div>
                <span>{u.banco || 'Sin banco'}</span>
                <small>{numeroCuenta || 'Sin cuenta'}</small>
                <small>{codigo || 'Sin código vendedor'}</small>
              </div>
              <div className="usuarios20-row-actions">
                <button type="button" className="usuarios20-btn secondary usuarios20-mini" onClick={() => editar(u)}><Pencil size={14} /> Editar</button>
                <button type="button" className="usuarios20-btn secondary usuarios20-mini" onClick={() => actualizarUsuario({ ...u, activo: u.activo === false })}>{u.activo === false ? <Eye size={14} /> : <EyeOff size={14} />}{u.activo === false ? 'Activar' : 'Desactivar'}</button>
                <button type="button" className="usuarios20-btn secondary usuarios20-mini" onClick={() => resetPassword(u)}><KeyRound size={14} /> Reset</button>
                <button type="button" className="usuarios20-btn secondary usuarios20-mini" onClick={() => copiarQR(u)}><Copy size={14} /> QR</button>
                <button type="button" className="usuarios20-btn danger usuarios20-mini" onClick={() => eliminarUsuario(u.id)}><Trash2 size={14} /> Eliminar</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
