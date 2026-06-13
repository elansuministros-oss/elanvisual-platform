import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useElan } from '../core/context/ElanContext.jsx';

export function PublicLayout() {
  const { carrito } = useElan();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <style>
        {`
          .elan-public-header .elan-menu-mobile {
            display: none !important;
          }

          .elan-public-header nav a {
            font-size: inherit !important;
            padding: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
          }

          @media (max-width: 850px) {
            .elan-public-header {
              min-height: 130px !important;
              padding: 18px 14px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
            }

            .elan-public-header .brand {
              font-size: 18px !important;
              letter-spacing: .08em !important;
              max-width: 52% !important;
              white-space: nowrap !important;
            }

            .elan-public-header .elan-menu-mobile {
              width: 96px !important;
              height: 96px !important;
              min-width: 96px !important;
              min-height: 96px !important;
              max-width: 96px !important;
              max-height: 96px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 0 !important;
              border-radius: 22px !important;
              border: 2px solid rgba(216,168,79,.85) !important;
              background: #101826 !important;
              color: #d8a84f !important;
              font-size: 68px !important;
              line-height: 1 !important;
              font-weight: 950 !important;
              cursor: pointer !important;
              flex-shrink: 0 !important;
              z-index: 9999 !important;
            }

            .elan-public-header .elan-menu-mobile span {
              display: block !important;
              transform: translateY(-4px) !important;
            }

            .elan-public-header nav {
              position: absolute !important;
              top: 130px !important;
              left: 0 !important;
              right: 0 !important;
              z-index: 9998 !important;
              display: none !important;
              flex-direction: column !important;
              gap: 0 !important;
              padding: 18px !important;
              background: rgba(16,24,38,.98) !important;
              border-top: 1px solid rgba(216,168,79,.35) !important;
            }

            .elan-public-header nav.open {
              display: flex !important;
            }

            .elan-public-header nav a {
              display: block !important;
              width: 100% !important;
              font-size: 32px !important;
              line-height: 1.15 !important;
              font-weight: 850 !important;
              padding: 22px 18px !important;
              color: #ffffff !important;
              border-bottom: 1px solid rgba(255,255,255,.08) !important;
            }

            .elan-public-header nav a.cart {
              font-size: 34px !important;
              color: #d8a84f !important;
            }
          }
        `}
      </style>

      <header className="topbar public elan-public-header">
        <Link className="brand" to="/" onClick={cerrarMenu}>
          ✣ ELANVISUAL
        </Link>

        <button
          type="button"
          className={`elan-menu-mobile ${menuAbierto ? 'active' : ''}`}
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          <span aria-hidden="true">{menuAbierto ? '×' : '☰'}</span>
        </button>

        <nav className={menuAbierto ? 'open' : ''}>
          <NavLink to="/" onClick={cerrarMenu}>Inicio</NavLink>
          <NavLink to="/catalogo" onClick={cerrarMenu}>Catálogo</NavLink>
          <NavLink to="/showroom" onClick={cerrarMenu}>Showroom</NavLink>
          <NavLink to="/nosotros" onClick={cerrarMenu}>Nosotros</NavLink>
          <NavLink to="/contacto" onClick={cerrarMenu}>Contacto</NavLink>

          <NavLink className="cart" to="/carrito" onClick={cerrarMenu}>
            🛒 {carrito.length}
          </NavLink>

          <NavLink to="/login" onClick={cerrarMenu}>Login</NavLink>
        </nav>
      </header>

      <Outlet />

      <footer className="footer">
        ELANVISUAL · Rotulación, impresión y proyectos visuales · Nicaragua
      </footer>
    </>
  );
}

const admin = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Catálogo', to: '/admin/catalogo' },
  { label: 'Productos', to: '/admin/productos' },
  { label: 'Categorías', to: '/admin/categorias' },
  { label: 'Materiales', to: '/admin/materiales' },
  { label: 'Inventario', to: '/admin/inventario' },
  { label: 'Consumo Materiales', to: '/admin/consumo-materiales' },
  { label: 'Lista Costos', to: '/admin/lista-costos' },
  { label: 'Fórmulas Costo', to: '/admin/formulas-costo' },
  { label: 'Clientes', to: '/admin/clientes' },
  { label: 'Leads', to: '/admin/leads' },
  { label: 'Seguimiento CRM', to: '/admin/seguimiento' },
  { label: 'Cotizador Interno', to: '/admin/cotizador-interno' },
  { label: 'Cotizaciones', to: '/admin/cotizaciones' },
  { label: 'Pedidos', to: '/admin/pedidos' },
  { label: 'Pagos', to: '/admin/pagos' },
  { label: 'Órdenes Trabajo', to: '/admin/ordenes-trabajo' },
  { label: 'Producción', to: '/admin/produccion' },
  { label: 'Proveedores', to: '/admin/proveedores' },
  { label: 'Vendedores', to: '/admin/vendedores' },
  { label: 'Comisiones', to: '/admin/comisiones' },
  { label: 'Multimedia', to: '/admin/multimedia' },
  { label: 'Banners', to: '/admin/banners' },
  { label: 'Showroom', to: '/admin/showroom' },
  { label: 'Usuarios', to: '/admin/usuarios' },
  { label: 'Configuración', to: '/admin/configuracion' },
  { label: 'CRM Central', to: '/admin/crm-central' },
];

export function AdminLayout() {
  const { logout } = useElan();
  const nav = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand adminbrand" to="/admin">✣ ELANVISUAL</Link>

        {admin.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
            {item.label}
          </NavLink>
        ))}

        <button onClick={() => { logout(); nav('/'); }}>Salir</button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function VendorLayout() {
  const { logout } = useElan();
  const nav = useNavigate();

  const items = [
    { label: 'Dashboard', to: '/vendedor-panel' },
    { label: 'QR', to: '/vendedor-panel/qr' },
    { label: 'Clientes', to: '/vendedor-panel/clientes' },
    { label: 'Leads', to: '/vendedor-panel/leads' },
    { label: 'Cotizador Interno', to: '/vendedor-panel/cotizador-interno' },
    { label: 'Cotizaciones', to: '/vendedor-panel/cotizaciones' },
    { label: 'Pedidos', to: '/vendedor-panel/pedidos' },
    { label: 'Comisiones', to: '/vendedor-panel/comisiones' },
    { label: 'Perfil', to: '/vendedor-panel/perfil' },
  ];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand adminbrand" to="/vendedor-panel">VENTAS</Link>

        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/vendedor-panel'}>
            {item.label}
          </NavLink>
        ))}

        <button onClick={() => { logout(); nav('/'); }}>Salir</button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function ProductionLayout() {
  const { logout } = useElan();
  const nav = useNavigate();

  const items = [
    { label: 'Dashboard', to: '/produccion' },
    { label: 'Órdenes Trabajo', to: '/produccion/ordenes-trabajo' },
    { label: 'Producción', to: '/produccion/procesos' },
    { label: 'Consumo Materiales', to: '/produccion/consumo-materiales' },
    { label: 'Entregas / Instalaciones', to: '/produccion/entregas' },
  ];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand adminbrand" to="/produccion">PRODUCCIÓN</Link>

        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/produccion'}>
            {item.label}
          </NavLink>
        ))}

        <button onClick={() => { logout(); nav('/'); }}>Salir</button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}