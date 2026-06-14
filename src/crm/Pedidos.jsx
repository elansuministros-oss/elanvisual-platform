import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = [
  'ELANVISUAL',
  'ELANVISUAL',
  'ELANKAV CENTER',
  'ELANHOME',
  'ELAN AI',
];

const fechaActual = () => new Date().toISOString().slice(0, 10);

const formInicial = () => ({
  codigo: '',
  cotizacionId: '',
  cotizacionCodigo: '',
  empresaId: '',
  empresaNombre: '',
  contactoId: '',
  contactoNombre: '',
  cliente: '',
  telefono: '',
  producto: '',
  unidadNegocio: 'ELANVISUAL',
  cantidad: '',
  total: '',
  anticipo: '',
  estado: 'Pendiente',
  fecha: fechaActual(),
  observaciones: '',
});

export default function Pedidos() {
  const {
    empresas,
    contactos,
    cotizaciones,
    pedidos,
    crearPedido,
    actualizarPedido,
    eliminarPedido,
  } = useCore();

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formInicial());

  const cotizacionesDisponibles = useMemo(() => {
    return cotizaciones.filter((cotizacion) => {
      const estado = cotizacion.estado || '';
      return estado !== 'Cancelada' && estado !== 'Rechazada' && estado !== 'Anulada';
    });
  }, [cotizaciones]);

  const obtenerEmpresaNombre = (item) => {
    if (item.empresaNombre) return item.empresaNombre;
    if (item.empresa) return item.empresa;
    if (item.cliente) return item.cliente;

    const empresa = empresas.find((empresaItem) => empresaItem.id === item.empresaId);
    return empresa?.nombre || '';
  };

  const obtenerContactoNombre = (item) => {
    if (item.contactoNombre) return item.contactoNombre;
    if (item.contacto) return item.contacto;

    const contacto = contactos.find(
      (contactoItem) => contactoItem.id === item.contactoId
    );

    return contacto?.nombre || '';
  };

  const obtenerTelefonoContacto = (contactoId) => {
    const contacto = contactos.find((item) => item.id === contactoId);
    return contacto?.whatsapp || contacto?.telefono || '';
  };

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === 'cotizacionId') {
        const cotizacionSeleccionada = cotizaciones.find(
          (cotizacion) => cotizacion.id === value
        );

        if (!cotizacionSeleccionada) {
          return {
            ...prev,
            cotizacionId: '',
            cotizacionCodigo: '',
            empresaId: '',
            empresaNombre: '',
            contactoId: '',
            contactoNombre: '',
            cliente: '',
            telefono: '',
            producto: '',
            total: '',
            observaciones: prev.observaciones,
          };
        }

        const empresaNombre = obtenerEmpresaNombre(cotizacionSeleccionada);
        const contactoNombre = obtenerContactoNombre(cotizacionSeleccionada);
        const telefono = obtenerTelefonoContacto(cotizacionSeleccionada.contactoId);

        return {
          ...prev,
          cotizacionId: cotizacionSeleccionada.id,
          cotizacionCodigo: cotizacionSeleccionada.codigo || '',
          empresaId: cotizacionSeleccionada.empresaId || '',
          empresaNombre,
          contactoId: cotizacionSeleccionada.contactoId || '',
          contactoNombre,
          cliente: empresaNombre,
          telefono,
          producto: cotizacionSeleccionada.descripcion || cotizacionSeleccionada.categoria || '',
          unidadNegocio: cotizacionSeleccionada.unidadNegocio || 'ELANVISUAL',
          total: String(cotizacionSeleccionada.total || ''),
          observaciones:
            prev.observaciones ||
            cotizacionSeleccionada.observaciones ||
            '',
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const limpiar = () => {
    setForm(formInicial());
    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.cotizacionId && !form.cliente.trim()) {
      alert('DebÃ©s seleccionar una cotizaciÃ³n o indicar un cliente.');
      return;
    }

    if (!form.producto.trim()) {
      alert('DebÃ©s indicar el producto o trabajo del pedido.');
      return;
    }

    const cotizacionSeleccionada = cotizaciones.find(
      (cotizacion) => cotizacion.id === form.cotizacionId
    );

    const datos = {
      codigo: form.codigo.trim() || `PED-${Date.now()}`,
      cotizacionId: form.cotizacionId,
      cotizacionCodigo:
        form.cotizacionCodigo || cotizacionSeleccionada?.codigo || '',
      empresaId: form.empresaId || cotizacionSeleccionada?.empresaId || '',
      empresaNombre:
        form.empresaNombre ||
        (cotizacionSeleccionada ? obtenerEmpresaNombre(cotizacionSeleccionada) : ''),
      contactoId: form.contactoId || cotizacionSeleccionada?.contactoId || '',
      contactoNombre:
        form.contactoNombre ||
        (cotizacionSeleccionada ? obtenerContactoNombre(cotizacionSeleccionada) : ''),
      cliente: form.cliente.trim(),
      telefono: form.telefono.trim(),
      producto: form.producto.trim(),
      unidadNegocio: form.unidadNegocio,
      cantidad: Number(form.cantidad) || 0,
      total: Number(form.total) || 0,
      anticipo: Number(form.anticipo) || 0,
      estado: form.estado,
      fecha: form.fecha,
      observaciones: form.observaciones.trim(),
    };

    if (editandoId) {
      actualizarPedido(editandoId, datos);
    } else {
      crearPedido(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);

    const cotizacion = cotizaciones.find(
      (cotizacionItem) => cotizacionItem.id === item.cotizacionId
    );

    setForm({
      codigo: item.codigo || '',
      cotizacionId: item.cotizacionId || '',
      cotizacionCodigo: item.cotizacionCodigo || cotizacion?.codigo || '',
      empresaId: item.empresaId || cotizacion?.empresaId || '',
      empresaNombre:
        item.empresaNombre ||
        (cotizacion ? obtenerEmpresaNombre(cotizacion) : '') ||
        item.cliente ||
        '',
      contactoId: item.contactoId || cotizacion?.contactoId || '',
      contactoNombre:
        item.contactoNombre ||
        (cotizacion ? obtenerContactoNombre(cotizacion) : '') ||
        '',
      cliente:
        item.cliente ||
        item.empresaNombre ||
        (cotizacion ? obtenerEmpresaNombre(cotizacion) : '') ||
        '',
      telefono: item.telefono || '',
      producto: item.producto || cotizacion?.descripcion || '',
      unidadNegocio: item.unidadNegocio || cotizacion?.unidadNegocio || 'ELANVISUAL',
      cantidad: String(item.cantidad || ''),
      total: String(item.total || ''),
      anticipo: String(item.anticipo || ''),
      estado: item.estado || 'Pendiente',
      fecha: item.fecha || fechaActual(),
      observaciones: item.observaciones || '',
    });
  };

  const eliminar = (id) => {
    const confirmar = window.confirm('Â¿Seguro que querÃ©s eliminar este pedido?');
    if (!confirmar) return;

    eliminarPedido(id);
    if (editandoId === id) limpiar();
  };

  const resumen = useMemo(() => {
    const totalVentas = pedidos.reduce(
      (acc, item) => acc + (Number(item.total) || 0),
      0
    );

    const totalAnticipos = pedidos.reduce(
      (acc, item) => acc + (Number(item.anticipo) || 0),
      0
    );

    return {
      totalPedidos: pedidos.length,
      totalVentas,
      totalAnticipos,
      saldoPendiente: totalVentas - totalAnticipos,
    };
  }, [pedidos]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Pedidos</h2>
          <p>Registro general de pedidos conectados a cotizaciones.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Total pedidos</span>
          <strong>{resumen.totalPedidos}</strong>
        </div>

        <div className="crm-card">
          <span>Total ventas</span>
          <strong>C$ {resumen.totalVentas.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Anticipos</span>
          <strong>C$ {resumen.totalAnticipos.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Saldo pendiente</span>
          <strong>C$ {resumen.saldoPendiente.toFixed(2)}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={guardar}>
        <h3>{editandoId ? 'Editar pedido' : 'Nuevo pedido'}</h3>

        <div className="form-grid">
          <label>
            CotizaciÃ³n
            <select
              name="cotizacionId"
              value={form.cotizacionId}
              onChange={cambiar}
            >
              <option value="">Seleccionar cotizaciÃ³n</option>
              {cotizacionesDisponibles.map((cotizacion) => (
                <option key={cotizacion.id} value={cotizacion.id}>
                  {cotizacion.codigo || 'Sin cÃ³digo'} - {obtenerEmpresaNombre(cotizacion) || 'Sin empresa'} - C$ {Number(cotizacion.total || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            CÃ³digo pedido
            <input
              name="codigo"
              value={form.codigo}
              onChange={cambiar}
              placeholder="PED-0001"
            />
          </label>

          <label>
            Empresa / Cliente
            <input
              name="cliente"
              value={form.cliente}
              onChange={cambiar}
              placeholder="Se completa desde la cotizaciÃ³n"
              readOnly={Boolean(form.cotizacionId)}
            />
          </label>

          <label>
            Contacto
            <input
              name="contactoNombre"
              value={form.contactoNombre}
              onChange={cambiar}
              placeholder="Contacto relacionado"
              readOnly={Boolean(form.cotizacionId)}
            />
          </label>


          <label>
            Unidad de negocio
            <select name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>
              {UNIDADES_NEGOCIO.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
          </label>

          <label>
            TelÃ©fono / WhatsApp
            <input
              name="telefono"
              value={form.telefono}
              onChange={cambiar}
              placeholder="NÃºmero de contacto"
            />
          </label>

          <label>
            Producto / Trabajo
            <input
              name="producto"
              value={form.producto}
              onChange={cambiar}
              placeholder="Producto o servicio solicitado"
            />
          </label>

          <label>
            Cantidad
            <input
              type="number"
              name="cantidad"
              value={form.cantidad}
              onChange={cambiar}
              placeholder="0"
            />
          </label>

          <label>
            Total
            <input
              type="number"
              name="total"
              value={form.total}
              onChange={cambiar}
              placeholder="0.00"
            />
          </label>

          <label>
            Anticipo
            <input
              type="number"
              name="anticipo"
              value={form.anticipo}
              onChange={cambiar}
              placeholder="0.00"
            />
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option>Pendiente</option>
              <option>Aprobado</option>
              <option>ProducciÃ³n</option>
              <option>Entregado</option>
              <option>Cancelado</option>
            </select>
          </label>

          <label>
            Fecha
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={cambiar}
            />
          </label>
        </div>

        <label>
          Observaciones
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={cambiar}
            placeholder="Notas internas del pedido"
            rows="3"
          />
        </label>

        <div className="form-actions">
          <button type="submit">
            {editandoId ? 'Actualizar pedido' : 'Guardar pedido'}
          </button>

          {editandoId && (
            <button type="button" onClick={limpiar} className="btn-secundario">
              Cancelar ediciÃ³n
            </button>
          )}
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>CÃ³digo</th>
              <th>CotizaciÃ³n</th>
              <th>Empresa / Contacto</th>
              <th>Producto</th>
              <th>Unidad</th>
              <th>Total</th>
              <th>Anticipo</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="10">No hay pedidos registrados.</td>
              </tr>
            ) : (
              pedidos.map((item) => {
                const saldo =
                  (Number(item.total) || 0) - (Number(item.anticipo) || 0);

                return (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>

                    <td>
                      {item.cotizacionCodigo || 'Manual'}
                    </td>

                    <td>
                      <strong>{item.empresaNombre || item.cliente}</strong>
                      <br />
                      <small>{item.contactoNombre || item.telefono || 'Sin contacto'}</small>
                    </td>

                    <td>
                      {item.producto}
                      <br />
                      <small>Cantidad: {item.cantidad}</small>
                    </td>

                    <td>{item.unidadNegocio || 'ELANVISUAL'}</td>

                    <td>C$ {Number(item.total || 0).toFixed(2)}</td>
                    <td>C$ {Number(item.anticipo || 0).toFixed(2)}</td>
                    <td>C$ {saldo.toFixed(2)}</td>
                    <td>{item.estado}</td>

                    <td>
                      <button type="button" onClick={() => editar(item)}>
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminar(item.id)}
                        className="btn-danger"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

