import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FileText,
  HandCoins,
  LayoutDashboard,
  PackageCheck,
  PackageSearch,
  PlusCircle,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const money = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

const contador = (lista) => (Array.isArray(lista) ? lista.length : 0);

const estadoActivo = (valor) => {
  const estado = String(valor || '').toLowerCase().trim();
  return !['entregado', 'cancelado', 'cerrado', 'finalizado'].includes(estado);
};

function KPI({ title, value, desc, icon }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.12)',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: 18,
        padding: 12,
        minHeight: 86,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <small style={{ color: 'rgba(255,255,255,.72)', fontWeight: 900 }}>{title}</small>
        <span style={{ color: 'rgba(255,255,255,.75)' }}>{icon}</span>
      </div>
      <b style={{ display: 'block', fontSize: 25, marginTop: 8 }}>{value}</b>
      <small style={{ color: 'rgba(255,255,255,.62)' }}>{desc}</small>
    </div>
  );
}

function QuickAction({ icon, title, desc, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: '1px solid rgba(15,23,42,.08)',
        background: primary ? '#0f172a' : '#fff',
        color: primary ? '#fff' : '#0f172a',
        borderRadius: 22,
        padding: 15,
        textAlign: 'left',
        minHeight: 96,
        display: 'grid',
        gridTemplateColumns: '42px 1fr',
        gap: 12,
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: '0 14px 32px rgba(15,23,42,.08)',
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          background: primary ? 'rgba(255,255,255,.12)' : '#eef4ff',
          color: primary ? '#fff' : '#1E5AA8',
        }}
      >
        {icon}
      </span>
      <span>
        <b style={{ display: 'block', fontSize: 15 }}>{title}</b>
        <small style={{ color: primary ? 'rgba(255,255,255,.68)' : '#64748b', fontWeight: 700 }}>
          {desc}
        </small>
      </span>
    </button>
  );
}

function ERPCard({ icon, title, count, desc, onClick, accent = '#1E5AA8' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="erp-card"
      style={{
        border: '1px solid rgba(15,23,42,.10)',
        background: '#fff',
        borderRadius: 22,
        padding: 14,
        textAlign: 'left',
        minHeight: 112,
        boxShadow: '0 14px 30px rgba(15,23,42,.07)',
        display: 'grid',
        gridTemplateColumns: '42px 1fr',
        gap: 11,
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          background: `${accent}16`,
          color: accent,
        }}
      >
        {icon}
      </span>

      <span>
        <strong style={{ display: 'block', fontSize: 15, color: '#0f172a' }}>{title}</strong>
        <b style={{ display: 'block', fontSize: 24, color: '#0f172a', marginTop: 2 }}>{count}</b>
        <small style={{ color: '#64748b', fontWeight: 700, lineHeight: 1.25 }}>{desc}</small>
      </span>
    </button>
  );
}

function MiniAction({ icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        border: '1px solid rgba(15,23,42,.08)',
        background: '#f8fafc',
        borderRadius: 18,
        padding: 14,
        textAlign: 'left',
        display: 'grid',
        gridTemplateColumns: '38px 1fr',
        gap: 12,
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: '#fff',
          color: '#1E5AA8',
          boxShadow: '0 8px 20px rgba(15,23,42,.06)',
        }}
      >
        {icon}
      </span>
      <span>
        <b style={{ display: 'block', color: '#0f172a', fontSize: 14 }}>{title}</b>
        <small style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{desc}</small>
      </span>
    </button>
  );
}

