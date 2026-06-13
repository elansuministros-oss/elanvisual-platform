import React, { useMemo } from 'react';
import { useCore } from '../core/context/CoreContext';

const asegurarArray = (valor) => (Array.isArray(valor) ? valor : []);

const calcularTotal = (items, campos = []) =>
  asegurarArray(items).reduce((total, item) => {
    const valorEncontrado = campos
      .map((campo) => Number(item?.[campo]))
      .find((valor) => Number.isFinite(valor));

    return total + (valorEncontrado || 0);
  }, 0);

const descargarJSON = (nombreArchivo, datos) => {
  const contenido = JSON.stringify(datos, null, 2);
  const blob = new Blob([contenido], {
    type: 'application/json;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');

  enlace.href = url;
  enlace.download = nombreArchivo;

  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  URL.revokeObjectURL(url);
};

const obtenerLeadsWhatsApp = (core = {}) => {
  const fuentes = [
    core.leadsWhatsApp,
    core.crm?.leadsWhatsApp,
    core.crm?.leads,
    core.leads,
  ];

  return fuentes.find((valor) => Array.isArray(valor) && valor.length > 0) || [];
};

const estilos = {
  pagina: {
    display: 'grid',
    gap: 18,
  },
  header: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 22,
    boxShadow: '0 8px 24px rgba(15,23,42,.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 18,
    flexWrap: 'wrap',
  },
  titulo: {
    margin: 0,
    color: '#111827',
  },
  texto: {
    margin: '8px 0 0',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  boton: {
    border: 0,
    borderRadius: 14,
    padding: '13px 18px',
    fontWeight: 900,
    cursor: 'pointer',
    background: '#111827',
    color: '#ffffff',
    minWidth: 220,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
  },
  tarjeta: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,.08)',
  },
  stat: {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 14,
  },
  label: {
    display: 'block',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 800,
  },
  valor: {
    display: 'block',
    marginTop: 6,
    color: '#111827',
    fontSize: 22,
    fontWeight: 950,
  },
  lista: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    marginTop: 12,
  },
  itemLista: {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 13,
    color: '#374151',
    fontWeight: 750,
  },
};

