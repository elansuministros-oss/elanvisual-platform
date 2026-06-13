import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useElan } from '../core/context/ElanContext.jsx';

export function PublicLayout() {
  const { carrito } = useElan();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <style>{`
        .elan-public-header .elan-menu-mobile { display:none !important; }

        @media (max-width:1100px){
          .elan-public-header{
            min-height:96px !important;
            padding:14px 16px !important;
            display:flex !important;
            align-items:center !important;
            justify-content:space-between !important;
          }

          .elan-public-header .brand{
            font-size:22px !important;
            font-weight:900 !important;
            letter-spacing:.06em !important;
          }

          .elan-public-header .elan-menu-mobile{
            width:76px !important;
            height:76px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            border-radius:22px !important;
            border:2px solid rgba(216,168,79,.85) !important;
            background:#101826 !important;
            color:#fff !important;
            font-size:48px !important;
            font-weight:950 !important;
            z-index:9999 !important;
          }

          .elan-public-header nav{
            position:absolute !important;
            top:96px !important;
            left:0 !important;
            right:0 !important;
            z-index:9998 !important;
            display:none !important;
            flex-direction:column !important;
            gap:12px !important;
            padding:16px !important;
            background:rgba(12,14,20,.98) !important;
          }

          .elan-public-header nav.open{ display:flex !important; }

          .elan-public-header nav a{
            min-height:68px !important;
            padding:18px 22px !important;
            border-radius:18px !important;
            background:rgba(255,255,255,.08) !important;
            color:#fff !important;
            font-size:26px !important;
            font-weight:900 !important;
            text-decoration:none !important;
          }
        }
      `}</style>

      <header className="topbar public elan-public-header">
        <Link className="brand" to="/" onClick={cerrarMenu}>✣ ELANVISUAL</Link>

        <button
          type="button"
          className="elan-menu-mobile"
          onClick={() => setMenuAbierto((prev) => !prev)}
        >
          {menuAbierto ? '×' : '☰'}
        </button>

        <nav className={menuAbierto ? 'open' : ''}>
          <NavLink to="/" onClick={cerrarMenu}>Inicio</NavLink>
          <NavLink to="/catalogo" onClick={cerrarMenu}>Catálogo</NavLink>
          <NavLink to="/showroom" onClick={cerrarMenu}>Showroom</NavLink>
          <NavLink to="/nosotros" onClick={cerrarMenu}>Nosotros</NavLink>
          <NavLink to="/contacto" onClick={cerrarMenu}>Contacto</NavLink>
          <NavLink to="/carrito" onClick={cerrarMenu}>🛒 {carrito.length}</NavLink>
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
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const salir = () => {
    logout();
    nav('/');
  };

  return (
    <>
      <style>{`
        .ev-shell{
          min-height:100vh !important;
          background:#202224 !important;
          color:#e5e7eb !important;
        }

        .ev-layout{
          min-height:100vh !important;
          display:grid !important;
          grid-template-columns:280px minmax(0,1fr) !important;
        }

        .ev-sidebar{
          background:#101826 !important;
          padding:24px 18px !important;
          display:flex !important;
          flex-direction:column !important;
          gap:8px !important;
          min-width:0 !important;
        }

        .ev-brand{
          color:#fff !important;
          font-size:18px !important;
          font-weight:950 !important;
          text-decoration:none !important;
          margin-bottom:16px !important;
          letter-spacing:.06em !important;
        }

        .ev-sidebar a:not(.ev-brand),
        .ev-sidebar button{
          min-height:42px !important;
          border-radius:12px !important;
          padding:10px 14px !important;
          border:0 !important;
          background:transparent !important;
          color:#cbd5e1 !important;
          font-size:15px !important;
          font-weight:800 !important;
          text-decoration:none !important;
          text-align:left !important;
          cursor:pointer !important;
          display:flex !important;
          align-items:center !important;
        }

        .ev-sidebar a.active{
          background:#223047 !important;
          color:#fff !important;
        }

        .ev-sidebar button{
          margin-top:10px !important;
          color:#fff !important;
        }

        .ev-main{
          min-width:0 !important;
          padding:28px !important;
          background:#202224 !important;
        }

        .ev-topbar,
        .ev-backdrop{
          display:none !important;
        }

        @media (max-width:900px){
          html,body,#root{
            width:100% !important;
            min-width:0 !important;
            overflow-x:hidden !important;
          }

          .ev-shell{
            padding-top:82px !important;
            width:100% !important;
            overflow-x:hidden !important;
          }

          .ev-topbar{
            position:fixed !important;
            top:0 !important;
            left:0 !important;
            right:0 !important;
            height:82px !important;
            z-index:30000 !important;
            display:flex !important;
            align-items:center !important;
            justify-content:space-between !important;
            padding:12px 14px !important;
            background:#101826 !important;
            border-bottom:1px solid rgba(255,255,255,.08) !important;
          }

          .ev-topbar a{
            color:#fff !important;
            font-size:20px !important;
            font-weight:950 !important;
            text-decoration:none !important;
          }

          .ev-menu-btn{
            width:62px !important;
            height:62px !important;
            border-radius:18px !important;
            border:1px solid rgba(216,168,79,.75) !important;
            background:#172033 !important;
            color:#fff !important;
            font-size:36px !important;
            font-weight:950 !important;
            display:flex !important;
            align-items:center !important;
            justify-content:center !important;
            z-index:30001 !important;
          }

          .ev-layout{
            display:block !important;
            min-height:auto !important;
          }

          .ev-backdrop{
            position:fixed !important;
            inset:0 !important;
            z-index:30002 !important;
            background:rgba(0,0,0,.64) !important;
          }

          .ev-backdrop.open{
            display:block !important;
          }

          .ev-sidebar{
            position:fixed !important;
            top:0 !important;
            left:0 !important;
            bottom:0 !important;
            z-index:30003 !important;
            width:min(88vw,380px) !important;
            height:100vh !important;
            transform:translateX(-110%) !important;
            transition:transform .22s ease !important;
            overflow-y:auto !important;
            box-shadow:20px 0 45px rgba(0,0,0,.45) !important;
          }

          .ev-sidebar.open{
            transform:translateX(0) !important;
          }

          .ev-brand{
            min-height:62px !important;
            display:flex !important;
            align-items:center !important;
            font-size:20px !important;
          }

          .ev-sidebar a:not(.ev-brand),
          .ev-sidebar button{
            min-height:60px !important;
            border-radius:16px !important;
            padding:14px 16px !important;
            font-size:20px !important;
            font-weight:900 !important;
          }

          .ev-sidebar button{
            width:100% !important;
            background:rgba(216,168,79,.14) !important;
          }

          .ev-main{
            width:100% !important;
            max-width:100% !important;
            padding:18px 14px 34px !important;
            overflow-x:hidden !important;
          }

          .ev-main h1,
          .ev-main h2{
            font-size:32px !important;
            line-height:1.1 !important;
          }

          .ev-main input,
          .ev-main select,
          .ev-main textarea{
            min-height:60px !important;
            font-size:20px !important;
            border-radius:16px !important;
          }

          .ev-main button{
            min-height:58px !important;
            font-size:19px !important;
            border-radius:16px !important;
          }

          .ev-main .grid,
          .ev-main form > div,
          .ev-main [style*="grid-template-columns"]{
            grid-template-columns:1fr !important;
          }
        }
      `}</style>

      <div className="ev-shell">
        <header className="ev-topbar">
          <Link to={homeTo} onClick={close}>{brand}</Link>
          <button className="ev-menu-btn" type="button" onClick={() => setOpen((v) => !v)}>
            {open ? '×' : '☰'}
          </button>
        </header>

        <div className={`ev-backdrop ${open ? 'open' : ''}`} onClick={close} />

        <div className="ev-layout">
          <aside className={`ev-sidebar ${open ? 'open' : ''}`}>
            <Link className="ev-brand" to={homeTo} onClick={close}>
              {brand}
            </Link>

            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === homeTo}
                onClick={close}
              >
                {item.label}
              </NavLink>
            ))}

            <button type="button" onClick={salir}>Salir</button>
          </aside>

          <main className="ev-main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export function AdminLayout() {
  return <AppPanelLayout brand="✣ ELANVISUAL" homeTo="/admin" items={admin} />;
}

export function VendorLayout() {
  return <AppPanelLayout brand="VENTAS" homeTo="/vendedor-panel" items={vendor} />;
}

export function ProductionLayout() {
  return <AppPanelLayout brand="PRODUCCIÓN" homeTo="/produccion" items={production} />;
}