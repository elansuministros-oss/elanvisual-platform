import { Link } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';

export default function Home() {
  const { banners, categorias, productos } = useElan();

  const bannerActivo =
    banners.find((x) => x.estado === 'Activo') ||
    banners[0] ||
    null;

  const imagenBanner =
    bannerActivo?.imagen ||
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1800&auto=format&fit=crop';

  const tituloBanner =
    bannerActivo?.titulo ||
    'Rotulación, impresión y proyectos visuales';

  const subtituloBanner =
    bannerActivo?.subtitulo ||
    'Fabricamos soluciones visuales reales para negocios, fachadas, interiores, vehículos y puntos de venta.';

  const botonBanner =
    bannerActivo?.boton ||
    'Ver catálogo';

  const enlaceBanner =
    bannerActivo?.enlace ||
    '/catalogo';

  return (
    <main>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.42),rgba(0,0,0,.08)),url(${imagenBanner})`,
        }}
      >
        <div className="hero-copy">
          <span>ELANVISUAL</span>

          <h1>{tituloBanner}</h1>

          <p>{subtituloBanner}</p>

          <Link className="primary" to={enlaceBanner}>
            {botonBanner}
          </Link>
        </div>
      </section>

      <section className="container">
        <h2>Categorías principales</h2>

        <div className="grid cats">
          {categorias.slice(0, 6).map((c) => (
            <Link
              className="card"
              to={`/catalogo/${encodeURIComponent(c.nombre)}`}
              key={c.id}
            >
              <h3>{c.nombre}</h3>
              <p>{c.subcategorias?.slice(0, 4).join(' · ')}</p>
            </Link>
          ))}
        </div>

        <h2>Trabajos y productos destacados</h2>

        <div className="grid products">
          {productos.slice(0, 6).map((p) => (
            <article className="product" key={p.id}>
              <img src={p.imagen} alt={p.nombre} />
              <h3>{p.nombre}</h3>
              <p>{p.categoria}</p>
            </article>
          ))}
        </div>

        <div className="trust">
          Producción real, materiales verificables, cotización clara y seguimiento por Orden de Trabajo.
        </div>
      </section>
    </main>
  );
}