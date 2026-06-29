import React, { useEffect, useMemo, useState } from 'react';
import { useCore } from '../../core/context/CoreContext';

import DashboardCRM from '../DashboardCRM';
import NotificacionesCRM from '../NotificacionesCRM';
import CentroWhatsApp from '../CentroWhatsApp';
import DashboardGerencial from '../DashboardGerencial';
import AutomatizacionesCRM from '../AutomatizacionesCRM';
import CRMComercialAvanzado from '../CRMComercialAvanzado';
import MetasKPIs from '../MetasKPIs';
import CalendarioCorporativo from '../CalendarioCorporativo';
import DocumentosCorporativos from '../DocumentosCorporativos';
import PortalClienteCRM from '../PortalClienteCRM';
import PortalProduccionCRM from '../PortalProduccionCRM';
import AppMovilCRM from '../AppMovilCRM';
import ElanAI from '../ElanAI';
import Empresas from '../Empresas';
import Contactos from '../Contactos';
import Clientes from '../Clientes';
import Proveedores from '../Proveedores';
import Compras from '../Compras';
import CuentasPorPagar from '../CuentasPorPagar';
import CuentasPorCobrar from '../CuentasPorCobrar';
import FlujoCaja from '../FlujoCaja';
import SeguimientoCRM from '../SeguimientoCRM';
import Vendedores from '../Vendedores';
import AliadosComerciales from '../AliadosComerciales';
import ReportesCRM from '../ReportesCRM';
import FiscalCRM from '../FiscalCRM';
import CentroUtilidades from '../CentroUtilidades';
import EstadoFinanciero from '../EstadoFinanciero';
import ExportadorCRMCentral from '../ExportadorCRMCentral';

import Pedidos from '../Pedidos';
import Produccion from '../Produccion';
import Cobros from '../Cobros';
import Comisiones from '../Comisiones';

import Cotizaciones from '../Cotizaciones';
import OrdenesTrabajo from '../OrdenesTrabajo';
import Inventario from '../Inventario';
import Materiales from '../Materiales';
import UsuariosPermisos from '../UsuariosPermisos';
import AuditoriaCRM from '../AuditoriaCRM';
import SolicitudesDisenoAI from '../../pages/SolicitudesDisenoAI';
import EMCDashboard from '../../pages/EMCDashboard';

