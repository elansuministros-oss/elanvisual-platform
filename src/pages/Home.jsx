import React from 'react';
import { ArrowRight, BadgeCheck, HeartHandshake, PackageCheck, Truck } from 'lucide-react';
import { categoriasHome } from '../data/productos';
import { useApp } from '../context/AppContext';

export default function Home({ setPage }) {
  const { banners } = useApp();

  const normalizar = (valor = '') =>
    String(valor)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const prioridadUbicacion = (banner) => {
    const ubicacion = normalizar(banner?.ubicacion);

    if (
      ubicacion === 'hero-principal' ||
      ubicacion === 'banner principal de portada' ||
      ubicacion === 'principal' ||
      ubicacion === 'portada'
    ) {
      return 1;
    }

    if (ubicacion === 'slider-home' || ubicacion === 'slider principal') {
      return 2;
    }

    if (ubicacion === 'home' || ubicacion === 'inicio') {
      return 3;
    }

    return 99;
  };

  const obtenerFecha = (banner) => {
    const valor = banner?.actualizadoEn || banner?.createdAt || banner?.fecha || banner?.id || '';
    const numero = Number(String(valor).replace(/\D/g, ''));
    return Number.isFinite(numero) ? numero : 0;
  };

  const bannersActivos = Array.isArray(banners)
    ? banners
        .filter((banner) => banner?.activo)
        .sort((a, b) => {
          const prioridadA = prioridadUbicacion(a);
          const prioridadB = prioridadUbicacion(b);

          if (prioridadA !== prioridadB) return prioridadA - prioridadB;

          return obtenerFecha(b) - obtenerFecha(a);
        })
    : [];

  const heroBanner = bannersActivos[0] || {};

  const heroTitulo = heroBanner.titulo || 'Tu mascota merece más';

  const heroDescripcion =
    heroBanner.descripcion ||
    heroBanner.subtitulo ||
    'Muebles funcionales, resistentes y fabricados para el bienestar de perros y gatos.';

  const heroImagen = heroBanner.imagen || '/productos/producto-04.jpg';

  return (
    <main className="home-page home-launch-page">
      <section className="elanpet-launch-hero">
        <div className="elanpet-launch-copy">
          <span className="elanpet-pill">🐾 TODO PARA TU MASCOTA</span>

          <h1>
            {heroTitulo.toLowerCase().includes('merece') ? (
              <>
                Tu mascota
                <br />
                merece <span>más</span>
              </>
            ) : (
              heroTitulo
            )}
          </h1>

          <p>{heroDescripcion}</p>

          <strong className="elanpet-hero-line">Compra fácil desde tu celular.</strong>

          <div className="elanpet-benefits">
            <div>
              <BadgeCheck size={32} />
              <b>
                Productos
                <br />
                de calidad
              </b>
            </div>

            <div>
              <PackageCheck size={32} />
              <b>
                Fabricados
                <br />
                con amor
              </b>
            </div>

            <div>
              <HeartHandshake size={32} />
              <b>
                Diseñados para
                <br />
                su bienestar
              </b>
            </div>

            <div>
              <Truck size={34} />
              <b>
                Entrega rápida
                <br />
                y segura
              </b>
            </div>
          </div>

          <div className="elanpet-hero-actions">
            <button onClick={() => setPage('catalogo')} className="elanpet-primary-btn">
              <span>🛍️</span>
              Ver catálogo
            </button>

            <button onClick={() => setPage('contacto')} className="elanpet-whatsapp-btn">
              <span>☘</span>
              Pedir por WhatsApp
            </button>
          </div>
        </div>

        <div className="elanpet-launch-media">
          <img src={heroImagen} alt={heroBanner.titulo || 'ELANPET productos para perros y gatos'} />
        </div>
      </section>

      <section className="elanpet-category-section">
        <div className="elanpet-section-title">
          <span>CATÁLOGO</span>
          <h2>
            Productos <strong>principales</strong>
          </h2>
        </div>

        <div className="elanpet-category-grid">
          {categoriasHome.map((cat) => (
            <button
              key={cat.nombre}
              className="elanpet-category-card"
              onClick={() => setPage('catalogo')}
            >
              {cat.imagen ? (
                <img src={cat.imagen} alt={cat.nombre} className="elanpet-category-image" />
              ) : null}

              <b>{cat.nombre}</b>
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
