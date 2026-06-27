import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardList,
  Factory,
  Image,
  LayoutGrid,
  MessageCircle,
  PackageSearch,
  Phone,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import HorizontalCarousel from '../components/HorizontalCarousel';

const normalizarWhatsApp = (numero) => {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (limpio.length === 8) return `505${limpio}`;
  return limpio || '50585228183';
};

const productosCatalogo = [
  {
    id: 'fallback-letras-3d',
    titulo: 'Letras 3D',
    texto: 'PVC, acrilico, channelum y luz frontal.',
    categoria: 'Letras 3D',
    medidas: 'Medidas personalizadas',
    precio: 'Desde $130',
    img: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'fallback-boton',
    titulo: 'Boton luminoso',
    texto: 'Rotulo circular personalizado para fachada o interior.',
    categoria: 'Rotulos luminosos',
    medidas: '60 x 60 cm referencia',
    precio: 'Desde $130',
    img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'fallback-jalavista',
    titulo: 'Jalavista',
    texto: 'Rotulo doble cara con brazo metalico.',
    categoria: 'Fachada',
    medidas: '60 x 60 cm referencia',
    precio: 'Desde $260',
    img: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'fallback-rollup',
    titulo: 'Roll Up',
    texto: 'Display portatil para eventos, ferias y puntos de venta.',
    categoria: 'Displays',
    medidas: '85 x 200 cm referencia',
    precio: 'Cotizar',
    img: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'fallback-banner',
    titulo: 'Banner impreso',
    texto: 'Lona, vinil o material rigido segun aplicacion.',
    categoria: 'Impresion',
    medidas: 'Por metro cuadrado',
    precio: 'Desde $25/m2',
    img: 'https://images.unsplash.com/photo-1565018054866-968e244671af?auto=format&fit=crop&w=900&q=80',
  },
];


const categorias = [
  'Rotulos luminosos',
  'Letras corporeas',
  'Impresion gran formato',
  'PVC / Acrilico',
  'Estructuras metalicas',
  'Senalizacion',
];

const formatearPrecio = (producto) => {
  if (producto?.etiqueta) return producto.etiqueta;
  const precio = Number(producto?.precio || 0);
  if (precio > 0) return `Desde $${precio}`;
  return 'Cotizar';
};