export default function DashboardERP({ setPage, areaInicial = 'dashboard' }) {
  const app = useApp();
  const [area, setArea] = useState(areaInicial);

  const {
    usuario,
    clientes,
    productos,
    pedidos,
    trabajos,
    banners,
    usuarios,
    configuracion,
    resumen,

    costosReales,
    utilidadesReales,
    comisionesAutomaticas,

    fondoComunidad,
    fondoIncentivo,
    fondoDireccion,
  } = app;

  const data = useMemo(() => {
    const listaPedidos = Array.isArray(pedidos) ? pedidos : [];

    const pedidosActivos = listaPedidos.filter((p) => estadoActivo(p.estado)).length;
    const produccionActiva = listaPedidos.filter((p) => estadoActivo(p.estadoProduccion)).length;

    const totalVentas = listaPedidos.reduce(
      (acc, p) => acc + Number(p.total || p.resumen?.total || p.monto || 0),
      0
    );

    const cxc = listaPedidos.reduce(
      (acc, p) => acc + Number(p.saldoPendiente || p.saldo || 0),
      0
    );

    const utilidadRealTotal = (utilidadesReales || []).reduce((acc, item) => acc + Number(item.utilidadReal || 0), 0);
    const totalComisiones = (comisionesAutomaticas || []).reduce((acc, item) => acc + Number(item.comision || 0), 0);
    const totalComunidad = (fondoComunidad || []).reduce((acc, item) => acc + Number(item.monto || 0), 0);
    const totalIncentivo = (fondoIncentivo || []).reduce((acc, item) => acc + Number(item.monto || 0), 0);
    const totalDireccion = (fondoDireccion || []).reduce((acc, item) => acc + Number(item.monto || 0), 0);
    const utilidadElan = utilidadRealTotal - totalComisiones - totalComunidad - totalIncentivo - totalDireccion;

    return {
      clientes: contador(clientes),
      productos: contador(productos),
      pedidos: listaPedidos.length,
      pedidosActivos,
      produccionActiva,
      trabajos: contador(trabajos),
      banners: contador(banners),
      usuarios: contador(usuarios),
      totalVentas,
      cxc,
      utilidadRealTotal,
      totalComisiones,
      totalComunidad,
      totalIncentivo,
      totalDireccion,
      utilidadElan,
    };
  }, [clientes, productos, pedidos, trabajos, banners, usuarios, utilidadesReales, comisionesAutomaticas, fondoComunidad, fondoIncentivo, fondoDireccion]);

  const brandName = configuracion?.logoTexto || configuracion?.nombreSitio || 'ELANVISUAL';

  const areas = [
    {
      key: 'crm',
      title: 'CRM',
      count: data.clientes,
      desc: 'Clientes y seguimiento',
      icon: <Users size={22} />,
      accent: '#1E5AA8',
    },
    {
      key: 'ventas',
      title: 'Ventas',
      count: data.pedidos,
      desc: 'Pedidos y cotizacion',
      icon: <HandCoins size={22} />,
      accent: '#059669',
    },
    {
      key: 'produccion',
      title: 'Produccion',
      count: data.produccionActiva,
      desc: 'OT en proceso',
      icon: <Factory size={22} />,
      accent: '#ea580c',
    },
    {
      key: 'inventario',
      title: 'Inventario',
      count: data.productos,
      desc: 'Productos / materiales',
      icon: <PackageSearch size={22} />,
      accent: '#7c3aed',
    },
    {
      key: 'finanzas',
      title: 'Finanzas',
      count: money(data.cxc),
      desc: 'CxC estimada',
      icon: <WalletCards size={22} />,
      accent: '#0f766e',
    },
    {
      key: 'reportes',
      title: 'Reportes',
      count: data.trabajos,
      desc: 'Trabajos registrados',
      icon: <BarChart3 size={22} />,
      accent: '#be123c',
    },
    {
      key: 'admin',
      title: 'Admin',
      count: data.usuarios,
      desc: 'Usuarios activos',
      icon: <Settings size={22} />,
      accent: '#334155',
    },
  ];

  const renderArea = () => {
    if (area === 'crm') {
      return (
        <>
          <MiniAction icon={<Users size={20} />} title="Abrir CRM" desc="Clientes, prospectos y seguimiento." onClick={() => setPage('crm')} />
          <MiniAction icon={<CalendarDays size={20} />} title="Seguimiento" desc="Consulta y control de avances." onClick={() => setPage('seguimiento')} />
          <MiniAction icon={<PlusCircle size={20} />} title="Nuevo cliente" desc="Crear contacto desde CRM." onClick={() => setPage('crm')} />
        </>
      );
    }

    if (area === 'ventas') {
      return (
        <>
          <MiniAction icon={<Calculator size={20} />} title="Cotizador Visual V2" desc="Cotizacion por medidas y materiales." onClick={() => setPage('cotizador')} />
          <MiniAction icon={<PackageCheck size={20} />} title="Pedidos / OT" desc="Control de pedidos generados." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<BriefcaseBusiness size={20} />} title="Servicios" desc="Catalogo comercial vigente." onClick={() => setPage('catalogo')} />
        </>
      );
    }

    if (area === 'produccion') {
      return (
        <>
          <MiniAction icon={<Factory size={20} />} title="Panel de produccion" desc="Estados, fabricacion y entrega." onClick={() => setPage('produccion')} />
          <MiniAction icon={<ClipboardCheck size={20} />} title="Pedidos / OT" desc="Ã“rdenes listas para taller." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<Truck size={20} />} title="Instalacion / entrega" desc="Flujo operativo de cierre." onClick={() => setPage('produccion')} />
        </>
      );
    }

    if (area === 'inventario') {
      return (
        <>
          <MiniAction icon={<PackageSearch size={20} />} title="Material Master V2" desc="Base de productos y costos." onClick={() => setPage('materiales')} />
          <MiniAction icon={<Calculator size={20} />} title="Consumo cotizable" desc="Relacion material â†’ venta â†’ OT." onClick={() => setPage('cotizador')} />
          <MiniAction icon={<FileText size={20} />} title="Productos" desc="Catalogo operativo actual." onClick={() => setPage('admin')} />
        </>
      );
    }

    if (area === 'finanzas') {
      return (
        <>
          <MiniAction icon={<WalletCards size={20} />} title="Cobros pendientes" desc="CxC desde pedidos existentes." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<HandCoins size={20} />} title="Ventas registradas" desc="Total acumulado de pedidos." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<BarChart3 size={20} />} title="Reporte financiero" desc="Base para siguiente fase ERP." onClick={() => setArea('reportes')} />
        </>
      );
    }

    if (area === 'reportes') {
      return (
        <>
          <MiniAction icon={<BarChart3 size={20} />} title="Reporte comercial" desc="Pedidos, clientes y trabajos." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<Factory size={20} />} title="Reporte produccion" desc="Produccion activa y entregas." onClick={() => setPage('produccion')} />
          <MiniAction icon={<Users size={20} />} title="Reporte clientes" desc="Base CRM y seguimiento." onClick={() => setPage('crm')} />
        </>
      );
    }

    if (area === 'admin') {
      return (
        <>
          <MiniAction icon={<ShieldCheck size={20} />} title="Administracion" desc="Usuarios, roles y configuracion." onClick={() => setPage('admin')} />
          <MiniAction icon={<BriefcaseBusiness size={20} />} title="Catalogo publico" desc="Servicios visibles al cliente." onClick={() => setPage('catalogo')} />
          <MiniAction icon={<LayoutDashboard size={20} />} title="Portafolio" desc="Trabajos, banners e identidad." onClick={() => setPage('trabajos')} />
        </>
      );
    }

    return null;
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(30,90,168,.16), transparent 34%), linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)',
        padding: '14px 12px 38px',
      }}
    >
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div
          style={{
            borderRadius: 28,
            padding: 18,
            background: 'linear-gradient(135deg,#0f172a,#1E5AA8)',
            color: '#fff',
            boxShadow: '0 24px 60px rgba(15,23,42,.22)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              gap: 8,
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.12)',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            <LayoutDashboard size={17} />
            ERP OPERATIVO
          </span>

          <h1
            style={{
              margin: '14px 0 6px',
              fontSize: 'clamp(30px, 8vw, 52px)',
              lineHeight: 1,
              letterSpacing: '-.05em',
            }}
          >
            {brandName}
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: 'rgba(255,255,255,.82)',
              fontSize: 15,
              lineHeight: 1.4,
              fontWeight: 650,
            }}
          >
            Centro ejecutivo movil para ventas, pedidos, produccion, CRM, inventario y control administrativo.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))',
              gap: 10,
              marginTop: 16,
            }}
          >
            <KPI title="Pedidos Activos" value={data.pedidosActivos} desc="No entregados" icon={<ClipboardList size={18} />} />
            <KPI title="Produccion" value={data.produccionActiva} desc="OT activas" icon={<Factory size={18} />} />
            <KPI title="Clientes" value={data.clientes} desc="CRM base" icon={<Users size={18} />} />
            <KPI title="CxC" value={money(data.cxc)} desc="Saldo pendiente" icon={<WalletCards size={18} />} />
            <KPI title="Ventas" value={money(data.totalVentas)} desc="Pedidos acumulados" icon={<HandCoins size={18} />} />
            <KPI title="Productos" value={data.productos} desc="Catalogo base" icon={<PackageSearch size={18} />} />
          </div>
        </div>

        <section
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <QuickAction primary icon={<Calculator size={22} />} title="Nueva Cotizacion" desc="Abrir cotizador" onClick={() => setPage('cotizador')} />
          <QuickAction icon={<PackageCheck size={22} />} title="Nuevo Pedido" desc="Pedidos / OT" onClick={() => setPage('pedidos')} />
          <QuickAction icon={<Factory size={22} />} title="Nueva OT" desc="Produccion" onClick={() => setPage('produccion')} />
          <QuickAction icon={<Users size={22} />} title="Nuevo Cliente" desc="CRM" onClick={() => setPage('crm')} />
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
            gap: 10,
            marginTop: 14,
          }}
        >
          {areas.map((item) => (
            <ERPCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              count={item.count}
              desc={item.desc}
              accent={item.accent}
              onClick={() => setArea(item.key)}
            />
          ))}
        </div>

        {area !== 'dashboard' && (
          <section
            style={{
              marginTop: 14,
              background: '#fff',
              borderRadius: 24,
              padding: 16,
              boxShadow: '0 18px 45px rgba(15,23,42,.08)',
              border: '1px solid rgba(15,23,42,.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
              <div>
                <small style={{ color: '#64748b', fontWeight: 900 }}>ÃREA ERP</small>
                <h2 style={{ margin: '3px 0 0', color: '#0f172a', letterSpacing: '-.03em' }}>
                  {areas.find((x) => x.key === area)?.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setArea('dashboard')}
                style={{
                  border: 0,
                  borderRadius: 999,
                  padding: '10px 14px',
                  background: '#0f172a',
                  color: '#fff',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Dashboard
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {renderArea()}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
