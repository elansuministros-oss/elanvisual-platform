import React, { useEffect, useMemo, useState } from 'react';
import { Factory } from 'lucide-react';
import { useApp } from '../context/AppContext';

const texto = (value) => String(value || '').trim();

const normalizarWhatsApp = (numero) => {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (limpio.length === 8) return `505${limpio}`;
  return limpio || '50585228183';
};

const bannerFallback = {
  id: 'hero-fallback',
  ubicacion: 'hero-principal',
  activo: true,
  orden: 1,
  imagen: '/productos/portada2-01.png',
  imagenRuta: '/productos/portada2-01.png',
  imagenDesktop: '/productos/portada2-01.png',
  imagenMobile: '/productos/portada2-01.png',
};

const categoriasFallback = [
  { id: 'cat-home-rotulacion', nombre: 'Rotulacion', slug: 'rotulacion', imagenDesktop: '/productos/fachada.jpg', imagenMobile: '', orden: 1, activo: true },
  { id: 'cat-home-displays', nombre: 'Displays publicitarios', slug: 'displays', imagenDesktop: '/productos/display.jpg', imagenMobile: '', orden: 2, activo: true },
  { id: 'cat-home-letras-3d', nombre: 'Letras 3D', slug: 'letras-3d', imagenDesktop: '/productos/letras-pvc.jpg', imagenMobile: '', orden: 3, activo: true },
  { id: 'cat-home-impresion-digital', nombre: 'Impresion digital', slug: 'impresion-digital', imagenDesktop: '/productos/portada2-01.png', imagenMobile: '', orden: 4, activo: true },
];

const obtenerImagenDesktop = (item) =>
  item?.imagenDesktop || item?.imagenRuta || item?.imagen || item?.img || item?.url || item?.src || '/productos/portada2-01.png';

const obtenerImagenMobile = (item) =>
  item?.imagenMobile || obtenerImagenDesktop(item);

