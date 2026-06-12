import { Link } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';

const LOCAL_BANNER_DESKTOP = '/banners/banner-desktop.jpg';
const LOCAL_BANNER_MOBILE = '/banners/banner-mobile.jpg';

function limpiarValor(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarBanner(banner) {
  if (!banner) return null;

  const imagen =
    limpiarValor(banner.imagen) ||
    limpiarValor(banner.image) ||
    limpiarValor(banner.url);

  return {
    ...banner,
    imagenDesktop:
      limpiarValor(banner.imagenDesktop) ||
      limpiarValor(banner.imagenEscritorio) ||
      limpiarValor(banner.desktop) ||
      limpiarValor(banner.bannerDesktop) ||
      limpiarValor(banner.imageDesktop) ||
      imagen ||
      LOCAL_BANNER_DESKTOP,

    imagenMobile:
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
      LOCAL_BANNER_MOBILE,
  };
}

function obtenerBannerActivo(banners = []) {
  const lista = Array.isArray(banners)
    ? banners.map(normalizarBanner).filter(Boolean)
    : [];

  const activos = lista.filter(
    (x) => x.estado === 'Activo' || x.activo === true
  );

  return activos[0] || lista[0] || null;
}

export default function Home() {
  const { banners = [], categorias = [], productos = [] } = useElan();

  const bannerActivo = obtenerBannerActivo(banners);

  const desktopBanner = bannerActivo?.imagenDesktop || LOCAL_BANNER_DESKTOP;
  const mobileBanner = bannerActivo?.imagenMobile || LOCAL_BANNER_MOBILE;

  return (
    <main>
      <section className="hero">
        <picture className="hero-picture">
          <source media="(max-width: 850px)" srcSet={mobileBanner} />
          <img src={desktopBanner} alt="ELANVISUAL" />
        </picture>

        <div className="hero-overlay" />

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