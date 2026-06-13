import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = [
  'ELANPET',
  'ELANKAV VISUAL',
  'ELANKAV CENTER',
  'ELANKAV SOLAR',
  'ELAN AI',
];

export default function Comisiones() {
  const {
    comisiones,
    crearComision,
    actualizarComision,
    eliminarComision,
  } = useCore();
  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    codigo: '',
    vendedor: '',
    cliente: '',
    empresa: '',
    pedido: '',
    unidadNegocio: 'ELANKAV VISUAL',
    ventaTotal: '',
    porcentaje: '10',
    comision: '',
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
        comision: ((venta * porcentaje) / 100).toFixed(2),
      };
    });
  };

  const limpiar = () => {
    setForm({
      codigo: '',
      vendedor: '',
      cliente: '',
      empresa: '',
      pedido: '',
      unidadNegocio: 'ELANKAV VISUAL',
      ventaTotal: '',
      porcentaje: '10',
      comision: '',
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
      codigo: form.codigo.trim() || `COM-${Date.now()}`,
      vendedor: form.vendedor.trim(),
      cliente: form.cliente.trim(),
      empresa: form.empresa.trim(),
      pedido: form.pedido.trim(),
      unidadNegocio: form.unidadNegocio || 'ELANKAV VISUAL',
      observaciones: form.observaciones.trim(),
      ventaTotal: Number(form.ventaTotal) || 0,
      porcentaje: Number(form.porcentaje) || 0,
      comision: Number(form.comision) || 0,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarComision(datos);
    } else {
      crearComision(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);

    setForm({
      codigo: item.codigo || '',
      vendedor: item.vendedor || '',
      cliente: item.cliente || '',
      empresa: item.empresa || '',
      pedido: item.pedido || '',
      unidadNegocio: item.unidadNegocio || 'ELANKAV VISUAL',
      ventaTotal: String(item.ventaTotal || ''),
      porcentaje: String(item.porcentaje || '10'),
      comision: String(item.comision || ''),
      estado: item.estado || 'Pendiente',
      fecha: item.fecha || '',
      observaciones: item.observaciones || '',
    });
  };

  const eliminar = (id) => {
    eliminarComision(id);

    if (editandoId === id) limpiar();
  };

  const resumen = useMemo(() => {
    const ventas = comisiones.reduce(
      (acc, item) => acc + (Number(item.ventaTotal) || 0),
      0
    );

    const totalComisiones = comisiones.reduce(
      (acc, item) => acc + (Number(item.comision) || 0),
      0
    );

    const pendientes = comisiones.filter(
      (item) => item.estado === 'Pendiente'
    ).length;

    return {
      totalRegistros: comisiones.length,
      ventas,
      totalComisiones,
      pendientes,
    };
  }, [comisiones]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Comisiones</h2>
          <p>Control de comisiones para vendedores, afiliados y aliados.</p>
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
          <span>Comisiones</span>
          <strong>C$ {resumen.totalComisiones.toFixed(2)}</strong>
        </div>

        <div className="crm-card">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </div>
      </div>

      <form className="crm-form" onSubmit={guardar}>
        <h3>{editandoId ? 'Editar comisión' : 'Nueva comisión'}</h3>

        <div className="form-grid">
          <label>
            Código
            <input
              name="codigo"
              value={form.codigo}
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
            Unidad de negocio
            <select
              name="unidadNegocio"
              value={form.unidadNegocio}
              onChange={cambiar}
            >
              {UNIDADES_NEGOCIO.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
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
              name="comision"
              value={form.comision}
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
            {editandoId ? 'Actualizar comisión' : 'Guardar comisión'}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limpiar}
              className="btn-secundario"
            >
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
              <th>Vendedor</th>
              <th>Cliente</th>
              <th>Unidad</th>
              <th>Venta</th>
              <th>%</th>
              <th>Comisión</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {comisiones.length === 0 ? (
              <tr>
                <td colSpan="9">No hay comisiones registradas.</td>
              </tr>
            ) : (
              comisiones.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo}</td>

                  <td>{item.vendedor}</td>

                  <td>{item.cliente || item.empresa}</td>

                  <td>{item.unidadNegocio || 'ELANKAV VISUAL'}</td>

                  <td>
                    C$ {Number(item.ventaTotal || 0).toFixed(2)}
                  </td>

                  <td>
                    {Number(item.porcentaje || 0).toFixed(2)}%
                  </td>

                  <td>
                    C$ {Number(item.comision || 0).toFixed(2)}
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