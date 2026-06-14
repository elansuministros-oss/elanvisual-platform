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
    if (pathInicial.startsWith('/catalogo')) return 'catalogo';
    if (pathInicial.startsWith('/trabajos')) return 'trabajos';
    if (pathInicial.startsWith('/contacto')) return 'contacto';
    if (pathInicial.startsWith('/erp')) return 'home';
    return 'home';
  })();

  const [page, setPage] = useState(paginaInicial);
  const { usuario, configuracion } = useApp();

  useEffect(() => {
    document.documentElement.style.setProperty('--azul', configuracion.colorPrincipal || '#1E5AA8');
    document.documentElement.style.setProperty('--teal', configuracion.colorSecundario || '#058B8C');
  }, [configuracion]);

  const ir = (destino) => {
    const rutas = {
      home: '/',
      catalogo: '/catalogo',
      trabajos: '/trabajos',
      carrito: '/carrito',
      contacto: '/contacto',
      crm: '/crm',
      seguimiento: '/seguimiento',
      login: '/login',
      admin: '/admin',
      produccion: '/produccion',
      materiales: '/materiales',
      cotizador: '/cotizador',
      pedidos: '/pedidos',
      ventas: '/',
      inventario: '/',
      finanzas: '/',
      reportes: '/',
    };

    setPage(destino);
    window.history.pushState({}, '', rutas[destino] || '/');
  };

  return (
    <>
      <Header page={page} setPage={ir} />

      {page === 'home' && <Home setPage={ir} />}
      {page === 'catalogo' && <Catalogo />}
      {page === 'trabajos' && <Trabajos />}
      {page === 'carrito' && <Carrito />}
      {page === 'contacto' && <Contacto />}
      {page === 'crm' && <CRM />}
      {page === 'seguimiento' && <Seguimiento />}
      {page === 'login' && <Login setPage={ir} />}

      {page === 'ventas' && <DashboardERP setPage={ir} />}
      {page === 'inventario' && <DashboardERP setPage={ir} />}
      {page === 'finanzas' && <DashboardERP setPage={ir} />}
      {page === 'reportes' && <DashboardERP setPage={ir} />}

      {page === 'produccion' &&
        (usuario?.rol === 'admin' || usuario?.rol === 'produccion' ? (
          <ProduccionPanel />
        ) : (
          <Login setPage={ir} destino="produccion" />
        ))}

      {page === 'admin' &&
        (usuario?.rol === 'admin' ? (
          <AdminPanel />
        ) : (
          <Login setPage={ir} destino="admin" />
        ))}

      {page === 'materiales' &&
        (usuario?.rol === 'admin' ? (
          <MaterialesCostos />
        ) : (
          <Login setPage={ir} destino="materiales" />
        ))}

      {page === 'cotizador' &&
        (usuario?.rol === 'admin' || usuario?.rol === 'ventas' ? (
          <CotizadorVisual />
        ) : (
          <Login setPage={ir} destino="cotizador" />
        ))}

      {page === 'pedidos' &&
        (usuario?.rol === 'admin' ||
        usuario?.rol === 'ventas' ||
        usuario?.rol === 'produccion' ? (
          <PedidosProduccion />
        ) : (
          <Login setPage={ir} destino="pedidos" />
        ))}
    </>
  );
}