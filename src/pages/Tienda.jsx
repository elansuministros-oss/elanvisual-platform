import React, { useMemo, useState } from 'react';
import { PackageSearch, Search, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';

const moneyUSD = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const texto = (value) => String(value || '').trim();

export default function Tienda({ setPage }) {
  const { productos = [], agregar, carrito = [] } = useApp();
  const [busqueda, setBusqueda] = useState('');

  const productosTienda = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    return productos
      .filter((producto) => producto?.activo !== false)
      .map((producto) => ({
        ...producto,
        id: producto.id || producto.codigo || producto.nombre,
        nombre: texto(producto.nombre) || 'Producto ELANVISUAL',
        descripcion: texto(producto.descripcion) || 'Producto disponible para compra.',
        categoria: texto(producto.categoria) || 'Producto',
        imagen: texto(producto.imagen) || texto(producto.url) || '/productos/portada-visual.png',
        precio: Number(producto.precio || producto.precioUSD || producto.precio_usd || 0),
      }))
      .filter((producto) => {
        if (!q) return true;

        return `${producto.nombre} ${producto.descripcion} ${producto.categoria} ${producto.codigo || ''}`
          .toLowerCase()
          .includes(q);
      });
  }, [productos, busqueda]);

  const cantidadCarrito = carrito.reduce(
    (acc, item) => acc + Number(item?.cantidad || 1),
    0
  );

  const agregarAlCarrito = (producto) => {
    if (typeof agregar === 'function') {
      agregar(producto);
    }
  };

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <div>
          <span className="badge">ELANVISUAL · Tienda</span>
          <h1>Productos listos para comprar</h1>
          <p>
            Productos registrados con precio en USD. Esta sección usa la misma base de productos
            del cotizador y del carrito.
          </p>
        </div>

        <aside className="cart-summary-mini">
          <b>Carrito</b>
          <span>{cantidadCarrito} producto(s)</span>
          <strong>Pago por transferencia</strong>
        </aside>
      </section>

      <section className="catalog-tools">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar producto, medida o categoría..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>

        <button type="button" className="filter-label" onClick={() => setPage?.('carrito')}>
          <ShoppingCart size={18} />
          Ver carrito
        </button>
      </section>

      <div className="product-grid">
        {productosTienda.map((producto) => (
          <article className="product-card" key={producto.id}>
            <div className="product-image-wrap">
              <img
                className="product-image"
                src={producto.imagen}
                alt={producto.nombre}
                loading="lazy"
              />
              {producto.etiqueta ? (
                <span className="product-tag">{producto.etiqueta}</span>
              ) : null}
            </div>

            <div className="product-body">
              <small>{producto.categoria}</small>
              <h3>{producto.nombre}</h3>
              <p>{producto.descripcion}</p>

              <div className="product-footer">
                <strong className="price">
                  {producto.precio > 0 ? moneyUSD(producto.precio) : 'Consultar'}
                </strong>

                <button type="button" onClick={() => agregarAlCarrito(producto)}>
                  <PackageSearch size={16} />
                  Agregar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {productosTienda.length === 0 && (
        <section className="panel empty-catalog">
          <h2>No hay productos disponibles</h2>
          <p className="note">Agregá productos activos desde el panel administrativo.</p>
        </section>
      )}
    </main>
  );
}