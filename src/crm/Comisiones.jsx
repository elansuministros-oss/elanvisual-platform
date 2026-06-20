import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

export default function Comisiónes() {
  const {
    Comisiónes,
    crearComisión,
    actualizarComisión,
    eliminarComisión,
  } = useCore();
  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    Código: '',
    vendedor: '',
    cliente: '',
    empresa: '',
    pedido: '',
    ventaTotal: '',
    porcentaje: '10',
    Comisión: '',
    estado: 'Pendiente',
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: '',
  });

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };

      const venta = Number(nuevo.ventaTotal) || 0;
      const porcentaje = Number(nuevo.porcentaje) || 0;

      return {
        ...nuevo,
        Comisión: ((venta * porcentaje) / 100).toFixed(2),
      };
    });
  };

  const limpiar = () => {
    setForm({
      Código: '',
      vendedor: '',
      cliente: '',
      empresa: '',
      pedido: '',
      ventaTotal: '',
      porcentaje: '10',
      Comisión: '',
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
    });

    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.vendedor.trim()) return;

    const datos = {
      ...form,
      id: editandoId || `com-${Date.now()}`,
      Código: form.Código.trim() || `COM-${Date.now()}`,
      vendedor: form.vendedor.trim(),
      cliente: form.cliente.trim(),
      empresa: form.empresa.trim(),
      pedido: form.pedido.trim(),
      observaciones: form.observaciones.trim(),
      ventaTotal: Number(form.ventaTotal) || 0,
      porcentaje: Number(form.porcentaje) || 0,
      Comisión: Number(form.Comisión) || 0,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarComisión(datos);
    } else {
      crearComisión(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);

    setForm({
      Código: item.Código || '',
      vendedor: item.vendedor || '',
      cliente: item.cliente || '',
      empresa: item.empresa || '',
      pedido: item.pedido || '',
      ventaTotal: String(item.ventaTotal || ''),
      porcentaje: String(item.porcentaje || '10'),
      Comisión: String(item.Comisión || ''),
      estado: item.estado || 'Pendiente',
      fecha: item.fecha || '',
      observaciones: item.observaciones || '',
    });
  };

  const eliminar = (id) => {
    eliminarComisión(id);

    if (editandoId === id) limpiar();
  };

  const resumen = useMemo(() => {
    const ventas = Comisiónes.reduce(
      (acc, item) => acc + (Number(item.ventaTotal) || 0),
      0
    );

    const totalComisiónes = Comisiónes.reduce(
      (acc, item) => acc + (Number(item.Comisión) || 0),
      0
    );

    const pendientes = Comisiónes.filter(
      (item) => item.estado === 'Pendiente'
    ).length;

    return {
      totalRegistros: Comisiónes.length,
      ventas,
      totalComisiónes,
      pendientes,
    };
  }, [Comisiónes]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Comisiónes</h2>
          <p>Control de Comisiónes para vendedores, afiliados y aliados.</p>
        </div>
      </div>

      <div className="crm-resumen">
        <div className="crm-card">
          <span>Registros</span>
          <strong>{resumen.totalRegistros}</strong>
        </div>

        <div className="crm-card">
          <span>Ventas</span>
          <strong>C$ {resumen.ventas.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Comisiónes</span>
          <strong>C$ {resumen.totalComisiónes.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={guardar}>
        <h3>{editandoId ? 'Editar Comisión' : 'Nueva Comisión'}</h3>

        <div className="form-grid">
          <label>
            Código
            <input
              name="Código"
              value={form.Código}
              onChange={cambiar}
              placeholder="COM-0001"
            />
          </label>

          <label>
            Vendedor
            <input
              name="vendedor"
              value={form.vendedor}
              onChange={cambiar}
            />
          </label>

          <label>
            Cliente
            <input
              name="cliente"
              value={form.cliente}
              onChange={cambiar}
            />
          </label>

          <label>
            Empresa
            <input
              name="empresa"
              value={form.empresa}
              onChange={cambiar}
            />
          </label>

          <label>
            Pedido
            <input
              name="pedido"
              value={form.pedido}
              onChange={cambiar}
              placeholder="PED-0001"
            />
          </label>

          <label>
            Venta total
            <input
              type="number"
              name="ventaTotal"
              value={form.ventaTotal}
              onChange={cambiar}
            />
          </label>

          <label>
            %
            <input
              type="number"
              name="porcentaje"
              value={form.porcentaje}
              onChange={cambiar}
            />
          </label>

          <label>
            Comisión
            <input
              type="number"
              name="Comisión"
              value={form.Comisión}
              readOnly
            />
          </label>

          <label>
            Estado
            <select
              name="estado"
              value={form.estado}
              onChange={cambiar}
            >
              <option>Pendiente</option>
              <option>Pagada</option>
              <option>Anulada</option>
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
            rows="3"
          />
        </label>

        <div className="form-actions">
          <button type="submit">
            {editandoId ? 'Actualizar Comisión' : 'Guardar Comisión'}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limpiar}
              className="btn-secundario"
            >
              Cancelar edicion
            </button>
          )}
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Vendedor</th>
              <th>Cliente</th>
              <th>Venta</th>
              <th>%</th>
              <th>Comisión</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {Comisiónes.length === 0 ? (
              <tr>
                <td colSpan="8">No hay Comisiónes registradas.</td>
              </tr>
            ) : (
              Comisiónes.map((item) => (
                <tr key={item.id}>
                  <td>{item.Código}</td>

                  <td>{item.vendedor}</td>

                  <td>{item.cliente || item.empresa}</td>

                  <td>
                    C$ {Number(item.ventaTotal || 0).toFixed(2)}
                  </td>

                  <td>
                    {Number(item.porcentaje || 0).toFixed(2)}%
                  </td>

                  <td>
                    C$ {Number(item.Comisión || 0).toFixed(2)}
                  </td>

                  <td>{item.estado}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => editar(item)}
                    >
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


