import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';
import {
  esAdminCRM,
  esVendedorCRM,
  filtrarRegistrosCRM,
  obtenerFirmaVendedor,
  puedeCrearCRM,
  puedeEditarCRM,
  puedeEliminarCRM,
} from '../services/permisosCRM';

const formInicial = {
  nombre: '',
  cargo: '',
  whatsapp: '',
  correo: '',
  empresaId: '',
  estado: 'Activo',
};

export default function Clientes() {
  const {
    empresas = [],
    contactos = [],
    crearContacto,
    actualizarContacto,
    eliminarContacto,
    usuarioActivoCRM,
    rolUsuarioActivoCRM,
  } = useCore();

  const usuarioCRM = {
    ...(usuarioActivoCRM || {}),
    rol:
      usuarioActivoCRM?.rol ||
      usuarioActivoCRM?.tipo ||
      rolUsuarioActivoCRM?.slug ||
      rolUsuarioActivoCRM?.nombre ||
      '',
    rolNombre: rolUsuarioActivoCRM?.nombre || usuarioActivoCRM?.rol || '',
  };

  const [form, setForm] = useState(formInicial);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  const clientesBase = useMemo(() => {
    return contactos.filter((contacto) => contacto.rol === 'Cliente');
  }, [contactos]);

  const clientes = useMemo(() => {
    return filtrarRegistrosCRM(usuarioCRM, clientesBase);
  }, [clientesBase, usuarioCRM?.id, usuarioCRM?.rol, usuarioCRM?.rolNombre]);

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return clientes;

    return clientes.filter((cliente) => {
      const empresa = empresas.find((e) => e.id === cliente.empresaId);
      const texto = [
        cliente.nombre,
        cliente.cargo,
        cliente.whatsapp,
        cliente.telefono,
        cliente.correo,
        cliente.estado,
        cliente.vendedor_nombre,
        cliente.codigo_vendedor,
        empresa?.nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return texto.includes(q);
    });
  }, [clientes, empresas, busqueda]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiar = () => {
    setForm(formInicial);
    setEditandoId(null);
  };

  const nombreEmpresa = (empresaId) => {
    return empresas.find((empresa) => empresa.id === empresaId)?.nombre || 'Sin empresa';
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!puedeCrearCRM(usuarioCRM)) {
      alert('No tenés permiso para crear clientes.');
      return;
    }

    if (!form.nombre.trim()) {
      alert('Escribí el nombre del cliente.');
      return;
    }

    const clienteOriginal = editandoId
      ? clientesBase.find((cliente) => cliente.id === editandoId)
      : null;

    if (editandoId && !puedeEditarCRM(usuarioCRM, clienteOriginal)) {
      alert('No tenés permiso para editar este cliente.');
      return;
    }

    const firmaVendedor = esVendedorCRM(usuarioCRM)
      ? obtenerFirmaVendedor(usuarioCRM)
      : {};

    const datos = {
      nombre: form.nombre.trim(),
      cargo: form.cargo.trim(),
      whatsapp: form.whatsapp.trim(),
      telefono: form.whatsapp.trim(),
      correo: form.correo.trim(),
      empresaId: form.empresaId,
      rol: 'Cliente',
      estado: form.estado || 'Activo',
      updated_at: new Date().toISOString(),
      ...(editandoId ? {} : { created_at: new Date().toISOString() }),
      ...(editandoId ? {} : firmaVendedor),
    };

    if (editandoId) {
      actualizarContacto(editandoId, {
        ...datos,
        vendedor_id: clienteOriginal?.vendedor_id || firmaVendedor.vendedor_id || '',
        vendedorId: clienteOriginal?.vendedorId || firmaVendedor.vendedorId || '',
        vendedor_nombre: clienteOriginal?.vendedor_nombre || firmaVendedor.vendedor_nombre || '',
        codigo_vendedor: clienteOriginal?.codigo_vendedor || firmaVendedor.codigo_vendedor || '',
        created_by: clienteOriginal?.created_by || firmaVendedor.created_by || '',
      });
    } else {
      crearContacto(datos);
    }

    limpiar();
  };

  const editar = (cliente) => {
    if (!puedeEditarCRM(usuarioCRM, cliente)) {
      alert('No tenés permiso para editar este cliente.');
      return;
    }

    setForm({
      nombre: cliente.nombre || '',
      cargo: cliente.cargo || '',
      whatsapp: cliente.whatsapp || cliente.telefono || '',
      correo: cliente.correo || '',
      empresaId: cliente.empresaId || '',
      estado: cliente.estado || 'Activo',
    });

    setEditandoId(cliente.id);
  };

  const eliminar = (cliente) => {
    if (!puedeEliminarCRM(usuarioCRM, cliente)) {
      alert('No tenés permiso para eliminar este cliente.');
      return;
    }

    const ok = window.confirm(`¿Eliminar cliente ${cliente.nombre || ''}?`);
    if (!ok) return;

    eliminarContacto(cliente.id);

    if (editandoId === cliente.id) {
      limpiar();
    }
  };

  const tituloResumen = esAdminCRM(usuarioCRM)
    ? 'Base completa'
    : 'Mis clientes';

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Clientes</h2>
          <p>
            {esAdminCRM(usuarioCRM)
              ? 'Administración general de clientes comerciales de ELANVISIÓN.'
              : 'Clientes asignados a tu usuario vendedor.'}
          </p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>{tituloResumen}</span>
          <strong>{clientes.length}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Activos</span>
          <strong>{clientes.filter((c) => c.estado !== 'Inactivo').length}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Inactivos</span>
          <strong>{clientes.filter((c) => c.estado === 'Inactivo').length}</strong>
        </div>
      </div>

      <div className="crm-grid">
        <form className="crm-card" onSubmit={guardar}>
          <h3>{editandoId ? 'Editar cliente' : 'Nuevo cliente'}</h3>

          <label>
            Nombre del cliente
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              placeholder="Ej: Carlos López"
            />
          </label>

          <label>
            Cargo / referencia
            <input
              name="cargo"
              value={form.cargo}
              onChange={cambiar}
              placeholder="Ej: Gerente, dueño, compras"
            />
          </label>

          <label>
            WhatsApp
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={cambiar}
              placeholder="+505 8888 8888"
            />
          </label>

          <label>
            Correo
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={cambiar}
              placeholder="cliente@empresa.com"
            />
          </label>

          <label>
            Empresa
            <select name="empresaId" value={form.empresaId} onChange={cambiar}>
              <option value="">Sin empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>

          <div className="crm-actions">
            <button type="submit">
              {editandoId ? 'Guardar cambios' : 'Guardar cliente'}
            </button>

            {editandoId && (
              <button type="button" onClick={limpiar}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <div className="crm-card">
          <div className="crm-toolbar">
            <input
              type="text"
              placeholder="Buscar cliente, WhatsApp, correo, vendedor o empresa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Referencia</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>WhatsApp</th>
                  <th>Correo</th>
                  <th>Vendedor</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.nombre}</td>
                      <td>{cliente.cargo || 'Sin referencia'}</td>
                      <td>{nombreEmpresa(cliente.empresaId)}</td>
                      <td>{cliente.estado || 'Activo'}</td>
                      <td>{cliente.whatsapp || cliente.telefono || 'N/A'}</td>
                      <td>{cliente.correo || 'N/A'}</td>
                      <td>{cliente.vendedor_nombre || cliente.codigo_vendedor || 'Sin asignar'}</td>
                      <td>
                        <div className="crm-row-actions">
                          <button type="button" onClick={() => editar(cliente)}>
                            Editar
                          </button>
                          <button type="button" onClick={() => eliminar(cliente)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No hay clientes disponibles para este usuario.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="crm-note">
            {esAdminCRM(usuarioCRM)
              ? 'El administrador ve toda la base comercial.'
              : 'El vendedor solo ve, edita y elimina clientes creados o asignados a su usuario.'}
          </div>
        </div>
      </div>
    </div>
  );
} 