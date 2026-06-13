import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const formInicial = {
  id: '',
  nombre: '',
  categoria: '',
  subcategoria: '',
  familia: '',
  tipo: '',
  descripcion: '',
  precioVenta: 0,
  unidad: 'unidad',
  imagen: '',
  estado: 'Activo',
};

export default function Productos() {
  const {
    productos = [],
    multimedia = [],
    guardarProducto,
  } = useElan();

  const [form, setForm] = useState(formInicial);
  const [busqueda, setBusqueda] = useState('');

  const imagenesProducto = multimedia.filter(
    (m) =>
      m.estado === 'Activo' &&
      ['Producto', 'General'].includes(m.categoria)
  );

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return productos;

    return productos.filter((producto) =>
      [
        producto.nombre,
        producto.categoria,
        producto.subcategoria,
        producto.familia,
        producto.tipo,
        producto.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [productos, busqueda]);

  const resumen = useMemo(() => {
    return {
      total: productos.length,
      activos: productos.filter((p) => (p.estado || 'Activo') === 'Activo').length,
      conImagen: productos.filter((p) => p.imagen).length,
    };
  }, [productos]);

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
      alert('Ingrese el nombre del producto.');
      return;
    }

    guardarProducto({
      ...form,
      precioVenta: Number(form.precioVenta || 0),
    });

    limpiar();
  };

  const editar = (producto) => {
    setForm({
      id: producto.id || '',
      nombre: producto.nombre || '',
      categoria: producto.categoria || '',
      subcategoria: producto.subcategoria || '',
      familia: producto.familia || '',
      tipo: producto.tipo || '',
      descripcion: producto.descripcion || '',
      precioVenta: Number(producto.precioVenta || producto.precio || 0),
      unidad: producto.unidad || 'unidad',
      imagen: producto.imagen || '',
      estado: producto.estado || 'Activo',
    });
  };

  return (
    <div>
      <h2>Productos</h2>

      <p>
        Catálogo comercial de ELANVISUAL conectado a Multimedia Central.
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
          <p>Total productos</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.activos}</strong>
          <p>Activos</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <strong>{resumen.conImagen}</strong>
          <p>Con imagen</p>
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
        <h3>{form.id ? 'Editar producto' : 'Nuevo producto'}</h3>

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
              placeholder="Ej: Banner impreso, fascia, monolito"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Categoría
            <input
              name="categoria"
              value={form.categoria}
              onChange={cambiar}
              placeholder="Ej: Rotulación"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Subcategoría
            <input
              name="subcategoria"
              value={form.subcategoria}
              onChange={cambiar}
              placeholder="Ej: Exterior, interior, vehicular"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Familia
            <input
              name="familia"
              value={form.familia}
              onChange={cambiar}
              placeholder="Ej: Fachadas, impresión, estructuras"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Tipo
            <input
              name="tipo"
              value={form.tipo}
              onChange={cambiar}
              placeholder="Ej: Estándar, Premium, Personalizado"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Unidad
            <input
              name="unidad"
              value={form.unidad}
              onChange={cambiar}
              placeholder="unidad, m2, metro"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Precio venta US$
            <input
              name="precioVenta"
              type="number"
              step="0.01"
              value={form.precioVenta}
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

          <label>
            Imagen desde Multimedia
            <select
              name="imagen"
              value={form.imagen}
              onChange={cambiar}
              style={{ width: '100%' }}
            >
              <option value="">Sin imagen</option>

              {imagenesProducto.map((img) => (
                <option key={img.id} value={img.imagen}>
                  {img.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={cambiar}
              placeholder="Descripción comercial o técnica del producto"
              style={{ width: '100%', minHeight: 80 }}
            />
          </label>
        </div>

        {form.imagen && (
          <div style={{ marginTop: 12 }}>
            <img
              src={form.imagen}
              alt={form.nombre || 'Producto'}
              style={{
                width: 180,
                height: 120,
                objectFit: 'cover',
                borderRadius: 10,
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit">
            {form.id ? 'Guardar cambios' : 'Crear producto'}
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
          placeholder="Buscar por nombre, categoría, familia, tipo o estado..."
          style={{ width: '100%' }}
        />
      </div>

      {productosFiltrados.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              style={{
                border: '1px solid #ddd',
                padding: 12,
                borderRadius: 8,
                display: 'grid',
                gridTemplateColumns: producto.imagen ? '120px 1fr' : '1fr',
                gap: 12,
              }}
            >
              {producto.imagen && (
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  style={{
                    width: 120,
                    height: 90,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              )}

              <div>
                <strong>{producto.nombre}</strong>

                <p>
                  {producto.categoria || 'Sin categoría'} /{' '}
                  {producto.subcategoria || 'Sin subcategoría'} /{' '}
                  {producto.familia || 'Sin familia'}
                </p>

                <small>
                  Tipo: {producto.tipo || 'N/A'} | Unidad:{' '}
                  {producto.unidad || 'unidad'} | Precio: US${' '}
                  {Number(producto.precioVenta || producto.precio || 0).toFixed(2)}
                </small>

                <br />

                <small>Estado: {producto.estado || 'Activo'}</small>

                {producto.descripcion && <p>{producto.descripcion}</p>}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => editar(producto)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}