import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';

const HOME_DEFAULT = {
  titulo: 'Rotulación profesional para negocios reales',
  subtitulo: 'Diseño, fabricación e instalación con criterio técnico.',
  textoInstitucional:
    'Fabricamos soluciones visuales funcionales para negocios que necesitan presencia, claridad y ejecución real.',
  botonPrincipalTexto: 'Ver catálogo',
  botonPrincipalUrl: '/catalogo',
  botonSecundarioTexto: 'Solicitar cotización',
  botonSecundarioUrl: '/contacto',
  servicio1Titulo: 'Rotulación comercial',
  servicio1Texto: 'Fachadas, letras 3D, cajillos, PVC, acrílico y estructuras.',
  servicio2Titulo: 'Catálogo visual',
  servicio2Texto: 'Productos organizados con imágenes, categorías y vista ampliada.',
  servicio3Titulo: 'Showroom',
  servicio3Texto: 'Galería pública de trabajos, acabados e instalaciones.',
  stat1Valor: '100%',
  stat1Texto: 'Fabricación real',
  stat2Valor: '1:1',
  stat2Texto: 'Escala técnica',
  stat3Valor: 'V2',
  stat3Texto: 'Sistema operativo',
};

function resolverImagenDesktop(banner) {
  return (
    banner?.imagenDesktop ||
    banner?.imagenPc ||
    banner?.imagenPC ||
    banner?.imagen ||
    banner?.url ||
    banner?.src ||
    ''
  );
}

function resolverImagenMobile(banner) {
  return (
    banner?.imagenMobile ||
    banner?.imagenMovil ||
    banner?.imagenMobil ||
    banner?.mobile ||
    banner?.urlMobile ||
    resolverImagenDesktop(banner)
  );
}

export default function Home() {
  const { state } = useElan();

  const home = {
    ...HOME_DEFAULT,
    ...(state.configuracion?.home || {}),
  };

  const banners = useMemo(() => {
    return Array.isArray(state.banners)
      ? state.banners.filter((item) => item.activo)
      : [];
  }, [state.banners]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (index >= banners.length) {
      setIndex(0);
    }
  }, [banners.length, index]);

  const banner = banners.length > 0 ? banners[index % banners.length] : null;

  const imagenDesktop = resolverImagenDesktop(banner);
  const imagenMobile = resolverImagenMobile(banner);

  const servicios = [
    { titulo: home.servicio1Titulo, texto: home.servicio1Texto },
    { titulo: home.servicio2Titulo, texto: home.servicio2Texto },
    { titulo: home.servicio3Titulo, texto: home.servicio3Texto },
  ];

  const stats = [
    { valor: home.stat1Valor, texto: home.stat1Texto },
    { valor: home.stat2Valor, texto: home.stat2Texto },
    { valor: home.stat3Valor, texto: home.stat3Texto },
  ];

  return (
    <main className="public-home">
      <section className="home-hero">
        {banner && (imagenDesktop || imagenMobile) ? (
          <>
            <picture className="hero-picture hero-slide" key={banner.id || index}>
              <source media="(max-width: 760px)" srcSet={imagenMobile} />

              <img
                src={imagenDesktop || imagenMobile}
                alt={banner.titulo || 'ELANVISUAL'}
                className="hero-image"
              />
            </picture>

            <div className="hero-overlay" />
          </>
        ) : (
          <>
            <div className="hero-fallback" />
            <div className="hero-overlay" />
          </>
        )}

        <div className="home-hero-content">
          <p className="eyebrow">ELANVISUAL</p>

          <h1>{banner?.titulo || home.titulo}</h1>

          <p>{banner?.subtitulo || home.subtitulo}</p>

          <div className="hero-actions">
            <Link to={home.botonPrincipalUrl || '/catalogo'}>
              {home.botonPrincipalTexto || 'Ver catálogo'}
            </Link>

            <Link to={home.botonSecundarioUrl || '/contacto'}>
              {home.botonSecundarioTexto || 'Solicitar cotización'}
            </Link>
          </div>

          {banners.length > 1 && (
            <div className="hero-dots">
              {banners.map((item, i) => (
                <button
                  key={item.id || i}
                  type="button"
                  aria-label={`Ver banner ${i + 1}`}
                  className={i === index ? 'hero-dot active' : 'hero-dot'}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner">
          <p className="eyebrow">Sistema visual</p>
          <h2>{home.titulo}</h2>
          <p>{home.textoInstitucional}</p>
        </div>
      </section>

      <section className="home-services">
        {servicios.map((servicio) => (
          <article key={servicio.titulo}>
            <h3>{servicio.titulo}</h3>
            <p>{servicio.texto}</p>
          </article>
        ))}
      </section>

      <section className="home-stats">
        {stats.map((stat) => (
          <article key={stat.texto}>
            <strong>{stat.valor}</strong>
            <span>{stat.texto}</span>
          </article>
        ))}
      </section>
    </main>
  );
}