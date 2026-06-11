import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const fechaActual = () => new Date().toISOString().slice(0, 10);

function nombreCliente(cotizacion) {
  return (
    cotizacion.clienteNombre ||
    cotizacion.cliente ||
    cotizacion.nombreCliente ||
    'Sin cliente'
  );
}

function descripcionCotizacion(cotizacion) {
  if (cotizacion.descripcion) return cotizacion.descripcion;

  if (Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    return cotizacion.items.map((item) => item.producto || item.nombre).join(', ');
  }

  return cotizacion.notas || cotizacion.observacion || '-';
}

export default function Cotizaciones() {
  const {
    cotizaciones,
    guardarCotizacion,
    actualizarCotizacion,
    crearPedidoDesdeCotizacion,
  } = useElan();

  const [form, setForm] = useState({
    clienteNombre: '',
    descripcion: '',
    subtotal: '',
    descuento: '',
    iva: '',
    total: '',
    estado: 'Borrador',
    fecha: fechaActual(),
    notas: '',
  });

  const resumen = useMemo(() => {
    const total = cotizaciones.reduce(
      (acc, item) => acc + Number(item.total || item.subtotal || 0),
      0
    );

    return {
      registros: cotizaciones.length,
      total,
      borradores: cotizaciones.filter((x) => x.estado === 'Borrador').length,
      aprobadas: cotizaciones.filter((x) => x.estado === 'Aprobada').length,
      convertidas: cotizaciones.filter((x) => x.pedidoId).length,
    };
  }, [cotizaciones]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };

      const subtotal = Number(nuevo.subtotal || 0);
      const descuento = Number(nuevo.descuento || 0);
      const iva = Number(nuevo.iva || 0);

      return {
        ...nuevo,
        total: String(Math.max(subtotal - descuento + iva, 0)),
      };
    });
  };

  const limpiar = () => {
    setForm({
      clienteNombre: '',
      descripcion: '',
      subtotal: '',
      descuento: '',
      iva: '',
      total: '',
      estado: 'Borrador',
      fecha: fechaActual(),
      notas: '',
    });
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.clienteNombre.trim() || !form.descripcion.trim()) {
      alert('Ingrese cliente y descripción');
      return;
    }

    guardarCotizacion({
      codigo: `COT-${Date.now()}`,
      clienteNombre: form.clienteNombre.trim(),
      cliente: form.clienteNombre.trim(),
      descripcion: form.descripcion.trim(),
      subtotal: Number(form.subtotal || 0),
      descuento: Number(form.descuento || 0),
      iva: Number(form.iva || 0),
      total: Number(form.total || 0),
      estado: form.estado,
      fecha: form.fecha,
      notas: form.notas.trim(),
      items: [
        {
          id: `ITEM-${Date.now()}`,
          nombre: form.descripcion.trim(),
          producto: form.descripcion.trim(),
          cantidad: 1,
          precio: Number(form.subtotal || 0),
          precioVenta: Number(form.total || form.subtotal || 0),
        },
      ],
    });

    limpiar();
  };

  const aprobarYCrearPedido = (cotizacion) => {
    if (cotizacion.pedidoId) {
      alert('Esta cotización ya tiene pedido generado.');
      return;
    }

    actualizarCotizacion(cotizacion.id, {
      estado: 'Aprobada',
      fechaAprobacion: new Date().toISOString(),
    });

    crearPedidoDesdeCotizacion(cotizacion.id, {
      anticipo: 0,
      notas:
        cotizacion.notas ||
        cotizacion.observacion ||
        'Pedido generado automáticamente desde cotización aprobada.',
    });

    alert('Cotización aprobada. Pedido y Orden de Trabajo generados.');
  };

  const soloAprobar = (cotizacion) => {
    actualizarCotizacion(cotizacion.id, {
      estado: 'Aprobada',
      fechaAprobacion: new Date().toISOString(),
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Cotizaciones</h2>
          <p>
            Registro comercial previo a pedido, orden de trabajo y producción.
          </p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Registros</span>
          <strong>{resumen.registros}</strong>
        </div>

        <div className="crm-card">
          <span>Total cotizado</span>
          <strong>US$ {resumen.total.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Borradores</span>
          <strong>{resumen.borradores}</strong>
        </div>

        <div className="crm-card">
          <span>Aprobadas</span>
          <strong>{resumen.aprobadas}</strong>
        </div>

        <div className="crm-card">
          <span>Convertidas</span>
          <strong>{resumen.convertidas}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={guardar}>
        <h3>Nueva cotización manual</h3>

        <div className="form-grid">
          <label>
            Cliente
            <input
              name="clienteNombre"
              value={form.clienteNombre}
              onChange={cambiar}
              placeholder="Nombre del cliente"
            />
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

          <label>
            Subtotal
            <input
              type="number"
              name="subtotal"
              value={form.subtotal}
              onChange={cambiar}
              placeholder="0.00"
            />
          </label>

          <label>
            Descuento
            <input
              type="number"
              name="descuento"
              value={form.descuento}
              onChange={cambiar}
              placeholder="0.00"
            />
          </label>

          <label>
            IVA
            <input
              type="number"
              name="iva"
              value={form.iva}
              onChange={cambiar}
              placeholder="0.00"
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
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option>Borrador</option>
              <option>Enviada</option>
              <option>Aprobada</option>
              <option>Rechazada</option>
              <option>Cancelada</option>
            </select>
          </label>
        </div>

        <label>
          Descripción del trabajo
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
            rows="3"
            placeholder="Ej: rótulo, fascia, vinil, acrílico, estructura, instalación..."
          />
        </label>

        <label>
          Notas internas
          <textarea
            name="notas"
            value={form.notas}
            onChange={cambiar}
            rows="3"
            placeholder="Condiciones, anticipo, tiempo de entrega, instalación..."
          />
        </label>

        <div className="form-actions">
          <button type="submit">Guardar cotización</button>
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Descripción</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Pedido / OT</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan="7">No hay cotizaciones registradas.</td>
              </tr>
            ) : (
              cotizaciones.map((cotizacion) => (
                <tr key={cotizacion.id}>
                  <td>{cotizacion.codigo}</td>
                  <td>{nombreCliente(cotizacion)}</td>
                  <td>{descripcionCotizacion(cotizacion)}</td>
                  <td>
                    US$ {Number(cotizacion.total || cotizacion.subtotal || 0).toFixed(2)}
                  </td>
                  <td>{cotizacion.estado || 'Borrador'}</td>
                  <td>{cotizacion.pedidoId ? 'Generado' : 'Pendiente'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => soloAprobar(cotizacion)}
                      disabled={cotizacion.estado === 'Aprobada'}
                    >
                      Aprobar
                    </button>

                    <button
                      type="button"
                      onClick={() => aprobarYCrearPedido(cotizacion)}
                      disabled={Boolean(cotizacion.pedidoId)}
                    >
                      Aprobar + OT
                    </button>
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