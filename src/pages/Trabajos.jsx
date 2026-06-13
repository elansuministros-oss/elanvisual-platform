import React from 'react';
import { PlayCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Trabajos() {
  const { trabajos } = useApp();

  return (
    <main>
      <section className="catalog-hero">
        <div>
          <span className="badge">Experiencias reales</span>

          <h1>Nuestros trabajos realizados</h1>

          <p>
            Conocé algunos de los productos fabricados para nuestros clientes.
            Fotografías reales de trabajos entregados, acabados y resultados
            que reflejan la calidad, funcionalidad y compromiso de ELANPET.
          </p>
        </div>

        <aside className="cart-summary-mini">
          <b>Trabajos reales</b>
          <span>
            Proyectos fabricados y entregados a nuestros clientes.
          </span>
        </aside>
      </section>

      <section className="work-grid">
        {trabajos
          .filter((t) => t.activo)
          .map((t) => (
            <article className="work-card" key={t.id}>
              <img src={t.imagen} alt={t.titulo} />

              <div>
                <small>
                  {t.tipo === 'Video' ? (
                    <>
                      <PlayCircle size={14} /> Video
                    </>
                  ) : (
                    t.tipo
                  )}
                </small>

                <b>{t.titulo}</b>

                <p>{t.descripcion}</p>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}