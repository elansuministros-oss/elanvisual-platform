import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HorizontalCarousel({ title, subtitle, items = [], renderItem }) {
  const id = React.useId();

  const scroll = (direction) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <section className="app-carousel-section">
      <div className="app-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="app-carousel-actions">
          <button type="button" onClick={() => scroll('left')} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll('right')} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div id={id} className="app-horizontal-scroll">
        {items.map((item, index) => (
          <div className="app-carousel-card" key={item.id || item.titulo || index}>
            {renderItem ? renderItem(item, index) : null}
          </div>
        ))}
      </div>
    </section>
  );
}