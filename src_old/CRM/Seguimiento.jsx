import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const etapas = [
  'Lead',
  'Cotización',
  'Pedido',
  'Orden de Trabajo',
  'Producción',
  'Comisión',
];

function fechaCorta(fecha) {
  if (!fecha) return 'Sin fecha';

  try {
    return new Date(fecha).toLocaleDateString('es-NI');
  } catch {
    return 'Sin fecha';
  }
}

function moneda(valor) {
  return `US$ ${Number(valor || 0).toFixed(2)}`;
}

export default function Seguimiento() {
  const {
    leads = [],
    cotizaciones = [],
    pedidos = [],
    ordenes = [],
    producciones = [],
    comisiones = [],
  } = useElan();

  const [busqueda, setBusqueda] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState('Todas');

  const lineas = useMemo(() => {
    const registros = [];

    leads.forEach((lead) => {
      registros.push({
        id: lead.id,
        codigo: lead.codigo || lead.id,
        etapa: 'Lead',
        cliente: lead.clienteNombre || lead.nombre || lead.cliente || 'Lead sin cliente',
        estado: lead.estado || 'Nuevo',
        responsable: lead.responsable || lead.vendedor || 'Sin responsable',
        fecha: lead.fecha,
        total: 0,
        referencia: lead.origen || 'ELANVISUAL',
      });
    });

    cotizaciones.forEach((cotizacion) => {
      registros.push({
        id: cotizacion.id,
        codigo: cotizacion.codigo || cotizacion.id,
        etapa: 'Cotización',
        cliente:
          cotizacion.clienteNombre ||
          cotizacion.cliente ||
          'Cliente sin nombre',
        estado: cotizacion.estado || 'Borrador',
        responsable: cotizacion.vendedorId || 'Sin vendedor',
        fecha: cotizacion.fecha,
        total: cotizacion.total || 0,
        referencia: cotizacion.pedidoId
          ? `Pedido: ${cotizacion.pedidoId}`
          : 'Sin pedido',
      });
    });

    pedidos.forEach((pedido) => {
      registros.push({
        id: pedido.id,
        codigo: pedido.codigo || pedido.id,
        etapa: 'Pedido',
        cliente:
          pedido.clienteNombre ||
          pedido.cliente ||
          'Cliente sin nombre',
        estado: pedido.estado || 'Nuevo',
        responsable: pedido.vendedorId || 'Sin vendedor',
        fecha: pedido.fecha,
        total: pedido.total || 0,
        referencia: pedido.ordenId
          ? `OT: ${pedido.ordenId}`
          : 'Sin orden de trabajo',
      });
    });

    ordenes.forEach((orden) => {
      registros.push({
        id: orden.id,
        codigo: orden.codigo || orden.id,
        etapa: 'Orden de Trabajo',
        cliente:
          orden.clienteNombre ||
          orden.cliente ||
          'Cliente sin nombre',
        estado: orden.estado || 'Pendiente',
        responsable: orden.responsable || 'Producción',
        fecha: orden.fecha,
        total: 0,
        referencia: orden.produccionId
          ? `Producción: ${orden.produccionId}`
          : 'Sin producción',
      });
    });

    producciones.forEach((produccion) => {
      registros.push({
        id: produccion.id,
        codigo: produccion.codigo || produccion.id,
        etapa: 'Producción',
        cliente:
          produccion.clienteNombre ||
          produccion.cliente ||
          'Cliente sin nombre',
        estado: produccion.estado || 'En cola',
        responsable: produccion.responsable || 'Producción',
        fecha: produccion.fecha,
        total: 0,
        referencia: `Avance: ${Number(produccion.avance || 0)}%`,
      });
    });

    comisiones.forEach((comision) => {
      registros.push({
        id: comision.id,
        codigo: comision.codigo || comision.id,
        etapa: 'Comisión',
        cliente:
          comision.clienteNombre ||
          comision.cliente ||
          'Cliente sin nombre',
        estado: comision.estado || 'Pendiente',
        responsable: comision.vendedorId || 'Sin vendedor',
        fecha: comision.fecha,
        total: comision.monto || 0,
        referencia: comision.pedidoId
          ? `Pedido: ${comision.pedidoId}`
          : 'Sin pedido',
      });
    });

    return registros.sort((a, b) => {
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  }, [leads, cotizaciones, pedidos, ordenes, producciones, comisiones]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    return lineas.filter((linea) => {
      const coincideEtapa =
        etapaFiltro === 'Todas' || linea.etapa === etapaFiltro;

      const texto = [
        linea.codigo,
        linea.etapa,
        linea.cliente,
        linea.estado,
        linea.responsable,
        linea.referencia,
      ]
        .join(' ')
        .toLowerCase();

      const coincideBusqueda = !q || texto.includes(q);

      return coincideEtapa && coincideBusqueda;
    });
  }, [lineas, busqueda, etapaFiltro]);

  const resumen = useMemo(() => {
    return etapas.reduce((acc, etapa) => {
      acc[etapa] = lineas.filter((linea) => linea.etapa === etapa).length;
      return acc;
    }, {});
  }, [lineas]);

  return (
    <div>
      <h2>Seguimiento CRM</h2>

      <p>
        Vista ejecutiva del flujo comercial y operativo de ELANVISUAL:
        lead, cotización, pedido, orden de trabajo, producción y comisión.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
          margin: '16px 0',
        }}
      >
        {etapas.map((etapa) => (
          <div
            key={etapa}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <strong>{resumen[etapa] || 0}</strong>
            <p>{etapa}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente, código, estado, responsable o referencia..."
          style={{ width: '100%' }}
        />

        <select
          value={etapaFiltro}
          onChange={(e) => setEtapaFiltro(e.target.value)}
          style={{ width: '100%' }}
        >
          <option value="Todas">Todas las etapas</option>
          {etapas.map((etapa) => (
            <option key={etapa} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <p>No hay registros de seguimiento.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtradas.map((linea) => (
            <div
              key={`${linea.etapa}-${linea.id}`}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 12,
                display: 'grid',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <strong>
                    {linea.codigo} — {linea.cliente}
                  </strong>
                  <p>{linea.etapa}</p>
                </div>

                <span>{linea.estado}</span>
              </div>

              <small>
                Responsable: {linea.responsable} | Fecha:{' '}
                {fechaCorta(linea.fecha)}
              </small>

              <small>Referencia: {linea.referencia}</small>

              {Number(linea.total || 0) > 0 && (
                <small>Total / monto: {moneda(linea.total)}</small>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}