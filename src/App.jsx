import Pedidos from './pages/admin/Pedidos.jsx';
import Categorias from './pages/admin/Categorias.jsx';

import Showroom from './pages/public/Showroom.jsx';
import Nosotros from './pages/public/Nosotros.jsx';
import Contacto from './pages/public/Contacto.jsx';
import Productos from './pages/admin/Productos.jsx';
import Configuracion from './pages/admin/Configuracion.jsx';
import { Navigate, Route, Routes } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import Home from './pages/public/Home.jsx';
import Catalogo from './pages/public/Catalogo.jsx';
import Carrito from './pages/public/Carrito.jsx';

import Dashboard from './pages/admin/Dashboard.jsx';
import Multimedia from './pages/admin/Multimedia.jsx';
import Banners from './pages/admin/Banners.jsx';

function Placeholder({ title, area = 'ELANVISUAL V2' }) {
  return (
    <main className="page-shell">
      <section className="app-card">
        <p className="eyebrow">{area}</p>
        <h1>{title}</h1>
        <p className="muted">Módulo listo para conectar en V2.</p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/showroom" element={<Showroom />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="multimedia" element={<Multimedia />} />
        <Route path="banners" element={<Banners />} />
        <Route path="productos" element={<Productos />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="clientes" element={<Placeholder title="Clientes" area="Administrador" />} />
        <Route path="inventario" element={<Placeholder title="Inventario" area="Administrador" />} />
        <Route path="materiales" element={<Placeholder title="Materiales" area="Administrador" />} />
        <Route path="cotizaciones" element={<Placeholder title="Cotizaciones" area="Administrador" />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="ordenes" element={<Placeholder title="Órdenes" area="Administrador" />} />
        <Route path="produccion" element={<Placeholder title="Producción" area="Administrador" />} />
        <Route path="pagos" element={<Placeholder title="Pagos" area="Administrador" />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>

      <Route path="/login" element={<Placeholder title="Acceso" area="Sistema" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}