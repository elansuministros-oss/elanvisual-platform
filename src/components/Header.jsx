import React, { useState } from 'react';
import { Building2, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header({ page, setPage }) {
  const { usuario, logout, configuracion } = useApp();
  const [open, setOpen] = useState(false);

  const go = (p) => {
    setPage(p);
    setOpen(false);
  };

  const salir = () => {
    logout();
    go('home');
  };

  const publicLinks = [
    ['home', 'Inicio'],
    ['catalogo', 'Servicios'],
    ['trabajos', 'Portafolio'],
    ['seguimiento', 'Seguimiento'],
    ['contacto', 'Contacto'],
  ];

  const internalLinks = [
    ...(usuario?.rol === 'admin' ? [['crm', 'CRM']] : []),
    ...(usuario?.rol === 'admin' || usuario?.rol === 'produccion'
      ? [['produccion', 'Producción']]
      : []),
  ];

  const links = usuario ? internalLinks : publicLinks;

  const brandName =
    configuracion.logoTexto ||
    configuracion.nombreSitio ||
    'ELANVISUAL';

  return (
    <>
      <header className="desktop-header">
        <div className="brand" onClick={() => go('home')}>
          <span className="brand-mark">
            <Building2 size={20} />
          </span>
          <strong>{brandName}</strong>
        </div>

        <nav className="desktop-nav">
          {links.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={page === key ? 'nav-active' : ''}
              onClick={() => go(key)}
            >
              {label}
            </button>
          ))}

          {usuario ? (
            <button type="button" onClick={salir}>
              Salir
            </button>
          ) : (
            <button type="button" onClick={() => go('login')}>
              Portal
            </button>
          )}
        </nav>
      </header>

      <header className="mobile-header">
        <div className="mobile-bar">
          <div className="brand" onClick={() => go('home')}>
            <span className="brand-mark">
              <Building2 size={18} />
            </span>
            <strong>{brandName}</strong>
          </div>

          <div className="mobile-actions">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            >
              {open ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="mobile-nav">
            {links.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={page === key ? 'nav-active' : ''}
                onClick={() => go(key)}
              >
                {label}
              </button>
            ))}

            {usuario ? (
              <button type="button" onClick={salir}>
                Salir
              </button>
            ) : (
              <button type="button" onClick={() => go('login')}>
                Portal
              </button>
            )}
          </nav>
        )}
      </header>
    </>
  );
}