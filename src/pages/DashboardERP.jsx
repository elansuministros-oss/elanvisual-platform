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

function contador(lista) {
  return Array.isArray(lista) ? lista.length : 0;
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
        borderRadius: 24,
        padding: 18,
        textAlign: 'left',
        minHeight: 150,
        boxShadow: '0 16px 38px rgba(15,23,42,.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: `${accent}16`,
          color: accent,
        }}
      >
        {icon}
      </span>

      <div>
        <strong
          style={{
            display: 'block',
            fontSize: 17,
            color: '#0f172a',
            letterSpacing: '-.02em',
          }}
        >
          {title}
        </strong>

        <b
          style={{
            display: 'block',
            fontSize: 28,
            color: '#0f172a',
            marginTop: 4,
          }}
        >
          {count}
        </b>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            lineHeight: 1.35,
            color: '#64748b',
          }}
        >
          {desc}
        </p>
      </div>
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
        <small style={{ color: '#64748b', fontSize: 12 }}>{desc}</small>
      </span>
    </button>
  );
}

export default function DashboardERP({ setPage }) {
  const app = useApp();
  const [area, setArea] = useState('dashboard');

  const {
    usuario,
    clientes,
    productos,
    pedidos,
    trabajos,
    banners,
    materiales,
    materialesCostos,
    ordenesTrabajo,
    ordenes,
    cotizaciones,
    configuracion,
  } = app;

  const data = useMemo(() => {
    const totalClientes = contador(clientes);
    const totalProductos = contador(productos);
    const totalPedidos = contador(pedidos);
    const totalTrabajos = contador(trabajos);
    const totalBanners = contador(banners);
    const totalMateriales = contador(materiales) || contador(materialesCostos);
    const totalOT = contador(ordenesTrabajo) || contador(ordenes);
    const totalCotizaciones = contador(cotizaciones);

    return {
      totalClientes,
      totalProductos,
      totalPedidos,
      totalTrabajos,
      totalBanners,
      totalMateriales,
      totalOT,
      totalCotizaciones,
    };
  }, [
    clientes,
    productos,
    pedidos,
    trabajos,
    banners,
    materiales,
    materialesCostos,
    ordenesTrabajo,
    ordenes,
    cotizaciones,
  ]);

  const brandName = configuracion?.logoTexto || configuracion?.nombreSitio || 'ELANVISUAL';

  const areas = [
    {
      key: 'crm',
      title: 'CRM',
      count: data.totalClientes,
      desc: 'Leads, prospectos, clientes, seguimiento y agenda comercial.',
      icon: <Users size={25} />,
      accent: '#1E5AA8',
    },
    {
      key: 'ventas',
      title: 'Ventas',
      count: data.totalPedidos + data.totalCotizaciones,
      desc: 'Cotizador, pedidos y órdenes de trabajo conectadas.',
      icon: <HandCoins size={25} />,
      accent: '#059669',
    },
    {
      key: 'produccion',
      title: 'Producción',
      count: data.totalOT,
      desc: 'OT, fabricación, instalación, entrega y control operativo.',
      icon: <Factory size={25} />,
      accent: '#ea580c',
    },
    {
      key: 'inventario',
      title: 'Inventario',
      count: data.totalMateriales,
      desc: 'Material Master, compras, proveedores y consumos.',
      icon: <PackageSearch size={25} />,
      accent: '#7c3aed',
    },
    {
      key: 'finanzas',
      title: 'Finanzas',
      count: money(0),
      desc: 'Anticipos, cobros, CxC, CxP y comisiones.',
      icon: <WalletCards size={25} />,
      accent: '#0f766e',
    },
    {
      key: 'reportes',
      title: 'Reportes',
      count: data.totalPedidos + data.totalTrabajos,
      desc: 'Ventas, producción, rentabilidad y comportamiento de clientes.',
      icon: <BarChart3 size={25} />,
      accent: '#be123c',
    },
    {
      key: 'admin',
      title: 'Admin',
      count: data.totalProductos + data.totalBanners,
      desc: 'Usuarios, roles, configuración, catálogo y multimedia.',
      icon: <Settings size={25} />,
      accent: '#334155',
    },
  ];

  const renderArea = () => {
    if (area === 'crm') {
      return (
        <>
          <MiniAction icon={<Users size={20} />} title="Abrir CRM" desc="Gestión comercial heredada funcional." onClick={() => setPage('crm')} />
          <MiniAction icon={<CalendarDays size={20} />} title="Seguimiento" desc="Consulta pública y control de avances." onClick={() => setPage('seguimiento')} />
          <MiniAction icon={<ClipboardList size={20} />} title="Clientes / prospectos" desc="Base local conectada al flujo actual." onClick={() => setPage('crm')} />
        </>
      );
    }

    if (area === 'ventas') {
      return (
        <>
          <MiniAction icon={<Calculator size={20} />} title="Cotizador Visual V2" desc="Cotización por materiales, medidas y servicio." onClick={() => setPage('cotizador')} />
          <MiniAction icon={<PackageCheck size={20} />} title="Pedidos / OT" desc="Convierte ventas en órdenes operativas." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<BriefcaseBusiness size={20} />} title="Servicios" desc="Catálogo comercial vigente." onClick={() => setPage('catalogo')} />
        </>
      );
    }

    if (area === 'produccion') {
      return (
        <>
          <MiniAction icon={<Factory size={20} />} title="Panel de producción" desc="Control de fabricación y estados." onClick={() => setPage('produccion')} />
          <MiniAction icon={<ClipboardCheck size={20} />} title="Pedidos / OT" desc="Órdenes listas para taller." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<Truck size={20} />} title="Instalación / entrega" desc="Flujo operativo conectado a producción." onClick={() => setPage('produccion')} />
        </>
      );
    }

    if (area === 'inventario') {
      return (
        <>
          <MiniAction icon={<PackageSearch size={20} />} title="Material Master V2" desc="Base real de materiales y costos." onClick={() => setPage('materiales')} />
          <MiniAction icon={<Calculator size={20} />} title="Consumos por cotización" desc="Relación materiales → venta → OT." onClick={() => setPage('cotizador')} />
          <MiniAction icon={<FileText size={20} />} title="Compras / proveedores" desc="Preparado sobre estructura de materiales." onClick={() => setPage('materiales')} />
        </>
      );
    }

    if (area === 'finanzas') {
      return (
        <>
          <MiniAction icon={<WalletCards size={20} />} title="Anticipos y cobros" desc="Control financiero conectado a pedidos." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<HandCoins size={20} />} title="CxC / CxP" desc="Base operativa desde ventas y producción." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<BarChart3 size={20} />} title="Comisiones" desc="Preparado para vendedores y roles." onClick={() => setPage('crm')} />
        </>
      );
    }

    if (area === 'reportes') {
      return (
        <>
          <MiniAction icon={<BarChart3 size={20} />} title="Reporte comercial" desc="Pedidos, clientes y cotizaciones." onClick={() => setPage('pedidos')} />
          <MiniAction icon={<Factory size={20} />} title="Reporte producción" desc="OT, instalación y entrega." onClick={() => setPage('produccion')} />
          <MiniAction icon={<Users size={20} />} title="Reporte clientes" desc="CRM y seguimiento comercial." onClick={() => setPage('crm')} />
        </>
      );
    }

    if (area === 'admin') {
      return (
        <>
          <MiniAction icon={<ShieldCheck size={20} />} title="Administración" desc="Usuarios, roles y configuración." onClick={() => setPage('admin')} />
          <MiniAction icon={<BriefcaseBusiness size={20} />} title="Catálogo público" desc="Servicios visibles para cliente final." onClick={() => setPage('catalogo')} />
          <MiniAction icon={<LayoutDashboard size={20} />} title="Portafolio / multimedia" desc="Trabajos, banners e identidad visual." onClick={() => setPage('trabajos')} />
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
        padding: '22px 14px 40px',
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            borderRadius: 30,
            padding: 22,
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
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <LayoutDashboard size={18} />
            ERP OPERATIVO
          </span>

          <h1
            style={{
              margin: '16px 0 8px',
              fontSize: 'clamp(30px, 7vw, 56px)',
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
              fontSize: 16,
              lineHeight: 1.45,
            }}
          >
            Centro operativo móvil para CRM, ventas, producción, inventario, finanzas,
            reportes y administración de rotulación.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
              marginTop: 18,
            }}
          >
            <div>
              <b style={{ fontSize: 24 }}>{data.totalPedidos}</b>
              <small style={{ display: 'block', color: 'rgba(255,255,255,.72)' }}>Pedidos</small>
            </div>
            <div>
              <b style={{ fontSize: 24 }}>{data.totalMateriales}</b>
              <small style={{ display: 'block', color: 'rgba(255,255,255,.72)' }}>Materiales</small>
            </div>
            <div>
              <b style={{ fontSize: 24 }}>{data.totalClientes}</b>
              <small style={{ display: 'block', color: 'rgba(255,255,255,.72)' }}>Clientes</small>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
            gap: 14,
            marginTop: 18,
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
              marginTop: 18,
              background: '#fff',
              borderRadius: 26,
              padding: 18,
              boxShadow: '0 18px 45px rgba(15,23,42,.08)',
              border: '1px solid rgba(15,23,42,.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
              <div>
                <small style={{ color: '#64748b', fontWeight: 800 }}>ÁREA ERP</small>
                <h2 style={{ margin: '4px 0 0', color: '#0f172a', letterSpacing: '-.03em' }}>
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
                  fontWeight: 800,
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