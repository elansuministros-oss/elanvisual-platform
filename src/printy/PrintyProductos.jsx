const productos = [
  "Rótulo luminoso frontal",
  "Letras PVC + acrílico",
  "Botón circular premium",
  "Jalavista doble cara"
];

export default function PrintyProductos() {
  return (
    <section className="printy-section printy-productos">
      <div className="printy-section-head">
        <h2>Productos populares</h2>
        <button>Ver todos</button>
      </div>

      <div className="printy-productos-grid">
        {productos.map((item) => (
          <article className="printy-producto-card" key={item}>
            <div className="printy-producto-img" />
            <h3>{item}</h3>
            <p>Fabricación bajo medida con materiales reales de taller.</p>
            <button>Cotizar</button>
          </article>
        ))}
      </div>
    </section>
  );
}
