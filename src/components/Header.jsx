import React, { useState } from 'react';
import { Building2, Menu, X, Home, BriefcaseBusiness, Image, ClipboardList, Phone, LayoutDashboard, Factory } from 'lucide-react';
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
    ['home', 'Inicio', <Home size={22} />],
    ['catalogo', 'Servicios', <BriefcaseBusiness size={22} />],
    ['trabajos', 'Portafolio', <Image size={22} />],
    ['seguimiento', 'Seguimiento', <ClipboardList size={22} />],
    ['contacto', 'Contacto', <Phone size={22} />],
  ];

  const internalLinks = [
    ...(usuario?.rol === 'admin'
      ? [['crm', 'CRM', <LayoutDashboard size={22} />]]
      : []),
    ...(usuario?.rol === 'admin' || usuario?.rol === 'produccion'
      ? [['produccion', 'ProducciÃ³n', <Factory size={22} />]]
      : []),
  ];

  const links = usuario ? internalLinks : publicLinks;

  const brandName =
    configuracion.logoTexto ||
    configuracion.nombreSitio ||
    'ELANVISUAL';

  return (
    <>
      <header className="desktop-header app-desktop-header">
        <div className="brand" onClick={() => go('home')}>
          <span className="brand-mark">
            <Building2 size={22} />
          </span>
          <strong>{brandName}</strong>
        </div>

        <nav className="desktop-nav app-desktop-nav">
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

      <header className="mobile-header app-mobile-header">
        <div className="mobile-bar app-mobile-bar">
          <div className="brand" onClick={() => go('home')}>
            <span className="brand-mark">
              <Building2 size={22} />
            </span>
            <strong>{brandName}</strong>
          </div>

          <button
            type="button"
            className="mobile-menu-btn app-menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X size={38} /> : <Menu size={38} />}
          </button>
        </div>

        {open && (
          <div className="app-menu-overlay">
            <nav className="mobile-nav app-mobile-nav">
              {links.map(([key, label, icon]) => (
                <button
                  key={key}
                  type="button"
                  className={page === key ? 'nav-active' : ''}
                  onClick={() => go(key)}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}

              {usuario ? (
                <button type="button" onClick={salir}>
                  <X size={22} />
                  <span>Salir</span>
                </button>
              ) : (
                <button type="button" onClick={() => go('login')}>
                  <LayoutDashboard size={22} />
                  <span>Portal</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