export default function ExportadorCRMCentral() {
  const core = useCore();

  const leadsWhatsApp = useMemo(() => obtenerLeadsWhatsApp(core), [core]);

  const datosCRMCentral = useMemo(
    () => ({
      fuente: 'CRM CENTRAL ELANKAV',
      destino: 'ELAN KAVTORE',
      version: 'PDR-0017',
      actualizadoEn: new Date().toISOString(),

      empresas: asegurarArray(core.empresas),
      contactos: asegurarArray(core.contactos),
      seguimiento: asegurarArray(core.seguimiento),
      vendedores: asegurarArray(core.vendedores),
      veterinarias: asegurarArray(core.veterinarias),
      afiliados: asegurarArray(core.afiliados),
      proveedores: asegurarArray(core.proveedores),
      compras: asegurarArray(core.compras),
      cuentasPorPagar: asegurarArray(core.cuentasPorPagar),
      cuentasPorCobrar: asegurarArray(core.cuentasPorCobrar),
      flujoCaja: asegurarArray(core.flujoCaja),
      cotizaciones: asegurarArray(core.cotizaciones),
      pedidos: asegurarArray(core.pedidos),
      ordenesTrabajo: asegurarArray(core.ordenesTrabajo),
      produccion: asegurarArray(core.produccion),
      cobros: asegurarArray(core.cobros),
      comisiones: asegurarArray(core.comisiones),
      inventario: asegurarArray(core.inventario),
      materiales: asegurarArray(core.materiales),
      auditoriaCRM: asegurarArray(core.auditoriaCRM),
      notificacionesCRM: asegurarArray(core.notificacionesCRM),
      leadsWhatsApp,
      usuariosCRM: asegurarArray(core.usuariosCRM),
      rolesCRM: asegurarArray(core.rolesCRM),
    }),
    [core, leadsWhatsApp]
  );

  const resumen = useMemo(
    () => ({
      empresas: datosCRMCentral.empresas.length,
      contactos: datosCRMCentral.contactos.length,
      pedidos: datosCRMCentral.pedidos.length,
      ordenesTrabajo: datosCRMCentral.ordenesTrabajo.length,
      produccion: datosCRMCentral.produccion.length,
      cobros: datosCRMCentral.cobros.length,
      inventario: datosCRMCentral.inventario.length,
      materiales: datosCRMCentral.materiales.length,
      leadsWhatsApp: datosCRMCentral.leadsWhatsApp.length,
      totalCobrado: calcularTotal(datosCRMCentral.cobros, [
        'montoCobrado',
        'monto',
        'total',
        'valor',
        'importe',
      ]),
      totalPedidos: calcularTotal(datosCRMCentral.pedidos, [
        'total',
        'monto',
        'valor',
        'importe',
      ]),
    }),
    [datosCRMCentral]
  );

  const exportarCRMCentral = () => {
    descargarJSON('crm-central.json', datosCRMCentral);
  };

  return (
    <section style={estilos.pagina}>
      <div style={estilos.header}>
        <div>
          <p style={{ margin: 0, color: '#1d4f9f', fontWeight: 900, letterSpacing: 1 }}>
            CRM CENTRAL
          </p>

          <h2 style={estilos.titulo}>Exportador CRM CENTRAL</h2>

          <p style={estilos.texto}>
            Descarga los datos reales guardados en el CRM CENTRAL para alimentar ELAN KAVTORÉ
            mediante el archivo <strong>crm-central.json</strong>.
          </p>
        </div>

        <button type="button" style={estilos.boton} onClick={exportarCRMCentral}>
          Exportar CRM CENTRAL
        </button>
      </div>

      <div style={estilos.grid}>
        <article style={estilos.stat}>
          <span style={estilos.label}>Empresas</span>
          <strong style={estilos.valor}>{resumen.empresas}</strong>
        </article>

        <article style={estilos.stat}>
          <span style={estilos.label}>Contactos</span>
          <strong style={estilos.valor}>{resumen.contactos}</strong>
        </article>

        <article style={estilos.stat}>
          <span style={estilos.label}>Pedidos</span>
          <strong style={estilos.valor}>{resumen.pedidos}</strong>
        </article>

        <article style={estilos.stat}>
          <span style={estilos.label}>Producción</span>
          <strong style={estilos.valor}>{resumen.produccion}</strong>
        </article>

        <article style={estilos.stat}>
          <span style={estilos.label}>Cobros</span>
          <strong style={estilos.valor}>{resumen.cobros}</strong>
        </article>

        <article style={estilos.stat}>
          <span style={estilos.label}>Leads WhatsApp</span>
          <strong style={estilos.valor}>{resumen.leadsWhatsApp}</strong>
        </article>
      </div>

      <div style={estilos.tarjeta}>
        <h3>Cadena de transferencia</h3>

        <p style={estilos.texto}>
          CRM CENTRAL → descarga <strong>crm-central.json</strong> → copiar a{' '}
          <strong>D:\ELAN\LAB\public</strong> → publicar KAVTORÉ.
        </p>
      </div>

      <div style={estilos.tarjeta}>
        <h3>Contenido incluido</h3>

        <div style={estilos.lista}>
          <span style={estilos.itemLista}>Empresas: {resumen.empresas}</span>
          <span style={estilos.itemLista}>Contactos: {resumen.contactos}</span>
          <span style={estilos.itemLista}>Pedidos: {resumen.pedidos}</span>
          <span style={estilos.itemLista}>Órdenes: {resumen.ordenesTrabajo}</span>
          <span style={estilos.itemLista}>Producción: {resumen.produccion}</span>
          <span style={estilos.itemLista}>Cobros: {resumen.cobros}</span>
          <span style={estilos.itemLista}>Inventario: {resumen.inventario}</span>
          <span style={estilos.itemLista}>Materiales: {resumen.materiales}</span>
          <span style={estilos.itemLista}>Leads WhatsApp: {resumen.leadsWhatsApp}</span>
        </div>
      </div>
    </section>
  );
}