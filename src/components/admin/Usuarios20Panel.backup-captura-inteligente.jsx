import React, { useMemo, useState } from 'react';
import { ShieldCheck, Pencil, Trash2, Eye, EyeOff, KeyRound, Copy } from 'lucide-react';
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
  comisionPorcentaje: 0,
  comision_porcentaje: 0,
  banco: '',
  numeroCuenta: '',
  numero_cuenta: '',
  tipoCuenta: '',
  tipo_cuenta: '',
  titularCuenta: '',
  titular_cuenta: '',
  monedaCuenta: 'USD',
  moneda_cuenta: 'USD',
  observaciones: '',
};

function valor(usuario, camel, snake, fallback = '') {
  return usuario?.[camel] ?? usuario?.[snake] ?? fallback;
}

function normalizarForm(usuario = {}) {
  const codigo = valor(usuario, 'codigoVendedor', 'codigo_vendedor', '');
  const unidad = valor(usuario, 'unidadNegocio', 'unidad_negocio', 'ELANVISUAL');
  const comision = valor(usuario, 'comisionPorcentaje', 'comision_porcentaje', 0);
  const debeCambiar = valor(usuario, 'debeCambiarPassword', 'debe_cambiar_password', true);
  const numeroCuenta = valor(usuario, 'numeroCuenta', 'numero_cuenta', '');
  const tipoCuenta = valor(usuario, 'tipoCuenta', 'tipo_cuenta', '');
  const titularCuenta = valor(usuario, 'titularCuenta', 'titular_cuenta', '');
  const monedaCuenta = valor(usuario, 'monedaCuenta', 'moneda_cuenta', 'USD');

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
  };
}