export default function CRM() {
  const { usuarioActivoCRM, rolUsuarioActivoCRM, usuarioTienePermisoCRM } = useCore();

  const rolTexto = String(
    rolUsuarioActivoCRM?.nombre ||
    usuarioActivoCRM?.rol ||
    usuarioActivoCRM?.tipo ||
    ''
  ).toLowerCase();

  const esVendedor =
    rolTexto.includes('vendedor') ||
    rolTexto.includes('ventas') ||
    rolTexto.includes('asesor');

  const rutaActual = typeof window !== 'undefined' ? window.location.pathname : '';

  const [modulo, setModulo] = useState(() => {
    if (rutaActual.includes('/clientes')) return 'clientes';
    if (esVendedor) return 'clientes';
    return 'dashboard';
  });

  const [menuAbierto, setMenuAbierto] = useState(false);

  const modulos = useMemo(
    () => [
      {
        grupo: 'General',
        items: [
          { id: 'dashboard', label: 'Dashboard', icono: '', componente: <DashboardCRM /> },
          { id: 'dashboard-gerencial', label: 'Dashboard Gerencial', icono: '', componente: <DashboardGerencial /> },
          { id: 'notificaciones', label: 'Notificaciones', icono: '', componente: <NotificacionesCRM /> },
          { id: 'centro-whatsapp', label: 'Centro WhatsApp', icono: '', componente: <CentroWhatsApp /> },
        ],
      },
      {
        grupo: 'CRM',
        items: [
          { id: 'empresas', label: 'Empresas', icono: '', componente: <Empresas /> },
          { id: 'contactos', label: 'Contactos', icono: '', componente: <Contactos /> },
          { id: 'clientes', label: 'Clientes', icono: '', componente: <Clientes /> },
          { id: 'proveedores', label: 'Proveedores', icono: '', componente: <Proveedores /> },
          { id: 'compras', label: 'Compras', icono: '', componente: <Compras /> },
          { id: 'seguimiento', label: 'Seguimiento', icono: '', componente: <SeguimientoCRM /> },
{ id: 'solicitudes-ai', label: 'Solicitudes AI', icono: '', componente: <SolicitudesDisenoAI /> },
{ id: 'crm-comercial', label: 'CRM Comercial', icono: '', componente: <CRMComercialAvanzado /> },
        ],
      },
      {
        grupo: 'Ventas',
        items: [
          { id: 'vendedores', label: 'Vendedores', icono: '', componente: <Vendedores /> },
          { id: 'aliados-comerciales', label: 'Aliados Comerciales', icono: '', componente: <AliadosComerciales /> },
          { id: 'cotizaciones', label: 'Cotizaciones', icono: '', componente: <Cotizaciones /> },
          { id: 'pedidos', label: 'Pedidos', icono: '', componente: <Pedidos /> },
        ],
      },
      {
        grupo: 'Operación',
        items: [
          { id: 'ordenes', label: 'Órdenes Trabajo', icono: '', componente: <OrdenesTrabajo /> },
          { id: 'produccion', label: 'Producción', icono: '', componente: <Produccion /> },
          { id: 'inventario', label: 'Inventario', icono: '', componente: <Inventario /> },
          { id: 'materiales', label: 'Materiales', icono: '', componente: <Materiales /> },
          { id: 'emc', label: 'Catálogo Maestro EMC', icono: '', componente: <EMCDashboard /> },
          { id: 'portal-produccion', label: 'Portal Producción', icono: '', componente: <PortalProduccionCRM /> },
        ],
      },
      {
        grupo: 'Finanzas',
        items: [
          { id: 'cobros', label: 'Cobros', icono: '', componente: <Cobros /> },
          { id: 'cuentas-cobrar', label: 'Cuentas por Cobrar', icono: '', componente: <CuentasPorCobrar /> },
          { id: 'cuentas-pagar', label: 'Cuentas por Pagar', icono: '', componente: <CuentasPorPagar /> },
          { id: 'flujo-caja', label: 'Flujo de Caja', icono: '', componente: <FlujoCaja /> },
          { id: 'centro-utilidades', label: 'Centro Utilidades', icono: '', componente: <CentroUtilidades /> },
          { id: 'estado-financiero', label: 'Estado Financiero', icono: '', componente: <EstadoFinanciero /> },
          { id: 'comisiones', label: 'Comisiones', icono: '', componente: <Comisiones /> },
          { id: 'reportes', label: 'Reportes', icono: '', componente: <ReportesCRM /> },
          { id: 'fiscal', label: 'Fiscal', icono: '', componente: <FiscalCRM /> },
          { id: 'metas-kpis', label: 'Metas y KPIs', icono: '', componente: <MetasKPIs /> },
        ],
      },
      {
        grupo: 'Portales',
        items: [
          { id: 'portal-cliente', label: 'Portal Cliente', icono: '', componente: <PortalClienteCRM /> },
          { id: 'app-movil', label: 'App Móvil', icono: '', componente: <AppMovilCRM /> },
        ],
      },
      {
        grupo: 'Tecnología',
        items: [
          { id: 'elan-ai', label: 'ELAN AI', icono: '', componente: <ElanAI /> },
          { id: 'exportador-crm-central', label: 'Exportador CRM Central', icono: '', componente: <ExportadorCRMCentral /> },
        ],
      },
      {
        grupo: 'Administración',
        items: [
          { id: 'usuarios-permisos', label: 'Usuarios y Permisos', icono: '', componente: <UsuariosPermisos /> },
          { id: 'auditoria', label: 'Auditoría', icono: '', componente: <AuditoriaCRM /> },
          { id: 'automatizaciones', label: 'Automatizaciones', icono: '', componente: <AutomatizacionesCRM /> },
          { id: 'calendario', label: 'Calendario', icono: '', componente: <CalendarioCorporativo /> },
          { id: 'documentos', label: 'Documentos', icono: '', componente: <DocumentosCorporativos /> },
        ],
      },
    ],
    []
  );

  const modulosVendedor = useMemo(
    () => [
      {
        grupo: 'Ventas',
        items: [
          { id: 'clientes', label: 'Clientes', icono: '', componente: <Clientes /> },
          { id: 'cotizaciones', label: 'Cotizaciones', icono: '', componente: <Cotizaciones /> },
          { id: 'pedidos', label: 'Pedidos', icono: '', componente: <Pedidos /> },
          { id: 'seguimiento', label: 'Seguimiento', icono: '', componente: <SeguimientoCRM /> },
          { id: 'crm-comercial', label: 'CRM Comercial', icono: '', componente: <CRMComercialAvanzado /> },
        ],
      },
    ],
    []
  );

  const modulosVisibles = useMemo(() => {
    if (esVendedor) return modulosVendedor;

    return modulos
      .map((grupo) => ({
        ...grupo,
        items: grupo.items.filter(
          (item) => item.id === 'usuarios-permisos' || usuarioTienePermisoCRM(item.id)
        ),
      }))
      .filter((grupo) => grupo.items.length > 0);
  }, [modulos, modulosVendedor, usuarioTienePermisoCRM, esVendedor]);

  const listaModulos = modulosVisibles.flatMap((grupo) => grupo.items);
  const moduloActivo = listaModulos.find((item) => item.id === modulo) || listaModulos[0];

  useEffect(() => {
    if (!listaModulos.some((item) => item.id === modulo)) {
      setModulo(listaModulos[0]?.id || 'clientes');
    }
  }, [listaModulos, modulo]);

  const abrirModulo = (id) => {
    setModulo(id);
    setMenuAbierto(false);
  };

  return (
    <div className="crm-shell">
      <style>
        {`
          .crm-shell {
            min-height: 100vh;
            background: #f3f6fb;
            color: #1f2937;
            display: flex;
            font-family: inherit;
          }

          .crm-sidebar {
            width: 280px;
            background: linear-gradient(180deg, #0f2f5f 0%, #123f7a 100%);
            color: #ffffff;
            padding: 18px 14px;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
            box-shadow: 4px 0 18px rgba(15, 47, 95, 0.25);
            z-index: 30;
          }

          .crm-brand {
            padding: 8px 10px 18px;
            border-bottom: 1px solid rgba(255,255,255,0.16);
            margin-bottom: 16px;
          }

          .crm-brand h1 {
            font-size: 18px;
            line-height: 1.15;
            margin: 0;
            letter-spacing: 0.4px;
          }

          .crm-brand p {
            margin: 7px 0 0;
            font-size: 12px;
            color: rgba(255,255,255,0.72);
          }

          .crm-group {
            margin-bottom: 16px;
          }

          .crm-group-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255,255,255,0.55);
            margin: 0 10px 8px;
            font-weight: 700;
          }

          .crm-nav-button {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 0;
            border-radius: 12px;
            padding: 11px 12px;
            margin-bottom: 6px;
            cursor: pointer;
            background: transparent;
            color: rgba(255,255,255,0.86);
            font-weight: 700;
            text-align: left;
            transition: all 0.18s ease;
          }

          .crm-nav-button:hover {
            background: rgba(255,255,255,0.12);
            color: #ffffff;
            transform: translateX(2px);
          }

          .crm-nav-button.active {
            background: #ffffff;
            color: #123f7a;
            box-shadow: 0 8px 18px rgba(0,0,0,0.18);
          }

          .crm-nav-icon {
            display: none;
          }

          .crm-main {
            flex: 1;
            min-width: 0;
            padding: 22px;
          }

          .crm-topbar {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
          }

          .crm-topbar-title h2 {
            margin: 0;
            font-size: 24px;
            color: #111827;
          }

          .crm-topbar-title p {
            margin: 5px 0 0;
            color: #6b7280;
            font-size: 14px;
          }

          .crm-module-badge {
            background: #eaf2ff;
            color: #1d4f9f;
            padding: 9px 13px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 800;
            white-space: nowrap;
          }

          .crm-content {
            min-width: 0;
          }

          .crm-mobile-button {
            display: none;
            border: 0;
            border-radius: 12px;
            padding: 10px 12px;
            background: #1f5fad;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .crm-overlay {
            display: none;
          }

          @media (max-width: 900px) {
            .crm-shell {
              display: block;
            }

            .crm-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              bottom: 0;
              transform: translateX(-105%);
              transition: transform 0.22s ease;
              width: 270px;
            }

            .crm-sidebar.open {
              transform: translateX(0);
            }

            .crm-overlay {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.52);
              z-index: 20;
            }

            .crm-main {
              padding: 14px;
            }

            .crm-topbar {
              border-radius: 14px;
              padding: 14px;
              align-items: flex-start;
            }

            .crm-mobile-button {
              display: inline-flex;
              align-items: center;
              gap: 8px;
            }

            .crm-topbar-title h2 {
              font-size: 20px;
            }

            .crm-module-badge {
              display: none;
            }
          }
        `}
      </style>

      {menuAbierto && <div className="crm-overlay" onClick={() => setMenuAbierto(false)} />}

      <aside className={`crm-sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="crm-brand">
          <h1>{esVendedor ? 'Panel Vendedor' : 'CRM CENTRAL ELANKAV'}</h1>
          <p>{esVendedor ? 'Gestión comercial limitada' : 'ERP operativo para ELANKAV'}</p>
          <p>Usuario: {usuarioActivoCRM?.nombre || 'Usuario activo'}</p>
        </div>

        {modulosVisibles.map((grupo) => (
          <div className="crm-group" key={grupo.grupo}>
            <p className="crm-group-title">{grupo.grupo}</p>

            {grupo.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`crm-nav-button ${modulo === item.id ? 'active' : ''}`}
                onClick={() => abrirModulo(item.id)}
              >
                <span className="crm-nav-icon">{item.icono}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="crm-main">
        <div className="crm-topbar">
          <button
            type="button"
            className="crm-mobile-button"
            onClick={() => setMenuAbierto(true)}
          >
            Menú
          </button>

          <div className="crm-topbar-title">
            <h2>{moduloActivo?.label || 'Clientes'}</h2>
            <p>
              {esVendedor
                ? 'Panel comercial para clientes, cotizaciones, pedidos y seguimiento.'
                : `CRM Central conectado a la cadena operativa completa. Rol activo: ${rolUsuarioActivoCRM?.nombre || 'Administrador General'}.`}
            </p>
          </div>

          <div className="crm-module-badge">
            {moduloActivo?.label || 'Clientes'}
          </div>
        </div>

        <section className="crm-content">
          {moduloActivo?.componente || <Clientes />}
        </section>
      </main>
    </div>
  );
}

