import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const inicial = {
  ordenId: '',
  inventarioId: '',
  cantidad: '',
  responsable: '',
  observaciones: '',
};

export default function ConsumoMateriales() {
  const {
    ordenes = [],
    inventario = [],
    movimientosInventario = [],
    registrarMovimientoInventario,
  } = useElan();

  const [form, setForm] = useState(inicial);

  const orden = ordenes.find((o) => o.id === form.ordenId);
  const item = inventario.find((i) => i.id === form.inventarioId);

  const consumos = useMemo(() => {
    return movimientosInventario.filter(
      (m) => m.tipo === 'Salida' && m.ordenId
    );
  }, [movimientosInventario]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiar = () => setForm(inicial);

  const guardar = (e) => {
    e.preventDefault();

    if (!form.ordenId) {
      alert('Seleccione una orden de trabajo.');
      return;
    }

    if (!form.inventarioId) {
      alert('Seleccione un material.');
      return;
    }

    if (Number(form.cantidad || 0) <= 0) {
      alert('Ingrese una cantidad válida.');
      return;
    }

    registrarMovimientoInventario({
      tipo: 'Salida',
      inventarioId: item.id,
      materialId: item.materialId || '',
      nombre: item.nombre || '',
      unidad: item.unidad || '',
      cantidad: Number(form.cantidad || 0),
      ordenId: orden.id,
      pedidoId: orden.pedidoId || '',
      referencia: orden.codigo || orden.id,
      responsable: form.responsable || orden.responsable || '',
      observaciones:
        form.observaciones ||
        `Consumo registrado para ${orden.codigo || orden.id}`,
    });

    limpiar();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Consumo de Materiales</h2>
          <p>
            Registro de materiales utilizados por orden de trabajo. Cada salida
            descuenta inventario automáticamente.
          </p>
        </div>
      </div>

      <form className="crm-form" onSubmit={guardar}>
        <h3>Registrar consumo por OT</h3>

        <div className="form-grid">
          <label>
            Orden de trabajo
            <select name="ordenId" value={form.ordenId} onChange={cambiar}>
              <option value="">Seleccionar OT</option>
              {ordenes.map((ot) => (
                <option key={ot.id} value={ot.id}>
                  {ot.codigo || ot.id} - {ot.clienteNombre || 'Sin cliente'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Material
            <select
              name="inventarioId"
              value={form.inventarioId}
              onChange={cambiar}
            >
              <option value="">Seleccionar material</option>
              {inventario.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.nombre} — {mat.existencia} {mat.unidad}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cantidad a consumir
            <input
              name="cantidad"
              type="number"
              step="0.01"
              value={form.cantidad}
              onChange={cambiar}
              placeholder="Ej: 2"
            />
          </label>

          <label>
            Responsable
            <input
              name="responsable"
              value={form.responsable}
              onChange={cambiar}
              placeholder="Producción / instalación"
            />
          </label>
        </div>

        <label>
          Observaciones
          <textarea
            name="observaciones"
            rows="3"
            value={form.observaciones}
            onChange={cambiar}
            placeholder="Detalle técnico del uso del material"
          />
        </label>

        {item && (
          <p>
            Disponible: <strong>{item.existencia} {item.unidad}</strong>
          </p>
        )}

        <div className="form-actions">
          <button type="submit">Registrar consumo</button>
        </div>
      </form>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>OT</th>
              <th>Material</th>
              <th>Cantidad</th>
              <th>Responsable</th>
              <th>Referencia</th>
            </tr>
          </thead>

          <tbody>
            {consumos.length === 0 ? (
              <tr>
                <td colSpan="5">No hay consumos registrados.</td>
              </tr>
            ) : (
              consumos.map((mov) => (
                <tr key={mov.id}>
                  <td>{mov.ordenId}</td>
                  <td>{mov.nombre}</td>
                  <td>
                    {mov.cantidad} {mov.unidad}
                  </td>
                  <td>{mov.responsable || 'Sin responsable'}</td>
                  <td>{mov.referencia || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
