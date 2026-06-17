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
import MiCuenta from './pages/MiCuenta';
import ProveedoresCostos from './pages/ProveedoresCostos';
import InventarioInteligente from './pages/InventarioInteligente';
import BibliotecaTecnica from './pages/BibliotecaTecnica';
import CotizadorDirecto from './pages/CotizadorDirecto';
import CotizacionesInteligentes from './pages/CotizacionesInteligentes';
import RecomendadorTecnico from './pages/RecomendadorTecnico';
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
    if (pathInicial.startsWith('/biblioteca-tecnica')) return 'bibliotecaTecnica';
    if (pathInicial.startsWith('/cotizador-visual')) return 'cotizadorVisual';
    if (pathInicial.startsWith('/cotizaciones-inteligentes')) return 'cotizacionesInteligentes';
    if (pathInicial.startsWith('/recomendador-tecnico')) return 'recomendadorTecnico';
    if (pathInicial.startsWith('/recomendador-tecnico')) return 'recomendadorTecnico';
    if (pathInicial.startsWith('/cotizador-inteligente')) return 'cotizadorInteligente';
    if (pathInicial.startsWith('/cotizador')) return 'cotizadorInteligente';
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
    if (pathInicial.startsWith('/mi-cuenta')) return 'miCuenta';
    if (pathInicial.startsWith('/proveedores')) return 'proveedores';
    if (pathInicial.startsWith('/inventario-real')) return 'inventarioReal';
    return 'home';
  })();

  const [page, setPage] = useState(paginaInicial);
  const { usuario, configuracion } = useApp();

  useEffect(() => {
    document.documentElement.style.setProperty('--azul', configuracion.colorPrincipal || '#111827');
    document.documentElement.style.setProperty('--teal', configuracion.colorSecundario || '#C9A227');
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
      bibliotecaTecnica: '/biblioteca-tecnica',
      cotizador: '/cotizador-inteligente',
      cotizadorInteligente: '/cotizador-inteligente',
      cotizacionesInteligentes: '/cotizaciones-inteligentes',
      recomendadorTecnico: '/recomendador-tecnico',
      cotizadorVisual: '/cotizador-visual',
      pedidos: '/pedidos',
      ventas: '/ventas',
      inventario: '/inventario',
      finanzas: '/finanzas',
      reportes: '/reportes',
      miCuenta: '/mi-cuenta',
      proveedores: '/proveedores',
      inventarioReal: '/inventario-real',
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

      {usuario && page !== 'home' && (
        <div className="erp-floating-actions">
          <button type="button" onClick={() => ir('home')}>🏠 Inicio</button>
          <button type="button" onClick={() => ir('miCuenta')}>👤 Mi cuenta</button>
            {accesoAdmin && <button type="button" onClick={() => ir('bibliotecaTecnica')}>📚 Biblioteca</button>}
        </div>
      )}

      {page === 'home' && <Home setPage={ir} />}
      {page === 'servicios' && <Catalogo />}
      {page === 'tienda' && <Catalogo />}
      {page === 'catalogo' && <Catalogo />}
      {page === 'trabajos' && <Trabajos />}
      {page === 'carrito' && <Carrito />}
      {page === 'contacto' && <Contacto />}
      {page === 'seguimiento' && <Seguimiento />}
      {page === 'login' && <Login setPage={ir} />}

      {page === 'inventarioReal' &&
        (accesoAdmin ? <InventarioInteligente /> : <Login setPage={ir} destino="admin" />)}

      {page === 'proveedores' &&
        (accesoAdmin ? <ProveedoresCostos /> : <Login setPage={ir} destino="admin" />)}

      {page === 'bibliotecaTecnica' &&
        (accesoAdmin ? <BibliotecaTecnica /> : <Login setPage={ir} destino="admin" />)}

      {page === 'miCuenta' &&
        (usuario ? <MiCuenta setPage={ir} /> : <Login setPage={ir} destino="miCuenta" />)}

      {page === 'dashboard' &&
        (accesoERP ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'crm' &&
        (accesoVentas ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="crm" />)}

      {page === 'ventas' &&
        (accesoVentas ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="crm" />)}

      {page === 'inventario' &&
        (accesoAdmin ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'finanzas' &&
        (accesoAdmin ? <DashboardERP setPage={ir} areaInicial="finanzas" /> : <Login setPage={ir} destino="admin" />)}

      {page === 'reportes' &&
        (accesoAdmin ? <DashboardERP setPage={ir} areaInicial="reportes" /> : <Login setPage={ir} destino="admin" />)}

      {page === 'produccion' &&
        (accesoProduccion ? <ProduccionPanel /> : <Login setPage={ir} destino="produccion" />)}

      {page === 'admin' &&
        (accesoAdmin ? <AdminPanel /> : <Login setPage={ir} destino="admin" />)}

      {page === 'materiales' &&
        (accesoAdmin ? <MaterialesCostos /> : <Login setPage={ir} destino="materiales" />)}

      {page === 'recomendadorTecnico' &&
        (accesoVentas ? <RecomendadorTecnico /> : <Login setPage={ir} destino="cotizador" />)}

      

      {page === 'cotizadorInteligente' &&
        (accesoVentas ? <CotizadorDirecto /> : <Login setPage={ir} destino="cotizador" />)}

      {page === 'cotizacionesInteligentes' &&
        (accesoVentas ? <CotizacionesInteligentes /> : <Login setPage={ir} destino="cotizador" />)}

      {page === 'cotizadorVisual' &&
        (accesoAdmin ? <CotizadorVisual /> : <Login setPage={ir} destino="admin" />)}

      {page === 'pedidos' &&
        (accesoPedidos ? <PedidosProduccion /> : <Login setPage={ir} destino="pedidos" />)}
    </>
  );
}


