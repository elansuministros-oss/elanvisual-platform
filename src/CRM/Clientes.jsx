import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const estadoOpciones = ['Activo', 'Prospecto', 'Inactivo'];

const formInicial = {
  id: '',
  nombre: '',
  empresa: '',
  contacto: '',
  whatsapp: '',
  correo: '',
  direccion: '',
  estado: 'Activo',
  observaciones: '',
};

export default function Clientes() {
  const {
    clientes = [],
    cotizaciones = [],
    pedidos = [],
    guardarCliente,
    actualizarCliente,
    eliminarCliente,
  } = useElan();

  const [form, setForm] = useState(formInicial);
  const [busqueda, setBusqueda] = useState('');

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return clientes;

    return clientes.filter((cliente) => {
      const texto = [
        cliente.nombre,
        cliente.empresa,
        cliente.contacto,
        cliente.whatsapp,
        cliente.correo,
        cliente.estado,
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(q);
    });
  }, [clientes, busqueda]);

  const resumen = useMemo(() => {
    return {
      total: clientes.length,
      activos: clientes.filter((c) => c.estado === 'Activo').length,
      prospectos: clientes.filter((c) => c.estado === 'Prospecto').length,
      inactivos: clientes.filter((c) => c.estado === 'Inactivo').length,
    };
  }, [clientes]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiar = () => {
    setForm(formInicial);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert('Ingresá el nombre del cliente.');
      return;
    }

    if (form.id) {
      actualizarCliente(form.id, form);
    } else {
      guardarCliente(form);
    }

    limpiar();
  };

  const editar = (cliente) => {
    setForm({
      id: cliente.id || '',
      nombre: cliente.nombre || '',
      empresa: cliente.empresa || '',
      contacto: cliente.contacto || '',
      whatsapp: cliente.whatsapp || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado || 'Activo',
      observaciones: cliente.observaciones || '',
    });
  };

  const eliminar = (cliente) => {
    const ok = window.confirm(`¿Eliminar el cliente "${cliente.nombre}"?`);
    if (!ok) return;

    eliminarCliente(cliente.id);

    if (form.id === cliente.id) limpiar();
  };

  const contarCotizaciones = (clienteId, clienteNombre) => {
    return cotizaciones.filter(
      (c) => c.clienteId === clienteId || c.clienteNombre === clienteNombre
    ).length;
  };

  const contarPedidos = (clienteId, clienteNombre) => {
    return pedidos.filter(
      (p) => p.clienteId === clienteId || p.clienteNombre === clienteNombre
    ).length;
  };

  return (
    <div>
      <h2>Clientes</h2>
      <p>
        Administración de clientes de ELANVISUAL conectada al flujo comercial:
        cotización, pedido, orden de trabajo y producción.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, margin: '16px 0' }}>
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.total}</strong>
          <p>Total clientes</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.activos}</strong>
          <p>Activos</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.prospectos}</strong>
          <p>Prospectos</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.inactivos}</strong>
          <p>Inactivos</p>
        </div>
      </div>

      <form onSubmit={guardar} style={{ border: '1px solid #ddd', padding: 14, borderRadius: 10, marginBottom: 18 }}>
        <h3>{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <label>
            Nombre del cliente
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              placeholder="Ej: Farmacia Santa Martha"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Empresa
            <input
              name="empresa"
              value={form.empresa}
              onChange={cambiar}
              placeholder="Razón comercial o empresa"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Contacto
            <input
              name="contacto"
              value={form.contacto}
              onChange={cambiar}
              placeholder="Persona responsable"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            WhatsApp
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={cambiar}
              placeholder="Número de WhatsApp"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Correo
            <input
              name="correo"
              value={form.correo}
              onChange={cambiar}
              placeholder="correo@cliente.com"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Estado
            <select
              name="estado"
              value={form.estado}
              onChange={cambiar}
              style={{ width: '100%' }}
            >
              {estadoOpciones.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 10 }}>
          Dirección
          <input
            name="direccion"
            value={form.direccion}
            onChange={cambiar}
            placeholder="Ubicación o referencia"
            style={{ width: '100%' }}
          />
        </label>

        <label style={{ display: 'block', marginTop: 10 }}>
          Observaciones
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={cambiar}
            placeholder="Notas comerciales, condiciones, historial o referencias."
            rows={3}
            style={{ width: '100%' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit">
            {form.id ? 'Guardar cambios' : 'Crear cliente'}
          </button>

          {form.id && (
            <button type="button" onClick={limpiar}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div style={{ marginBottom: 12 }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente, empresa, contacto, WhatsApp o correo..."
          style={{ width: '100%' }}
        />
      </div>

      {clientesFiltrados.length === 0 ? (
        <p>No hay clientes registrados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {clientesFiltrados.map((cliente) => {
            const totalCotizaciones = contarCotizaciones(cliente.id, cliente.nombre);
            const totalPedidos = contarPedidos(cliente.id, cliente.nombre);

            return (
              <div
                key={cliente.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 12,
                  borderRadius: 8,
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{cliente.nombre}</strong>
                    <p>{cliente.empresa || 'Sin empresa registrada'}</p>
                  </div>

                  <span>{cliente.estado || 'Activo'}</span>
                </div>

                <small>
                  Contacto: {cliente.contacto || 'N/A'} | WhatsApp:{' '}
                  {cliente.whatsapp || 'N/A'} | Correo: {cliente.correo || 'N/A'}
                </small>

                <small>
                  Dirección: {cliente.direccion || 'Sin dirección registrada'}
                </small>

                <small>
                  Cotizaciones: {totalCotizaciones} | Pedidos: {totalPedidos}
                </small>

                {cliente.observaciones && <p>{cliente.observaciones}</p>}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => editar(cliente)}>
                    Editar
                  </button>

                  <button type="button" onClick={() => eliminar(cliente)}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}