import { useEffect, useState } from 'react';
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

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [open]);

  return (
    <div className="public-app">
      <header className="public-header">
        <div className="public-header-inner">
          <NavLink to="/" className="brand-mark" onClick={closeMenu}>
            <span className="brand-main">ELANVISUAL</span>
            <span className="brand-sub">Rotulación & Producción</span>
          </NavLink>

          <nav className="public-nav" aria-label="Navegación pública">
            {publicLinks.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}

            <NavLink to="/login" className="public-login-link">
              Acceso
            </NavLink>
          </nav>

          <button
            type="button"
            className="public-menu-button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {open && (
        <div className="public-mobile-layer">
          <button
            type="button"
            className="public-mobile-backdrop"
            aria-label="Cerrar menú"
            onClick={closeMenu}
          />

          <nav className="public-mobile-menu" aria-label="Menú móvil">
            <div className="mobile-menu-head">
              <strong>Menú</strong>
              <span>ELANVISUAL</span>
            </div>

            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}

            <NavLink to="/login" onClick={closeMenu} className="mobile-login-link">
              Acceso / Admin
            </NavLink>
          </nav>
        </div>
      )}

      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}