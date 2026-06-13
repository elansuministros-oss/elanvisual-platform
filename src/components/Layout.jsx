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

          @media (max-width: 1100px) {
            .elan-public-header {
              min-height: 96px !important;
              padding: 14px 16px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
            }

            .elan-public-header .brand {
              font-size: 22px !important;
              font-weight: 900 !important;
              letter-spacing: .06em !important;
            }

            .elan-public-header .elan-menu-mobile {
              width: 76px !important;
              height: 76px !important;
              min-width: 76px !important;
              min-height: 76px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 22px !important;
              border: 2px solid rgba(216,168,79,.85) !important;
              background: #101826 !important;
              color: #ffffff !important;
              font-size: 48px !important;
              font-weight: 950 !important;
              line-height: 1 !important;
              padding: 0 !important;
              z-index: 9999 !important;
            }

            .elan-public-header nav {
              position: absolute !important;
              top: 96px !important;
              left: 0 !important;
              right: 0 !important;
              z-index: 9998 !important;
              display: none !important;
              flex-direction: column !important;
              gap: 12px !important;
              padding: 16px !important;
              background: rgba(12,14,20,.98) !important;
            }

            .elan-public-header nav.open {
              display: flex !important;
            }

            .elan-public-header nav a {
              display: flex !important;
              align-items: center !important;
              width: 100% !important;
              min-height: 68px !important;
              padding: 18px 22px !important;
              border-radius: 18px !important;
              background: rgba(255,255,255,.08) !important;
              color: #ffffff !important;
              font-size: 26px !important;
              line-height: 1.05 !important;
              font-weight: 900 !important;
              text-decoration: none !important;
            }

            .elan-public-header nav a.cart {
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
          <NavLink className="cart" to="/carrito" onClick={cerrarMenu}>🛒 {carrito.length}</NavLink>
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

const vendor = [
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

const production = [
  { label: 'Dashboard', to: '/produccion' },
  { label: 'Órdenes Trabajo', to: '/produccion/ordenes-trabajo' },
  { label: 'Producción', to: '/produccion/procesos' },
  { label: 'Consumo Materiales', to: '/produccion/consumo-materiales' },
  { label: 'Entregas / Instalaciones', to: '/produccion/entregas' },
];

function AppPanelLayout({ brand, homeTo, items }) {
  const { logout } = useElan();
  const nav = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  const salir = () => {
    logout();
    nav('/');
  };

  return (
    <>
      <style>
        {`
          .app-shell {
            min-height: 100vh;
            background: #202224;
          }

          .app-mobile-topbar {
            display: none;
          }

          .app-menu-backdrop {
            display: none;
          }

          .app-layout {
            display: flex;
            min-height: 100vh;
          }

          .app-sidebar {
            width: 280px;
            flex: 0 0 280px;
            min-height: 100vh;
            background: #101826;
            padding: 24px 18px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .app-sidebar .brand {
            margin-bottom: 20px;
            color: #ffffff;
            font-size: 18px;
            font-weight: 950;
            text-decoration: none;
            letter-spacing: .06em;
          }

          .app-sidebar a:not(.brand),
          .app-sidebar button {
            min-height: 42px;
            display: flex;
            align-items: center;
            border-radius: 12px;
            padding: 10px 14px;
            border: 0;
            background: transparent;
            color: #cbd5e1;
            font-size: 15px;
            font-weight: 750;
            text-align: left;
            text-decoration: none;
            cursor: pointer;
          }

          .app-sidebar a.active {
            background: #223047;
            color: #ffffff;
          }

          .app-sidebar button {
            margin-top: 10px;
            color: #ffffff;
            font-weight: 900;
          }

          .app-main {
            flex: 1;
            min-width: 0;
            padding: 28px;
          }

          @media (max-width: 900px) {
            html,
            body,
            #root {
              width: 100%;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .admin-shell,
            .app-shell,
            .app-layout {
              width: 100%;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .app-shell {
              background: #202224;
              padding-top: 84px;
            }

            .app-mobile-topbar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              z-index: 10000;
              min-height: 84px;
              padding: 12px 14px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #101826;
              border-bottom: 1px solid rgba(255,255,255,.08);
            }

            .app-mobile-brand {
              color: #ffffff;
              font-size: 20px;
              font-weight: 950;
              letter-spacing: .05em;
              text-decoration: none;
            }

            .app-mobile-menu-btn {
              width: 62px;
              height: 62px;
              min-width: 62px;
              min-height: 62px;
              border-radius: 18px;
              border: 1px solid rgba(216,168,79,.75);
              background: #172033;
              color: #ffffff;
              font-size: 34px;
              font-weight: 950;
              line-height: 1;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }

            .app-layout {
              display: block;
              min-height: auto;
            }

            .app-menu-backdrop {
              position: fixed;
              inset: 0;
              z-index: 10001;
              display: none;
              background: rgba(0,0,0,.62);
            }

            .app-menu-backdrop.open {
              display: block;
            }

            .app-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              z-index: 10002;
              width: min(86vw, 360px);
              min-height: 100vh;
              padding: 22px 16px 28px;
              transform: translateX(-105%);
              transition: transform .2s ease;
              overflow-y: auto;
              box-shadow: 18px 0 45px rgba(0,0,0,.35);
            }

            .app-sidebar.open {
              transform: translateX(0);
            }

            .app-sidebar .brand {
              min-height: 54px;
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              font-size: 18px;
            }

            .app-sidebar a:not(.brand),
            .app-sidebar button {
              min-height: 58px;
              border-radius: 16px;
              padding: 14px 16px;
              font-size: 19px;
              font-weight: 900;
            }

            .app-sidebar button {
              width: 100%;
              margin-top: 14px;
              background: rgba(216,168,79,.14);
              color: #ffffff;
            }

            .app-main {
              width: 100%;
              min-width: 0;
              padding: 18px 14px 34px;
            }

            .app-main h1,
            .app-main h2 {
              font-size: 32px !important;
              line-height: 1.1 !important;
              margin-bottom: 14px !important;
            }

            .app-main p,
            .app-main small,
            .app-main span,
            .app-main label {
              font-size: 18px;
              line-height: 1.35;
            }

            .app-main input,
            .app-main select,
            .app-main textarea {
              width: 100%;
              min-height: 58px;
              border-radius: 16px;
              font-size: 19px;
              padding: 12px 14px;
            }

            .app-main button {
              min-height: 56px;
              border-radius: 16px;
              font-size: 18px;
              font-weight: 900;
            }

            .app-main .card,
            .app-main section,
            .app-main article {
              max-width: 100%;
            }

            .app-main .grid,
            .app-main form > div,
            .app-main [style*="grid-template-columns"] {
              grid-template-columns: 1fr !important;
            }

            .app-main table {
              font-size: 18px;
            }

            .app-main .table-wrap {
              overflow-x: auto;
            }
          }
        `}
      </style>

      <div className="app-shell">
        <header className="app-mobile-topbar">
          <Link className="app-mobile-brand" to={homeTo} onClick={cerrarMenu}>
            {brand}
          </Link>

          <button
            type="button"
            className="app-mobile-menu-btn"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuAbierto ? '×' : '☰'}
          </button>
        </header>

        <div
          className={`app-menu-backdrop ${menuAbierto ? 'open' : ''}`}
          onClick={cerrarMenu}
        />

        <div className="app-layout">
          <aside className={`app-sidebar ${menuAbierto ? 'open' : ''}`}>
            <Link className="brand adminbrand" to={homeTo} onClick={cerrarMenu}>
              {brand}
            </Link>

            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === homeTo}
                onClick={cerrarMenu}
              >
                {item.label}
              </NavLink>
            ))}

            <button type="button" onClick={salir}>
              Salir
            </button>
          </aside>

          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export function AdminLayout() {
  return (
    <AppPanelLayout brand="✣ ELANVISUAL" homeTo="/admin" items={admin} />
  );
}

export function VendorLayout() {
  return (
    <AppPanelLayout brand="VENTAS" homeTo="/vendedor-panel" items={vendor} />
  );
}

export function ProductionLayout() {
  return (
    <AppPanelLayout brand="PRODUCCIÓN" homeTo="/produccion" items={production} />
  );
}