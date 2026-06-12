import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1800&auto=format&fit=crop';

function limpiarValor(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarBanner(banner) {
  if (!banner) return null;

  const imagen = limpiarValor(banner.imagen);
  const imagenDesktop = limpiarValor(banner.imagenDesktop) || imagen;
  const imagenMobile =
    limpiarValor(banner.imagenMobile) ||
    imagenDesktop ||
    imagen;

  return {
    ...banner,
    imagen,
    imagenDesktop,
    imagenMobile,
  };
}

function obtenerBannerActivo(banners = []) {
  const lista = Array.isArray(banners)
    ? banners.map(normalizarBanner).filter(Boolean)
    : [];

  const activos = lista.filter((x) => x.estado === 'Activo');

  return (
    activos.find((x) => x.imagenMobile && x.imagenDesktop) ||
    activos.find((x) => x.imagenMobile) ||
    activos[0] ||
    lista.find((x) => x.imagenMobile && x.imagenDesktop) ||
    lista.find((x) => x.imagenMobile) ||
    lista[0] ||
    null
  );
}

export default function Home() {
  const { banners, categorias, productos } = useElan();

  const [esMovil, setEsMovil] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 850px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 850px)');

    const actualizar = () => {
      setEsMovil(media.matches);
    };

    actualizar();

    if (media.addEventListener) {
      media.addEventListener('change', actualizar);
      return () => media.removeEventListener('change', actualizar);
    }

    media.addListener(actualizar);
    return () => media.removeListener(actualizar);
  }, []);

  const bannerActivo = useMemo(() => obtenerBannerActivo(banners), [banners]);

  const imagenBanner =
    (esMovil
      ? bannerActivo?.imagenMobile ||
        bannerActivo?.imagenDesktop ||
        bannerActivo?.imagen
      : bannerActivo?.imagenDesktop ||
        bannerActivo?.imagen ||
        bannerActivo?.imagenMobile) ||
    FALLBACK_BANNER;

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
          backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.42),rgba(0,0,0,.08)),url("${imagenBanner}")`,
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
