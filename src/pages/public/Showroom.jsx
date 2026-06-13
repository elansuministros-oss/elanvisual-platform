import { useMemo, useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';
import ImageViewer from '../../components/ImageViewer.jsx';

export default function Showroom() {
  const { state } = useElan();
  const [viewer, setViewer] = useState(null);

  const imagenes = useMemo(() => {
    return (state.multimedia || []).filter(
      (item) =>
        item.tipo === 'showroom' ||
        item.tipo === 'general'
    );
  }, [state.multimedia]);

  return (
    <main className="page-shell public-page">
      <div className="page-title">
        <p className="eyebrow">Showroom</p>
        <h1>Galería de trabajos</h1>

        <p className="muted">
          Proyectos, instalaciones y trabajos publicados.
        </p>
      </div>

      <section className="catalog-grid">
        {imagenes.map((item) => (
          <article
            key={item.id}
            className="catalog-card"
          >
            <button
              type="button"
              onClick={() => setViewer(item.url)}
              style={{
                border: 0,
                padding: 0,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <img
                src={item.url}
                alt={item.titulo}
              />
            </button>

            <div>
              <h2>{item.titulo}</h2>

              <small className="muted">
                {item.tipo}
              </small>
            </div>
          </article>
        ))}
      </section>

      {!imagenes.length && (
        <div className="empty-state">
          No hay trabajos publicados todavía.
        </div>
      )}

      <ImageViewer
        image={viewer}
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
      />
    </main>
  );
}