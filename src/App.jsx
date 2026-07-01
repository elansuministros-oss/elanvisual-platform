import { AIAssistantProvider } from './ai/AIAssistantProvider';
import AIFloatingButton from './ai/AIFloatingButton';
import AIAssistantPanel from './ai/AIAssistantPanel';
import ClientesCRM from './crm/Clientes';
import PanelVentas from './pages/PanelVentas';
import React, { useEffect, useState } from 'react';
import CRM from './crm/App/CRM.jsx';
import Header from './components/Header';
import Home from './pages/Home';
import Servicios from './pages/Servicios';
import Tienda from './pages/Tienda';
import Carrito from './pages/Carrito';
import ProduccionPanel from './pages/ProduccionPanel';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Contacto from './pages/Contacto';
import Seguimiento from './pages/Seguimiento';
import MaterialesCostos from './pages/MaterialesCostos';
import PedidosProduccion from './pages/PedidosProduccion';
import OrdenTrabajo from './pages/OrdenTrabajo';
import DashboardERP from './pages/DashboardERP';
import MiCuenta from './pages/MiCuenta';
import ProveedoresHub from './pages/ProveedoresHub';
import RedProveedoresIA from './pages/RedProveedoresIA';
import InventarioInteligente from './pages/InventarioInteligente';
import BibliotecaTecnica from './pages/BibliotecaTecnica';
import CotizadorDirectoAI from './pages/CotizadorDirectoAI';
import CapturaInteligente from './pages/CapturaInteligente';
import CotizacionesInteligentes from './pages/CotizacionesInteligentes';
import RecomendadorTecnico from './pages/RecomendadorTecnico';
import AIStudio from './pages/AIStudio';
import SolicitudesDisenoAI from './pages/SolicitudesDisenoAI';
import EMCImportadorAI22 from './pages/EMCImportadorAI22';
import EMCInventario from './pages/EMCInventario';
import { useApp } from './context/AppContext';
import './styles/global.css';

