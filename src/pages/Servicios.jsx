import React, { useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Brush,
  Building2,
  CheckCircle2,
  Factory,
  Hammer,
  MonitorSmartphone,
  PackageOpen,
  Printer,
  Search,
  Shirt,
  Sparkles,
  Trophy,
} from 'lucide-react';

const texto = (value) => String(value || '').trim();

const servicios = [
  {
    id: 'diseno',
    titulo: 'Diseño',
    subtitulo: 'Imagen visual, marca y comunicación',
    descripcion:
      'Desarrollamos identidad visual, piezas gráficas y soluciones de diseño aplicadas a negocios, productos y espacios comerciales.',
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
    <main className="catalog-page">
      <section className="store-ai-banner">
        <div className="store-ai-copy">
          <span className="store-ai-badge">
            <BriefcaseBusiness size={15} />
            NUESTROS SERVICIOS
          </span>

          <h1>Soluciones visuales que impulsan tu marca</h1>

          <p>
            Diseño, impresión, rotulación, fabricación, estructuras, displays,
            grabado láser, textil y mobiliario a medida para negocios.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <button
              type="button"
              className="product-main-action"
              onClick={() => setPage?.('cotizador')}
              style={{ width: 'auto', paddingInline: 24 }}
            >
              <BriefcaseBusiness size={18} />
              Solicitar cotización
            </button>

            <button
              type="button"
              className="filter-label"
              onClick={() => setPage?.('portafolio')}
            >
              <MonitorSmartphone size={18} />
              Ver portafolio
            </button>
          </div>
        </div>
      </section>

      <section className="catalog-tools">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar servicio, material o aplicación..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
      </section>

      <section className="product-grid">
        {lista.map((servicio) => {
          const Icono = servicio.icono;

          return (
            <article className="product-card" key={servicio.id}>
              <div className="product-body">
                <span className="store-ai-badge" style={{ width: 'fit-content' }}>
                  <Icono size={18} />
                  {servicio.subtitulo}
                </span>

                <h3>{servicio.titulo}</h3>

                <p>{servicio.descripcion}</p>

                <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                  {servicio.items.map((item) => (
                    <span
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#111827',
                        fontWeight: 800,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="product-footer" style={{ marginTop: 20 }}>
                  <button type="button" onClick={() => setPage?.('portafolio')}>
                    <Trophy size={16} />
                    Ver trabajos
                  </button>

                  <button type="button" onClick={() => setPage?.('cotizador')}>
                    <BriefcaseBusiness size={16} />
                    Cotizar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {lista.length === 0 && (
        <section className="panel empty-catalog">
          <h2>No encontramos ese servicio</h2>
          <p className="note">
            Probá buscando impresión, rótulos, letras, display, láser, textil,
            estructuras o mobiliario.
          </p>
        </section>
      )}
    </main>
  );
}