import React from 'react';
import { useApp } from '../context/AppContext';

export default function Trabajos() {
  const { trabajos } = useApp();

  const trabajosActivos = Array.isArray(trabajos)
    ? trabajos.filter((t) => t.activo)
    : [];

  return (
    <main>
      <section className="catalog-hero">
        <div>
          <span className="badge">Portafolio ELANVISUAL</span>

          <h1>Trabajos realizados</h1>

          <p>
            Portafolio listo para cargar proyectos reales de rotulación,
            impresión digital, acrílico, PVC, letras corpóreas,
            fachadas, señalización y branding corporativo.
          </p>
        </div>

        <aside className="cart-summary-mini">
          <b>Portafolio operativo</b>

          <span>
            Los trabajos se administran desde el panel interno
            de ELANVISUAL.
          </span>
        </aside>
      </section>

      {trabajosActivos.length === 0 ? (
        <section className="empty-state">
          <b>Portafolio vacío</b>

          <p>
            No existen proyectos publicados.
            Cargá trabajos reales desde Administración
            para mostrarlos aquí.
          </p>
        </section>
      ) : (
        <section className="work-grid">
          {trabajosActivos.map((t) => (
            <article className="work-card" key={t.id}>
              {t.imagen ? (
                <img
                  src={t.imagen}
                  alt={t.titulo}
                />
              ) : null}

              <div>
                <small>
                  {t.tipo || 'Trabajo realizado'}
                </small>

                <b>{t.titulo}</b>

                <p>{t.descripcion}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}