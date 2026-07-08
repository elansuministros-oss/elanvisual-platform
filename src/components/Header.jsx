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
  FolderKanban,
  Factory,
  PackageSearch,
  WalletCards,
  BarChart3,
  Settings,
  Calculator,
  LayoutDashboard,
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

  const brandName = configuracion.logoTexto || configuracion.nombreSitio || 'ELANVISUAL';
  const rol = usuario?.rol;

  const publicLinks = [
    ['home', 'Inicio', <Home size={24} />],
    ['servicios', 'Servicios', <BriefcaseBusiness size={24} />],
    ['tienda', 'Tienda', <PackageSearch size={24} />],
    ['carrito', 'Carrito', <ShoppingCart size={24} />],
    ['seguimiento', 'Seguimiento', <ClipboardList size={24} />],
['contacto', 'Contacto', <Phone size={24} />],
['whatsapp', 'WhatsApp', <Phone size={24} />],
  ];

  const adminLinks = [
    ['dashboard', 'Dashboard', <LayoutDashboard size={24} />],
    ['crm', 'CRM', <Users size={24} />],
    ['proyectos', 'Proyectos', <FolderKanban size={24} />],
    ['ece', 'ECE', <Calculator size={24} />],
    ['cotizador', 'Cotizador', <Calculator size={24} />],
    ['bibliotecaComercial', 'Biblioteca Comercial', <BriefcaseBusiness size={24} />],
    ['pedidos', 'Pedidos', <ClipboardList size={24} />],
    ['produccion', 'Produccin', <Factory size={24} />],
    ['materiales', 'Inventario', <PackageSearch size={24} />],
    ['proveedores', 'Proveedores', <Users size={24} />],
    ['finanzas', 'Finanzas', <WalletCards size={24} />],
    ['reportes', 'Reportes', <BarChart3 size={24} />],
    ['admin', 'Administracin', <Settings size={24} />],
  ];

 const ventasLinks = [
  ['aiStudio', 'AI', <Calculator size={24} />],
  ['proyectos', 'Proyectos', <FolderKanban size={24} />],
  ['ece', 'ECE', <Calculator size={24} />],
  ['cotizacionesInteligentes', 'Cotizaciones', <ClipboardList size={24} />],
  ['pedidos', 'Pedidos', <ClipboardList size={24} />],
  ['miCuenta', 'Cuenta', <Users size={24} />],
];

  const produccionLinks = [
    ['pedidos', 'Pedidos / OT', <ClipboardList size={24} />],
    ['produccion', 'Produccin', <Factory size={24} />],
  ];

  const links = !usuario
    ? publicLinks
    : rol === 'admin'
      ? adminLinks
      : rol === 'produccion'
        ? produccionLinks
        : ventasLinks;

  return (
    <>
      <header className="desktop-header app-desktop-header">
        <div className="brand" onClick={() => go(usuario ? 'dashboard' : 'home')}>
          <img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" className="brand-logo-img brand-logo-desktop" />

        </div>

        <nav className="desktop-nav app-desktop-nav">
          {links.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={page === key ? 'nav-active' : ''}
onClick={() => {
  if (key === 'whatsapp') {
    trackWhatsAppClick();
  }
  go(key);
}}
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
              Acceso Interno
            </button>
          )}
        </nav>
      </header>

      <header className="mobile-header app-mobile-header">
        <div className="mobile-bar app-mobile-bar">
          <div className="brand" onClick={() => go(usuario ? 'dashboard' : 'home')}>
            <img src="/assets/branding/elanvisual-isotipo.svg" alt="ELANVISUAL" className="brand-logo-img brand-logo-mobile" />
  
          </div>

          {usuario && (
            <button type="button" className="mobile-logout-fixed" onClick={salir}>
              Salir
            </button>
          )}

          <button
            type="button"
            className="mobile-menu-btn app-menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar men' : 'Abrir men'}
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
                  <span>Acceso Interno</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}










