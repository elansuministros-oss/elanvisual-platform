import React, { useEffect, useState } from 'react';
import HtmlSlot from './HtmlSlot.jsx';
import { SLOT_REGISTRY } from './slotRegistry.js';
import { heroPromoHtml, promoBannerHtml, productCardHtml, sampleProducts } from './demoHtml.js';

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
      <div><b>Operación</b><button onClick={() => go('/vendedor')}>Acceso vendedores</button><span>Conectado a ELAN ONE por diseño</span></div>
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
        <div><span className="kicker">UNA NUEVA ELANVISUAL</span><h2>Diseñada para cambiar sin volver a programar la página.</h2></div>
        <p>Las áreas visuales principales se publican como módulos HTML completos. ELAN podrá diseñarlos, guardarlos en Biblioteca y ubicarlos en el slot correcto después de validación.</p>
      </section>
      <section className="service-strip section-pad">
        {['Rótulos', 'Impresión', 'Fachadas', 'Exhibidores', 'Señalización', 'Instalación'].map((item, index) => <button key={item} onClick={() => go('/catalogo')}><span>0{index + 1}</span>{item}</button>)}
      </section>
      <section className="section-pad featured">
        <div className="section-heading"><span className="kicker">CATÁLOGO</span><h2>Soluciones visuales</h2><button onClick={() => go('/catalogo')}>Ver todo →</button></div>
        <div className="product-grid">
          {sampleProducts.slice(0, 3).map((product) => <HtmlSlot key={product.title} slotId="CATALOG.PRODUCT.CARD" html={productCardHtml(product)} />)}
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

function Services() {
  const services = [
    ['Rotulación', 'Letras corpóreas, cajas de luz, rótulos bandera, tótems y soluciones especiales.'],
    ['Impresión', 'Vinil, microperforado, lonas, gráficos y aplicaciones de gran formato.'],
    ['Fachadas', 'ACM, volumen, iluminación, revestimientos y renovación visual.'],
    ['Exhibición', 'Muebles, exhibidores, stands y piezas comerciales a medida.'],
    ['Señalización', 'Sistemas informativos, direccionales y corporativos.'],
    ['Producción especial', 'CNC, láser, acrílico, PVC, estructuras y combinaciones personalizadas.']
  ];
  return <section className="page section-pad"><span className="kicker">SERVICIOS</span><h1>Fabricamos comunicación visual.</h1><p className="lead">Una sola operación para diseñar, producir e instalar proyectos visuales.</p><div className="info-grid">{services.map(([t, d], i) => <article key={t}><span>0{i + 1}</span><h2>{t}</h2><p>{d}</p></article>)}</div></section>;
}

function Catalog() {
  return <section className="page section-pad"><div className="section-heading"><div><span className="kicker">CATÁLOGO HTML</span><h1>Productos y soluciones</h1></div><p>Cada ficha que ves abajo es un módulo HTML completo alojado dentro de su slot.</p></div><div className="product-grid catalog-grid">{sampleProducts.map((product) => <HtmlSlot key={product.title} slotId="CATALOG.PRODUCT.CARD" html={productCardHtml(product)} />)}</div></section>;
}

function Portfolio() {
  return <section className="page section-pad"><span className="kicker">PORTAFOLIO</span><h1>Trabajo que habla por la marca.</h1><p className="lead">Este espacio quedará alimentado desde Biblioteca con proyectos reales aprobados.</p><div className="portfolio-grid">{['Fachadas', 'Retail', 'Rotulación', 'Interiores'].map((x, i) => <article key={x}><div className={`portfolio-art art-${i + 1}`}></div><span>PROYECTOS · {x.toUpperCase()}</span><h2>{x}</h2><p>Módulo preparado para recibir una presentación HTML completa del proyecto.</p></article>)}</div></section>;
}

function Contact() {
  return <section className="page contact-page section-pad"><div><span className="kicker">HABLEMOS</span><h1>Tu próximo proyecto empieza con una conversación.</h1><p className="lead">El formulario y los canales comerciales se conectarán a ELAN ONE para crear prospecto, oportunidad y seguimiento sin duplicar CRM.</p></div><div className="contact-card"><span>FLUJO OBJETIVO</span><strong>Consulta → ELAN ONE → vendedor → cotización → seguimiento</strong><p>En LAB no estamos enviando datos todavía. La integración se habilitará después de validar Access Core.</p></div></section>;
}

function SellerPortal() {
  const modules = ['Mis prospectos', 'Mis clientes', 'Mis contactos', 'Mis cotizaciones', 'Mis seguimientos', 'Mis oportunidades', 'Mis pedidos', 'Mis comisiones'];
  return <section className="seller-page section-pad"><div className="seller-hero"><div><span className="kicker">PORTAL VENDEDOR</span><h1>ELANVISUAL para vender.<br />ELAN ONE para operar.</h1><p>Esta interfaz no tendrá un CRM propio. Mostrará al vendedor los datos y acciones autorizadas que provengan de ELAN ONE.</p></div><div className="connection-status"><i></i><span>LAB</span><strong>Integración ELAN ONE pendiente de conexión</strong></div></div><div className="seller-modules">{modules.map((m) => <article key={m}><span>ELAN ONE</span><h3>{m}</h3><p>Vista preparada para datos centralizados.</p></article>)}</div><div className="seller-login"><div><b>Acceso centralizado</b><p>La autenticación final vendrá de ELAN ONE Access.</p></div><button disabled>Ingresar con ELAN ONE</button></div></section>;
}

function ContentAdminLab() {
  return <section className="page section-pad"><span className="kicker">ADMINISTRACIÓN · LAB</span><h1>Registro de slots HTML</h1><p className="lead">Contrato inicial para que ELAN sepa exactamente dónde publicar cada diseño.</p><div className="slot-table">{Object.entries(SLOT_REGISTRY).map(([id, config]) => <article key={id}><code>{id}</code><div><strong>{config.label}</strong><p>{config.purpose}</p></div><span>{config.kind}</span></article>)}</div></section>;
}

export default function CleanApp() {
  const [route, go] = useRoute();
  useEffect(() => { document.title = 'ELANVISUAL · Comunicación visual'; }, []);
  let page = <Home go={go} />;
  if (route === '/servicios') page = <Services />;
  if (route === '/catalogo') page = <Catalog />;
  if (route === '/portafolio') page = <Portfolio />;
  if (route === '/contacto') page = <Contact />;
  if (route === '/vendedor') page = <SellerPortal />;
  if (route === '/admin-contenido') page = <ContentAdminLab />;
  return <Layout route={route} go={go}>{page}</Layout>;
}
