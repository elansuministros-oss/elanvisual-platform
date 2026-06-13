import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const formInicial = {
  id: '',
  nombre: '',
  categoria: '',
  subcategoria: '',
  familia: '',
  unidad: 'unidad',
  stock: 0,
  stockMinimo: 0,
  costo: 0,
  proveedor: '',
  estado: 'Activo',
};

export default function Materiales() {
  const {
    materiales = [],
    proveedores = [],
    guardarMaterial,
  } = useElan();

  const [form, setForm] = useState(formInicial);
  const [busqueda, setBusqueda] = useState('');

  const materialesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return materiales;

    return materiales.filter((material) =>
      [
        material.nombre,
        material.categoria,
        material.subcategoria,
        material.familia,
        material.unidad,
        material.proveedor,
        material.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [materiales, busqueda]);

  const resumen = useMemo(() => {
    return {
      total: materiales.length,
      activos: materiales.filter((m) => (m.estado || 'Activo') === 'Activo').length,
      bajoStock: materiales.filter(
        (m) => Number(m.stock || 0) <= Number(m.stockMinimo || 0)
      ).length,
    };
  }, [materiales]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiar = () => {
    setForm(formInicial);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert('Ingrese el nombre del material.');
      return;
    }

    guardarMaterial({
      ...form,
      stock: Number(form.stock || 0),
      stockMinimo: Number(form.stockMinimo || 0),
      costo: Number(form.costo || 0),
    });

    limpiar();
  };

  const editar = (material) => {
    setForm({
      id: material.id || '',
      nombre: material.nombre || '',
      categoria: material.categoria || '',
      subcategoria: material.subcategoria || '',
      familia: material.familia || '',
      unidad: material.unidad || 'unidad',
      stock: Number(material.stock || 0),
      stockMinimo: Number(material.stockMinimo || 0),
      costo: Number(material.costo || 0),
      proveedor: material.proveedor || '',
      estado: material.estado || 'Activo',
    });
  };

  return (
    <div>
      <h2>Materiales</h2>

      <p>
        Catálogo técnico de materiales de ELANVISUAL. Cada material puede alimentar
        inventario, costos, producción y futuras órdenes de trabajo.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
          margin: '16px 0',
        }}
      >
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.total}</strong>
          <p>Total materiales</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.activos}</strong>
          <p>Activos</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.bajoStock}</strong>
          <p>Bajo stock</p>
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
        <h3>{form.id ? 'Editar material' : 'Nuevo material'}</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <label>
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              placeholder="Ej: PVC 10 mm 122×244"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Categoría
            <input
              name="categoria"
              value={form.categoria}
              onChange={cambiar}
              placeholder="Ej: PVC, Acrílico, Vinil, LED"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Subcategoría
            <input
              name="subcategoria"
              value={form.subcategoria}
              onChange={cambiar}
              placeholder="Ej: Lámina, rollo, módulo, perfilería"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Familia
            <input
              name="familia"
              value={form.familia}
              onChange={cambiar}
              placeholder="Ej: Rotulación, impresión, iluminación"
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
            Stock actual
            <input
              name="stock"
              type="number"
              step="0.01"
              value={form.stock}
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
            <select
              name="proveedor"
              value={form.proveedor}
              onChange={cambiar}
              style={{ width: '100%' }}
            >
              <option value="">Sin proveedor asignado</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.nombre}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
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
              <option value="Agotado">Agotado</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit">
            {form.id ? 'Guardar cambios' : 'Crear material'}
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
          placeholder="Buscar por nombre, categoría, familia, proveedor o estado..."
          style={{ width: '100%' }}
        />
      </div>

      {materialesFiltrados.length === 0 ? (
        <p>No hay materiales registrados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {materialesFiltrados.map((material) => {
            const bajoStock =
              Number(material.stock || 0) <= Number(material.stockMinimo || 0);

            return (
              <div
                key={material.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <strong>{material.nombre}</strong>

                <p>
                  {material.categoria || 'Sin categoría'} /{' '}
                  {material.subcategoria || 'Sin subcategoría'} /{' '}
                  {material.familia || 'Sin familia'}
                </p>

                <small>
                  Stock: {material.stock || 0} {material.unidad || 'unidad'} |
                  Mínimo: {material.stockMinimo || 0} {material.unidad || 'unidad'} |
                  Costo: US$ {Number(material.costo || 0).toFixed(2)}
                </small>

                <br />

                <small>
                  Proveedor: {material.proveedor || 'N/A'} | Estado:{' '}
                  {material.estado || 'Activo'}
                </small>

                {bajoStock && (
                  <p style={{ fontWeight: 'bold' }}>
                    ⚠️ Este material está en stock mínimo.
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => editar(material)}>
                    Editar
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