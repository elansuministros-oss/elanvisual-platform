import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useElan } from '../core/context/ElanContext.jsx';

export function PublicLayout() {
  const { carrito } = useElan();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <header className="topbar public">
        <Link className="brand" to="/" onClick={cerrarMenu}>
          ✣ ELANVISUAL
        </Link>

        <button
          type="button"
          className={`elan-menu-mobile ${menuAbierto ? 'active' : ''}`}
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          style={{
            width: 58,
            height: 58,
            minWidth: 58,
            minHeight: 58,
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            fontSize: 42,
            lineHeight: 1,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              transform: menuAbierto ? 'translateY(-1px)' : 'translateY(-3px)',
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            {menuAbierto ? '×' : '≡'}
          </span>
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