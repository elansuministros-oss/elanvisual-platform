import React, { useState } from 'react';
import {
  Building2,
  Menu,
  X,
  Home,
  BriefcaseBusiness,
  ShoppingCart,
  ClipboardList,
  Phone,
  LogIn,
  LogOut,
  Users,
  Factory,
  PackageSearch,
  WalletCards,
  BarChart3,
  Settings,
  LayoutDashboard,
  Palette,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import '../styles/header-dropdown.css';

export default function Header({ page, setPage }) {
  const { usuario, logout, configuracion } = useApp();
  const [open, setOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);

  const go = (p) => {
    setPage(p);
    setOpen(false);
    setDesktopMenuOpen(false);
  };

  const salir = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (error) {
      console.error('Error cerrando sesión de Supabase:', error);
    } finally {
      logout();
      go('home');
    }
  };

  const brandName = configuracion.logoTexto || configuracion.nombreSitio || 'ELANVISUAL';
  const rol = usuario?.rol;

  const publicLinks = [
    ['home', 'Inicio', <Home size={24} />],
    ['servicios', 'Servicios', <BriefcaseBusiness size={24} />],
    ['tienda', 'Tienda', <PackageSearch size={24} />],
    ['disenoPortal', 'Diseño', <Palette size={24} />],
    ['carrito', 'Carrito', <ShoppingCart size={24} />],
    ['seguimiento', 'Seguimiento', <ClipboardList size={24} />],
    ['contacto', 'Contacto', <Phone size={24} />],
  ];

  const adminLinks = [
    ['dashboard', 'Dashboard', <LayoutDashboard size={24} />],
    ['crm', 'CRM', <Users size={24} />],
    ['solicitudesAI', 'Solicitudes Diseño', <Palette size={24} />],
    ['cotizador', 'Nueva cotización', <Calculator size={24} />],
    ['vqsCenter', 'Cotizaciones', <ClipboardList size={24} />],
    ['pedidos', 'Pedidos', <ClipboardList size={24} />],
    ['produccion', 'Producción', <Factory size={24} />],
    ['materiales', 'Inventario', <PackageSearch size={24} />],
    ['proveedores', 'Proveedores', <Users size={24} />],
    ['finanzas', 'Finanzas', <WalletCards size={24} />],
    ['reportes', 'Reportes', <BarChart3 size={24} />],
    ['admin', 'Administración', <Settings size={24} />],
  ];

  const ventasLinks = [
    ['aiStudio', 'AI', <Palette size={24} />],
    ['cotizador', 'Nueva cotización', <Calculator size={24} />],
    ['vqsCenter', 'Cotizaciones', <ClipboardList size={24} />],
    ['cotizacionesInteligentes', 'Cotizaciones anteriores', <ClipboardList size={24} />],
    ['pedidos', 'Pedidos', <ClipboardList size={24} />],
    ['miCuenta', 'Cuenta', <Users size={24} />],
  ];

  const produccionLinks = [
    ['pedidos', 'Pedidos / OT', <ClipboardList size={24} />],
    ['produccion', 'Producción', <Factory size={24} />],
  ];

  const links = !usuario
    ? publicLinks
    : rol === 'admin'
      ? adminLinks
      : rol === 'produccion'
        ? produccionLinks
        : ventasLinks;

  const primaryKeys = rol === 'admin'
    ? ['dashboard', 'cotizador', 'vqsCenter']
    : rol === 'produccion'
      ? ['pedidos', 'produccion']
      : usuario
        ? ['cotizador', 'vqsCenter', 'pedidos']
        : links.map(([key]) => key);

  const primaryLinks = links.filter(([key]) => primaryKeys.includes(key));
  const dropdownLinks = links.filter(([key]) => !primaryKeys.includes(key));
  const dropdownHasActivePage = dropdownLinks.some(([key]) => key === page);

  return (
    <>
      <header className="desktop-header app-desktop-header">
        <div className="brand" onClick={() => go(usuario ? 'dashboard' : 'home')}>
          <img src="/assets/branding/elanvisual.svg" alt={brandName} className="brand-logo-img brand-logo-desktop" />
        </div>

        <nav className="desktop-nav app-desktop-nav desktop-nav-compact">
          <div className="desktop-nav-primary">
            {primaryLinks.map(([key, label]) => (
              <button key={key} type="button" className={page === key ? 'nav-active' : ''} onClick={() => go(key)}>{label}</button>
            ))}
          </div>

          {dropdownLinks.length > 0 && (
            <div className="desktop-menu-wrap">
              <button
                type="button"
                className={`desktop-menu-trigger ${desktopMenuOpen ? 'is-open' : ''} ${dropdownHasActivePage ? 'has-active-section' : ''}`}
                onClick={() => setDesktopMenuOpen((current) => !current)}
                aria-expanded={desktopMenuOpen}
                aria-haspopup="menu"
              >
                Menú <ChevronDown size={18} />
              </button>

              {desktopMenuOpen && (
                <div className="desktop-menu-dropdown" role="menu">
                  {dropdownLinks.map(([key, label, icon]) => (
                    <button key={key} type="button" role="menuitem" className={page === key ? 'nav-active' : ''} onClick={() => go(key)}>
                      {icon}<span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {usuario ? (
            <button type="button" className="desktop-logout-button" onClick={salir}>Salir</button>
          ) : (
            <button type="button" onClick={() => go('login')}>Acceso Interno</button>
          )}
        </nav>
      </header>

      <header className="mobile-header app-mobile-header">
        <div className="mobile-bar app-mobile-bar">
          <div className="brand" onClick={() => go(usuario ? 'dashboard' : 'home')}>
            <img src="/assets/branding/elanvisual-isotipo.svg" alt={brandName} className="brand-logo-img brand-logo-mobile" />
          </div>

          {usuario && <button type="button" className="mobile-logout-fixed" onClick={salir}>Salir</button>}

          <button type="button" className="mobile-menu-btn app-menu-btn" onClick={() => setOpen(!open)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
            {open ? <X size={42} /> : <Menu size={42} />}
          </button>
        </div>

        {open && (
          <div className="app-menu-overlay">
            <nav className="mobile-nav app-mobile-nav">
              {links.map(([key, label, icon]) => (
                <button key={key} type="button" className={page === key ? 'nav-active' : ''} onClick={() => go(key)}>
                  {icon}<span>{label}</span>
                </button>
              ))}

              {usuario ? (
                <button type="button" onClick={salir}><LogOut size={24} /><span>Salir</span></button>
              ) : (
                <button type="button" onClick={() => go('login')}><LogIn size={24} /><span>Acceso Interno</span></button>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
