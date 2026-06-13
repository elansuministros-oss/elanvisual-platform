import React, { useMemo, useState } from 'react';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    codigo: '',
    cliente: '',
    telefono: '',
    producto: '',
    cantidad: '',
    total: '',
    anticipo: '',
    estado: 'Pendiente',
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: '',
  });

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiar = () => {
    setForm({
      codigo: '',
      cliente: '',
      telefono: '',
      producto: '',
      cantidad: '',
      total: '',
      anticipo: '',
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
    });

    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.cliente.trim() || !form.producto.trim()) return;

    const datos = {
      ...form,
      id: editandoId || `ped-${Date.now()}`,
      codigo: form.codigo.trim() || `PED-${Date.now()}`,
      cliente: form.cliente.trim(),
      telefono: form.telefono.trim(),
      producto: form.producto.trim(),
      observaciones: form.observaciones.trim(),
      cantidad: Number(form.cantidad) || 0,
      total: Number(form.total) || 0,
      anticipo: Number(form.anticipo) || 0,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      setPedidos((prev) =>
        prev.map((item) => (item.id === editandoId ? datos : item))
      );
    } else {
      setPedidos((prev) => [datos, ...prev]);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);

    setForm({
      codigo: item.codigo || '',
      cliente: item.cliente || '',
      telefono: item.telefono || '',
      producto: item.producto || '',
      cantidad: String(item.cantidad || ''),
      total: String(item.total || ''),
      anticipo: String(item.anticipo || ''),
      estado: item.estado || 'Pendiente',
      fecha: item.fecha || new Date().toISOString().slice(0, 10),
      observaciones: item.observaciones || '',
    });
  };

  const eliminar = (id) => {
    setPedidos((prev) => prev.filter((item) => item.id !== id));
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
          <p>Registro general de pedidos del sistema.</p>
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
            Código
            <input
              name="codigo"
              value={form.codigo}
              onChange={cambiar}
              placeholder="PED-0001"
            />
          </label>

          <label>
            Cliente
            <input
              name="cliente"
              value={form.cliente}
              onChange={cambiar}
              placeholder="Nombre del cliente"
            />
          </label>

          <label>
            Teléfono / WhatsApp
            <input
              name="telefono"
              value={form.telefono}
              onChange={cambiar}
              placeholder="Número de contacto"
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
              <option>Confirmado</option>
              <option>En producción</option>
              <option>Listo</option>
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
              <th>Cliente</th>
              <th>Producto</th>
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
                <td colSpan="8">No hay pedidos registrados.</td>
              </tr>
            ) : (
              pedidos.map((item) => {
                const saldo =
                  (Number(item.total) || 0) - (Number(item.anticipo) || 0);

                return (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>

                    <td>
                      <strong>{item.cliente}</strong>
                      <br />
                      <small>{item.telefono}</small>
                    </td>

                    <td>
                      {item.producto}
                      <br />
                      <small>Cantidad: {item.cantidad}</small>
                    </td>

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