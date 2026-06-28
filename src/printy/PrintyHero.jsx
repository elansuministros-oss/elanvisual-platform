export default function PrintyHero() {
  return (
    <section className="printy-hero">
      <picture className="printy-hero-picture">
        <source
          media="(max-width: 760px)"
          srcSet="https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=900&q=90"
        />
        <img
          src="https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=1800&q=90"
          alt="ELANVISUAL"
        />
      </picture>

      <div className="printy-hero-buttons">
        <a className="printy-hero-btn primary" href="/contacto">
          Cotizar ahora
        </a>
        <a className="printy-hero-btn secondary" href="/printy">
          Ver catálogo
        </a>
      </div>
    </section>
  );
}
