import { useMemo, useState } from 'react';

import { useElan } from '../../core/context/ElanContext.jsx';
import { uid } from '../../utils/formatters.js';

import AppCard from '../../components/AppCard.jsx';
import AppButton from '../../components/AppButton.jsx';
import AppInput from '../../components/AppInput.jsx';
import ImageViewer from '../../components/ImageViewer.jsx';

export default function Productos() {
  const { state, addItem, removeItem } = useElan();

  const mediaProductos = useMemo(() => {
    return (state.multimedia || []).filter(
      (item) => item.tipo === 'producto' || item.tipo === 'general'
    );
  }, [state.multimedia]);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    imagen: '',
    galeria: [],
    activo: true,
  });

  const [viewer, setViewer] = useState(null);

  const cambiarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const agregarImagenGaleria = (url) => {
    if (!url) return;

    setForm((prev) => {
      if (prev.galeria.includes(url)) return prev;

      return {
        ...prev,
        galeria: [...prev.galeria, url],
        imagen: prev.imagen || url,
      };
    });
  };

  const quitarImagenGaleria = (url) => {
    setForm((prev) => {
      const nuevaGaleria = prev.galeria.filter((item) => item !== url);

      return {
        ...prev,
        galeria: nuevaGaleria,
        imagen: prev.imagen === url ? nuevaGaleria[0] || '' : prev.imagen,
      };
    });
  };

  const guardar = () => {
    if (!form.nombre.trim()) {
      alert('Escribí el nombre del producto.');
      return;
    }

    addItem('productos', {
      id: uid('producto'),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio || 0),
      categoria: form.categoria.trim(),
      imagen: form.imagen,
      galeria: form.galeria,
      activo: form.activo,
      creado: new Date().toISOString(),
    });

    setForm({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      imagen: '',
      galeria: [],
      activo: true,
    });
  };

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Productos</h1>

        <p className="muted">
          Productos conectados a Multimedia con imagen principal y galería.
        </p>
      </div>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Nombre"
            value={form.nombre}
            onChange={(e) => cambiarCampo('nombre', e.target.value)}
          />

          <AppInput
            label="Precio"
            type="number"
            value={form.precio}
            onChange={(e) => cambiarCampo('precio', e.target.value)}
          />

          <AppInput
            label="Categoría"
            value={form.categoria}
            onChange={(e) => cambiarCampo('categoria', e.target.value)}
          />

          <label className="app-field">
            <span>Imagen principal</span>
            <select
              value={form.imagen}
              onChange={(e) => cambiarCampo('imagen', e.target.value)}
            >
              <option value="">Seleccionar imagen principal</option>

              {mediaProductos.map((img) => (
                <option key={img.id} value={img.url}>
                  {img.titulo} / {img.tipo}
                </option>
              ))}
            </select>
          </label>

          <label className="app-field">
            <span>Agregar imagen a galería</span>
            <select
              value=""
              onChange={(e) => agregarImagenGaleria(e.target.value)}
            >
              <option value="">Seleccionar imagen</option>

              {mediaProductos.map((img) => (
                <option key={img.id} value={img.url}>
                  {img.titulo} / {img.tipo}
                </option>
              ))}
            </select>
          </label>

          {form.galeria.length > 0 ? (
            <div className="media-grid">
              {form.galeria.map((url) => (
                <article className="media-card" key={url}>
                  <button type="button" onClick={() => setViewer(url)}>
                    <img src={url} alt="Imagen de galería" />
                  </button>

                  <AppButton
                    variant="danger"
                    onClick={() => quitarImagenGaleria(url)}
                  >
                    Quitar
                  </AppButton>
                </article>
              ))}
            </div>
          ) : null}

          <label className="app-field">
            <span>Descripción</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => cambiarCampo('descripcion', e.target.value)}
            />
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => cambiarCampo('activo', e.target.checked)}
            />
            Producto activo
          </label>

          <AppButton onClick={guardar}>Guardar producto</AppButton>
        </div>
      </AppCard>

      <section className="products-admin-grid">
        {(state.productos || []).map((producto) => {
          const galeria = Array.isArray(producto.galeria)
            ? producto.galeria
            : producto.imagen
              ? [producto.imagen]
              : [];

          return (
            <article key={producto.id} className="product-admin-card">
              {producto.imagen ? (
                <button
                  type="button"
                  onClick={() => setViewer(producto.imagen)}
                  style={{
                    border: 0,
                    padding: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <img src={producto.imagen} alt={producto.nombre} />
                </button>
              ) : null}

              <div>
                <h3>{producto.nombre}</h3>
                <p>{producto.descripcion}</p>
                <strong>C$ {producto.precio}</strong>
                <small>{producto.categoria}</small>
                <small>{producto.activo ? 'Activo' : 'Inactivo'}</small>
                <small>{galeria.length} imagen(es)</small>
              </div>

              <AppButton
                variant="danger"
                onClick={() => removeItem('productos', producto.id)}
              >
                Eliminar
              </AppButton>
            </article>
          );
        })}
      </section>

      <ImageViewer
        image={viewer}
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
      />
    </main>
  );
}