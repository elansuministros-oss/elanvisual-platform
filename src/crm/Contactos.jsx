import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

export default function Contactos() {
  const {
    empresas,
    contactos,
    crearContacto,
    actualizarContacto,
    eliminarContacto,
  } = useCore();

  const [form, setForm] = useState({
    nombre: '',
    cargo: '',
    whatsapp: '',
    correo: '',
    empresaId: '',
    rol: 'Cliente',
    estado: 'Activo',
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [editandoId, setEditandoId] = useState(null);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm({
      nombre: '',
      cargo: '',
      whatsapp: '',
      correo: '',
      empresaId: '',
      rol: 'Cliente',
      estado: 'Activo',
    });

    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert('Debés ingresar el nombre del contacto.');
      return;
    }

    const datosContacto = {
      nombre: form.nombre.trim(),
      cargo: form.cargo.trim(),
      whatsapp: form.whatsapp.trim(),
      telefono: form.whatsapp.trim(),
      correo: form.correo.trim(),
      empresaId: form.empresaId,
      rol: form.rol,
      estado: form.estado,
    };

    if (editandoId) {
      actualizarContacto(editandoId, datosContacto);
    } else {
      crearContacto(datosContacto);
    }

    limpiarFormulario();
  };

  const editarContacto = (contacto) => {
    setForm({
      nombre: contacto.nombre || '',
      cargo: contacto.cargo || '',
      whatsapp: contacto.whatsapp || contacto.telefono || '',
      correo: contacto.correo || '',
      empresaId: contacto.empresaId || '',
      rol: contacto.rol || 'Cliente',
      estado: contacto.estado || 'Activo',
    });

    setEditandoId(contacto.id);
  };

  const confirmarEliminarContacto = (id) => {
    const confirmar = window.confirm(
      '¿Seguro que querés eliminar este contacto?'
    );

    if (!confirmar) return;

    eliminarContacto(id);

    if (editandoId === id) {
      limpiarFormulario();
    }
  };

  const nombreEmpresa = (empresaId) => {
    const empresa = empresas.find((item) => item.id === empresaId);
    return empresa ? empresa.nombre : 'Sin empresa';
  };

  const contactosFiltrados = useMemo(() => {
    return contactos.filter((contacto) => {
      const texto = `${contacto.nombre} ${contacto.cargo} ${contacto.whatsapp} ${contacto.telefono} ${contacto.correo} ${contacto.rol} ${contacto.estado} ${nombreEmpresa(contacto.empresaId)}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === 'Todos' || contacto.rol === filtroRol;

      return coincideBusqueda && coincideRol;
    });
  }, [contactos, empresas, busqueda, filtroRol]);

  const resumen = useMemo(() => {
    return {
      total: contactos.length,
      clientes: contactos.filter((c) => c.rol === 'Cliente').length,
      proveedores: contactos.filter((c) => c.rol === 'Proveedor').length,
      veterinarias: contactos.filter((c) => c.rol === 'Veterinaria').length,
      afiliados: contactos.filter((c) => c.rol === 'Afiliado').length,
    };
  }, [contactos]);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Contactos</h2>
          <p>Contactos relacionados con empresas del CRM Central ELANKAV.</p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Total contactos</span>
          <strong>{resumen.total}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Clientes</span>
          <strong>{resumen.clientes}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Proveedores</span>
          <strong>{resumen.proveedores}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Veterinarias</span>
          <strong>{resumen.veterinarias}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Afiliados</span>
          <strong>{resumen.afiliados}</strong>
        </div>
      </div>

      <div className="crm-grid">
        <form className="crm-card" onSubmit={guardar}>
          <h3>{editandoId ? 'Editar contacto' : 'Nuevo contacto'}</h3>

          <label>
            Nombre del contacto
            <input
              name="nombre"
              placeholder="Ej: Carlos López"
              value={form.nombre}
              onChange={cambiar}
            />
          </label>

          <label>
            Cargo
            <input
              name="cargo"
              placeholder="Ej: Gerente de compras"
              value={form.cargo}
              onChange={cambiar}
            />
          </label>

          <label>
            WhatsApp
            <input
              name="whatsapp"
              placeholder="Ej: +505 8888 8888"
              value={form.whatsapp}
              onChange={cambiar}
            />
          </label>

          <label>
            Correo
            <input
              name="correo"
              type="email"
              placeholder="Ej: contacto@empresa.com"
              value={form.correo}
              onChange={cambiar}
            />
          </label>

          <label>
            Empresa
            <select name="empresaId" value={form.empresaId} onChange={cambiar}>
              <option value="">Seleccionar empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Rol
            <select name="rol" value={form.rol} onChange={cambiar}>
              <option value="Cliente">Cliente</option>
              <option value="Veterinaria">Veterinaria</option>
              <option value="Afiliado">Afiliado</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Proveedor">Proveedor</option>
              <option value="Aliado Comercial">Aliado Comercial</option>
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
              {editandoId ? 'Guardar cambios' : 'Guardar contacto'}
            </button>

            {editandoId && (
              <button type="button" onClick={limpiarFormulario}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <div className="crm-card">
          <div className="crm-toolbar">
            <input
              type="text"
              placeholder="Buscar contacto, empresa, rol o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Cliente">Cliente</option>
              <option value="Veterinaria">Veterinaria</option>
              <option value="Afiliado">Afiliado</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Proveedor">Proveedor</option>
              <option value="Aliado Comercial">Aliado Comercial</option>
            </select>
          </div>

          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Cargo</th>
                  <th>Empresa</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>WhatsApp</th>
                  <th>Correo</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {contactosFiltrados.length > 0 ? (
                  contactosFiltrados.map((contacto) => (
                    <tr key={contacto.id}>
                      <td>{contacto.nombre}</td>
                      <td>{contacto.cargo || 'Sin cargo'}</td>
                      <td>{nombreEmpresa(contacto.empresaId)}</td>
                      <td>{contacto.rol}</td>
                      <td>{contacto.estado}</td>
                      <td>
                        {contacto.whatsapp || contacto.telefono || 'N/A'}
                      </td>
                      <td>{contacto.correo || 'N/A'}</td>
                      <td>
                        <div className="crm-row-actions">
                          <button
                            type="button"
                            onClick={() => editarContacto(contacto)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              confirmarEliminarContacto(contacto.id)
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      No hay contactos registrados con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="crm-note">
            Un contacto puede representar cliente, proveedor, veterinaria,
            afiliado, vendedor o aliado comercial dentro del CRM Central.
          </div>
        </div>
      </div>
    </div>
  );
}