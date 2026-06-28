const productos = [
  {
    nombre: "Hello Mini",
    precio: "$ 620.00 MXN",
    imagen: "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=80",
  },
  {
    nombre: "Love Mini",
    precio: "$ 599.00 MXN",
    imagen: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80",
  },
  {
    nombre: "Nails Beauty Salon",
    subtitulo: "Decoración cálida para salón de uñas",
    precioAnterior: "$ 900.00 MXN",
    precio: "$ 530.00 MXN",
    oferta: true,
    imagen: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
  },
  {
    nombre: "Lashes Beauty Salon",
    subtitulo: "Decoración cálida",
    precioAnterior: "$ 900.00 MXN",
    precio: "$ 525.00 MXN",
    oferta: true,
    imagen: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
  },
  {
    nombre: "OPEN",
    precio: "$ 599.00 MXN",
    imagen: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=80",
  },
];

export default function PrintyProductos() {
  return (
    <section className="printy-store">
      <div className="printy-store-toolbar">
        <div className="printy-filter-group">
          <span>FILTRAR:</span>
          <select>
            <option>Disponibilidad</option>
            <option>En existencia</option>
            <option>Por encargo</option>
          </select>
          <select>
            <option>Precio</option>
            <option>Menor a mayor</option>
            <option>Mayor a menor</option>
          </select>
        </div>

        <div className="printy-sort-group">
          <span>ORDENAR POR:</span>
          <select>
            <option>Más vendidos</option>
            <option>Más relevantes</option>
            <option>Alfabéticamente, A-Z</option>
            <option>Precio, menor a mayor</option>
            <option>Precio, mayor a menor</option>
          </select>
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
              {producto.precioAnterior && (
                <del>{producto.precioAnterior}</del>
              )}
              <strong>{producto.precio}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
