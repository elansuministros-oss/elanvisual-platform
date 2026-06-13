import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/admin/productos', label: 'Productos', icon: '▣' },
  { to: '/admin/multimedia', label: 'Media', icon: '◉' },
  { to: '/admin/banners', label: 'Banners', icon: '▰' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '✓' },
  { to: '/admin/categorias', label: 'Categorías', icon: '◇' },
  { to: '/admin/clientes', label: 'Clientes', icon: '☻' },
  { to: '/admin/inventario', label: 'Inventario', icon: '▤' },
  { to: '/admin/materiales', label: 'Materiales', icon: '⬡' },
  { to: '/admin/cotizaciones', label: 'Cotizaciones', icon: '$' },
  { to: '/admin/ordenes', label: 'Órdenes', icon: '⚙' },
  { to: '/admin/produccion', label: 'Producción', icon: '◆' },
  { to: '/admin/pagos', label: 'Pagos', icon: '₡' },
  { to: '/admin/configuracion', label: 'Configuración', icon: '☰' },
];

const bottomLinks = adminLinks.slice(0, 5);

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  const closeDrawer = () => setOpen(false);

  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <div className="admin-title">
          <strong>ELANVISUAL</strong>
          <span>Administrador V2</span>
        </div>

        <button
          type="button"
          className="admin-menu-button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú administrador"
        >
          ☰
        </button>
      </header>

      {open && <button className="admin-drawer-backdrop" onClick={closeDrawer} aria-label="Cerrar menú" />}

      <aside className={`admin-drawer ${open ? 'is-open' : ''}`}>
        <nav className="admin-drawer-nav">
          {adminLinks.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={closeDrawer}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>

      <nav className="admin-bottom-nav" aria-label="Navegación rápida administrador">
        {bottomLinks.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}