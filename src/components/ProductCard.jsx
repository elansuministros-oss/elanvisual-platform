import React from 'react';
import { ShoppingCart, Ruler } from 'lucide-react';
import { formatoC$ } from '../lib/calculos';
import { useApp } from '../context/AppContext';

export default function ProductCard({ p }) {
  const { agregar } = useApp();

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={p.imagen} alt={p.nombre} className="product-image" />
        <span className="product-tag">{p.etiqueta}</span>
      </div>

      <div className="product-body">
        <small>{p.categoria}</small>
        <h3>{p.nombre}</h3>
        <p>{p.descripcion}</p>
        <div className="measure"><Ruler size={16} /> {p.medidas}</div>
        <div className="product-footer">
          <span className="price">{formatoC$(p.precio)}</span>
          <button onClick={() => agregar(p)}><ShoppingCart size={16} /> Agregar</button>
        </div>
      </div>
    </article>
  );
}
