import React, { useEffect, useState } from 'react';
import CRM from './crm/App/CRM.jsx';
import Header from './components/Header';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import ProduccionPanel from './pages/ProduccionPanel';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Contacto from './pages/Contacto';
import Trabajos from './pages/Trabajos';
import Seguimiento from './pages/Seguimiento';
import MaterialesCostos from './pages/MaterialesCostos';
import CotizadorVisual from './pages/CotizadorVisual';
import PedidosProduccion from './pages/PedidosProduccion';
import DashboardERP from './pages/DashboardERP';
import { useApp } from './context/AppContext';
import './styles/global.css';

export default function App() {
  const pathInicial = window.location.pathname || '/';

  const paginaInicial = (() => {
    if (pathInicial.startsWith('/crm')) return 'crm';
    if (pathInicial.startsWith('/seguimiento')) return 'seguimiento';
    if (pathInicial.startsWith('/login')) return 'login';
    if (pathInicial.startsWith('/admin')) return 'admin';
    if (pathInicial.startsWith('/produccion')) return 'produccion';
    if (pathInicial.startsWith('/materiales')) return 'materiales';
    if (pathInicial.startsWith('/cotizador')) return 'cotizador';
    if (pathInicial.startsWith('/pedidos')) return 'pedidos';
    if (pathInicial.startsWith('/servicios')) return 'servicios';
    if (pathInicial.startsWith('/tienda')) return 'tienda';
    if (pathInicial.startsWith('/catalogo')) return 'servicios';
    if (pathInicial.startsWith('/trabajos')) return 'trabajos';
    if (pathInicial.startsWith('/portafolio')) return 'trabajos';
    if (pathInicial.startsWith('/carrito')) return 'carrito';
    if (pathInicial.startsWith('/contacto')) return 'contacto';
    if (pathInicial.startsWith('/dashboard')) return 'dashboard';
    if (pathInicial.startsWith('/ventas')) return 'ventas';
    if (pathInicial.startsWith('/inventario')) return 'inventario';
    if (pathInicial.startsWith('/finanzas')) return 'finanzas';
    if (pathInicial.startsWith('/reportes')) return 'reportes';
    if (pathInicial.startsWith('/erp')) return 'dashboard';
    return 'home';
  })();

  const [page, setPage] = useState(paginaInicial);
  const { usuario, configuracion } = useApp();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--azul',
      configuracion.colorPrincipal || '#111827'
    );
    document.documentElement.style.setProperty(
      '--teal',
      configuracion.colorSecundario || '#C9A227'
    );
  }, [configuracion]);

  const ir = (destino) => {
    const rutas = {
      home: '/',
      servicios: '/servicios',
      tienda: '/tienda',
      catalogo: '/servicios',
      trabajos: '/portafolio',
      carrito: '/carrito',
      contacto: '/contacto',
      seguimiento: '/seguimiento',
      login: '/login',
      dashboard: '/dashboard',
      crm: '/crm',
      admin: '/admin',
      produccion: '/produccion',
      materiales: '/materiales',
      cotizador: '/cotizador',
      pedidos: '/pedidos',
      ventas: '/ventas',
      inventario: '/inventario',
      finanzas: '/finanzas',
      reportes: '/reportes',
    };

    setPage(destino);
    window.history.pushState({}, '', rutas[destino] || '/');
  };

  const rol = usuario?.rol;

  const accesoAdmin = rol === 'admin';
  const accesoVentas = rol === 'admin' || rol === 'ventas';
  const accesoProduccion = rol === 'admin' || rol === 'produccion';
  const accesoPedidos = rol === 'admin' || rol === 'ventas' || rol === 'produccion';
  const accesoERP = rol === 'admin';

  return (
    <>
      <Header page={page} setPage={ir} />

      {page === 'home' && <Home setPage={ir} />}
      {page === 'servicios' && <Catalogo />}
      {page === 'tienda' && <Catalogo />}
      {page === 'catalogo' && <Catalogo />}
      {page === 'trabajos' && <Trabajos />}
      {page === 'carrito' && <Carrito />}
      {page === 'contacto' && <Contacto />}
      {page === 'seguimiento' && <Seguimiento />}
      {page === 'login' && <Login setPage={ir} />}

      {page === 'dashboard' &&
        (accesoERP ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'crm' &&
        (accesoVentas ? <CRM /> : <Login setPage={ir} destino="crm" />)}

      {page === 'ventas' &&
        (accesoVentas ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="crm" />)}

      {page === 'inventario' &&
        (accesoAdmin ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'finanzas' &&
        (accesoAdmin ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'reportes' &&
        (accesoAdmin ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'produccion' &&
        (accesoProduccion ? (
          <ProduccionPanel />
        ) : (
          <Login setPage={ir} destino="produccion" />
        ))}

      {page === 'admin' &&
        (accesoAdmin ? <AdminPanel /> : <Login setPage={ir} destino="admin" />)}

      {page === 'materiales' &&
        (accesoAdmin ? <MaterialesCostos /> : <Login setPage={ir} destino="materiales" />)}

      {page === 'cotizador' &&
        (accesoVentas ? <CotizadorVisual /> : <Login setPage={ir} destino="cotizador" />)}

      {page === 'pedidos' &&
        (accesoPedidos ? <PedidosProduccion /> : <Login setPage={ir} destino="pedidos" />)}
    </>
  );
}