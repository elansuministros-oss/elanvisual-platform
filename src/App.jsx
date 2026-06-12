import { Routes, Route, Navigate } from 'react-router-dom';

import {
  PublicLayout,
  AdminLayout,
  VendorLayout,
  ProductionLayout,
} from './components/Layout.jsx';

import Home from './pages/public/Home.jsx';
import Catalogo from './pages/public/Catalogo.jsx';
import Carrito from './pages/public/Carrito.jsx';

import {
  Showroom,
  Nosotros,
  Contacto,
  Seguimiento,
  VendedorQRPublico,
} from './pages/public/SimplePages.jsx';

import Login from './pages/Login.jsx';
import CotizadorInterno from './pages/admin/CotizadorInterno.jsx';

import {
  Dashboard,
  Productos,
  Categorias,
  Proveedores,
  Vendedores,
  Leads,
  Cotizaciones,
  Pedidos,
  Pagos,
  Ordenes,
  Produccion,
  Comisiones,
  SimpleAdmin,
  Configuracion,
  CRM,
  ListaCostos,
  FormulasCosto,
} from './pages/admin/AdminPages.jsx';

import ClientesCRM from './CRM/Clientes.jsx';
import InventarioCRM from './CRM/Inventario.jsx';
import MaterialesCRM from './CRM/Materiales.jsx';
import SeguimientoCRM from './CRM/Seguimiento.jsx';
import UsuariosPermisosCRM from './CRM/UsuariosPermisos.jsx';
import ConsumoMaterialesCRM from './CRM/ConsumoMateriales.jsx';

import {
  VendorDashboard,
  VendorQR,
  VendorCotizador,
  VendorCotizaciones,
  VendorPedidos,
  VendorComisiones,
  VendorSimple,
} from './pages/vendor/VendorPages.jsx';

import {
  ProductionDashboard,
  ProductionOrders,
  ProductionTracking,
  ProductionSimple,
} from './pages/production/ProductionPages.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/catalogo/:categoria" element={<Catalogo />} />
        <Route path="/showroom" element={<Showroom />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/seguimiento/:codigo" element={<Seguimiento />} />
        <Route path="/v/:codigoVendedor" element={<VendedorQRPublico />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />

        <Route path="catalogo" element={<Productos />} />
        <Route path="productos" element={<Productos />} />
        <Route path="categorias" element={<Categorias />} />

        <Route path="materiales" element={<MaterialesCRM />} />
        <Route path="inventario" element={<InventarioCRM />} />
        <Route path="consumo-materiales" element={<ConsumoMaterialesCRM />} />
        <Route path="lista-costos" element={<ListaCostos />} />
        <Route path="formulas-costo" element={<FormulasCosto />} />
        <Route path="costos" element={<ListaCostos />} />

        <Route path="clientes" element={<ClientesCRM />} />
        <Route path="leads" element={<Leads />} />
        <Route path="seguimiento" element={<SeguimientoCRM />} />

        <Route path="cotizador-interno" element={<CotizadorInterno />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="ordenes-trabajo" element={<Ordenes />} />
        <Route path="produccion" element={<Produccion />} />
        <Route path="comisiones" element={<Comisiones />} />

        <Route path="proveedores" element={<Proveedores />} />
        <Route path="vendedores" element={<Vendedores />} />

        <Route path="banners" element={<SimpleAdmin titulo="Banners" />} />
        <Route path="showroom" element={<SimpleAdmin titulo="Showroom" />} />
        <Route path="usuarios" element={<UsuariosPermisosCRM />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="crm-central" element={<CRM />} />
      </Route>

      <Route path="/vendedor-panel" element={<VendorLayout />}>
        <Route index element={<VendorDashboard />} />
        <Route path="qr" element={<VendorQR />} />
        <Route path="clientes" element={<ClientesCRM />} />
        <Route path="leads" element={<VendorSimple titulo="Mis leads" />} />

        <Route path="cotizador-interno" element={<VendorCotizador />} />
        <Route path="cotizaciones" element={<VendorCotizaciones />} />
        <Route path="pedidos" element={<VendorPedidos />} />
        <Route path="comisiones" element={<VendorComisiones />} />

        <Route path="perfil" element={<VendorSimple titulo="Mi perfil" />} />
      </Route>

      <Route path="/vendedor" element={<Navigate to="/vendedor-panel" />} />

      <Route path="/produccion" element={<ProductionLayout />}>
        <Route index element={<ProductionDashboard />} />

        <Route path="ordenes" element={<ProductionOrders />} />
        <Route path="ordenes-trabajo" element={<ProductionOrders />} />

        <Route path="seguimiento" element={<ProductionTracking />} />
        <Route path="procesos" element={<ProductionTracking />} />

        <Route path="consumo-materiales" element={<ConsumoMaterialesCRM />} />

        <Route
          path="entregas"
          element={<ProductionSimple titulo="Entregas e instalaciones" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}