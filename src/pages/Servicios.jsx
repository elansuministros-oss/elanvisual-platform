import React, { useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Brush,
  Building2,
  CheckCircle2,
  Factory,
  Hammer,
  PackageOpen,
  Printer,
  Search,
  Shirt,
  Sparkles,
} from 'lucide-react';
import '../styles/servicios.css';

const servicios = [
  {
    id: 'diseno',
    titulo: 'Diseño',
    subtitulo: 'Imagen visual, marca y comunicación',
    descripcion:
      'Desarrollamos identidad visual, piezas gráficas y soluciones de diseño aplicadas a negocios, productos y espacios comerciales.',
    imagen: '/servicios/diseno.webp.png',
    icono: Brush,
    items: [
      'Diseño gráfico',
      'Branding e identidad',
      'Diseño publicitario',
      'Diseño arquitectónico',
      'Diseño de interiores',
      'Diseño web y digital',
    ],
  },
  {
    id: 'impresion-digital',
    titulo: 'Impresión digital',
    subtitulo: 'Gran formato y pequeño formato',
    descripcion:
      'Impresión para publicidad, comunicación comercial, eventos, promociones y materiales corporativos.',
    imagen: '/servicios/impresion.webp.png',
    icono: Printer,
    items: [
      'Lona',
      'Vinil',
      'Microperforado',
      'Adhesivos',
      'Flyers',
      'Tarjetas',
      'Menús',
      'Carteles',
      'Invitaciones',
      'Etiquetas',
    ],
  },
  {
    id: 'rotulacion',
    titulo: 'Rotulación',
    subtitulo: 'Fabricación visual para negocios',
    descripcion:
      'Fabricamos soluciones de rotulación para fachadas, interiores, puntos de venta y espacios comerciales.',
    imagen: '/servicios/rotulacion.webp.png',
    icono: Building2,
    items: [
      'Letras PVC',
      'Letras acrílicas',
      'Letras 3D',
      'Fachadas comerciales',
      'Botones luminosos',
      'Jalavistas',
      'Neón LED',
      'Señalización',
    ],
  },
  {
    id: 'display-pop',
    titulo: 'Display y POP',
    subtitulo: 'Exhibición para marca y venta',
    descripcion:
      'Soluciones para ferias, promociones, eventos, puntos de venta y campañas comerciales.',
    imagen: '/servicios/display.webp.png',
    icono: PackageOpen,
    items: [
      'Roll Up',
      'X Banner',
      'Backings',
      'Porta banner',
      'Exhibidores',
      'Stands',
      'Material POP',
    ],
  },
  {
    id: 'grabado-laser',
    titulo: 'Grabado láser',
    subtitulo: 'Detalles exclusivos y personalizados',
    descripcion:
      'Grabado y corte láser sobre diferentes materiales para piezas corporativas, promocionales y decorativas.',
    imagen: '/servicios/laser.webp.png',
    icono: Sparkles,
    items: [
      'Acrílico',
      'Madera',
      'Cuero',
      'Metal',
      'Reconocimientos',
      'Promocionales',
      'Detalles personalizados',
    ],
  },
  {
    id: 'textil',
    titulo: 'Textil',
    subtitulo: 'Uniformes y promocionales',
    descripcion:
      'Personalización textil para empresas, eventos, equipos deportivos y productos promocionales.',
    imagen: '/servicios/textil.webp.png',
    icono: Shirt,
    items: [
      'Sublimación',
      'Serigrafía',
      'Camisetas',
      'Polos deportivos',
      'Uniformes deportivos',
      'Gorras',
      'Promocionales',
    ],
  },
  {
    id: 'estructuras',
    titulo: 'Estructuras',
    subtitulo: 'Soporte técnico para rotulación',
    descripcion:
      'Fabricamos estructuras metálicas y soportes para proyectos de rotulación, instalación y comunicación exterior.',
    imagen: '/servicios/estructuras.webp.png',
    icono: Factory,
    items: [
      'Postes',
      'Tótems',
      'Cajillos',
      'Marcos metálicos',
      'Estructuras para fachadas',
      'Instalación',
    ],
  },
  {
    id: 'mobiliario',
    titulo: 'Mobiliario',
    subtitulo: 'Fabricación a medida',
    descripcion:
      'Diseñamos y fabricamos muebles comerciales, exhibidores y soluciones funcionales para hogar, negocio u oficina.',
    imagen: '/servicios/mobiliario.webp.png',
    icono: Hammer,
    items: [
      'Recepciones',
      'Muebles comerciales',
      'Exhibidores',
      'Closets',
      'Módulos',
      'Muebles a medida',
    ],
  },
];

export default function Servicios({ setPage }) {
  const [busqueda, setBusqueda] = useState('');

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return servicios;

    return servicios.filter((servicio) =>
      `${servicio.titulo} ${servicio.subtitulo} ${servicio.descripcion} ${servicio.items.join(' ')}`
        .toLowerCase()
        .includes(q)
    );
  }, [busqueda]);

  return (
    <main className="servicios-page">
      <section className="servicios-hero">
        <div className="servicios-hero-bg" />

        <div className="servicios-hero-content">
          <span className="servicios-badge">
            <BriefcaseBusiness size={16} />
            NUESTROS SERVICIOS
          </span>

          <h1>Soluciones visuales que impulsan tu marca</h1>

          <p>
            Diseño, impresión, rotulación, fabricación, estructuras, displays,
            grabado láser, textil y mobiliario a medida para negocios.
          </p>

          <button
            type="button"
            className="servicios-primary-btn"
            onClick={() => setPage?.('cotizador')}
          >
            <BriefcaseBusiness size={20} />
            Solicitar cotización
          </button>
        </div>
      </section>

      <section className="servicios-search-section">
        <div className="servicios-search-box">
          <Search size={20} />
          <input
            placeholder="Buscar servicio, material o aplicación..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
      </section>

      <section className="servicios-list">
        {lista.map((servicio, index) => {
          const Icono = servicio.icono;
          const invertido = index % 2 !== 0;

          return (
            <article
              className={`servicio-block ${invertido ? 'servicio-block-invertido' : ''}`}
              key={servicio.id}
            >
              <div className="servicio-media">
                <img
                  src={servicio.imagen}
                  alt={servicio.titulo}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = '/productos/portada-visual.png';
                  }}
                />
              </div>

              <div className="servicio-content">
                <span className="servicios-badge servicio-badge">
                  <Icono size={18} />
                  {servicio.subtitulo}
                </span>

                <h2>{servicio.titulo}</h2>

                <p>{servicio.descripcion}</p>

                <div className="servicio-items">
                  {servicio.items.map((item) => (
                    <span key={item}>
                      <CheckCircle2 size={17} />
                      {item}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="servicios-secondary-btn"
                  onClick={() => setPage?.('cotizador')}
                >
                  <BriefcaseBusiness size={18} />
                  Solicitar cotización
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {lista.length === 0 && (
        <section className="servicios-empty">
          <h2>No encontramos ese servicio</h2>
          <p>
            Probá buscando impresión, rótulos, letras, display, láser, textil,
            estructuras o mobiliario.
          </p>
        </section>
      )}

      <section className="servicios-final-cta">
        <span>ELANVISUAL</span>
        <h2>¿Tenés un proyecto en mente?</h2>
        <p>
          Te ayudamos a convertirlo en una solución visual fabricable, rentable
          y profesional.
        </p>

        <button
          type="button"
          className="servicios-primary-btn"
          onClick={() => setPage?.('cotizador')}
        >
          <BriefcaseBusiness size={20} />
          Solicitar cotización
        </button>
      </section>
    </main>
  );
}
