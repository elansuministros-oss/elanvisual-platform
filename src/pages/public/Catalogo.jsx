import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';
import ImageViewer from '../../components/ImageViewer.jsx';

export default function Catalogo() {
  const { state, updateModule } = useElan();

  const [viewer, setViewer] = useState(null);
  const [categoria, setCategoria] = useState('todas');

  const carrito = Array.isArray(state.carrito) ? state.carrito : [];

  const productos = useMemo(() => {
    let lista = (state.productos || []).filter((p) => p.activo);

    if (categoria !== 'todas') {
      lista = lista.filter((p) => p.categoria === categoria);
    }

    return lista;
  }, [state.productos, categoria]);

  const categorias = useMemo(() => {
    const lista = (state.productos || [])
      .map((p) => p.categoria)
      .filter(Boolean);

    return [...new Set(lista)];
  }, [state.productos]);

  const agregarCarrito = (producto) => {
    const existe = carrito.some((item) => item.id === producto.id);

    if (existe) return;

    updateModule('carrito', [
      ...carrito,
      {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        imagen: producto.imagen,
        galeria: producto.galeria || [],
        cantidad: 1,
      },
    ]);
  };

  const estaEnCarrito = (id) => {
    return carrito.some((item) => item.id === id);
  };

  return (
    <main className="page-shell public-page">
      <div className="page-title">
        <p className="eyebrow">Catálogo</p>
        <h1>Productos</h1>
        <p className="muted">Productos y servicios disponibles.</p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="todas">Todas las categorías</option>

          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <Link className="cart-link" to="/carrito">
          Carrito ({carrito.length})
        </Link>
      </div>

      {productos.length === 0 ? (
        <section className="empty-state">
          <h2>No hay productos cargados</h2>
        </section>
      ) : (
        <section className="catalog-grid">
          {productos.map((producto) => {
            const galeria = Array.isArray(producto.galeria)
              ? producto.galeria
              : producto.imagen
                ? [producto.imagen]
                : [];

            const agregado = estaEnCarrito(producto.id);

            return (
              <article className="catalog-card" key={producto.id}>
                {producto.imagen && (
                  <button
                    type="button"
                    onClick={() => setViewer(producto.imagen)}
                    style={{
                      border: 0,
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={producto.imagen} alt={producto.nombre} />
                  </button>
                )}

                <div>
                  <h2>{producto.nombre}</h2>
                  <p>{producto.descripcion}</p>

                  <strong>C$ {producto.precio}</strong>

                  {producto.categoria ? (
                    <small
                      style={{
                        display: 'block',
                        marginTop: '8px',
                      }}
                    >
                      {producto.categoria}
                    </small>
                  ) : null}

                  <button
                    type="button"
                    className="cart-button"
                    onClick={() => agregarCarrito(producto)}
                    disabled={agregado}
                  >
                    {agregado ? 'Agregado al carrito' : 'Agregar al carrito'}
                  </button>
                </div>

                {galeria.length > 1 ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginTop: '10px',
                    }}
                  >
                    {galeria.map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setViewer(img)}
                        style={{
                          width: '70px',
                          height: '70px',
                          padding: 0,
                          border: 0,
                          overflow: 'hidden',
                          borderRadius: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        <img
                          src={img}
                          alt={producto.nombre}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      <ImageViewer image={viewer} open={Boolean(viewer)} onClose={() => setViewer(null)} />
    </main>
  );
}