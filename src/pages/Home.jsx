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

const whatsapp = 'https://wa.me/50588888888';

const servicios = [
  {
    titulo: 'Letras 3D',
    texto: 'PVC, acrílico, channelum y luz frontal.',
    img: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=900&q=80',
  },
  {
    titulo: 'Fachadas',
    texto: 'Rótulos exteriores, fascia y estructuras.',
    img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
  {
    titulo: 'Acrílico',
    texto: 'Placas, cajas, logos y piezas premium.',
    img: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
  },
  {
    titulo: 'Impresión UV',
    texto: 'Vinil, PVC, acrílico y materiales rígidos.',
    img: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=900&q=80',
  },
  {
    titulo: 'CNC / Láser',
    texto: 'Corte técnico para producción real.',
    img: 'https://images.unsplash.com/photo-1565018054866-968e244671af?auto=format&fit=crop&w=900&q=80',
  },
];

const portafolio = [
  { titulo: 'Recepciones', texto: 'Logos corporativos interiores.' },
  { titulo: 'Botones', texto: 'Rótulos circulares luminosos.' },
  { titulo: 'Jalavistas', texto: 'Doble cara para fachada.' },
  { titulo: 'Retail', texto: 'Imagen comercial para tiendas.' },
  { titulo: 'Eventos', texto: 'Stands, displays y activaciones.' },
];

const categorias = [
  'Rótulos luminosos',
  'Letras corpóreas',
  'Impresión gran formato',
  'PVC / Acrílico',
  'Estructuras metálicas',
  'Señalización',
];

export default function Home({ setPage }) {
  const { banners = [] } = useApp();

const bannersSeguros = Array.isArray(banners) && banners.length > 0
  ? banners
  : [
      {
        id: 'hero-fallback',
        ubicacion: 'hero-principal',
        activo: true,
        titulo: 'Rotulacion profesional para negocios reales',
        subtitulo: 'Letras 3D, fachadas, acrilico, PVC, impresion UV, DTF UV, CNC, laser y displays fabricables.',
        imagen: '/productos/portada-visual.png',
        imagenRuta: '/productos/portada-visual.png',
        imagenDesktop: '/productos/portada-visual.png',
        imagenMobile: '/productos/portada-visual.png',
      },
    ];
const bannerHome = bannersSeguros.find(
  
  (b) => b.ubicacion === 'hero-principal' && b.activo
);

console.log('BANNERS', banners);
console.log('BANNER HOME', bannerHome);
console.log('BANNER HOME JSON', JSON.stringify(bannerHome, null, 2));

  const isMobileHero =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches;

  const heroImgDesktop =
    bannerHome?.imagenDesktop ||
    bannerHome?.imagenRuta ||
    bannerHome?.imagen ||
    bannerHome?.url ||
    bannerHome?.src ||
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85';

  const heroImgMobile =
    bannerHome?.imagenMobile ||
    heroImgDesktop;

  const heroImg = isMobileHero ? heroImgMobile : heroImgDesktop;

console.log('DEBUG HERO MOBILE isMobileHero', isMobileHero);
console.log('DEBUG HERO MOBILE heroImgDesktop', heroImgDesktop);
console.log('DEBUG HERO MOBILE heroImgMobile', heroImgMobile);
console.log('DEBUG HERO MOBILE heroImg', heroImg);

  const go = (page) => {
    if (typeof setPage === 'function') setPage(page);
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
            Rotulación · Producción · Imagen Comercial
          </span>

         <h1>{bannerHome?.titulo || 'ELANVISUAL'}</h1>

<p>
  {bannerHome?.subtitulo ||
    'Diseño, fabricación e instalación de soluciones visuales profesionales.'}
</p>

          <div className="app-hero-buttons">
            <button type="button" onClick={() => go('servicios')} className="app-btn primary">
              Servicios <ArrowRight size={18} />
            </button>

            <button type="button" onClick={() => go('contacto')} className="app-btn secondary">
              Cotizar
            </button>

            <a href={whatsapp} target="_blank" rel="noreferrer" className="app-btn whatsapp">
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="app-launcher-screen">
        <button type="button" onClick={() => go('servicios')} className="app-launcher-item">
          <BriefcaseBusiness />
          <span>Servicios</span>
        </button>

        <button type="button" onClick={() => go('tienda')} className="app-launcher-item">
          <ShoppingBag />
          <span>Tienda</span>
        </button>

        <button type="button" onClick={() => go('portafolio')} className="app-launcher-item">
          <Image />
          <span>Portafolio</span>
        </button>

        <button type="button" onClick={() => go('seguimiento')} className="app-launcher-item">
          <PackageSearch />
          <span>Seguimiento</span>
        </button>

        <button type="button" onClick={() => go('contacto')} className="app-launcher-item">
          <Phone />
          <span>Contacto</span>
        </button>

        <button type="button" onClick={() => go('portal')} className="app-launcher-item">
          <ClipboardList />
          <span>Portal</span>
        </button>
      </section>

      <HorizontalCarousel
        title="Servicios destacados"
        subtitle="Deslizá para explorar"
        items={servicios}
        renderItem={(item) => (
          <>
            <div className="app-card-img">
              <img src={item.img} alt={item.titulo} />
            </div>
            <h3>{item.titulo}</h3>
            <p>{item.texto}</p>
          </>
        )}
      />

      <HorizontalCarousel
        title="Portafolio"
        subtitle="Trabajos por tipo de aplicación"
        items={portafolio}
        renderItem={(item) => (
          <div className="app-portfolio-card">
            <BadgeCheck size={24} />
            <h3>{item.titulo}</h3>
            <p>{item.texto}</p>
          </div>
        )}
      />

      <section className="app-category-section">
        <div className="app-section-head">
          <div>
            <h2>Categorías</h2>
            <p>Producción lista para cotizar</p>
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
        <h2>Convertí tu idea en producción real.</h2>
        <p>Medidas, materiales, fabricación e instalación desde un solo flujo.</p>

        <div className="app-hero-buttons">
          <button type="button" onClick={() => go('contacto')} className="app-btn primary">
            Solicitar cotización
          </button>

          <a href={whatsapp} target="_blank" rel="noreferrer" className="app-btn whatsapp">
            WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}