export default function Home({ setPage }) {
  const {
    banners = [],
    categoriasHome = [],
    configuracion = {},
  } = useApp();

  const [bannerActivoIndex, setBannerActivoIndex] = useState(0);

  const bannersHero = useMemo(() => {
    const lista = Array.isArray(banners)
      ? banners
          .filter((b) => b?.ubicacion === 'hero-principal' && b?.activo !== false)
          .filter((b) => obtenerImagenDesktop(b))
          .sort((a, b) => Number(a.orden || 999) - Number(b.orden || 999))
      : [];

    return lista.length > 0 ? lista : [bannerFallback];
  }, [banners]);

  const categoriasPortada = useMemo(() => {
    const lista = Array.isArray(categoriasHome)
      ? categoriasHome
          .filter((item) => item?.activo !== false)
          .filter((item) => obtenerImagenDesktop(item))
          .sort((a, b) => Number(a.orden || 999) - Number(b.orden || 999))
      : [];

    return lista.length > 0 ? lista : categoriasFallback;
  }, [categoriasHome]);

  useEffect(() => {
    setBannerActivoIndex(0);
  }, [bannersHero.length]);

  useEffect(() => {
    if (bannersHero.length <= 1) return undefined;

    const intervalo = window.setInterval(() => {
      setBannerActivoIndex((actual) => (actual + 1) % bannersHero.length);
    }, 6000);

    return () => window.clearInterval(intervalo);
  }, [bannersHero.length]);

  const bannerHome = bannersHero[bannerActivoIndex] || bannersHero[0] || bannerFallback;

  const heroImgDesktop = obtenerImagenDesktop(bannerHome);
  const heroImgMobile = obtenerImagenMobile(bannerHome);

  const go = (page) => {
    if (typeof setPage === 'function') setPage(page);
  };

  const abrirCategoria = (slug) => {
    window.location.href = `/tienda/${slug}`;
  };

  return (
    <main className="app-home">
      <section className="app-hero-screen" aria-label="Banner principal ELANVISUAL">
        <div className="app-hero-image">
          <picture>
            <source media="(max-width: 1099px)" srcSet={heroImgMobile} />
            <img src={heroImgDesktop} alt="ELANVISUAL" />
          </picture>
        </div>

        {bannersHero.length > 1 && (
          <div className="app-hero-dots" aria-label="Indicadores de banners">
            {bannersHero.map((banner, index) => (
              <button
                key={banner.id || `${banner.ubicacion}-${index}`}
                type="button"
                className={index === bannerActivoIndex ? 'active' : ''}
                aria-label={`Ver banner ${index + 1}`}
                onClick={() => setBannerActivoIndex(index)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="ev-catalog-section">
        <div className={`ev-catalog-grid ${categoriasPortada.length === 1 ? 'single' : ''}`}>
          {categoriasPortada.map((item) => {
            const nombre = texto(item.nombre || item.titulo || 'Categoria ELANVISUAL');
            const slug = texto(item.slug || item.id || nombre.toLowerCase().replace(/\s+/g, '-'));
            const img = obtenerImagenDesktop(item);

            return (
              <button
                type="button"
                className="ev-category-card"
                key={item.id || slug}
                onClick={() => abrirCategoria(slug)}
              >
                <img src={img} alt={nombre} />
                <strong>{nombre}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="app-final-cta">
        <Factory size={34} />
        <h2>Converti tu idea en produccion real.</h2>
        <p>Medidas, materiales, fabricacion e instalacion desde un solo flujo.</p>

        <div className="app-hero-buttons">
          <button type="button" onClick={() => go('contacto')} className="app-btn primary">
            Solicitar cotizacion
          </button>

          <a
            href={`https://wa.me/${normalizarWhatsApp(configuracion.whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="app-btn whatsapp"
          >
            WhatsApp
          </a>
        </div>
      </section>

      <style>{`
        .app-hero-dots{
          position:absolute;
          left:50%;
          bottom:18px;
          transform:translateX(-50%);
          z-index:3;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          padding:8px 10px;
          border-radius:999px;
          background:rgba(15,23,42,.28);
          backdrop-filter:blur(8px);
        }
        .app-hero-dots button{
          width:10px;
          height:10px;
          border:0;
          border-radius:999px;
          padding:0;
          background:rgba(255,255,255,.55);
          cursor:pointer;
        }
        .app-hero-dots button.active{
          width:26px;
          background:#fff;
        }
        .ev-catalog-section{
          padding:30px 18px 40px;
        }
        .ev-catalog-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
          gap:22px;
          align-items:stretch;
        }
        .ev-catalog-grid.single{
          grid-template-columns:minmax(280px, 520px);
        }
        .ev-category-card{
          position:relative;
          min-height:310px;
          border:0;
          border-radius:30px;
          overflow:hidden;
          cursor:pointer;
          background:#020617;
          box-shadow:0 20px 45px rgba(15,23,42,.16);
          padding:0;
          text-align:left;
        }
        .ev-category-card img{
          width:100%;
          height:100%;
          min-height:310px;
          object-fit:cover;
          display:block;
          transform:scale(1.01);
          transition:transform .25s ease;
        }
        .ev-category-card::after{
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(180deg, rgba(2,6,23,.04), rgba(2,6,23,.78));
        }
        .ev-category-card strong{
          position:absolute;
          left:24px;
          right:24px;
          bottom:24px;
          z-index:2;
          color:white;
          font-size:31px;
          line-height:1;
          font-weight:1000;
          text-shadow:0 4px 16px rgba(0,0,0,.45);
        }
        .ev-category-card:hover img{
          transform:scale(1.06);
        }
        @media (max-width: 700px){
          .app-hero-dots{
            bottom:12px;
          }
          .ev-catalog-section{
            padding:24px 14px 34px;
          }
          .ev-catalog-grid,
          .ev-catalog-grid.single{
            display:flex;
            overflow-x:auto;
            gap:16px;
            scroll-snap-type:x mandatory;
            padding-bottom:10px;
            -webkit-overflow-scrolling:touch;
          }
          .ev-category-card{
            min-width:86vw;
            max-width:86vw;
            min-height:330px;
            scroll-snap-align:start;
          }
          .ev-category-card img{
            min-height:330px;
          }
        }
      `}</style>
    </main>
  );
}