export default function Home({ setPage }) {
  const {
    banners = [],
    configuracion = {},
    productos = [],
    carrito = [],
    agregar,
  } = useApp();

  const bannersSeguros = Array.isArray(banners) && banners.length > 0
    ? banners
    : [
        {
          id: 'hero-fallback',
          ubicacion: 'hero-principal',
          activo: true,
          titulo: 'Rotulacion profesional para negocios reales',
          subtitulo: 'Letras 3D, fachadas, acrilico, PVC, impresion UV, DTF UV, CNC, laser y displays fabricables.',
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
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85';

  const heroImgMobile = bannerHome?.imagenMobile || heroImgDesktop;
  const heroImg = isMobileHero ? heroImgMobile : heroImgDesktop;

  const go = (page) => {
    if (typeof setPage === 'function') setPage(page);
  };

  const productosAdmin = Array.isArray(productos)
    ? productos.filter((p) => p.activo !== false)
    : [];

  const catalogoHome = productosAdmin.length > 0
    ? productosAdmin.map((p) => ({
        id: p.id,
        titulo: p.nombre || p.titulo || 'Producto',
        texto: p.descripcion || p.texto || 'Producto personalizado ELANVISUAL.',
        categoria: p.categoria || 'ELANVISUAL',
        medidas: p.medidas || '',
        precio: formatearPrecio(p),
        img: p.imagen || p.img || '/productos/portada2-01.png',
        raw: p,
      }))
    : productosCatalogo;

  const cantidadCarrito = Array.isArray(carrito)
    ? carrito.reduce((total, item) => total + Number(item.cantidad || 1), 0)
    : 0;

  const agregarProducto = (item) => {
    if (typeof agregar === 'function') {
      agregar(item.raw || {
        id: item.id || item.titulo,
        nombre: item.titulo,
        descripcion: item.texto,
        imagen: item.img,
        precio: Number(String(item.precio || '').replace(/[^0-9.]/g, '')) || 0,
        etiqueta: item.precio,
      });
    }
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
        <div className="ev-catalog-head">
          <div>
            <h2>Catalogo personalizado</h2>
            <p>Productos listos para agregar o cotizar</p>
          </div>

          <button type="button" className="ev-cart-pill" onClick={() => go('tienda')}>
            <ShoppingBag size={18} />
            Carrito
            <strong>{cantidadCarrito}</strong>
          </button>
        </div>

        <div className={`ev-catalog-grid ${catalogoHome.length === 1 ? 'single' : ''}`}>
          {catalogoHome.map((item) => (
            <article className="ev-product-card" key={item.id || item.titulo}>
              <div className="ev-product-img">
                <img src={item.img} alt={item.titulo} />
              </div>

              <div className="ev-product-body">
                <span className="ev-product-category">{item.categoria || 'ELANVISUAL'}</span>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>

                {item.medidas ? (
                  <div className="ev-product-measure">{item.medidas}</div>
                ) : null}

                <div className="ev-product-action">
                  <strong>{item.precio}</strong>
                  <button type="button" onClick={() => agregarProducto(item)}>
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {cantidadCarrito > 0 && (
          <div className="ev-cart-summary">
            <div>
              <strong>
                {cantidadCarrito} producto{cantidadCarrito === 1 ? '' : 's'} en carrito
              </strong>
              <span>Listo para revisar y solicitar cotizacion.</span>
            </div>
            <button type="button" onClick={() => go('tienda')}>
              Ver carrito
            </button>
          </div>
        )}
      </section>
            <h3>{item.titulo}</h3>
            <p>{item.texto}</p>
          </div>
        )}
      />

      <section className="app-category-section">
        <div className="app-section-head">
          <div>
            <h2>Categorias</h2>
            <p>Produccion lista para cotizar</p>
          </div>
        </div>

        <div className="app-chip-scroll">
          {categorias.map((cat) => (
            <button type="button" key={cat} onClick={() => go('servicios')} className="app-chip">
              <LayoutGrid size={16} />
              {cat}
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
          padding:26px 18px 34px;
        }
        .ev-catalog-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          margin-bottom:18px;
        }
        .ev-catalog-head h2{
          margin:0;
          font-size:30px;
          font-weight:950;
          color:#020617;
        }
        .ev-catalog-head p{
          margin:4px 0 0;
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
          grid-template-columns:repeat(auto-fit, minmax(260px, 320px));
          gap:18px;
          align-items:stretch;
        }
        .ev-catalog-grid.single{
          grid-template-columns:minmax(280px, 420px);
        }
        .ev-product-card{
          background:white;
          border:1px solid #e5e7eb;
          border-radius:24px;
          overflow:hidden;
          box-shadow:0 16px 38px rgba(15,23,42,.08);
        }
        .ev-product-img{
          height:210px;
          background:#f8fafc;
          overflow:hidden;
        }
        .ev-product-img img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }
        .ev-product-body{
          padding:16px;
        }
        .ev-product-category{
          color:#0891b2;
          font-size:12px;
          font-weight:950;
          text-transform:uppercase;
          letter-spacing:.04em;
        }
        .ev-product-body h3{
          margin:8px 0 8px;
          font-size:21px;
          line-height:1.05;
          color:#020617;
        }
        .ev-product-body p{
          margin:0;
          color:#64748b;
          font-size:15px;
          font-weight:750;
          line-height:1.35;
        }
        .ev-product-measure{
          margin-top:14px;
          border-radius:14px;
          background:#f1f5f9;
          padding:10px 12px;
          font-weight:950;
          color:#0f172a;
        }
        .ev-product-action{
          margin-top:16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        }
        .ev-product-action strong{
          font-size:22px;
          font-weight:1000;
          color:#0f766e;
        }
        .ev-product-action button,
        .ev-cart-summary button{
          border:0;
          border-radius:999px;
          padding:11px 16px;
          background:#111827;
          color:white;
          font-weight:950;
          cursor:pointer;
        }
        .ev-cart-summary{
          margin-top:18px;
          padding:16px;
          border-radius:22px;
          background:#0f172a;
          color:white;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
        }
        .ev-cart-summary span{
          display:block;
          color:#cbd5e1;
          margin-top:4px;
          font-size:13px;
        }
        .ev-cart-summary button{
          background:#facc15;
          color:#111827;
        }
        @media (max-width: 700px){
          .ev-catalog-section{
            padding:22px 14px 30px;
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
          .ev-product-card{
            min-width:86vw;
            max-width:86vw;
            scroll-snap-align:start;
          }
          .ev-product-img{
            height:230px;
          }
          .ev-cart-summary{
            align-items:flex-start;
            flex-direction:column;
          }
        }
      `}</style>
    </main>
  );
}