function generarPasswordTemporal() {
  return `ELAN-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function Usuarios20Panel() {
  const { usuarios = [], crearUsuario, actualizarUsuario, eliminarUsuario } = useApp();

  const [form, setForm] = useState(baseUsuario);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const resumen = useMemo(() => {
    return {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo !== false).length,
      vendedores: usuarios.filter((u) => u.rol === 'ventas').length,
      produccion: usuarios.filter((u) => u.rol === 'produccion').length,
    };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuarios;

    return usuarios.filter((u) =>
      [
        u.nombre,
        u.usuario,
        u.email,
        u.rol,
        u.whatsapp,
        valor(u, 'codigoVendedor', 'codigo_vendedor'),
        u.banco,
        valor(u, 'numeroCuenta', 'numero_cuenta'),
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto)
    );
  }, [usuarios, busqueda]);

  const cambiar = (campo, valorCampo) => {
    setForm((prev) => {
      const nuevo = { ...prev, [campo]: valorCampo };

      if (campo === 'codigoVendedor') nuevo.codigo_vendedor = valorCampo;
      if (campo === 'codigo_vendedor') nuevo.codigoVendedor = valorCampo;

      if (campo === 'unidadNegocio') nuevo.unidad_negocio = valorCampo;
      if (campo === 'unidad_negocio') nuevo.unidadNegocio = valorCampo;

      if (campo === 'comisionPorcentaje') nuevo.comision_porcentaje = Number(valorCampo || 0);
      if (campo === 'comision_porcentaje') nuevo.comisionPorcentaje = Number(valorCampo || 0);

      if (campo === 'numeroCuenta') nuevo.numero_cuenta = valorCampo;
      if (campo === 'numero_cuenta') nuevo.numeroCuenta = valorCampo;

      if (campo === 'tipoCuenta') nuevo.tipo_cuenta = valorCampo;
      if (campo === 'tipo_cuenta') nuevo.tipoCuenta = valorCampo;

      if (campo === 'titularCuenta') nuevo.titular_cuenta = valorCampo;
      if (campo === 'titular_cuenta') nuevo.titularCuenta = valorCampo;

      if (campo === 'monedaCuenta') nuevo.moneda_cuenta = valorCampo;
      if (campo === 'moneda_cuenta') nuevo.monedaCuenta = valorCampo;

      if (campo === 'debeCambiarPassword') nuevo.debe_cambiar_password = Boolean(valorCampo);
      if (campo === 'debe_cambiar_password') nuevo.debeCambiarPassword = Boolean(valorCampo);

      return nuevo;
    });
  };

  const limpiar = () => {
    setForm(baseUsuario);
    setEditandoId(null);
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
  };

  const editar = (usuario) => {
    setEditandoId(usuario.id);
    setForm(normalizarForm(usuario));
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
    const codigo =
      valor(usuario, 'codigoVendedor', 'codigo_vendedor') ||
      (usuario.rol === 'ventas'
        ? `VEN-${String(usuario.usuario || usuario.id).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
        : '');

    if (!codigo) return alert('Este usuario no tiene código de vendedor.');

    const link = `${window.location.origin}/?ref=${encodeURIComponent(codigo)}`;
    navigator.clipboard?.writeText(link);
    alert('Link QR copiado.');
  };

  return (
    <section className="panel usuarios20">
      <style>{`
        .usuarios20-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .usuarios20-title {
          display: grid;
          gap: 4px;
        }

        .usuarios20-title h2 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .usuarios20-title p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .usuarios20-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(100px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .usuarios20-card {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
          background: #ffffff;
        }

        .usuarios20-card span {
          display: block;
          color: #64748b;
          font-size: 12px;
        }

        .usuarios20-card strong {
          font-size: 24px;
          color: #0f172a;
        }

        .usuarios20-form {
          display: grid;
          gap: 16px;
          margin-bottom: 22px;
        }

        .usuarios20-block {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          background: #f8fafc;
        }

        .usuarios20-block h3 {
          margin: 0 0 12px;
          font-size: 15px;
          color: #0f172a;
        }

        .usuarios20-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(150px, 1fr));
          gap: 12px;
        }

        .usuarios20-grid input,
        .usuarios20-grid select,
        .usuarios20-block textarea,
        .usuarios20-search {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 11px 12px;
          font-size: 14px;
          background: #ffffff;
        }

        .usuarios20-block textarea {
          min-height: 80px;
          resize: vertical;
        }

        .usuarios20-check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #334155;
        }

        .usuarios20-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .usuarios20-btn {
          border: 0;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #0f172a;
          color: #ffffff;
        }

        .usuarios20-btn.secondary {
          background: #e2e8f0;
          color: #0f172a;
        }

        .usuarios20-btn.danger {
          background: #b91c1c;
          color: #ffffff;
        }

        .usuarios20-list {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .usuarios20-row {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          background: #ffffff;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr auto;
          gap: 14px;
          align-items: center;
        }

        .usuarios20-row strong {
          color: #0f172a;
        }

        .usuarios20-row span,
        .usuarios20-row small {
          display: block;
          color: #64748b;
          font-size: 13px;
        }

        .usuarios20-badge {
          display: inline-flex;
          width: fit-content;
          padding: 4px 9px;
          border-radius: 999px;
          background: #dcfce7;
          color: #166534;
          font-size: 12px;
          font-weight: 700;
        }

        .usuarios20-badge.off {
          background: #fee2e2;
          color: #991b1b;
        }

        .usuarios20-row-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        @media (max-width: 900px) {
          .usuarios20-cards,
          .usuarios20-grid,
          .usuarios20-row {
            grid-template-columns: 1fr;
          }

          .usuarios20-row-actions {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="usuarios20-header">
        <div className="usuarios20-title">
          <h2><ShieldCheck size={20} /> Usuarios 2.0</h2>
          <p>Accesos, vendedores, comisión, WhatsApp y datos bancarios.</p>
        </div>

        <button type="button" className="usuarios20-btn secondary" onClick={limpiar}>
          Nuevo usuario
        </button>
      </div>

      <div className="usuarios20-cards">
        <div className="usuarios20-card"><span>Total</span><strong>{resumen.total}</strong></div>
        <div className="usuarios20-card"><span>Activos</span><strong>{resumen.activos}</strong></div>
        <div className="usuarios20-card"><span>Vendedores</span><strong>{resumen.vendedores}</strong></div>
        <div className="usuarios20-card"><span>Producción</span><strong>{resumen.produccion}</strong></div>
      </div>

      <div className="usuarios20-form">
        <div className="usuarios20-block">
          <h3>{editandoId ? 'Editar usuario' : 'Crear usuario'}</h3>
          <div className="usuarios20-grid">
            <input placeholder="Nombre completo" value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
            <input placeholder="Usuario" value={form.usuario} onChange={(e) => cambiar('usuario', e.target.value)} />
            <input placeholder="Correo" value={form.email} onChange={(e) => cambiar('email', e.target.value)} />
            <input placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => cambiar('whatsapp', e.target.value)} />
          </div>
        </div>

        <div className="usuarios20-block">
          <h3>Seguridad y rol</h3>
          <div className="usuarios20-grid">
            <select value={form.rol} onChange={(e) => cambiar('rol', e.target.value)}>
              <option value="admin">admin</option>
              <option value="ventas">ventas</option>
              <option value="produccion">produccion</option>
            </select>

            <input
              placeholder={editandoId ? 'Nueva contraseña opcional' : 'Contraseña temporal'}
              value={form.password || ''}
              onChange={(e) => cambiar('password', e.target.value)}
            />

            <label className="usuarios20-check">
              <input type="checkbox" checked={form.activo !== false} onChange={(e) => cambiar('activo', e.target.checked)} />
              Usuario activo
            </label>

            <label className="usuarios20-check">
              <input type="checkbox" checked={form.debeCambiarPassword !== false} onChange={(e) => cambiar('debeCambiarPassword', e.target.checked)} />
              Debe cambiar contraseña
            </label>
          </div>
        </div>

        <div className="usuarios20-block">
          <h3>Comercial</h3>
          <div className="usuarios20-grid">
            <input placeholder="Código vendedor" value={form.codigoVendedor} onChange={(e) => cambiar('codigoVendedor', e.target.value)} />
            <input type="number" placeholder="Comisión %" value={form.comisionPorcentaje} onChange={(e) => cambiar('comisionPorcentaje', e.target.value)} />
            <input placeholder="Unidad de negocio" value={form.unidadNegocio} onChange={(e) => cambiar('unidadNegocio', e.target.value)} />
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
              <option value="USD">USD</option>
              <option value="NIO">NIO</option>
            </select>
          </div>
        </div>

        <div className="usuarios20-block">
          <h3>Observaciones</h3>
          <textarea placeholder="Notas administrativas del usuario..." value={form.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} />
        </div>

        <div className="usuarios20-actions">
          <button type="button" className="usuarios20-btn" onClick={guardar}>
            {editandoId ? 'Guardar cambios' : 'Crear usuario'}
          </button>

          {editandoId && (
            <button type="button" className="usuarios20-btn secondary" onClick={limpiar}>
              Cancelar edición
            </button>
          )}
        </div>
      </div>

      <input
        className="usuarios20-search"
        placeholder="Buscar usuario, correo, WhatsApp, banco o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="usuarios20-list">
        {usuariosFiltrados.map((u) => {
          const codigo = valor(u, 'codigoVendedor', 'codigo_vendedor', '');
          const comision = valor(u, 'comisionPorcentaje', 'comision_porcentaje', 0);
          const numeroCuenta = valor(u, 'numeroCuenta', 'numero_cuenta', '');
          const titularCuenta = valor(u, 'titularCuenta', 'titular_cuenta', '');

          return (
            <article className="usuarios20-row" key={u.id}>
              <div>
                <strong>{u.nombre || u.usuario}</strong>
                <span>{u.usuario} · {u.email || 'Sin correo'}</span>
                <small>{u.whatsapp || 'Sin WhatsApp'}</small>
              </div>

              <div>
                <span className={`usuarios20-badge ${u.activo === false ? 'off' : ''}`}>
                  {u.activo === false ? 'Inactivo' : 'Activo'}
                </span>
                <small>Rol: {u.rol}</small>
                <small>Comisión: {Number(comision || 0)}%</small>
              </div>

              <div>
                <span>{u.banco || 'Sin banco'}</span>
                <small>{numeroCuenta || 'Sin cuenta'}</small>
                <small>{titularCuenta || 'Sin titular'}</small>
                <small>{codigo || 'Sin código vendedor'}</small>
              </div>

              <div className="usuarios20-row-actions">
                <button type="button" className="usuarios20-btn secondary" onClick={() => editar(u)}>
                  <Pencil size={15} /> Editar
                </button>

                <button type="button" className="usuarios20-btn secondary" onClick={() => actualizarUsuario({ ...u, activo: u.activo === false })}>
                  {u.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                  {u.activo === false ? 'Activar' : 'Desactivar'}
                </button>

                <button type="button" className="usuarios20-btn secondary" onClick={() => resetPassword(u)}>
                  <KeyRound size={15} /> Reset
                </button>

                <button type="button" className="usuarios20-btn secondary" onClick={() => copiarQR(u)}>
                  <Copy size={15} /> QR
                </button>

                <button type="button" className="usuarios20-btn danger" onClick={() => eliminarUsuario(u.id)}>
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
