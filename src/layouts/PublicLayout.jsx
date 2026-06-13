import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/showroom', label: 'Showroom' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/carrito', label: 'Carrito' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <div className="public-app">
      <header className="public-header">
        <div className="public-header-inner">
          <NavLink to="/" className="brand-mark" onClick={closeMenu}>
            <span className="brand-main">ELANVISUAL</span>
            <span className="brand-sub">Rotulación & Producción</span>
          </NavLink>

          <nav className="public-nav">
            {publicLinks.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="public-menu-button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>
      </header>

      {open && (
        <nav className="public-mobile-menu">
          {publicLinks.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeMenu}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}