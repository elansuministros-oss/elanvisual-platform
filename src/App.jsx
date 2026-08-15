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
import CapturaInteligente from './pages/CapturaInteligente';
import CotizacionesInteligentes from './pages/CotizacionesInteligentes';
import CotizadorUniversal from './pages/CotizadorUniversal';
import QuotationDetail from './pages/QuotationDetail';
import PublicQuotation from './pages/PublicQuotation';
import PublicQuotationV2 from './pages/PublicQuotationV2';
import PublicReceipt from './pages/PublicReceipt';
import PublicWorkOrder from './pages/PublicWorkOrder';
import SupplierPurchaseOrderPortal from './pages/SupplierPurchaseOrderPortal';
import QuotationsViewer from './pages/QuotationsViewer';
import RecomendadorTecnico from './pages/RecomendadorTecnico';
import AIStudio from './pages/AIStudio';
import SolicitudesDisenoAI from './pages/SolicitudesDisenoAI';
import DisenoPortal from './pages/DisenoPortal';
import EMCImportadorAI22 from './pages/EMCImportadorAI22';
import EMCInventario from './pages/EMCInventario';
import { useApp } from './context/AppContext';
import './styles/global.css';

export default function App() {
  const pathInicial = window.location.pathname || '/';

  const paginaInicial = (() => {
    if (pathInicial.startsWith('/oc/proveedor/')) return 'supplierPurchaseOrder';
    if (pathInicial.startsWith('/r/')) return 'publicReceipt';
    if (pathInicial.startsWith('/ot/')) return 'publicWorkOrder';
    if (/^\/ELV-REC-\d{4}-\d{6}\/?$/i.test(pathInicial)) return 'publicReceipt';
    if (pathInicial.startsWith('/cotizaciones/v2/')) return 'publicQuotationV2';
    if (pathInicial.startsWith('/cotizaciones/publicas/') || pathInicial.startsWith('/q/')) return 'publicQuotation';
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
    if (pathInicial.startsWith('/cotizador')) return 'cotizador';
    if (pathInicial.startsWith('/cotizaciones-inteligentes')) return 'cotizacionesInteligentes';
    if (pathInicial.startsWith('/cotizaciones/')) return 'quotationDetail';
    if (pathInicial.startsWith('/cotizaciones')) return 'cotizaciones';
    if (pathInicial.startsWith('/recomendador-tecnico')) return 'recomendadorTecnico';
    if (pathInicial.startsWith('/diseno-ai')) return 'disenoAI';
    if (pathInicial.startsWith('/diseno') || pathInicial.startsWith('/solicitar-diseno')) return 'disenoPortal';
    if (pathInicial.startsWith('/solicitudes-ai')) return 'solicitudesAI';
    if (pathInicial.startsWith('/ai-studio')) return 'aiStudio';
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
      home: '/', servicios: '/servicios', tienda: '/tienda', catalogo: '/servicios', carrito: '/carrito',
      contacto: '/contacto', seguimiento: '/seguimiento', login: '/login', dashboard: '/dashboard',
      crm: '/crm', clientes: '/clientes', admin: '/admin', produccion: '/produccion', materiales: '/materiales',
      emc: '/emc', emcInventario: '/emc-inventario', bibliotecaTecnica: '/biblioteca-tecnica',
      cotizador: '/cotizador', cotizaciones: '/cotizaciones', cotizacionesInteligentes: '/cotizaciones-inteligentes',
      recomendadorTecnico: '/recomendador-tecnico', aiStudio: '/ai-studio', solicitudesAI: '/solicitudes-ai',
      disenoAI: '/diseno-ai', disenoPortal: '/diseno', pedidos: '/pedidos', ordenTrabajo: '/orden-trabajo',
      ventas: '/ventas', inventario: '/inventario', finanzas: '/finanzas', reportes: '/reportes',
      miCuenta: '/mi-cuenta', proveedores: '/proveedores', inventarioReal: '/inventario-real'
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
  const isPublicQuotation =
    page === 'publicQuotation' ||
    page === 'publicQuotationV2' ||
    page === 'publicReceipt' ||
    page === 'publicWorkOrder' ||
    page === 'supplierPurchaseOrder';

  const abrirCotizacion = (id) => {
    if (!id) return;
    setPage('quotationDetail');
    window.history.pushState({}, '', `/cotizaciones/${encodeURIComponent(id)}`);
  };

  const editarCotizacion = (id) => {
    if (!id) return;
    setPage('cotizador');
    window.history.pushState({}, '', `/cotizador?quotationId=${encodeURIComponent(id)}`);
  };

  const volverACotizaciones = () => {
    setPage('cotizaciones');
    window.history.pushState({}, '', '/cotizaciones');
  };

  return (
    <AIAssistantProvider>
      {!isPublicQuotation && usuario && (rol === 'admin' || rol === 'ventas') && <><AIFloatingButton /><AIAssistantPanel /></>}
      {!isPublicQuotation && <Header page={page} setPage={ir} />}
      {page === 'supplierPurchaseOrder' && <SupplierPurchaseOrderPortal />}
      {page === 'publicQuotation' && <PublicQuotation />}
      {page === 'publicQuotationV2' && <PublicQuotationV2 />}
      {page === 'publicReceipt' && <PublicReceipt />}
      {page === 'publicWorkOrder' && <PublicWorkOrder />}
      {page === 'home' && <Home setPage={ir} />}
      {page === 'servicios' && <Servicios setPage={ir} />}
      {page === 'tienda' && <Tienda setPage={ir} />}
      {page === 'catalogo' && <Servicios setPage={ir} />}
      {page === 'carrito' && <Carrito />}
      {page === 'contacto' && <Contacto />}
      {page === 'disenoPortal' && <DisenoPortal />}
      {page === 'seguimiento' && <Seguimiento />}
      {page === 'login' && <Login setPage={ir} />}
      {page === 'inventarioReal' && (accesoAdmin ? <InventarioInteligente /> : <Login setPage={ir} destino="admin" />)}
      {page === 'proveedores' && (accesoAdmin ? <ProveedoresHub /> : <Login setPage={ir} destino="admin" />)}
      {page === 'redProveedoresIA' && (accesoAdmin ? <RedProveedoresIA /> : <Login setPage={ir} destino="admin" />)}
      {page === 'bibliotecaTecnica' && (accesoAdmin ? <BibliotecaTecnica /> : <Login setPage={ir} destino="admin" />)}
      {page === 'miCuenta' && (usuario ? <MiCuenta setPage={ir} /> : <Login setPage={ir} destino="miCuenta" />)}
      {page === 'dashboard' && (accesoERP ? <DashboardERP setPage={ir} /> : <Login setPage={ir} destino="admin" />)}
      {page === 'crm' && (accesoAdmin ? <CRM /> : <Login setPage={ir} destino="admin" />)}
      {page === 'clientes' && (accesoVentas ? <ClientesCRM /> : <Login setPage={ir} destino="clientes" />)}
      {page === 'ventas' && (accesoVentas ? <PanelVentas setPage={ir} /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'inventario' && (accesoAdmin ? <DashboardERP setPage={ir} areaInicial="inventario" /> : <Login setPage={ir} destino="admin" />)}
      {page === 'finanzas' && (accesoAdmin ? <DashboardERP setPage={ir} areaInicial="finanzas" /> : <Login setPage={ir} destino="admin" />)}
      {page === 'reportes' && (accesoAdmin ? <DashboardERP setPage={ir} areaInicial="reportes" /> : <Login setPage={ir} destino="admin" />)}
      {page === 'produccion' && (accesoProduccion ? <ProduccionPanel /> : <Login setPage={ir} destino="produccion" />)}
      {page === 'admin' && (accesoAdmin ? <AdminPanel /> : <Login setPage={ir} destino="admin" />)}
      {page === 'materiales' && (accesoAdmin ? <MaterialesCostos /> : <Login setPage={ir} destino="materiales" />)}
      {page === 'emc' && (accesoAdmin ? <EMCImportadorAI22 /> : <Login setPage={ir} destino="admin" />)}
      {page === 'emcInventario' && (accesoAdmin ? <EMCInventario /> : <Login setPage={ir} destino="admin" />)}
      {page === 'recomendadorTecnico' && (accesoVentas ? <RecomendadorTecnico /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'aiStudio' && (accesoVentas ? <AIStudio setPage={ir} /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'capturaInteligente' && (accesoVentas ? <CapturaInteligente /> : <Login setPage={ir} destino="crm" />)}
      {page === 'cotizador' && (accesoVentas ? <CotizadorUniversal /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'cotizaciones' && (accesoVentas ? <QuotationsViewer onOpenQuotation={abrirCotizacion} onEditQuotation={editarCotizacion} /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'quotationDetail' && (accesoVentas ? <QuotationDetail onBack={volverACotizaciones} /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'cotizacionesInteligentes' && (accesoVentas ? <CotizacionesInteligentes /> : <Login setPage={ir} destino="ventas" />)}
      {page === 'ordenTrabajo' && (accesoPedidos ? <OrdenTrabajo /> : <Login setPage={ir} destino="pedidos" />)}
      {page === 'pedidos' && (accesoPedidos ? <PedidosProduccion /> : <Login setPage={ir} destino="pedidos" />)}
      {page === 'solicitudesAI' && (accesoAdmin ? <SolicitudesDisenoAI /> : <Login setPage={ir} destino="admin" />)}
    </AIAssistantProvider>
  );
}