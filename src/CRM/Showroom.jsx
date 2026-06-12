import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const formInicial = {
  id: '',
  titulo: '',
  categoria: '',
  cliente: '',
  ubicacion: '',
  descripcion: '',
  imagen: '',
  estado: 'Activo',
};

export default function ShowroomCRM() {
  const { showroom = [], multimedia = [] } = useElan();

  const [lista, setLista] = useState(showroom || []);
  const [form, setForm] = useState(formInicial);
  const [busqueda, setBusqueda] = useState('');

  const imagenesShowroom = multimedia.filter(
    (m) =>
      m.estado === 'Activo' &&
      ['Showroom', 'Proyecto', 'General'].includes(m.categoria)
  );

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardarStorage = (nuevaLista) => {
    const actual = JSON.parse(localStorage.getItem('elanvisual_state_v2') || '{}');

    localStorage.setItem(
      'elanvisual_state_v2',
      JSON.stringify({
        ...actual,
        showroom: nuevaLista,
      })
    );

    setLista(nuevaLista);
  };

  const limpiar = () => {
    setForm(formInicial);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      alert('Ingrese el título del trabajo.');
      return;
    }

    const item = {
      ...form,
      id: form.id || `show-${Date.now()}`,
      fecha: form.fecha || new Date().toISOString(),
      titulo: form.titulo.trim(),
      estado: form.estado || 'Activo',
    };

    const nuevaLista = form.id
      ? lista.map((x) => (x.id === form.id ? item : x))
      : [item, ...lista];

    guardarStorage(nuevaLista);
    limpiar();
  };

  const editar = (item) => {
    setForm({
      id: item.id || '',
      titulo: item.titulo || '',
      categoria: item.categoria || '',
      cliente: item.cliente || '',
      ubicacion: item.ubicacion || '',
      descripcion: item.descripcion || '',
      imagen: item.imagen || '',
      estado: item.estado || 'Activo',
    });
  };

  const eliminar = (id) => {
    if (!confirm('¿Eliminar este trabajo del showroom?')) return;
    guardarStorage(lista.filter((x) => x.id !== id));
  };

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return lista;

    return lista.filter((item) =>
      [
        item.titulo,
        item.categoria,
        item.cliente,
        item.ubicacion,
        item.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [lista, busqueda]);

  return (
    <div>
      <h2>Showroom</h2>

      <p>
        Galería administrativa de trabajos realizados, conectada a Multimedia
        Central.
      </p>

      <form
        onSubmit={guardar}
        style={{
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
        }}
      >
        <h3>{form.id ? 'Editar trabajo' : 'Nuevo trabajo'}</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <label>
            Título
            <input
              name="titulo"
              value={form.titulo}
              onChange={cambiar}
              placeholder="Ej: Fachada COMEX Altamira"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Categoría
            <input
              name="categoria"
              value={form.categoria}
              onChange={cambiar}
              placeholder="Ej: Fachada, monolito, letras 3D"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Cliente
            <input
              name="cliente"
              value={form.cliente}
              onChange={cambiar}
              placeholder="Ej: COMEX"
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Ubicación
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={cambiar}
              placeholder="Ej: Managua, Nicaragua"
              style={{ width: '100%' }}
            />
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

              {imagenesShowroom.map((img) => (
                <option key={img.id} value={img.imagen}>
                  {img.nombre}
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
            </select>
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={cambiar}
              placeholder="Descripción técnica o comercial del trabajo"
              style={{ width: '100%', minHeight: 90 }}
            />
          </label>
        </div>

        {form.imagen && (
          <div style={{ marginTop: 12 }}>
            <img
              src={form.imagen}
              alt={form.titulo || 'Showroom'}
              style={{
                width: 220,
                height: 140,
                objectFit: 'cover',
                borderRadius: 10,
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit">
            {form.id ? 'Guardar cambios' : 'Crear trabajo'}
          </button>

          {form.id && (
            <button type="button" onClick={limpiar}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar trabajo, cliente, ubicación o estado..."
        style={{ width: '100%', marginBottom: 12 }}
      />

      {filtrados.length === 0 ? (
        <p>No hay trabajos registrados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtrados.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #ddd',
                padding: 12,
                borderRadius: 8,
                display: 'grid',
                gridTemplateColumns: item.imagen ? '140px 1fr' : '1fr',
                gap: 12,
              }}
            >
              {item.imagen && (
                <img
                  src={item.imagen}
                  alt={item.titulo}
                  style={{
                    width: 140,
                    height: 95,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              )}

              <div>
                <strong>{item.titulo}</strong>

                <p>
                  {item.categoria || 'Sin categoría'} ·{' '}
                  {item.cliente || 'Sin cliente'} ·{' '}
                  {item.ubicacion || 'Sin ubicación'}
                </p>

                <small>Estado: {item.estado || 'Activo'}</small>

                {item.descripcion && <p>{item.descripcion}</p>}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => editar(item)}>
                    Editar
                  </button>

                  <button type="button" onClick={() => eliminar(item.id)}>
                    Eliminar
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