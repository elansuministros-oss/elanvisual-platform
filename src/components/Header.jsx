import React, { useState } from 'react';
import {
  Building2,
  Menu,
  X,
  Home,
  Users,
  HandCoins,
  Factory,
  PackageSearch,
  WalletCards,
  BarChart3,
  Settings,
  LogIn,
  LogOut,
} from 'lucide-react';
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

  const links = [
    ['home', 'Dashboard', <Home size={24} />],
    ['crm', 'CRM', <Users size={24} />],
    ['ventas', 'Ventas', <HandCoins size={24} />],
    ['produccion', 'Producción', <Factory size={24} />],
    ['inventario', 'Inventario', <PackageSearch size={24} />],
    ['finanzas', 'Finanzas', <WalletCards size={24} />],
    ['reportes', 'Reportes', <BarChart3 size={24} />],
    ['admin', 'Admin', <Settings size={24} />],
  ];

  const brandName = configuracion.logoTexto || configuracion.nombreSitio || 'ELANVISUAL';

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
              <Building2 size={24} />
            </span>
            <strong>{brandName}</strong>
          </div>

          <button
            type="button"
            className="mobile-menu-btn app-menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X size={42} /> : <Menu size={42} />}
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
                  <LogOut size={24} />
                  <span>Salir</span>
                </button>
              ) : (
                <button type="button" onClick={() => go('login')}>
                  <LogIn size={24} />
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