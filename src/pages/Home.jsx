import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const serviciosClave = [
  'RotulaciÃ³n',
  'ImpresiÃ³n UV',
  'DTF UV',
  'PVC',
  'AcrÃ­lico',
  'CNC',
  'LÃ¡ser',
  'Fachadas',
  'Displays',
  'Letras 3D',
  'Estructuras',
  'SeÃ±alizaciÃ³n',
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
      : 'RotulaciÃ³n, impresiÃ³n y fabricaciÃ³n visual';

  const heroDescripcion =
    textoValido(descripcionBase)
      ? descripcionBase
      : 'Soluciones visuales fabricadas con medidas reales, materiales de taller e instalaciÃ³n profesional.';

  const heroImagen =
    heroBanner.imagen ||
    heroBanner.imagenRuta ||
    '/productos/portada2-01.png';

  return (
    <main className="home-page home-launch-page app-home">
      <section className="ELANVISUAL-launch-hero app-hero-clean">
        <div className="ELANVISUAL-launch-media app-hero-media">
          <img src={heroImagen} alt="ELANVISUAL rotulaciÃ³n e impresiÃ³n" />
        </div>

        <div className="ELANVISUAL-launch-copy app-hero-copy">
          <span className="ELANVISUAL-pill app-pill">
            <Building2 size={18} /> ELANVISUAL
          </span>

          <h1>{heroTitulo}</h1>

          <p>{heroDescripcion}</p>

          <div className="ELANVISUAL-hero-actions app-hero-actions">
            <button
              type="button"
              onClick={() => setPage('catalogo')}
              className="ELANVISUAL-primary-btn"
            >
              <Sparkles size={20} />
              Ver servicios
            </button>

            <button
              type="button"
              onClick={() => setPage('contacto')}
              className="ELANVISUAL-whatsapp-btn"
            >
              <BadgeCheck size={20} />
              Cotizar
            </button>
          </div>
        </div>
      </section>

      <section className="ELANVISUAL-category-section app-service-section">
        <div className="ELANVISUAL-section-title">
          <span>SERVICIOS</span>
          <h2>
            Soluciones visuales <strong>listas para producir</strong>
          </h2>
        </div>

        <div className="ELANVISUAL-category-grid app-service-grid">
          {serviciosClave.map((servicio) => (
            <button
              key={servicio}
              type="button"
              className="ELANVISUAL-category-card app-service-card"
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
