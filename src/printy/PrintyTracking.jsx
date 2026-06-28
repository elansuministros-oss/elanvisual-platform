export default function PrintyTracking() {
  return (
    <section className="printy-tracking">
      <div>
        <h2>Seguimiento de pedido</h2>
        <p>Consultá el avance de tu pedido, producción e instalación.</p>
      </div>

      <form>
        <input placeholder="Número de pedido o teléfono" />
        <button type="button">Buscar</button>
      </form>
    </section>
  );
}
