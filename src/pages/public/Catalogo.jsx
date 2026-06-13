import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';

export default function Catalogo() {
  const { categoria } = useParams();
  const {
    categorias = [],
    productos = [],
    agregarCarrito,
    crearLead,
  } = useElan();

  const [visor, setVisor] = useState(null);

  const lista = useMemo(() => {
    if (!categoria) return productos;
    return productos.filter(
      (p) => p.categoria === decodeURIComponent(categoria)
    );
  }, [categoria, productos]);

  const abrirImagen = (producto) => {
    if (!producto?.imagen) return;

    setVisor({
      imagen: producto.imagen,
      titulo: producto.nombre || 'Producto',
    });
  };

  return (
    <main className="container catalogo-page">
      <style>
        {`
          .catalogo-page {
            padding-bottom: 40px;
          }

          .catalogo-page h1 {
            font-size: 42px;
            line-height: 1.05;
            margin-bottom: 18px;
          }

          .catalogo-page .chips {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 24px;
          }

          .catalogo-page .chips a {
            min-height: 46px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 999px;
            font-weight: 900;
            text-decoration: none;
          }

          .catalogo-page .product {
            overflow: hidden;
          }

          .catalogo-img-btn {
            border: 0;
            background: transparent;
            padding: 0;
            width: 100%;
            cursor: zoom-in;
            display: block;
          }

          .catalogo-img-btn img {
            width: 100%;
            display: block;
            object-fit: cover;
          }

          .catalogo-page .product span {
            display: block;
            margin-top: 12px;
            font-weight: 800;
            color: #667085;
          }

          .catalogo-page .product h3 {
            margin: 8px 0;
            line-height: 1.15;
          }

          .catalogo-page .product p {
            font-weight: 900;
            color: #172033;
          }

          .catalogo-page .product button:not(.catalogo-img-btn) {
            width: 100%;
            min-height: 52px;
            border-radius: 14px;
            font-weight: 900;
            cursor: pointer;
          }

          .catalogo-viewer {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(9, 12, 18, .94);
            display: grid;
            place-items: center;
            padding: 16px;
          }

          .catalogo-viewer-box {
            width: min(1100px, 100%);
            display: grid;
            gap: 14px;
          }

          .catalogo-viewer img {
            width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 18px;
            background: #111827;
          }

          .catalogo-viewer button {
            justify-self: end;
            min-height: 56px;
            border-radius: 16px;
            padding: 12px 22px;
            font-size: 18px;
            font-weight: 900;
            cursor: pointer;
          }

          @media (max-width: 760px) {
            .catalogo-page {
              padding: 22px 16px 42px !important;
            }

            .catalogo-page h1 {
              font-size: 44px !important;
            }

            .catalogo-page .chips {
              display: grid;
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .catalogo-page .chips a {
              width: 100%;
              min-height: 64px;
              font-size: 22px;
              border-radius: 18px;
            }

            .catalogo-page .grid.products {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 22px !important;
            }

            .catalogo-page .product {
              border-radius: 24px !important;
              padding: 18px !important;
            }

            .catalogo-img-btn img {
              height: 280px !important;
              border-radius: 20px;
            }

            .catalogo-page .product span {
              font-size: 18px;
            }

            .catalogo-page .product h3 {
              font-size: 30px;
            }

            .catalogo-page .product p {
              font-size: 24px;
            }

            .catalogo-page .product button:not(.catalogo-img-btn) {
              min-height: 66px;
              font-size: 22px;
              border-radius: 18px;
            }

            .catalogo-viewer {
              padding: 10px;
            }

            .catalogo-viewer img {
              max-height: 74vh;
              border-radius: 14px;
            }

            .catalogo-viewer button {
              width: 100%;
              min-height: 64px;
              font-size: 22px;
            }
          }
        `}
      </style>

      <h1>Catálogo</h1>

      <div className="chips">
        {categorias.map((c) => (
          <Link key={c.id} to={`/catalogo/${encodeURIComponent(c.nombre)}`}>
            {c.nombre}
          </Link>
        ))}
      </div>

      <div className="grid products">
        {lista.map((p) => (
          <article className="product" key={p.id}>
            {p.imagen && (
              <button
                type="button"
                className="catalogo-img-btn"
                onClick={() => abrirImagen(p)}
                aria-label={`Ampliar imagen de ${p.nombre}`}
              >
                <img src={p.imagen} alt={p.nombre || 'Producto'} />
              </button>
            )}

            <span>
              {p.categoria || 'Sin categoría'} / {p.subcategoria || 'General'}
            </span>

            <h3>{p.nombre}</h3>

            <p>
              {p.tipo === 'especial'
                ? 'Presupuesto especial'
                : `Desde USD ${p.precioVenta}`}
            </p>

            {p.tipo === 'estandar' ? (
              <button type="button" onClick={() => agregarCarrito(p, 1)}>
                Agregar al Carrito
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  crearLead({
                    producto: p.nombre,
                    cliente: 'Pendiente',
                    observacion: 'Solicitud desde catálogo',
                  });

                  alert('Solicitud creada como lead.');
                }}
              >
                Solicitar Cotización
              </button>
            )}
          </article>
        ))}
      </div>

      {visor && (
        <div className="catalogo-viewer" onClick={() => setVisor(null)}>
          <div
            className="catalogo-viewer-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setVisor(null)}>
              Cerrar imagen
            </button>

            <img src={visor.imagen} alt={visor.titulo} />
          </div>
        </div>
      )}
    </main>
  );
}