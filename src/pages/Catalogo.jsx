import React, { useEffect, useMemo, useState } from 'react';
import { Maximize2, Ruler, Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatoC$ } from '../lib/calculos';

export default function Catalogo() {
  const { productos, resumen, banners, agregar } = useApp();
  const bannerCatalogo = banners.find((b) => b.ubicacion === 'catalogo' && b.activo);
  const cats = ['Todos', ...new Set(productos.map((p) => p.categoria))];
  const [cat, setCat] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const lista = useMemo(() => {
    return productos.filter((p) => {
      const coincideCategoria = cat === 'Todos' || p.categoria === cat;
      const texto = `${p.nombre} ${p.descripcion} ${p.medidas} ${p.categoria}`.toLowerCase();
      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, cat, busqueda]);

  const abrirImagen = (producto) => {
    if (!producto?.imagen) return;
    setImagenAmpliada(producto);
  };

  const cerrarImagen = () => setImagenAmpliada(null);

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') cerrarImagen();
    };

    if (imagenAmpliada) {
      document.body.classList.add('lightbox-open');
      window.addEventListener('keydown', cerrarConEscape);
    }

    return () => {
      document.body.classList.remove('lightbox-open');
      window.removeEventListener('keydown', cerrarConEscape);
    };
  }, [imagenAmpliada]);

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <div>
          <span className="badge">ELAN PET · Catálogo V1</span>
          <h1>Catálogo de muebles para mascotas</h1>
          <p>Casas, camas, comederos, escaleras, organizadores y torres para gatos.</p>
        </div>

        <aside className="cart-summary-mini">
          <b>Carrito actual</b>
          <span>{resumen.cantidad} producto(s)</span>
          <strong>{formatoC$(resumen.total)}</strong>
        </aside>
      </section>

      <section className="catalog-tools">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar producto, medida o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-label">
          <SlidersHorizontal size={18} /> Filtrar por categoría
        </div>
      </section>

      <div className="chips">
        {cats.map((c) => (
          <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {bannerCatalogo && (
        <section className="ad-banner catalog-ad">
          <div>
            <b>{bannerCatalogo.titulo}</b>
            <span>{bannerCatalogo.subtitulo}</span>
          </div>
        </section>
      )}

      <div className="product-grid">
        {lista.map((p) => (
          <article className="product-card" key={p.id}>
            <div className="product-image-wrap">
              <button
                type="button"
                className="product-image-button"
                onClick={() => abrirImagen(p)}
                aria-label={`Ampliar imagen de ${p.nombre}`}
              >
                <img className="product-image" src={p.imagen} alt={p.nombre} />
                <span className="product-zoom-badge">
                  <Maximize2 size={15} /> Ampliar
                </span>
              </button>

              {p.etiqueta ? <span className="product-tag">{p.etiqueta}</span> : null}
            </div>

            <div className="product-body">
              <small>{p.categoria}</small>
              <h3>{p.nombre}</h3>
              <p>{p.descripcion}</p>

              <div className="measure">
                <Ruler size={16} />
                {p.medidas}
              </div>

              <div className="product-footer">
                <strong className="price">{formatoC$(p.precio)}</strong>
                <button type="button" onClick={() => agregar(p)}>
                  Agregar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {lista.length === 0 ? (
        <section className="panel empty-catalog">
          <h2>No se encontraron productos</h2>
          <p className="note">Probá con otra categoría o cambiá el texto de búsqueda.</p>
        </section>
      ) : null}

      {imagenAmpliada ? (
        <section className="image-lightbox" onMouseDown={cerrarImagen} role="dialog" aria-modal="true">
          <button type="button" className="image-lightbox-close" onClick={cerrarImagen} aria-label="Cerrar imagen ampliada">
            <X size={28} />
          </button>

          <div className="image-lightbox-content" onMouseDown={(event) => event.stopPropagation()}>
            <img src={imagenAmpliada.imagen} alt={imagenAmpliada.nombre} />
            <div className="image-lightbox-caption">
              <b>{imagenAmpliada.nombre}</b>
              <span>{imagenAmpliada.medidas}</span>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
