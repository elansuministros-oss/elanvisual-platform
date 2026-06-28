import React, { useMemo, useState } from 'react';
import { ArrowLeft, PackageSearch, Search, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';

const moneyUSD = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const texto = (value) => String(value || '').trim();

const slugify = (value) =>
  texto(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const imagenFallback = '/productos/portada-visual.png';

const obtenerImagenCategoria = (categoria = {}) =>
  categoria.imagenDesktop ||
  categoria.imagenRuta ||
  categoria.imagen ||
  categoria.img ||
  categoria.imagenMobile ||
  imagenFallback;

export default function Tienda({ setPage }) {
  const {
    productos = [],
    categoriasHome = [],
    agregar,
    carrito = [],
  } = useApp();

  const [busqueda, setBusqueda] = useState('');

  const slugInicial = (() => {
    const path = window.location.pathname || '/tienda';
    const partes = path.split('/').filter(Boolean);
    return partes[0] === 'tienda' && partes[1] ? partes[1] : '';
  })();

  const [categoriaActiva, setCategoriaActiva] = useState(slugInicial);

  const categoriasOficiales = useMemo(() => {
    return Array.isArray(categoriasHome)
      ? categoriasHome
          .filter((categoria) => categoria?.activo !== false)
          .map((categoria) => ({
            ...categoria,
            id: categoria.id || `cat-${slugify(categoria.nombre || categoria.titulo || 'general')}`,
            nombre: texto(categoria.nombre || categoria.titulo || 'Categoria ELANVISUAL'),
            slug: categoria.slug || slugify(categoria.nombre || categoria.titulo || categoria.id || 'general'),
            imagen: obtenerImagenCategoria(categoria),
            orden: Number(categoria.orden || 999),
          }))
          .filter((categoria) => categoria.slug)
          .sort((a, b) => Number(a.orden || 999) - Number(b.orden || 999))
      : [];
  }, [categoriasHome]);

  const productosNormalizados = useMemo(() => {
    return productos
      .filter((producto) => producto?.activo !== false)
      .map((producto) => {
        const slugCategoria =
          producto.categoriaSlug ||
          producto.slugCategoria ||
          slugify(texto(producto.categoria) || 'general');

        const categoriaOficial = categoriasOficiales.find((cat) => cat.slug === slugCategoria);

        return {
          ...producto,
          id: producto.id || producto.codigo || producto.nombre,
          nombre: texto(producto.nombre) || 'Producto ELANVISUAL',
          descripcion: texto(producto.descripcion) || 'Producto disponible para compra.',
          categoria: categoriaOficial?.nombre || texto(producto.categoria) || 'General',
          categoriaSlug: categoriaOficial?.slug || slugCategoria,
          categoriaHomeId: categoriaOficial?.id || producto.categoriaHomeId || '',
          imagen: texto(producto.imagen) || texto(producto.url) || imagenFallback,
          precio: Number(producto.precio || producto.precioUSD || producto.precio_usd || 0),
        };
      });
  }, [productos, categoriasOficiales]);

  const categorias = useMemo(() => {
    return categoriasOficiales
      .map((categoria) => {
        const productosCategoria = productosNormalizados.filter(
          (producto) => producto.categoriaSlug === categoria.slug
        );

        return {
          ...categoria,
          cantidad: productosCategoria.length,
        };
      })
      .filter((categoria) => categoria.cantidad > 0);
  }, [categoriasOficiales, productosNormalizados]);

  const categoriaSeleccionada = categoriasOficiales.find((item) => item.slug === categoriaActiva);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    return productosNormalizados
      .filter((producto) => !categoriaActiva || producto.categoriaSlug === categoriaActiva)
      .filter((producto) => {
        if (!q) return true;

        return `${producto.nombre} ${producto.descripcion} ${producto.categoria} ${producto.codigo || ''}`
          .toLowerCase()
          .includes(q);
      });
  }, [productosNormalizados, categoriaActiva, busqueda]);

  const cantidadCarrito = carrito.reduce(
    (acc, item) => acc + Number(item?.cantidad || 1),
    0
  );

  const abrirCategoria = (slug) => {
    setCategoriaActiva(slug);
    setBusqueda('');
    window.history.pushState({}, '', `/tienda/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const volverCategorias = () => {
    setCategoriaActiva('');
    setBusqueda('');
    window.history.pushState({}, '', '/tienda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <h1>
            {categoriaActiva
              ? categoriaSeleccionada?.nombre || 'Productos'
              : 'Categorias de productos'}
          </h1>
          <p>
            {categoriaActiva
              ? 'Selecciona el producto que queres cotizar o agregar al carrito.'
              : 'Explora por categoria. Primero elegi el tipo de solucion y luego mira los productos disponibles.'}
          </p>
        </div>

        <aside className="cart-summary-mini">
          <b>Carrito</b>
          <span>{cantidadCarrito} producto(s)</span>
          <strong>Pago por transferencia</strong>
        </aside>
      </section>

      <section className="catalog-tools">
        {categoriaActiva ? (
          <button type="button" className="filter-label" onClick={volverCategorias}>
            <ArrowLeft size={18} />
            Categorias
          </button>
        ) : null}

        {categoriaActiva ? (
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Buscar producto dentro de esta categoria..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        ) : null}

        <button type="button" className="filter-label" onClick={() => setPage?.('carrito')}>
          <ShoppingCart size={18} />
          Ver carrito
        </button>
      </section>

      {!categoriaActiva && (
        <div className="product-grid">
          {categorias.map((categoria) => (
            <button
              type="button"
              className="product-card"
              key={categoria.slug}
              onClick={() => abrirCategoria(categoria.slug)}
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="product-image-wrap">
                <img
                  className="product-image"
                  src={categoria.imagen || imagenFallback}
                  alt={categoria.nombre}
                  loading="lazy"
                />
              </div>

              <div className="product-body">
                <h3>{categoria.nombre}</h3>
                <p>{categoria.cantidad} producto(s)</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoriaActiva && (
        <div className="product-grid">
          {productosFiltrados.map((producto) => (
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
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!categoriaActiva && categorias.length === 0 && (
        <section className="panel empty-catalog">
          <h2>No hay categorias disponibles</h2>
          <p className="note">
            Agrega productos activos y asignales una Categoria Home desde el panel administrativo.
          </p>
        </section>
      )}

      {categoriaActiva && productosFiltrados.length === 0 && (
        <section className="panel empty-catalog">
          <h2>No hay productos disponibles</h2>
          <p className="note">
            Agrega productos activos en esta categoria desde el panel administrativo.
          </p>
        </section>
      )}
    </main>
  );
}