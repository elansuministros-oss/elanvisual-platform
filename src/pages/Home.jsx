import React, { useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Image,
  MessageCircle,
  PackageSearch,
  Sparkles,
} from 'lucide-react';
import { formatoC$ } from '../lib/calculos';
import { useApp } from '../context/AppContext';

export default function Home({ setPage }) {
  const { configuracion, banners = [], productos = [], trabajos = [] } = useApp();

  const bannerHero = useMemo(() => {
    return (
      banners.find((b) => b.ubicacion === 'hero-principal' && b.activo) ||
      banners.find((b) => b.activo) ||
      null
    );
  }, [banners]);

  const serviciosDestacados = useMemo(() => {
    return productos.filter((p) => p.activo !== false).slice(0, 6);
  }, [productos]);

  const trabajosDestacados = useMemo(() => {
    return trabajos.slice(0, 4);
  }, [trabajos]);

  const heroTitulo =
    bannerHero?.titulo ||
    configuracion.textoHero ||
    configuracion.tituloHero ||
    'Rotulación profesional para negocios reales';

  const heroDescripcion =
    bannerHero?.subtitulo ||
    configuracion.descripcionHero ||
    'Rótulos, letras 3D, acrílico, PVC, impresión UV, DTF UV, CNC, láser, fachadas y displays fabricables.';

  const heroImagen =
    bannerHero?.imagenRuta ||
    bannerHero?.imagen ||
    configuracion.logo ||
    '/productos/portada-visual.png';

  const whatsapp = String(configuracion.whatsapp || '').replace(/[^\d]/g, '');
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        'Hola, quiero solicitar información sobre un proyecto de rotulación.'
      )}`
    : '#';

  return (
    <main className="home-public-page">
      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="badge">
            <Sparkles size={16} /> Plataforma comercial ELANVISUAL
          </span>

          <h1>{heroTitulo}</h1>
          <p>{heroDescripcion}</p>

          <div className="public-hero-actions">
            <button type="button" className="primary-btn" onClick={() => setPage('servicios')}>
              Ver servicios <ArrowRight size={18} />
            </button>

            <button type="button" className="secondary-btn" onClick={() => setPage('contacto')}>
              Solicitar cotización
            </button>

            {whatsapp ? (
              <a className="secondary-btn" href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> WhatsApp
              </a>
            ) : null}
          </div>

          <div className="public-hero-kpis">
            <article>
              <b>Fabricación real</b>
              <span>PVC, acrílico, metal, impresión e instalación.</span>
            </article>
            <article>
              <b>Proceso controlado</b>
              <span>Solicitud, cotización, pedido, OT y seguimiento.</span>
            </article>
            <article>
              <b>Portal público</b>
              <span>Servicios, tienda, carrito y estado del pedido.</span>
            </article>
          </div>
        </div>

        <div className="public-hero-media">
          {heroImagen ? (
            <img src={heroImagen} alt={heroTitulo} />
          ) : (
            <div className="public-hero-placeholder">
              <Building2 size={72} />
              <span>ELANVISUAL</span>
            </div>
          )}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section-head">
          <span className="badge">
            <BriefcaseBusiness size={16} /> Servicios fabricables
          </span>
          <h2>Soluciones visuales listas para cotizar</h2>
          <p>
            Catálogo administrable desde el panel interno. Cada servicio puede tener imagen,
            descripción, categoría y precio referencial.
          </p>
        </div>

        {serviciosDestacados.length > 0 ? (
          <div className="public-card-grid">
            {serviciosDestacados.map((servicio) => (
              <article className="public-card" key={servicio.id}>
                {servicio.imagen ? (
                  <img src={servicio.imagen} alt={servicio.nombre} />
                ) : (
                  <div className="public-card-empty">
                    <PackageSearch size={34} />
                  </div>
                )}

                <div>
                  <span>{servicio.categoria || 'Servicio'}</span>
                  <h3>{servicio.nombre}</h3>
                  <p>{servicio.descripcion}</p>

                  <div className="public-card-footer">
                    <b>
                      {Number(servicio.precio || 0) > 0
                        ? `Desde ${formatoC$(servicio.precio)}`
                        : 'A cotizar'}
                    </b>
                    <button type="button" onClick={() => setPage('servicios')}>
                      Ver
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="public-empty">
            <PackageSearch size={42} />
            <h3>Servicios pendientes de cargar</h3>
            <p>Agregá servicios desde Administración → Servicios.</p>
          </div>
        )}

        <div className="public-center-action">
          <button type="button" className="primary-btn" onClick={() => setPage('servicios')}>
            Ver todos los servicios
          </button>
        </div>
      </section>

      <section className="public-process">
        <article>
          <BadgeCheck size={28} />
          <h3>1. Solicitud</h3>
          <p>El cliente selecciona servicio, envía datos y describe el proyecto.</p>
        </article>

        <article>
          <ClipboardList size={28} />
          <h3>2. Cotización</h3>
          <p>Ventas valida medidas, materiales, instalación y precio final.</p>
        </article>

        <article>
          <PackageSearch size={28} />
          <h3>3. Pedido / OT</h3>
          <p>El pedido pasa a producción con orden de trabajo y control interno.</p>
        </article>

        <article>
          <Image size={28} />
          <h3>4. Seguimiento</h3>
          <p>El cliente puede consultar el avance con código o WhatsApp.</p>
        </article>
      </section>

      <section className="public-section">
        <div className="public-section-head">
          <span className="badge">
            <Image size={16} /> Portafolio
          </span>
          <h2>Trabajos y referencias visuales</h2>
          <p>Proyectos administrados desde el panel interno para mostrar respaldo real.</p>
        </div>

        {trabajosDestacados.length > 0 ? (
          <div className="public-portfolio-grid">
            {trabajosDestacados.map((trabajo) => (
              <article className="public-portfolio-card" key={trabajo.id}>
                {trabajo.imagen ? (
                  <img src={trabajo.imagen} alt={trabajo.titulo} />
                ) : (
                  <div className="public-card-empty">
                    <Image size={34} />
                  </div>
                )}

                <div>
                  <span>{trabajo.tipo || 'Proyecto'}</span>
                  <h3>{trabajo.titulo}</h3>
                  <p>{trabajo.descripcion}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="public-empty">
            <Image size={42} />
            <h3>Portafolio pendiente de cargar</h3>
            <p>Agregá trabajos desde Administración → Portafolio.</p>
          </div>
        )}

        <div className="public-center-action">
          <button type="button" className="secondary-btn" onClick={() => setPage('trabajos')}>
            Ver portafolio
          </button>
        </div>
      </section>

      <section className="public-cta">
        <div>
          <span className="badge">Cotización rápida</span>
          <h2>Convertí una idea en una orden fabricable</h2>
          <p>
            Enviá medidas, ubicación, material deseado y referencia visual. El equipo comercial
            prepara la propuesta y producción recibe una OT clara.
          </p>
        </div>

        <div className="public-cta-actions">
          <button type="button" className="primary-btn" onClick={() => setPage('contacto')}>
            Solicitar información
          </button>
          <button type="button" className="secondary-btn" onClick={() => setPage('seguimiento')}>
            Consultar pedido
          </button>
        </div>
      </section>

      <style>{`
        .home-public-page{
          background:#f4f6fb;
          min-height:100vh;
          padding:18px;
          display:grid;
          gap:18px;
        }

        .public-hero,
        .public-section,
        .public-process,
        .public-cta{
          max-width:1180px;
          width:100%;
          margin:0 auto;
        }

        .public-hero{
          display:grid;
          grid-template-columns:1fr .95fr;
          gap:18px;
          align-items:stretch;
        }

        .public-hero-copy,
        .public-hero-media,
        .public-section,
        .public-cta{
          background:#fff;
          border-radius:28px;
          box-shadow:0 18px 45px rgba(15,23,42,.08);
          overflow:hidden;
        }

        .public-hero-copy{
          padding:28px;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          width:max-content;
          max-width:100%;
          color:#9a741b;
          background:#fff7df;
          border:1px solid #f3df9b;
          border-radius:999px;
          padding:8px 12px;
          font-size:12px;
          font-weight:950;
          text-transform:uppercase;
          letter-spacing:.04em;
        }

        .public-hero h1{
          color:#111827;
          font-size:clamp(38px, 6vw, 72px);
          line-height:.95;
          margin:18px 0 14px;
          letter-spacing:-.055em;
        }

        .public-hero p,
        .public-section-head p,
        .public-cta p{
          color:#64748b;
          font-weight:700;
          line-height:1.55;
          font-size:16px;
        }

        .public-hero-actions,
        .public-cta-actions{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:18px;
        }

        .primary-btn,
        .secondary-btn{
          border:0;
          border-radius:16px;
          padding:13px 16px;
          font-weight:950;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          text-decoration:none;
        }

        .primary-btn{
          background:#111827;
          color:#fff;
        }

        .secondary-btn{
          background:#f3f4f6;
          color:#111827;
          border:1px solid #e5e7eb;
        }

        .public-hero-kpis{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:10px;
          margin-top:22px;
        }

        .public-hero-kpis article{
          background:#f8fafc;
          border:1px solid #e5e7eb;
          border-radius:18px;
          padding:14px;
        }

        .public-hero-kpis b{
          display:block;
          color:#111827;
          font-size:14px;
          margin-bottom:5px;
        }

        .public-hero-kpis span{
          color:#64748b;
          font-size:12px;
          font-weight:700;
          line-height:1.35;
        }

        .public-hero-media{
          min-height:460px;
          background:#111827;
        }

        .public-hero-media img{
          width:100%;
          height:100%;
          min-height:460px;
          object-fit:cover;
          display:block;
        }

        .public-hero-placeholder{
          min-height:460px;
          display:grid;
          place-items:center;
          color:#fff;
          text-align:center;
          gap:10px;
        }

        .public-section{
          padding:24px;
        }

        .public-section-head{
          max-width:720px;
          margin-bottom:18px;
        }

        .public-section-head h2,
        .public-cta h2{
          font-size:clamp(28px,4vw,44px);
          line-height:1;
          margin:14px 0 10px;
          color:#111827;
          letter-spacing:-.04em;
        }

        .public-card-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:14px;
        }

        .public-card,
        .public-portfolio-card{
          border:1px solid #e5e7eb;
          border-radius:22px;
          overflow:hidden;
          background:#fff;
        }

        .public-card img,
        .public-portfolio-card img{
          width:100%;
          height:210px;
          object-fit:cover;
          display:block;
          background:#e5e7eb;
        }

        .public-card > div,
        .public-portfolio-card > div{
          padding:16px;
        }

        .public-card span,
        .public-portfolio-card span{
          color:#9a741b;
          font-weight:950;
          font-size:12px;
          text-transform:uppercase;
        }

        .public-card h3,
        .public-portfolio-card h3{
          margin:7px 0 8px;
          color:#111827;
          font-size:20px;
          line-height:1.1;
        }

        .public-card p,
        .public-portfolio-card p{
          color:#64748b;
          line-height:1.45;
          font-weight:700;
          font-size:14px;
        }

        .public-card-footer{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-top:14px;
        }

        .public-card-footer b{
          color:#111827;
        }

        .public-card-footer button{
          border:0;
          background:#111827;
          color:#fff;
          border-radius:12px;
          padding:9px 12px;
          font-weight:900;
          cursor:pointer;
        }

        .public-card-empty{
          height:210px;
          display:grid;
          place-items:center;
          background:#f1f5f9;
          color:#94a3b8;
        }

        .public-center-action{
          display:flex;
          justify-content:center;
          margin-top:18px;
        }

        .public-empty{
          border:1px dashed #cbd5e1;
          border-radius:22px;
          padding:30px;
          text-align:center;
          color:#64748b;
          background:#f8fafc;
        }

        .public-empty h3{
          color:#111827;
          margin-bottom:6px;
        }

        .public-process{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:14px;
        }

        .public-process article{
          background:#111827;
          color:#fff;
          border-radius:24px;
          padding:20px;
          box-shadow:0 18px 45px rgba(15,23,42,.08);
        }

        .public-process article svg{
          color:#C9A227;
        }

        .public-process h3{
          margin:12px 0 8px;
          font-size:18px;
        }

        .public-process p{
          margin:0;
          color:#cbd5e1;
          line-height:1.45;
          font-weight:700;
          font-size:14px;
        }

        .public-portfolio-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:14px;
        }

        .public-portfolio-card img,
        .public-portfolio-card .public-card-empty{
          height:180px;
        }

        .public-cta{
          padding:26px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          margin-bottom:20px;
        }

        .public-cta > div:first-child{
          max-width:720px;
        }

        @media (max-width:900px){
          .home-public-page{
            padding:12px;
          }

          .public-hero{
            grid-template-columns:1fr;
          }

          .public-hero-copy{
            padding:20px;
          }

          .public-hero h1{
            font-size:42px;
          }

          .public-hero-media,
          .public-hero-media img,
          .public-hero-placeholder{
            min-height:260px;
          }

          .public-hero-kpis,
          .public-card-grid,
          .public-process,
          .public-portfolio-grid{
            grid-template-columns:1fr;
          }

          .public-section{
            padding:18px;
          }

          .public-cta{
            display:grid;
          }

          .public-cta-actions{
            width:100%;
          }

          .public-cta-actions .primary-btn,
          .public-cta-actions .secondary-btn,
          .public-hero-actions .primary-btn,
          .public-hero-actions .secondary-btn{
            width:100%;
          }
        }
      `}</style>
    </main>
  );
}