export default function App() {
  const pathInicial = window.location.pathname || '/';

  const paginaInicial = (() => {
    if (pathInicial.startsWith('/emc-inventario')) return 'emcInventario';
    if (pathInicial.startsWith('/emc')) return 'emc';
    if (pathInicial.startsWith('/clientes')) return 'clientes';
    if (pathInicial.startsWith('/crm')) return 'crm';
    if (pathInicial.startsWith('/seguimiento')) return 'seguimiento';
    if (pathInicial.startsWith('/login')) return 'login';
    if (pathInicial.startsWith('/admin')) return 'admin';
    if (pathInicial.startsWith('/produccion')) return 'produccion';
    if (pathInicial.startsWith('/materiales')) return 'materiales';
    if (pathInicial.startsWith('/biblioteca-tecnica')) return 'bibliotecaTecnica';
    if (pathInicial.startsWith('/cotizador-ai')) return 'cotizadorAI';
    if (pathInicial.startsWith('/cotizador-visual')) return 'cotizadorVisual';
    if (pathInicial.startsWith('/cotizaciones-inteligentes')) return 'cotizacionesInteligentes';
    if (pathInicial.startsWith('/recomendador-tecnico')) return 'recomendadorTecnico';
    if (pathInicial.startsWith('/diseno-ai')) return 'disenoAI';
    if (pathInicial.startsWith('/solicitudes-ai')) return 'solicitudesAI';
    if (pathInicial.startsWith('/ai-studio')) return 'aiStudio';
    if (pathInicial.startsWith('/cotizador-inteligente')) return 'cotizador';
    if (pathInicial.startsWith('/cotizador')) return 'cotizador';
    if (pathInicial.startsWith('/orden-trabajo')) return 'ordenTrabajo';
    if (pathInicial.startsWith('/pedidos')) return 'pedidos';
    if (pathInicial.startsWith('/servicios')) return 'servicios';
    if (pathInicial.startsWith('/tienda')) return 'tienda';
    if (pathInicial.startsWith('/catalogo')) return 'servicios';
if (pathInicial.startsWith('/trabajos')) return 'servicios';
if (pathInicial.startsWith('/portafolio')) return 'servicios';
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
      carrito: '/carrito',
      contacto: '/contacto',
      seguimiento: '/seguimiento',
      login: '/login',
      dashboard: '/dashboard',
      crm: '/crm',
      clientes: '/clientes',
      admin: '/admin',
      produccion: '/produccion',
      materiales: '/materiales',
      emc: '/emc',
      emcInventario: '/emc-inventario',
      bibliotecaTecnica: '/biblioteca-tecnica',
      cotizador: '/cotizador',
      cotizadorAI: '/cotizador-ai',
      cotizadorInteligente: '/cotizador',
      cotizacionesInteligentes: '/cotizaciones-inteligentes',
      recomendadorTecnico: '/recomendador-tecnico',
      aiStudio: '/ai-studio',
      solicitudesAI: '/solicitudes-ai',
      disenoAI: '/diseno-ai',
      cotizadorVisual: '/cotizador-visual',
      pedidos: '/pedidos',
      ordenTrabajo: '/orden-trabajo',
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
    <AIAssistantProvider>
      {usuario && (rol === 'admin' || rol === 'ventas') && (
        <>
          <AIFloatingButton />
          <AIAssistantPanel />
        </>
      )}

      <Header page={page} setPage={ir} />

      {page === 'home' && <Home setPage={ir} />}
      {page === 'servicios' && <Servicios setPage={ir} />}
      {page === 'tienda' && <Tienda setPage={ir} />}
      {page === 'catalogo' && <Servicios setPage={ir} />}
      {page === 'carrito' && <Carrito />}
      {page === 'contacto' && <Contacto />}
      {page === 'seguimiento' && <Seguimiento />}
      {page === 'login' && <Login setPage={ir} />}

      {page === 'inventarioReal' &&
        (accesoAdmin ? <InventarioInteligente /> : <Login setPage={ir} destino="admin" />)}

      {page === 'proveedores' &&
        (accesoAdmin ? <ProveedoresHub /> : <Login setPage={ir} destino="admin" />)}

      {page === 'redProveedoresIA' &&
        (accesoAdmin ? <RedProveedoresIA /> : <Login setPage={ir} destino="admin" />)}

      {page === 'bibliotecaTecnica' &&
        (accesoAdmin ? <BibliotecaTecnica /> : <Login setPage={ir} destino="admin" />)}

      {page === 'miCuenta' &&
        (usuario ? <MiCuenta setPage={ir} /> : <Login setPage={ir} destino="miCuenta" />)}

      {page === 'dashboard' &&
        (accesoERP ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'crm' && (accesoAdmin ? <CRM /> : <Login setPage={ir} destino="admin" />)}

      {page === 'clientes' &&
        (accesoVentas ? <ClientesCRM /> : <Login setPage={ir} destino="clientes" />)}

      {page === 'ventas' &&
        (accesoVentas ? <PanelVentas setPage={ir} /> : <Login setPage={ir} destino="ventas" />)}

      {page === 'inventario' &&
        (accesoAdmin ? (
          <DashboardERP setPage={ir} areaInicial="inventario" />
        ) : (
          <Login setPage={ir} destino="admin" />
        ))}

      {page === 'finanzas' &&
        (accesoAdmin ? (
          <DashboardERP setPage={ir} areaInicial="finanzas" />
        ) : (
          <Login setPage={ir} destino="admin" />
        ))}

      {page === 'reportes' &&
        (accesoAdmin ? (
          <DashboardERP setPage={ir} areaInicial="reportes" />
        ) : (
          <Login setPage={ir} destino="admin" />
        ))}

      {page === 'produccion' &&
        (accesoProduccion ? <ProduccionPanel /> : <Login setPage={ir} destino="produccion" />)}

      {page === 'admin' &&
        (accesoAdmin ? <AdminPanel /> : <Login setPage={ir} destino="admin" />)}

      {page === 'materiales' &&
        (accesoAdmin ? <MaterialesCostos /> : <Login setPage={ir} destino="materiales" />)}

{page === 'emc' &&
        (accesoAdmin ? <EMCImportadorAI22 /> : <Login setPage={ir} destino="admin" />)}

      {page === 'emcInventario' &&
        (accesoAdmin ? <EMCInventario /> : <Login setPage={ir} destino="admin" />)}
  
      {page === 'recomendadorTecnico' &&
        (accesoVentas ? <RecomendadorTecnico /> : <Login setPage={ir} destino="cotizador" />)}

      {page === 'aiStudio' &&
        (accesoVentas ? <AIStudio setPage={ir} /> : <Login setPage={ir} destino="ventas" />)}

      {page === 'capturaInteligente' &&
        (accesoVentas ? <CapturaInteligente /> : <Login setPage={ir} destino="crm" />)}

      {page === 'cotizador' &&
        (accesoVentas ? <CotizadorDirectoAI setPage={ir} /> : <Login setPage={ir} destino="cotizador" />)}

      {page === 'cotizadorAI' &&
        (accesoVentas ? <CotizadorDirectoAI setPage={ir} /> : <Login setPage={ir} destino="cotizadorAI" />)}

      {page === 'cotizacionesInteligentes' &&
        (accesoVentas ? <CotizacionesInteligentes /> : <Login setPage={ir} destino="cotizador" />)}

      {page === 'cotizadorVisual' &&
        (accesoAdmin ? <CotizadorDirectoAI setPage={ir} /> : <Login setPage={ir} destino="admin" />)}

      {page === 'ordenTrabajo' &&
        (accesoPedidos ? <OrdenTrabajo /> : <Login setPage={ir} destino="pedidos" />)}

      {page === 'pedidos' &&
        (accesoPedidos ? <PedidosProduccion /> : <Login setPage={ir} destino="pedidos" />)}

      {page === 'solicitudesAI' &&
        (accesoAdmin ? <SolicitudesDisenoAI /> : <Login setPage={ir} destino="admin" />)}
    </AIAssistantProvider>
  );
}

