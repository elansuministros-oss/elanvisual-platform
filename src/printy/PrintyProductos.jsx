const productos = [
  "Letreros luminosos",
  "Letras 3D",
  "Botones acrilicos",
  "Jalavistas",
  "Vinil impreso",
  "Displays",
  "Senalizacion",
  "Exhibidores"
];

export default function PrintyProductos() {
  return (
    <section className="printy-products" id="productos">
      <div className="printy-section-head">
        <span>Catalogo</span>
        <h2>Productos destacados</h2>
      </div>

      <div className="printy-grid">
        {productos.map((item) => (
          <article className="printy-card" key={item}>
            <div className="printy-card-image" />
            <h3>{item}</h3>
            <p>Cotizacion personalizada segun medida, material y acabado.</p>
            <button>Cotizar</button>
          </article>
        ))}
      </div>

      <section className="printy-tracking" id="tracking">
        <div>
          <span>Tracking</span>
          <h2>Consulta el estado de tu pedido</h2>
          <p>Ingresa tu codigo de orden para revisar avance, produccion y entrega.</p>
        </div>
        <form>
          <input placeholder="Codigo de pedido" />
          <button type="button">Buscar</button>
        </form>
      </section>
    </section>
  );
}
