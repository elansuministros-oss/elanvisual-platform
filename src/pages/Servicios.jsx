import React, { useMemo, useState } from 'react';
import { BriefcaseBusiness, Maximize2, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const serviciosBase = [
  {
    id: 'rotulacion',
    nombre: 'Rotulación comercial',
    categoria: 'Rotulación',
    descripcion:
      'Diseño, fabricación e instalación de rótulos para fachadas, interiores y puntos de venta.',
    imagen: '/productos/fachada.jpg',
  },
  {
    id: 'letras-3d',
    nombre: 'Letras 3D',
    categoria: 'Fabricación',
    descripcion:
      'Letras corpóreas en PVC, acrílico, ACM, metal o combinaciones según aplicación.',
    imagen: '/productos/letras-pvc.jpg',
  },
  {
    id: 'displays',
    nombre: 'Displays y exhibidores',
    categoria: 'Publicidad',
    descripcion:
      'Soluciones visuales para ferias, promociones, retail y comunicación comercial.',
    imagen: '/productos/display.jpg',
  },
];

const texto = (value) => String(value || '').trim();

export default function Servicios({ setPage }) {
  const { trabajos = [] } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [imagenActiva, setImagenActiva] = useState(null);

  const servicios = useMemo(() => {
    if (!Array.isArray(trabajos) || trabajos.length === 0) {
      return serviciosBase;
    }

    return trabajos
      .filter((trabajo) => trabajo?.activo !== false)
      .map((trabajo) => ({
        id: trabajo.id || trabajo.titulo || trabajo.nombre,
        nombre:
          texto(trabajo.titulo) ||
          texto(trabajo.nombre) ||
          'Servicio ELANVISUAL',
        categoria: texto(trabajo.categoria) || 'Portafolio',
        descripcion:
          texto(trabajo.descripcion) ||
          'Trabajo realizado por ELANVISUAL.',
        imagen:
          texto(trabajo.imagen) ||
          texto(trabajo.url) ||
          '/productos/fachada.jpg',
      }));
  }, [trabajos]);

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return servicios;

    return servicios.filter((servicio) =>
      `${servicio.nombre} ${servicio.categoria} ${servicio.descripcion}`
        .toLowerCase()
        .includes(q)
    );
  }, [servicios, busqueda]);

  return (
    <main className="catalog-page">

      <section className="catalog-tools">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar servicio, categoría o referencia..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
      </section>

      <div className="product-grid">
        {lista.map((servicio) => (
          <article className="product-card" key={servicio.id}>
            <div className="product-image-wrap">
              <button
                type="button"
                className="product-image-button"
                onClick={() => setImagenActiva(servicio)}
              >
                <img
                  className="product-image"
                  src={servicio.imagen}
                  alt={servicio.nombre}
                  loading="lazy"
                />

                <span className="product-zoom-badge">
                  <Maximize2 size={15} />
                  Ampliar
                </span>
              </button>
            </div>

            <div className="product-body">
              <small>{servicio.categoria}</small>

              <h3>{servicio.nombre}</h3>

              <p>{servicio.descripcion}</p>

              <div className="product-footer">
                <strong className="price">
                  A cotizar
                </strong>

                <button
                  type="button"
                  onClick={() => setPage?.('cotizador')}
                >
                  <BriefcaseBusiness size={16} />
                  Solicitar cotización
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {lista.length === 0 && (
        <section className="panel empty-catalog">
          <h2>No hay servicios disponibles</h2>

          <p className="note">
            Agregá trabajos o referencias desde el panel administrativo.
          </p>
        </section>
      )}

      {imagenActiva && (
        <section
          className="image-lightbox"
          onMouseDown={() => setImagenActiva(null)}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setImagenActiva(null)}
          >
            <X size={28} />
          </button>

          <div
            className="image-lightbox-content"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <img
              src={imagenActiva.imagen}
              alt={imagenActiva.nombre}
            />

            <div className="image-lightbox-caption">
              <b>{imagenActiva.nombre}</b>
              <span>{imagenActiva.categoria}</span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}