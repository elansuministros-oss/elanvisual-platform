const categorias = [
  "Letreros luminosos",
  "Letras 3D",
  "Botones acrílicos",
  "Jalavistas",
  "Vinil impreso",
  "Displays"
];

export default function PrintyCategorias() {
  return (
    <section className="printy-section">
      <h2>Categorías destacadas</h2>
      <div className="printy-categorias-grid">
        {categorias.map((item) => (
          <article className="printy-categoria-card" key={item}>
            <div className="printy-categoria-img" />
            <h3>{item}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
