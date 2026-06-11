import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useElan } from '../core/context/ElanContext.jsx';

export function PublicLayout() {
  const { carrito } = useElan();

  return (
    <>
      <header className="topbar public">
        <Link className="brand" to="/">
          ✣ ELANVISUAL
        </Link>

        <nav>
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/catalogo">Catálogo</NavLink>
          <NavLink to="/showroom">Showroom</NavLink>
          <NavLink to="/nosotros">Nosotros</NavLink>
          <NavLink to="/contacto">Contacto</NavLink>

          <NavLink className="cart" to="/carrito">
            🛒 {carrito.length}
          </NavLink>

          <NavLink to="/login">Login</NavLink>
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
  { label: 'Banners', to: '/admin/banners' },
  { label: 'Showroom', to: '/admin/showroom' },
  { label: 'Usuarios', to: '/admin/usuarios' },
  { label: 'Costos', to: '/admin/costos' },
  { label: 'Configuración', to: '/admin/configuracion' },
  { label: 'CRM Central', to: '/admin/crm-central' },
];

export function AdminLayout() {
  const { logout } = useElan();
  const nav = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand adminbrand" to="/admin">
          ✣ ELANVISUAL
        </Link>

        {admin.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
          >
            {item.label}
          </NavLink>
        ))}

        <button
          onClick={() => {
            logout();
            nav('/');
          }}
        >
          Salir
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function VendorLayout() {
  const items = [
    'Dashboard',
    'QR',
    'Clientes',
    'Leads',
    'Cotizador Interno',
    'Cotizaciones',
    'Pedidos',
    'Comisiones',
    'Perfil',
  ];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand adminbrand" to="/vendedor">
          VENDEDOR
        </Link>

        {items.map((i) => (
          <NavLink
            key={i}
            to={
              i === 'Dashboard'
                ? '/vendedor'
                : '/vendedor/' +
                  i.toLowerCase().replaceAll(' ', '-')
            }
            end={i === 'Dashboard'}
          >
            {i}
          </NavLink>
        ))}
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function ProductionLayout() {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand adminbrand" to="/produccion">
          PRODUCCIÓN
        </Link>

        <NavLink to="/produccion" end>
          Dashboard
        </NavLink>

        <NavLink to="/produccion/ordenes">
          Órdenes
        </NavLink>

        <NavLink to="/produccion/seguimiento">
          Seguimiento
        </NavLink>

        <NavLink to="/produccion/inventario">
          Inventario
        </NavLink>

        <NavLink to="/admin/consumo-materiales">
          Consumo Materiales
        </NavLink>

        <NavLink to="/produccion/entregas">
          Entregas
        </NavLink>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}