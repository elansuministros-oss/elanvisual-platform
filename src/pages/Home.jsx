import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Layers3,
  Lightbulb,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const serviciosClave = [
  'Rotulación',
  'Impresión UV',
  'DTF UV',
  'PVC',
  'Acrílico',
  'CNC',
  'Láser',
  'Fachadas',
  'Displays',
  'Letras 3D',
  'Estructuras',
  'Señalización',
];

const bloques = [
  {
    icono: <Ruler size={30} />,
    titulo: 'Medidas reales',
    texto: 'Diseños pensados para fabricar, instalar y mantener escala real.',
  },
  {
    icono: <Layers3 size={30} />,
    titulo: 'Materiales de taller',
    texto: 'PVC, acrílico, vinil, lona, estructura metálica, CNC y láser.',
  },
  {
    icono: <Lightbulb size={30} />,
    titulo: 'Iluminación funcional',
    texto: 'Luz frontal, halo, rebote o cajas luminosas según el uso real.',
  },
  {
    icono: <Wrench size={30} />,
    titulo: 'Producción instalada',
    texto: 'Cotización, fabricación, instalación y seguimiento desde CRM.',
  },
];

export default function Home({ setPage }) {
  const { banners, configuracion } = useApp();

  const bannersActivos = Array.isArray(banners)
    ? banners.filter((banner) => banner?.activo)
    : [];

  const heroBanner =
    bannersActivos.find((banner) => banner.ubicacion === 'hero-principal') ||
    bannersActivos.find((banner) => banner.ubicacion === 'home') ||
    {};

  const heroTitulo =
    heroBanner.titulo ||
    configuracion?.textoHero ||
    'Rotulación, impresión y fabricación visual para negocios reales';

  const heroDescripcion =
    heroBanner.descripcion ||
    heroBanner.subtitulo ||
    configuracion?.descripcionHero ||
    'Diseñamos, cotizamos, fabricamos e instalamos soluciones visuales con materiales reales, medidas exactas y flujo operativo conectado al CRM.';

  const heroImagen =
    heroBanner.imagen ||
    heroBanner.imagenRuta ||
    '/productos/portada2-01.png';

  return (
    <main className="home-page home-launch-page">
      <section className="elanpet-launch-hero">
        <div className="elanpet-launch-copy">
          <span className="elanpet-pill">
            <Building2 size={18} /> ELANVISUAL APP MODE
          </span>

          <h1>{heroTitulo}</h1>

          <p>{heroDescripcion}</p>

          <strong className="elanpet-hero-line">
            Cotización, producción e instalación desde una sola operación.
          </strong>

          <div className="elanpet-benefits">
            {bloques.map((item) => (
              <div key={item.titulo}>
                {item.icono}
                <b>{item.titulo}</b>
                <small>{item.texto}</small>
              </div>
            ))}
          </div>

          <div className="elanpet-hero-actions">
            <button
              type="button"
              onClick={() => setPage('catalogo')}
              className="elanpet-primary-btn"
            >
              <Sparkles size={20} />
              Ver servicios
            </button>

            <button
              type="button"
              onClick={() => setPage('contacto')}
              className="elanpet-whatsapp-btn"
            >
              <BadgeCheck size={20} />
              Solicitar cotización
            </button>
          </div>
        </div>

        <div className="elanpet-launch-media">
          <img src={heroImagen} alt="ELANVISUAL rotulación e impresión" />
        </div>
      </section>

      <section className="elanpet-category-section">
        <div className="elanpet-section-title">
          <span>SERVICIOS FABRICABLES</span>
          <h2>
            Soluciones visuales <strong>listas para cotizar</strong>
          </h2>
        </div>

        <div className="elanpet-category-grid">
          {serviciosClave.map((servicio) => (
            <button
              key={servicio}
              type="button"
              className="elanpet-category-card"
              onClick={() => setPage('catalogo')}
            >
              <b>{servicio}</b>
              <i>
                <ArrowRight size={20} />
              </i>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Flujo operativo ELANVISUAL</h2>
        <p className="note">
          Cliente → Cotización → Pedido → Orden de Trabajo → Producción →
          Instalación → Entrega → Cobro → Comisión.
        </p>
      </section>
    </main>
  );
}