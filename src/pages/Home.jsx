import React from 'react';
import {
  ArrowRight,
  Factory,
  MessageCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const normalizarWhatsApp = (numero) => {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (limpio.length === 8) return `505${limpio}`;
  return limpio || '50585228183';
};

const texto = (value) => String(value || '').trim();

const slugify = (value) =>
  texto(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const categoriasFallback = [
  {
    id: 'rotulacion',
    titulo: 'Rotulacion',
    img: '/productos/fachada.jpg',
  },
  {
    id: 'displays',
    titulo: 'Displays publicitarios',
    img: '/productos/display.jpg',
  },
  {
    id: 'letras-3d',
    titulo: 'Letras 3D',
    img: '/productos/letras-pvc.jpg',
  },
  {
    id: 'impresion-digital',
    titulo: 'Impresion digital',
    img: '/productos/portada2-01.png',
  },
];

export default function Home({ setPage }) {
  const {
    banners = [],
    configuracion = {},
    productos = [],
    carrito = [],
  } = useApp();

  const bannersSeguros =
    Array.isArray(banners) && banners.length > 0
      ? banners
      : [
          {
            id: 'hero-fallback',
            ubicacion: 'hero-principal',
            activo: true,
            titulo: 'Rotulacion profesional para negocios reales',
            subtitulo:
              'Letras 3D, fachadas, acrilico, PVC, impresion UV, DTF UV, CNC, laser y displays fabricables.',
            imagen: '/productos/portada2-01.png',
            imagenRuta: '/productos/portada2-01.png',
            imagenDesktop: '/productos/portada2-01.png',
            imagenMobile: '/productos/portada2-01.png',
          },
        ];

  const bannerHome = bannersSeguros.find(
    (b) => b.ubicacion === 'hero-principal' && b.activo
  );

  const isMobileHero =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches;

  const heroImgDesktop =
    bannerHome?.imagenDesktop ||
    bannerHome?.imagenRuta ||
    bannerHome?.imagen ||
    bannerHome?.url ||
    bannerHome?.src ||
    '/productos/portada2-01.png';

  const heroImgMobile = bannerHome?.imagenMobile || heroImgDesktop;
  const heroImg = isMobileHero ? heroImgMobile : heroImgDesktop;

  const go = (page) => {
    if (typeof setPage === 'function') setPage(page);
  };

  const productosAdmin = Array.isArray(productos)
    ? productos.filter((p) => p.activo !== false)
    : [];

  const categoriasHome =
    productosAdmin.length > 0
      ? Array.from(
          productosAdmin.reduce((mapa, producto) => {
            const nombreCategoria = texto(producto.categoria) || 'ELANVISUAL';
            const slug = slugify(nombreCategoria) || 'elanvisual';

            if (!mapa.has(slug)) {
              mapa.set(slug, {
                id: slug,
                titulo: nombreCategoria,
                img:
                  texto(producto.imagen) ||
                  texto(producto.img) ||
                  texto(producto.url) ||
                  '/productos/portada2-01.png',
              });
            }

            const actual = mapa.get(slug);
            const imagenProducto =
              texto(producto.imagen) || texto(producto.img) || texto(producto.url);

            if (
              (!actual.img || actual.img === '/productos/portada2-01.png') &&
              imagenProducto
            ) {
              actual.img = imagenProducto;
            }

            return mapa;
          }, new Map()).values()
        )
      : categoriasFallback;

  const cantidadCarrito = Array.isArray(carrito)
    ? carrito.reduce((total, item) => total + Number(item.cantidad || 1), 0)
    : 0;

  const abrirCategoria = (slug) => {
    window.location.href = `/tienda/${slug}`;
  };

  return (
    <main className="app-home">
      <section className="app-hero-screen">
        <div className="app-hero-image">
          <img src={heroImg} alt="ELANVISUAL" />
        </div>
        <div className="app-hero-overlay" />

        <div className="app-hero-content">
          <span className="app-pill">
            <Sparkles size={15} />
            Rotulacion · Produccion · Imagen Comercial
          </span>

          <h1>{bannerHome?.titulo || 'ELANVISUAL'}</h1>

          <p>
            {bannerHome?.subtitulo ||
              'Diseno, fabricacion e instalacion de soluciones visuales profesionales.'}
          </p>

          <div className="app-hero-buttons">
            <button type="button" onClick={() => go('servicios')} className="app-btn primary">
              Servicios <ArrowRight size={18} />
            </button>

            <button type="button" onClick={() => go('contacto')} className="app-btn secondary">
              Cotizar
            </button>

            <a
              href={`https://wa.me/${normalizarWhatsApp(configuracion.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              className="app-btn whatsapp"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="ev-catalog-section">
        <div className={`ev-catalog-grid ${categoriasHome.length === 1 ? 'single' : ''}`}>
          {categoriasHome.map((item) => (
            <button
              type="button"
              className="ev-category-card"
              key={item.id || item.titulo}
              onClick={() => abrirCategoria(item.id)}
            >
              <img src={item.img} alt={item.titulo} />
              <strong>{item.titulo}</strong>
            </button>
          ))}
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
        .ev-catalog-section{
          padding:30px 18px 40px;
        }
        .ev-catalog-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          margin-bottom:22px;
        }
        .ev-catalog-head h2{
          margin:0;
          font-size:34px;
          font-weight:950;
          color:#020617;
        }
        .ev-catalog-head p{
          margin:5px 0 0;
          color:#64748b;
          font-weight:800;
        }
        .ev-cart-pill{
          border:0;
          border-radius:999px;
          padding:12px 16px;
          background:#0f172a;
          color:white;
          font-weight:950;
          display:flex;
          align-items:center;
          gap:9px;
          cursor:pointer;
        }
        .ev-cart-pill strong{
          background:#facc15;
          color:#111827;
          min-width:24px;
          height:24px;
          border-radius:999px;
          display:grid;
          place-items:center;
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
          .ev-catalog-section{
            padding:24px 14px 34px;
          }
          .ev-catalog-head{
            align-items:flex-start;
            flex-direction:column;
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
