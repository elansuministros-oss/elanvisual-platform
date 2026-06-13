import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const unidadesNegocio = [
  'ELANPET',
  'ELANKAV VISUAL',
  'ELANKAV CENTER',
  'ELANKAV SOLAR',
  'ELAN AI',
];

const categoriasProveedor = [
  'Materiales de rotulación',
  'Impresión y acabados',
  'CNC / Láser',
  'Acrílicos / PVC',
  'Ferretería',
  'Tecnología',
  'Energía solar',
  'Transporte',
  'Servicios profesionales',
  'Otro',
];

export default function Proveedores() {
  const {
    proveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
  } = useCore();

  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    ruc: '',
    contacto: '',
    whatsapp: '',
    correo: '',
    direccion: '',
    categoria: 'Materiales de rotulación',
    unidadNegocio: 'ELANKAV VISUAL',
    estado: 'Activo',
    condicionesPago: 'Contado',
    observaciones: '',
  });

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiar = () => {
    setForm({
      codigo: '',
      nombre: '',
      ruc: '',
      contacto: '',
      whatsapp: '',
      correo: '',
      direccion: '',
      categoria: 'Materiales de rotulación',
      unidadNegocio: 'ELANKAV VISUAL',
      estado: 'Activo',
      condicionesPago: 'Contado',
      observaciones: '',
    });

    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) return;

    const datos = {
      ...form,
      id: editandoId || `prov-${Date.now()}`,
      codigo: form.codigo.trim() || `PROV-${Date.now()}`,
      nombre: form.nombre.trim(),
      ruc: form.ruc.trim(),
      contacto: form.contacto.trim(),
      whatsapp: form.whatsapp.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim(),
      observaciones: form.observaciones.trim(),
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarProveedor(editandoId, datos);
    } else {
      crearProveedor(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);

    setForm({
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      ruc: item.ruc || '',
      contacto: item.contacto || '',
      whatsapp: item.whatsapp || '',
      correo: item.correo || '',
      direccion: item.direccion || '',
      categoria: item.categoria || 'Materiales de rotulación',
      unidadNegocio: item.unidadNegocio || 'ELANKAV VISUAL',
      estado: item.estado || 'Activo',
      condicionesPago: item.condicionesPago || 'Contado',
      observaciones: item.observaciones || '',
    });
  };

  const eliminar = (id) => {
    eliminarProveedor(id);
    if (editandoId === id) limpiar();
  };

  const resumen = useMemo(() => {
    const activos = proveedores.filter((item) => item.estado === 'Activo').length;
    const inactivos = proveedores.filter((item) => item.estado === 'Inactivo').length;
    const credito = proveedores.filter((item) => item.condicionesPago === 'Crédito').length;
    const visual = proveedores.filter(
      (item) => item.unidadNegocio === 'ELANKAV VISUAL'
    ).length;

    return {
      total: proveedores.length,
      activos,
      inactivos,
      credito,
      visual,
    };
  }, [proveedores]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Proveedores</h2>
          <p>Registro de proveedores para compras, inventario, costos y cuentas por pagar de ELANKAV GROUP.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Total proveedores</span>
          <strong>{resumen.total}</strong>
        </div>

        <div className="crm-card">
          <span>Activos</span>
          <strong>{resumen.activos}</strong>
        </div>

        <div className="crm-card">
          <span>Crédito</span>
          <strong>{resumen.credito}</strong>
        </div>

        <div className="crm-card">
          <span>ELANKAV VISUAL</span>
          <strong>{resumen.visual}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={guardar}>
        <h3>{editandoId ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>

        <div className="form-grid">
          <label>
            Código
            <input
              name="codigo"
              value={form.codigo}
              onChange={cambiar}
              placeholder="PROV-0001"
            />
          </label>

          <label>
            Nombre del proveedor
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              placeholder="Nombre comercial o razón social"
            />
          </label>

          <label>
            RUC
            <input
              name="ruc"
              value={form.ruc}
              onChange={cambiar}
              placeholder="Número RUC"
            />
          </label>

          <label>
            Contacto
            <input
              name="contacto"
              value={form.contacto}
              onChange={cambiar}
              placeholder="Persona encargada"
            />
          </label>

          <label>
            WhatsApp / Teléfono
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={cambiar}
              placeholder="Número de contacto"
            />
          </label>

          <label>
            Correo
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={cambiar}
              placeholder="correo@proveedor.com"
            />
          </label>

          <label>
            Categoría
            <select name="categoria" value={form.categoria} onChange={cambiar}>
              {categoriasProveedor.map((categoria) => (
                <option key={categoria}>{categoria}</option>
              ))}
            </select>
          </label>

          <label>
            Unidad de negocio
            <select
              name="unidadNegocio"
              value={form.unidadNegocio}
              onChange={cambiar}
            >
              {unidadesNegocio.map((unidad) => (
                <option key={unidad}>{unidad}</option>
              ))}
            </select>
          </label>

          <label>
            Condición de pago
            <select
              name="condicionesPago"
              value={form.condicionesPago}
              onChange={cambiar}
            >
              <option>Contado</option>
              <option>Crédito</option>
              <option>Transferencia</option>
              <option>Contra entrega</option>
              <option>Otro</option>
            </select>
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Bloqueado</option>
            </select>
          </label>

          <label className="form-full">
            Dirección
            <input
              name="direccion"
              value={form.direccion}
              onChange={cambiar}
              placeholder="Dirección física o punto de referencia"
            />
          </label>

          <label className="form-full">
            Observaciones
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={cambiar}
              placeholder="Notas internas, horarios, productos principales, condiciones especiales"
              rows="3"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editandoId ? 'Actualizar proveedor' : 'Guardar proveedor'}
          </button>

          {editandoId && (
            <button type="button" className="secondary" onClick={limpiar}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Proveedor</th>
              <th>Contacto</th>
              <th>WhatsApp</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan="9">No hay proveedores registrados.</td>
              </tr>
            ) : (
              proveedores.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo}</td>
                  <td>
                    <strong>{item.nombre}</strong>
                    <br />
                    <small>{item.ruc || 'Sin RUC'}</small>
                  </td>
                  <td>{item.contacto || '-'}</td>
                  <td>{item.whatsapp || '-'}</td>
                  <td>{item.categoria || '-'}</td>
                  <td>{item.unidadNegocio || '-'}</td>
                  <td>{item.condicionesPago || '-'}</td>
                  <td>{item.estado || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => editar(item)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => eliminar(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
