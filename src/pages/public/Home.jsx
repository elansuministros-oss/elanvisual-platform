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

  const imagen =
    limpiarValor(banner.imagen) ||
    limpiarValor(banner.image) ||
    limpiarValor(banner.url);

  const imagenDesktop =
    limpiarValor(banner.imagenDesktop) ||
    limpiarValor(banner.imagenEscritorio) ||
    limpiarValor(banner.desktop) ||
    limpiarValor(banner.bannerDesktop) ||
    limpiarValor(banner.imageDesktop) ||
    imagen;

  const imagenMobile =
    limpiarValor(banner.imagenMobile) ||
    limpiarValor(banner.imagenMovil) ||
    limpiarValor(banner.imagen_movil) ||
    limpiarValor(banner.imagen_mobile) ||
    limpiarValor(banner.mobile) ||
    limpiarValor(banner.bannerMobile) ||
    limpiarValor(banner.bannerMovil) ||
    limpiarValor(banner.imageMobile) ||
    limpiarValor(banner.image_mobile) ||
    limpiarValor(banner.fotoMobile) ||
    limpiarValor(banner.fotoMovil) ||
    imagenDesktop ||
    imagen ||
    FALLBACK_BANNER;

  return {
    ...banner,
    imagen: imagen || FALLBACK_BANNER,
    imagenDesktop: imagenDesktop || imagen || FALLBACK_BANNER,
    imagenMobile,
  };
}

function obtenerBannerActivo(banners = []) {
  const lista = Array.isArray(banners)
    ? banners.map(normalizarBanner).filter(Boolean)
    : [];

  const activos = lista.filter((x) => x.estado === 'Activo' || x.activo === true);

  return activos[0] || lista[0] || null;
}

export default function Home() {
  const { banners = [], categorias = [], productos = [] } = useElan();

  const [ancho, setAncho] = useState(() => {
    if (typeof window === 'undefined') return 1200;
    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const actualizar = () => setAncho(window.innerWidth);

    actualizar();
    window.addEventListener('resize', actualizar);
    window.addEventListener('orientationchange', actualizar);

    return () => {
      window.removeEventListener('resize', actualizar);
      window.removeEventListener('orientationchange', actualizar);
    };
  }, []);

  const esMovil = ancho <= 850;

  const bannerActivo = useMemo(() => obtenerBannerActivo(banners), [banners]);

  const imagenBanner =
    (esMovil
      ? bannerActivo?.imagenMobile
      : bannerActivo?.imagenDesktop) ||
    bannerActivo?.imagen ||
    FALLBACK_BANNER;

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

          <h1>
            {bannerActivo?.titulo || 'Rotulación, impresión y proyectos visuales'}
          </h1>

          <p>
            {bannerActivo?.subtitulo ||
              'Fabricamos soluciones visuales reales para negocios, fachadas, interiores, vehículos y puntos de venta.'}
          </p>

          <Link className="primary" to={bannerActivo?.enlace || '/catalogo'}>
            {bannerActivo?.boton || 'Ver catálogo'}
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