import React, { useEffect, useState } from 'react';
import HtmlSlot from './HtmlSlot.jsx';
import { SLOT_REGISTRY } from './slotRegistry.js';
import { heroPromoHtml, promoBannerHtml, productCardHtml } from './demoHtml.js';
import { contactSeed, servicesSeed, productsSeed, portfolioSeed } from './contentSeed.js';

const NAV = [
  ['Inicio', '/'],
  ['Servicios', '/servicios'],
  ['Catálogo', '/catalogo'],
  ['Portafolio', '/portafolio'],
  ['Contacto', '/contacto']
];

function normalizeRoute(pathname = '/') {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (path.startsWith('/catalogo')) return '/catalogo';
  if (path.startsWith('/servicios')) return '/servicios';
  if (path.startsWith('/portafolio')) return '/portafolio';
  if (path.startsWith('/contacto')) return '/contacto';
  if (path.startsWith('/vendedor')) return '/vendedor';
  if (path.startsWith('/admin-contenido')) return '/admin-contenido';
  return '/';
}

function useRoute() {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (path) => {
    window.history.pushState({}, '', path);
    setRoute(normalizeRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return [route, go];
}

function Header({ route, go }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <button className="brand" onClick={() => go('/')} aria-label="Ir al inicio">
        <img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" />
      </button>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Abrir menú">{open ? '×' : '☰'}</button>
      <nav className={open ? 'site-nav is-open' : 'site-nav'}>
        {NAV.map(([label, path]) => (
          <button key={path} className={route === path ? 'active' : ''} onClick={() => { go(path); setOpen(false); }}>{label}</button>
        ))}
        <button className="seller-link" onClick={() => { go('/vendedor'); setOpen(false); }}>Vendedores</button>
      </nav>
    </header>
  );
}

function Footer({ go }) {
  return (
    <footer className="site-footer">
      <div><img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" /><p>Comunicación visual, producción e instalación.</p></div>
      <div><b>Explorar</b><button onClick={() => go('/servicios')}>Servicios</button><button onClick={() => go('/catalogo')}>Catálogo</button><button onClick={() => go('/portafolio')}>Portafolio</button></div>
      <div><b>Contacto</b><a href={contactSeed.whatsappHref} target="_blank" rel="noreferrer">WhatsApp {contactSeed.whatsappLabel}</a><a href={`mailto:${contactSeed.email}`}>{contactSeed.email}</a><button onClick={() => go('/vendedor')}>Acceso vendedores</button></div>
    </footer>
  );
}

function Layout({ route, go, children }) {
  return <><Header route={route} go={go} /><main>{children}</main><Footer go={go} /></>;
}

function Home({ go }) {
  return (
    <>
      <HtmlSlot slotId="HOME.HERO.MAIN" html={heroPromoHtml} />
      <section className="intro section-pad">
        <div><span className="kicker">ELANVISUAL</span><h2>Diseño, fabricación e instalación desde una sola operación.</h2></div>
        <p>La nueva plataforma conserva el contenido útil de ELANVISUAL y convierte las zonas comerciales en slots HTML completos para que ELAN pueda rediseñarlas y publicarlas después desde Biblioteca.</p>
      </section>
      <section className="service-strip section-pad">
        {servicesSeed.slice(0, 6).map((item, index) => <button key={item.id} onClick={() => go('/servicios')}><span>0{index + 1}</span>{item.title}</button>)}
      </section>
      <section className="section-pad featured">
        <div className="section-heading"><span className="kicker">CATÁLOGO</span><h2>Soluciones visuales</h2><button onClick={() => go('/catalogo')}>Ver todo →</button></div>
        <div className="product-grid">
          {productsSeed.slice(0, 3).map((product) => <HtmlSlot key={product.title} slotId="CATALOG.PRODUCT.CARD" html={productCardHtml(product)} />)}
        </div>
      </section>
      <HtmlSlot slotId="HOME.PROMO.PRIMARY" html={promoBannerHtml} />
      <section className="section-pad process">
        <span className="kicker">DE LA IDEA A LA INSTALACIÓN</span>
        <div className="process-grid">
          {[['01', 'Contanos qué necesitás'], ['02', 'Diseñamos la solución'], ['03', 'Cotizamos y producimos'], ['04', 'Entregamos e instalamos']].map(([n, t]) => <div key={n}><span>{n}</span><h3>{t}</h3></div>)}
        </div>
      </section>
    </>
  );
}

function Services({ go }) {
  return (
    <section className="page section-pad">
      <span className="kicker">NUESTROS SERVICIOS</span>
      <h1>Soluciones visuales que impulsan tu marca.</h1>
      <p className="lead">Contenido y recursos recuperados de la ELANVISUAL anterior, ya separados del ERP y del CRM.</p>
      <div className="services-rich-grid">
        {servicesSeed.map((service) => (
          <article key={service.id} className="service-rich-card">
            <img src={service.image} alt={service.title} loading="lazy" />
            <div>
              <span>{service.subtitle}</span>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <button onClick={() => go('/contacto')}>Solicitar cotización</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Catalog() {
  return <section className="page section-pad"><div className="section-heading"><div><span className="kicker">CATÁLOGO HTML</span><h1>Productos y soluciones</h1></div><p>Cada ficha es un módulo HTML completo. Cuando Biblioteca esté activa, ELAN podrá sustituir cualquiera de estos módulos sin modificar la página.</p></div><div className="product-grid catalog-grid">{productsSeed.map((product) => <HtmlSlot key={product.title} slotId="CATALOG.PRODUCT.CARD" html={productCardHtml(product)} />)}</div></section>;
}

function Portfolio() {
  return (
    <section className="page section-pad">
      <span className="kicker">PORTAFOLIO / REFERENCIAS</span>
      <h1>Capacidades recuperadas sin enlaces rotos.</h1>
      <p className="lead">La página anterior declaraba trabajos cuyos archivos ya no existen. Aquí conservamos la información descriptiva y usamos únicamente recursos comprobados mientras activamos Biblioteca.</p>
      <div className="portfolio-grid">
        {portfolioSeed.map((item) => (
          <article key={item.title}>
            <img className="portfolio-image" src={item.image} alt={item.title} loading="lazy" />
            <span>REFERENCIA · {item.category}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  return <section className="page contact-page section-pad"><div><span className="kicker">HABLEMOS</span><h1>Tu próximo proyecto empieza con una conversación.</h1><p className="lead">Mientras se conecta el CRM de ELAN ONE, mantenemos canales directos reales sin recrear un CRM dentro de ELANVISUAL.</p><div className="direct-contact"><a href={contactSeed.whatsappHref} target="_blank" rel="noreferrer">WhatsApp {contactSeed.whatsappLabel}</a><a href={`mailto:${contactSeed.email}`}>{contactSeed.email}</a><span>{contactSeed.instagram}</span></div></div><div className="contact-card"><span>FLUJO OBJETIVO</span><strong>Consulta → ELAN ONE → vendedor → cotización → seguimiento</strong><p>El envío automático al CRM se habilitará únicamente cuando Access Core quede validado. Hasta entonces, los canales directos funcionan sin duplicar datos empresariales.</p></div></section>;
}

function SellerPortal() {
  const modules = ['Mis prospectos', 'Mis clientes', 'Mis contactos', 'Mis cotizaciones', 'Mis seguimientos', 'Mis oportunidades', 'Mis pedidos', 'Mis comisiones'];
  return <section className="seller-page section-pad"><div className="seller-hero"><div><span className="kicker">PORTAL VENDEDOR</span><h1>ELANVISUAL para vender.<br />ELAN ONE para operar.</h1><p>La interfaz está reservada para los vendedores, pero no tendrá un CRM propio. Los datos y acciones finales vendrán de ELAN ONE.</p></div><div className="connection-status"><i></i><span>LAB</span><strong>Integración ELAN ONE pendiente de conexión</strong></div></div><div className="seller-modules">{modules.map((m) => <article key={m}><span>ELAN ONE</span><h3>{m}</h3><p>Vista preparada para datos centralizados.</p></article>)}</div><div className="seller-login"><div><b>Acceso centralizado</b><p>La autenticación final vendrá de ELAN ONE Access.</p></div><button disabled>Ingresar con ELAN ONE</button></div></section>;
}

function ContentAdminLab() {
  return <section className="page section-pad"><span className="kicker">ADMINISTRACIÓN · LAB</span><h1>Registro de slots HTML</h1><p className="lead">Contrato inicial para que ELAN sepa exactamente dónde publicar cada diseño.</p><div className="slot-table">{Object.entries(SLOT_REGISTRY).map(([id, config]) => <article key={id}><code>{id}</code><div><strong>{config.label}</strong><p>{config.purpose}</p></div><span>{config.kind}</span></article>)}</div></section>;
}

export default function CleanApp() {
  const [route, go] = useRoute();
  useEffect(() => { document.title = 'ELANVISUAL · Comunicación visual'; }, []);
  let page = <Home go={go} />;
  if (route === '/servicios') page = <Services go={go} />;
  if (route === '/catalogo') page = <Catalog />;
  if (route === '/portafolio') page = <Portfolio />;
  if (route === '/contacto') page = <Contact />;
  if (route === '/vendedor') page = <SellerPortal />;
  if (route === '/admin-contenido') page = <ContentAdminLab />;
  return <Layout route={route} go={go}>{page}</Layout>;
}
