import React from 'react';
import { ArrowRight, PawPrint } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LandingVeterinaria({ setPage }) {
  const { veterinaria, configuracion } = useApp();
  return (
    <main className="landing-vet">
      <section className="landing-card catalog-hero vet-public-landing">
        <div>
          <span className="badge"><PawPrint size={15} /> Compra recomendada por</span>
          <h1>{veterinaria.nombre}</h1>
          <p>Bienvenido. Desde este enlace puedes ver productos funcionales para el bienestar de tu mascota. Tu pedido quedará asociado a esta veterinaria para mantener el seguimiento correcto.</p>
          <button onClick={() => setPage('catalogo')}>Ver catálogo <ArrowRight size={17} /></button>
        </div>
        <aside className="cart-summary-mini"><b>{configuracion.nombreSitio}</b><span>{configuracion.slogan}</span></aside>
      </section>
    </main>
  );
}
