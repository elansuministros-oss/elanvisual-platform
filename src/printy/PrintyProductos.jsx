import { useEffect, useState } from "react";
import { cargarPrintyProductos } from "./data/printyStore";

export default function PrintyProductos() {
  const [productos, setProductos] = useState(cargarPrintyProductos());

  useEffect(() => {
    const actualizar = () => setProductos(cargarPrintyProductos());
    window.addEventListener("printy-data-updated", actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener("printy-data-updated", actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  return (
    <section className="printy-store">
      <div className="printy-store-toolbar">
        <div className="printy-filter-group">
          <span>FILTRAR:</span>
          <select><option>Disponibilidad</option></select>
          <select><option>Precio</option></select>
        </div>

        <div className="printy-sort-group">
          <span>ORDENAR POR:</span>
          <select><option>Más vendidos</option></select>
          <small>{productos.length} productos</small>
        </div>
      </div>

      <div className="printy-store-grid">
        {productos.map((producto) => (
          <article className="printy-store-card" key={producto.nombre}>
            <div className="printy-store-image-wrap">
              <img src={producto.imagen} alt={producto.nombre} />
              {producto.oferta && <span>Oferta</span>}
            </div>

            <div className="printy-store-info">
              <h3>{producto.nombre}</h3>
              {producto.subtitulo && <p>{producto.subtitulo}</p>}
              {producto.precioAnterior && <del>{producto.precioAnterior}</del>}
              <strong>{producto.precio}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
