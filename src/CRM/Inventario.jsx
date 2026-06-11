import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const formInicial = {
  id: '',
  materialId: '',
  nombre: '',
  unidad: 'unidad',
  existencia: 0,
  stockMinimo: 0,
  costo: 0,
  proveedor: '',
  estado: 'Activo',
};

const movimientoInicial = {
  inventarioId: '',
  tipo: 'Salida',
  cantidad: 0,
  referencia: '',
  responsable: '',
  observaciones: '',
};

export default function Inventario() {
  const {
    inventario = [],
    movimientosInventario = [],
    materiales = [],
    guardarInventario,
    actualizarInventario,
    registrarMovimientoInventario,
  } = useElan();

  const [form, setForm] = useState(formInicial);
  const [movimiento, setMovimiento] = useState(movimientoInicial);
  const [busqueda, setBusqueda] = useState('');

  const inventarioFiltrado = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return inventario;

    return inventario.filter((item) =>
      [
        item.nombre,
        item.unidad,
        item.proveedor,
        item.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [inventario, busqueda]);

  const resumen = useMemo(() => {
    const bajoStock = inventario.filter(
      (item) => Number(item.existencia || 0) <= Number(item.stockMinimo || 0)
    ).length;

    const valorInventario = inventario.reduce((total, item) => {
      return total + Number(item.existencia || 0) * Number(item.costo || 0);
    }, 0);

    return {
      totalItems: inventario.length,
      bajoStock,
      movimientos: movimientosInventario.length,
      valorInventario,
    };
  }, [inventario, movimientosInventario]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const cambiarMovimiento = (e) => {
    const { name, value } = e.target;

    setMovimiento((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarMaterial = (e) => {
    const materialId = e.target.value;
    const material = materiales.find((m) => m.id === materialId);

    if (!material) {
      setForm((prev) => ({
        ...prev,
        materialId: '',
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      materialId: material.id,
      nombre: material.nombre || '',
      unidad: material.unidad || 'unidad',
      existencia: Number(material.stock || prev.existencia || 0),
      stockMinimo: Number(material.stockMinimo || 0),
      costo: Number(material.costo || 0),
      proveedor: material.proveedor || '',
    }));
  };

  const limpiar = () => {
    setForm(formInicial);
  };

  const limpiarMovimiento = () => {
    setMovimiento(movimientoInicial);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert('Ingrese el nombre del material o producto de inventario.');
      return;
    }

    const data = {
      ...form,
      existencia: Number(form.existencia || 0),
      stockMinimo: Number(form.stockMinimo || 0),
      costo: Number(form.costo || 0),
    };

    if (form.id) {
      actualizarInventario(form.id, data);
    } else {
      guardarInventario(data);
    }

    limpiar();
  };

  const editar = (item) => {
    setForm({
      id: item.id || '',
      materialId: item.materialId || '',
      nombre: item.nombre || '',
      unidad: item.unidad || 'unidad',
      existencia: Number(item.existencia || 0),
      stockMinimo: Number(item.stockMinimo || 0),
      costo: Number(item.costo || 0),
      proveedor: item.proveedor || '',
      estado: item.estado || 'Activo',
    });
  };

  const registrarMovimiento = (e) => {
    e.preventDefault();

    if (!movimiento.inventarioId) {
      alert('Seleccione un material de inventario.');
      return;
    }

    if (Number(movimiento.cantidad || 0) <= 0 && movimiento.tipo !== 'Ajuste') {
      alert('Ingrese una cantidad válida.');
      return;
    }

    const item = inventario.find((i) => i.id === movimiento.inventarioId);

    registrarMovimientoInventario({
      ...movimiento,
      cantidad: Number(movimiento.cantidad || 0),
      materialId: item?.materialId || '',
      nombre: item?.nombre || '',
      unidad: item?.unidad || '',
    });

    limpiarMovimiento();
  };

  return (
    <div>
      <h2>Inventario</h2>

      <p>
        Control de existencias, entradas, salidas, ajustes y alertas de compra
        para producción ELANVISUAL.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 10,
          margin: '16px 0',
        }}
      >
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.totalItems}</strong>
          <p>Materiales</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.bajoStock}</strong>
          <p>Bajo stock</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.movimientos}</strong>
          <p>Movimientos</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>US$ {resumen.valorInventario.toFixed(2)}</strong>
          <p>Valor inventario</p>
        </div>
      </div>

      <form
        onSubmit={guardar}
        style={{
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
        }}
      >
        <h3>{form.id ? 'Editar inventario' : 'Nuevo item de inventario'}</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <label>
            Material base
            <select
              value={form.materialId}
              onChange={seleccionarMaterial}
              style={{ width: '100%' }}
            >
              <option value="">Manual / sin material base</option>
              {materiales.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Unidad
            <input
              name="unidad"
              value={form.unidad}
              onChange={cambiar}
              placeholder="m2, lámina, unidad, metro"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Existencia
            <input
              name="existencia"
              type="number"
              step="0.01"
              value={form.existencia}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Stock mínimo
            <input
              name="stockMinimo"
              type="number"
              step="0.01"
              value={form.stockMinimo}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Costo unitario US$
            <input
              name="costo"
              type="number"
              step="0.01"
              value={form.costo}
              onChange={cambiar}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Proveedor
            <input
              name="proveedor"
              value={form.proveedor}
              onChange={cambiar}
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
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit">
            {form.id ? 'Guardar cambios' : 'Crear item'}
          </button>

          {form.id && (
            <button type="button" onClick={limpiar}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <form
        onSubmit={registrarMovimiento}
        style={{
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
        }}
      >
        <h3>Registrar movimiento</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <label>
            Material
            <select
              name="inventarioId"
              value={movimiento.inventarioId}
              onChange={cambiarMovimiento}
              style={{ width: '100%' }}
            >
              <option value="">Seleccione material</option>
              {inventario.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} — {item.existencia} {item.unidad}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select
              name="tipo"
              value={movimiento.tipo}
              onChange={cambiarMovimiento}
              style={{ width: '100%' }}
            >
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
              <option value="Ajuste">Ajuste</option>
            </select>
          </label>

          <label>
            Cantidad
            <input
              name="cantidad"
              type="number"
              step="0.01"
              value={movimiento.cantidad}
              onChange={cambiarMovimiento}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Referencia
            <input
              name="referencia"
              value={movimiento.referencia}
              onChange={cambiarMovimiento}
              placeholder="OT, compra, ajuste, proveedor"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Responsable
            <input
              name="responsable"
              value={movimiento.responsable}
              onChange={cambiarMovimiento}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Observaciones
            <input
              name="observaciones"
              value={movimiento.observaciones}
              onChange={cambiarMovimiento}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Registrar movimiento</button>
        </div>
      </form>

      <div style={{ marginBottom: 12 }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por material, proveedor, unidad o estado..."
          style={{ width: '100%' }}
        />
      </div>

      {inventarioFiltrado.length === 0 ? (
        <p>No hay inventario registrado.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {inventarioFiltrado.map((item) => {
            const bajoStock =
              Number(item.existencia || 0) <= Number(item.stockMinimo || 0);

            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <strong>{item.nombre}</strong>

                <p>
                  Existencia: {item.existencia} {item.unidad} | Stock mínimo:{' '}
                  {item.stockMinimo} {item.unidad}
                </p>

                <small>
                  Costo: US$ {Number(item.costo || 0).toFixed(2)} | Proveedor:{' '}
                  {item.proveedor || 'N/A'} | Estado: {item.estado || 'Activo'}
                </small>

                {bajoStock && (
                  <p style={{ fontWeight: 'bold' }}>
                    ⚠️ Alerta: este material está en stock mínimo.
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => editar(item)}>
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ marginTop: 22 }}>Últimos movimientos</h3>

      {movimientosInventario.length === 0 ? (
        <p>No hay movimientos registrados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {movimientosInventario.slice(0, 10).map((mov) => (
            <div
              key={mov.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <strong>
                {mov.tipo} — {mov.nombre}
              </strong>

              <p>
                Cantidad: {mov.cantidad} {mov.unidad || ''}
              </p>

              <small>
                Referencia: {mov.referencia || 'N/A'} | Responsable:{' '}
                {mov.responsable || 'N/A'}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}