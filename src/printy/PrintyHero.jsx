export default function PrintyHero() {
  return (
    <section className="printy-hero">
      <div className="printy-hero-content">
        <p className="printy-eyebrow">ELANVISUAL</p>
        <h1>Rotulación, impresión y letreros a medida</h1>
        <p>
          Diseños funcionales, fabricación real y acabados profesionales para negocios,
          oficinas, eventos y espacios comerciales.
        </p>

        <div className="printy-hero-actions">
          <button>Cotizar ahora</button>
          <button className="secondary">Ver catálogo</button>
        </div>
      </div>

      <div className="printy-hero-image">
        <img
          src="https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=1200&q=90"
          alt="Rotulación luminosa ELANVISUAL"
        />

        <a className="printy-floating-btn" href="/contacto">
          Cotizar diseño
        </a>
      </div>
    </section>
  );
}
