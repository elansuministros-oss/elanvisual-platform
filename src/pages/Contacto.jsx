import React from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Contacto() {
  const { configuracion } = useApp();
  return (
    <main>
      <section className="catalog-hero">
        <div><span className="badge">AtenciÃ³n al cliente</span><h1>Consulta tu pedido o solicita informaciÃ³n</h1><p>EscrÃ­benos para confirmar medidas, disponibilidad, tiempos de entrega o seguimiento de tu pedido.</p></div>
        <aside className="cart-summary-mini"><b>{configuracion.nombreSitio}</b><span>{configuracion.slogan}</span></aside>
      </section>
      <section className="cards admin-grid-3">
        <article className="kpi"><MessageCircle /><b>WhatsApp</b><span>{configuracion.whatsapp}</span></article>
        <article className="kpi"><Mail /><b>Correo</b><span>{configuracion.correo}</span></article>
        <article className="kpi"><Phone /><b>AtenciÃ³n</b><span>Pedidos, catÃ¡logo y seguimiento.</span></article>
      </section>
      <section className="panel">
        <h2>Solicitar informaciÃ³n</h2>
        <div className="form-grid"><input placeholder="Nombre" /><input placeholder="WhatsApp" /><input placeholder="Producto o consulta" /><input placeholder="Mensaje" /></div>
        <button><Phone size={17} /> Enviar solicitud</button>
      </section>
    </main>
  );
}

