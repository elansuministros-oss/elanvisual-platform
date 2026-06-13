import { Link } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';

const FALLBACK_DESKTOP = '/banners/banner-desktop.jpg';
const FALLBACK_MOBILE = '/banners/banner-mobile.jpg';

function limpiar(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function activo(item) {
  return item?.estado === 'Activo' || item?.activo === true || item?.active === true;
}

function imagenDesktopDe(item) {
  return (
    limpiar(item?.imagenDesktop) ||
    limpiar(item?.imagenEscritorio) ||
    limpiar(item?.desktop) ||
    limpiar(item?.bannerDesktop) ||
    limpiar(item?.imagen) ||
    limpiar(item?.url) ||
    limpiar(item?.src) ||
    limpiar(item?.archivo) ||
    limpiar(item?.image) ||
    ''
  );
}

function imagenMobileDe(item) {
  return (
    limpiar(item?.imagenMobile) ||
    limpiar(item?.imagenMovil) ||
    limpiar(item?.imagen_mobile) ||
    limpiar(item?.mobile) ||
    limpiar(item?.bannerMobile) ||
    limpiar(item?.imagen) ||
    limpiar(item?.url) ||
    limpiar(item?.src) ||
    limpiar(item?.archivo) ||
    limpiar(item?.image) ||
    ''
  );
}

function leerEstadoLocal() {
  try {
    const keys = ['elanvisual_state_v2', 'elanvisual_state', 'elan_state'];

    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') return data;
      }
    }
  } catch {
    return {};
  }

  return {};
}

function unirListas(...listas) {
  return listas.flatMap((lista) => (Array.isArray(lista) ? lista : []));
}

function buscarMultimediaPorCategoria(multimedia, categoria) {
  const objetivo = categoria.toLowerCase();

  const lista = Array.isArray(multimedia) ? [...multimedia].reverse() : [];

  return (
    lista.find(
      (item) => activo(item) && limpiar(item.categoria).toLowerCase() === objetivo
    ) ||
    lista.find(
      (item) => limpiar(item.categoria).toLowerCase() === objetivo
    ) ||
    null
  );
}

function obtenerBanner({ banners, multimedia }) {
  const listaBanners = Array.isArray(banners) ? [...banners].reverse() : [];

  const bannerActivo =
    listaBanners.find(activo) ||
    listaBanners[0] ||
    null;

  const mediaDesktop = buscarMultimediaPorCategoria(multimedia, 'Banner');
  const mediaMobile = buscarMultimediaPorCategoria(multimedia, 'Banner Mobile');

  const desktop =
    imagenDesktopDe(bannerActivo) ||
    imagenDesktopDe(mediaDesktop) ||
    FALLBACK_DESKTOP;

  const mobile =
    imagenMobileDe(bannerActivo) ||
    imagenMobileDe(mediaMobile) ||
    FALLBACK_MOBILE ||
    desktop;

  return {
    ...(bannerActivo || {}),
    imagenDesktop: desktop,
    imagenMobile: mobile,
  };
}

export default function Home() {
  const contexto = useElan();
  const local = leerEstadoLocal();

  const categorias = contexto?.categorias || local?.categorias || [];
  const productos = contexto?.productos || local?.productos || [];

  const banners = unirListas(
    local?.banners,
    contexto?.banners
  );

  const multimedia = unirListas(
    local?.multimedia,
    local?.media,
    local?.archivos,
    contexto?.multimedia,
    contexto?.media,
    contexto?.archivos
  );

  const bannerActivo = obtenerBanner({ banners, multimedia });

  return (
    <main>
      <section className="hero">
        <picture className="hero-picture" key={`${bannerActivo.imagenDesktop}-${bannerActivo.imagenMobile}`}>
          <source media="(max-width: 850px)" srcSet={bannerActivo.imagenMobile} />
          <img src={bannerActivo.imagenDesktop} alt="ELANVISUAL" />
        </picture>

        <div className="hero-overlay" />

        <div className="hero-copy">
          <span>ELANVISUAL</span>

          <h1>
            {bannerActivo?.titulo || 'Soluciones visuales para marcas, espacios y negocios.'}
          </h1>

          <p>
            {bannerActivo?.subtitulo ||
              'Rotulación, impresión digital, fachadas, displays, acrílicos, PVC y proyectos especiales.'}
          </p>

          <Link className="primary" to={bannerActivo?.enlace || '/catalogo'}>
            {bannerActivo?.boton || 'Ver Catálogo'}
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