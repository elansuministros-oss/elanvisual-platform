import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Sparkles,
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

function textoValido(valor) {
  if (!valor) return false;

  const limpio = String(valor).trim().toLowerCase();

  const basura = [
    'fghdfgdfgdfgdf',
    'dfgsdfgdfgsdfg',
    'asdf',
    'test',
    'prueba',
  ];

  if (basura.includes(limpio)) return false;
  if (limpio.length < 8) return false;

  return true;
}

export default function Home({ setPage }) {
  const { banners, configuracion } = useApp();

  const bannersActivos = Array.isArray(banners)
    ? banners.filter((banner) => banner?.activo)
    : [];

  const heroBanner =
    bannersActivos.find((banner) => banner.ubicacion === 'hero-principal') ||
    bannersActivos.find((banner) => banner.ubicacion === 'home') ||
    {};

  const tituloBase =
    textoValido(heroBanner.titulo)
      ? heroBanner.titulo
      : configuracion?.textoHero;

  const descripcionBase =
    textoValido(heroBanner.descripcion)
      ? heroBanner.descripcion
      : textoValido(heroBanner.subtitulo)
        ? heroBanner.subtitulo
        : configuracion?.descripcionHero;

  const heroTitulo =
    textoValido(tituloBase)
      ? tituloBase
      : 'Rotulación, impresión y fabricación visual';

  const heroDescripcion =
    textoValido(descripcionBase)
      ? descripcionBase
      : 'Soluciones visuales fabricadas con medidas reales, materiales de taller e instalación profesional.';

  const heroImagen =
    heroBanner.imagen ||
    heroBanner.imagenRuta ||
    '/productos/portada2-01.png';

  return (
    <main className="home-page home-launch-page app-home">
      <section className="elanpet-launch-hero app-hero-clean">
        <div className="elanpet-launch-media app-hero-media">
          <img src={heroImagen} alt="ELANVISUAL rotulación e impresión" />
        </div>

        <div className="elanpet-launch-copy app-hero-copy">
          <span className="elanpet-pill app-pill">
            <Building2 size={18} /> ELANVISUAL
          </span>

          <h1>{heroTitulo}</h1>

          <p>{heroDescripcion}</p>

          <div className="elanpet-hero-actions app-hero-actions">
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
              Cotizar
            </button>
          </div>
        </div>
      </section>

      <section className="elanpet-category-section app-service-section">
        <div className="elanpet-section-title">
          <span>SERVICIOS</span>
          <h2>
            Soluciones visuales <strong>listas para producir</strong>
          </h2>
        </div>

        <div className="elanpet-category-grid app-service-grid">
          {serviciosClave.map((servicio) => (
            <button
              key={servicio}
              type="button"
              className="elanpet-category-card app-service-card"
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
    </main>
  );
}