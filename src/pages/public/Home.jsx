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

function imagenDe(item) {
  return (
    limpiar(item?.imagenMobile) ||
    limpiar(item?.imagenMovil) ||
    limpiar(item?.imagen_mobile) ||
    limpiar(item?.imagenDesktop) ||
    limpiar(item?.imagenEscritorio) ||
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
    lista.find((item) => activo(item) && limpiar(item.categoria).toLowerCase() === objetivo) ||
    lista.find((item) => limpiar(item.categoria).toLowerCase() === objetivo) ||
    null
  );
}

function obtenerBanner({ banners, multimedia }) {
  const listaBanners = Array.isArray(banners) ? [...banners].reverse() : [];
  const bannerActivo = listaBanners.find(activo) || listaBanners[0] || null;

  const mediaDesktop = buscarMultimediaPorCategoria(multimedia, 'Banner');
  const mediaMobile = buscarMultimediaPorCategoria(multimedia, 'Banner Mobile');

  const desktop =
    imagenDe(mediaDesktop) ||
    imagenDe(bannerActivo) ||
    FALLBACK_DESKTOP;

  const mobile =
    imagenDe(mediaMobile) ||
    limpiar(bannerActivo?.imagenMobile) ||
    limpiar(bannerActivo?.imagenMovil) ||
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

  const banners = unirListas(local?.banners, contexto?.banners);

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
      <style>
        {`
          .elan-home-hero {
            position: relative !important;
            min-height: 760px !important;
            overflow: hidden !important;
          }

          .elan-home-picture {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 0 !important;
          }

          .elan-home-picture img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
          }

          .elan-home-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: linear-gradient(
              90deg,
              rgba(0,0,0,.78),
              rgba(0,0,0,.52),
              rgba(0,0,0,.25)
            ) !important;
            z-index: 1 !important;
          }

          .elan-home-copy {
            position: absolute !important;
            z-index: 5 !important;
            left: 7vw !important;
            bottom: 100px !important;
            width: min(760px, 86vw) !important;
            color: #fff !important;
          }

          .elan-home-copy span {
            display: block !important;
            color: #d8a84f !important;
            font-size: 18px !important;
            font-weight: 950 !important;
            letter-spacing: .22em !important;
            margin-bottom: 18px !important;
          }

          .elan-home-copy h1 {
            color: #fff !important;
            font-size: clamp(54px, 7vw, 92px) !important;
            line-height: .95 !important;
            font-weight: 950 !important;
            margin: 0 0 26px !important;
          }

          .elan-home-copy p {
            color: #fff !important;
            font-size: clamp(24px, 2.7vw, 34px) !important;
            line-height: 1.18 !important;
            font-weight: 650 !important;
            margin: 0 0 34px !important;
          }

          .elan-home-copy .primary {
            font-size: 26px !important;
            padding: 22px 34px !important;
            border-radius: 18px !important;
            font-weight: 950 !important;
          }

          @media (max-width: 850px) {
            .elan-home-hero {
              min-height: 900px !important;
            }

            .elan-home-overlay {
              background: linear-gradient(
                180deg,
                rgba(0,0,0,.38),
                rgba(0,0,0,.72),
                rgba(0,0,0,.90)
              ) !important;
            }

            .elan-home-copy {
              left: 28px !important;
              right: 28px !important;
              top: 165px !important;
              bottom: auto !important;
              width: auto !important;
            }

            .elan-home-copy span {
              font-size: 26px !important;
              margin-bottom: 22px !important;
            }

            .elan-home-copy h1 {
              font-size: 76px !important;
              line-height: .92 !important;
              margin-bottom: 30px !important;
            }

            .elan-home-copy p {
              font-size: 34px !important;
              line-height: 1.18 !important;
              margin-bottom: 36px !important;
            }

            .elan-home-copy .primary {
              width: 100% !important;
              display: flex !important;
              justify-content: center !important;
              font-size: 34px !important;
              padding: 30px 34px !important;
              border-radius: 24px !important;
            }

            .container {
              padding: 48px 26px !important;
            }

            .container h2 {
              font-size: 42px !important;
              line-height: 1.05 !important;
              margin: 0 0 30px !important;
            }

            .grid.cats,
            .grid.products {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }

            .grid.cats .card {
              min-height: 190px !important;
              padding: 34px 30px !important;
              border-radius: 26px !important;
            }

            .grid.cats .card h3 {
              font-size: 34px !important;
              line-height: 1.1 !important;
              margin-bottom: 18px !important;
            }

            .grid.cats .card p {
              font-size: 26px !important;
              line-height: 1.25 !important;
            }

            .grid.products .product {
              padding: 28px !important;
              border-radius: 26px !important;
            }

            .grid.products .product img {
              width: 100% !important;
              min-height: 360px !important;
              object-fit: cover !important;
              border-radius: 22px !important;
            }

            .grid.products .product h3 {
              font-size: 34px !important;
              line-height: 1.1 !important;
              margin-top: 22px !important;
            }

            .grid.products .product p {
              font-size: 26px !important;
              line-height: 1.2 !important;
            }

            .trust {
              font-size: 30px !important;
              line-height: 1.22 !important;
              padding: 34px 30px !important;
              border-radius: 26px !important;
              margin-top: 36px !important;
            }
          }
        `}
      </style>

      <section className="hero elan-home-hero">
        <picture className="hero-picture elan-home-picture">
          <source media="(max-width: 850px)" srcSet={bannerActivo.imagenMobile} />
          <img src={bannerActivo.imagenDesktop} alt="ELANVISUAL" />
        </picture>

        <div className="hero-overlay elan-home-overlay" />

        <div className="hero-copy elan-home-copy">
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