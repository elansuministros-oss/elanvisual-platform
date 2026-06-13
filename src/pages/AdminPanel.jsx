import React from 'react';
import {
  Building2,
  ClipboardList,
  Factory,
  FileText,
  ImagePlus,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AdminPanel() {
  const { productos, trabajos, banners, pedidos, usuarios, configuracion } = useApp();

  const kpis = [
    { label: 'Servicios', value: productos.length },
    { label: 'Portafolio', value: trabajos.length },
    { label: 'Banners', value: banners.length },
    { label: 'Solicitudes', value: pedidos.length },
    { label: 'Usuarios', value: usuarios.filter((u) => u.activo !== false).length },
  ];

  return (
    <main>
      <div className="admin-head">
        <div>
          <span className="badge">ELANVISUAL · Administración</span>
          <h1>Panel Operativo ELANVISUAL</h1>
          <p className="note">
            Administración visual básica del portal. El flujo comercial completo
            se gestiona desde el CRM Central.
          </p>
        </div>
      </div>

      <section className="cards">
        {kpis.map((item) => (
          <div className="kpi" key={item.label}>
            <b>{item.value}</b>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2><Building2 size={20} /> Estado de unidad</h2>
        <div className="form-grid">
          <label>
            Nombre visible
            <input value={configuracion?.nombreSitio || 'ELANVISUAL'} readOnly />
          </label>

          <label>
            WhatsApp
            <input value={configuracion?.whatsapp || ''} readOnly />
          </label>

          <label>
            Correo
            <input value={configuracion?.correo || ''} readOnly />
          </label>

          <label>
            Anticipo configurado
            <input value={`${configuracion?.anticipoPorcentaje || 60}%`} readOnly />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2><ClipboardList size={20} /> Flujo operativo vigente</h2>
        <p className="note">
          Cliente → Solicitud → Cotización → Pedido → Orden de Trabajo →
          Producción → Instalación → Entrega → Cobro → Comisión.
        </p>
      </section>

      <section className="panel">
        <h2><Factory size={20} /> Administración real</h2>
        <div className="admin-list">
          <article className="admin-row no-image">
            <div>
              <b>CRM Central</b>
              <span>Cotizaciones, pedidos, órdenes de trabajo, producción, cobros y comisiones.</span>
            </div>
            <strong>Principal</strong>
          </article>

          <article className="admin-row no-image">
            <div>
              <b>Producción</b>
              <span>Seguimiento de estados, evidencias y avance operativo.</span>
            </div>
            <strong>Operativo</strong>
          </article>

          <article className="admin-row no-image">
            <div>
              <b>Portal público</b>
              <span>Inicio, servicios, portafolio, solicitud y contacto.</span>
            </div>
            <strong>APP Mode</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2><FileText size={20} /> Módulos activos</h2>
        <div className="admin-list">
          <article className="admin-row no-image">
            <div>
              <b>Servicios fabricables</b>
              <span>Se administran desde catálogo/productos y se muestran como servicios.</span>
            </div>
            <strong>{productos.length}</strong>
          </article>

          <article className="admin-row no-image">
            <div>
              <b>Portafolio</b>
              <span>Trabajos entregados, referencias visuales y casos reales.</span>
            </div>
            <strong>{trabajos.length}</strong>
          </article>

          <article className="admin-row no-image">
            <div>
              <b>Solicitudes</b>
              <span>Entradas generadas desde Solicitud de Servicio.</span>
            </div>
            <strong>{pedidos.length}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2><ShieldCheck size={20} /> Limpieza aplicada</h2>
        <p className="note">
          Este panel ya no administra veterinarias, QR afiliados ni comisiones
          veterinarias. ELANVISUAL usa CRM Central como núcleo operativo.
        </p>
      </section>

      <section className="panel">
        <h2><Settings size={20} /> Próxima fase</h2>
        <p className="note">
          Limpiar AppContext.jsx, eliminar archivos temporales .txt y retirar
          componentes heredados de ELANPET que ya no forman parte del flujo.
        </p>
      </section>

      <section className="panel">
        <h2><ImagePlus size={20} /> Nota técnica</h2>
        <p className="note">
          Este reemplazo es intencionalmente limpio: no destruye CRM, pedidos,
          producción ni seguimiento. Solo elimina la administración visual
          heredada de ELANPET en este panel.
        </p>
      </section>
    </main>
  );
}