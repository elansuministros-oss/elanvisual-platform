import { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const categorias = [
  'Banner',
  'Producto',
  'Showroom',
  'Proyecto',
  'Logo',
  'Cliente',
  'General',
];

const pesoMaximoMB = 1.2;
const pesoMaximoBytes = pesoMaximoMB * 1024 * 1024;

export default function MultimediaCRM() {
  const {
    multimedia = [],
    agregarMultimedia,
    actualizarMultimedia,
    eliminarMultimedia,
  } = useElan();

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Banner',
    imagen: '',
    estado: 'Activo',
  });

  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const cargarImagen = (e) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes.');
      return;
    }

    if (file.size > pesoMaximoBytes) {
      setError(`La imagen pesa demasiado. Máximo recomendado: ${pesoMaximoMB} MB.`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        imagen: reader.result,
        nombre: prev.nombre || file.name.replace(/\.[^/.]+$/, ''),
      }));
    };

    reader.readAsDataURL(file);
  };

  const guardar = (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) {
      setError('Escribí un nombre para la imagen.');
      return;
    }

    if (!form.imagen) {
      setError('Seleccioná una imagen.');
      return;
    }

    agregarMultimedia({
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      imagen: form.imagen,
      estado: form.estado,
    });

    setForm({
      nombre: '',
      categoria: 'Banner',
      imagen: '',
      estado: 'Activo',
    });
  };

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return multimedia.filter((item) => {
      if (!q) return true;

      return [
        item.nombre,
        item.categoria,
        item.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [multimedia, busqueda]);

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h1>Multimedia Central</h1>
          <p>
            Biblioteca central para banners, productos, showroom, proyectos,
            logos y clientes.
          </p>
        </div>
      </div>

      <form className="grid-form" onSubmit={guardar}>
        <label>
          Nombre
          <input
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Ej: Banner principal ELANVISUAL"
          />
        </label>

        <label>
          Categoría
          <select name="categoria" value={form.categoria} onChange={cambiar}>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Estado
          <select name="estado" value={form.estado} onChange={cambiar}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </label>

        <label>
          Imagen local
          <input type="file" accept="image/*" onChange={cargarImagen} />
        </label>

        {form.imagen && (
          <div className="media-preview">
            <img src={form.imagen} alt={form.nombre || 'Vista previa'} />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit">Guardar imagen</button>
      </form>

      <div className="section-head">
        <h2>Biblioteca</h2>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar imagen..."
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vista</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {lista.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      style={{
                        width: 90,
                        height: 54,
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    'Sin imagen'
                  )}
                </td>

                <td>{item.nombre}</td>
                <td>{item.categoria}</td>
                <td>{item.fecha || '-'}</td>

                <td>
                  <button
                    type="button"
                    onClick={() =>
                      actualizarMultimedia(item.id, {
                        estado: item.estado === 'Activo' ? 'Inactivo' : 'Activo',
                      })
                    }
                  >
                    {item.estado || 'Activo'}
                  </button>
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() => eliminarMultimedia(item.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {!lista.length && (
              <tr>
                <td colSpan="6">No hay imágenes guardadas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}