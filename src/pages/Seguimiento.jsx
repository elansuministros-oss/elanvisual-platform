import React, { useMemo, useState } from 'react';
import { Camera, Clock, Search, Video } from 'lucide-react';
import { estadosProduccion, etiquetasEstado, useApp } from '../context/AppContext';
import { formatoC$ } from '../lib/calculos';

const evidenciaLabels = {
  inicial: 'Evidencia inicial',
  proceso: 'Evidencia proceso',
  terminado: 'Evidencia terminado',
  entrega: 'Evidencia entrega',
};

function normalizarEvidencia(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') {
    return {
      url: valor,
      tipo: valor.startsWith('data:video') ? 'video' : 'imagen',
      mime: valor.slice(5, valor.indexOf(';')) || '',
      nombre: 'Evidencia cargada',
      fecha: '',
      estado: '',
    };
  }
  return {
    url: valor.url || valor.dataUrl || valor.imagen || '',
    tipo: valor.tipo || (String(valor.mime || '').startsWith('video') ? 'video' : 'imagen'),
    mime: valor.mime || '',
    nombre: valor.nombre || 'Evidencia cargada',
    fecha: valor.fecha || valor.updatedAt || valor.createdAt || '',
    estado: valor.estado || '',
  };
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha registrada';
  try {
    return new Date(fecha).toLocaleString('es-NI', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return fecha;
  }
}

function obtenerUltimaActualizacion(pedido, evidencias) {
  const fechas = [
    pedido?.ordenTrabajo?.fecha,
    pedido?.updatedAt,
    pedido?.createdAt,
    ...(pedido?.historial || []).map((h) => h.fecha),
    ...evidencias.map((e) => e.evidencia?.fecha),
  ].filter(Boolean);

  if (fechas.length === 0) return '';
  return fechas.sort((a, b) => new Date(b) - new Date(a))[0];
}

export default function Seguimiento() {
  const { buscarPedidoSeguimiento } = useApp();
  const [form, setForm] = useState({ codigo: '', whatsapp: '' });
  const [pedido, setPedido] = useState(null);
  const [buscado, setBuscado] = useState(false);

  function consultar(e) {
    e.preventDefault();
    const encontrado = buscarPedidoSeguimiento(form);
    setPedido(encontrado || null);
    setBuscado(true);
  }

  const indiceActual = pedido ? estadosProduccion.indexOf(pedido.estadoProduccion) : -1;

  const evidencias = useMemo(() => {
    const datos = pedido?.ordenTrabajo?.evidencias || {};
    return Object.entries(evidenciaLabels)
      .map(([tipo, label]) => ({ tipo, label, evidencia: normalizarEvidencia(datos[tipo]) }))
      .filter((item) => item.evidencia?.url);
  }, [pedido]);

  const ultimaActualizacion = obtenerUltimaActualizacion(pedido, evidencias);

  return (
    <main className="tracking-page">
      <section className="panel tracking-card">
        <span className="badge">Seguimiento de pedido</span>
        <h1>Consulta como va tu producto</h1>
        <p className="note">Ingresa el codigo que ELANVISUAL te envio por WhatsApp despues de confirmar tu anticipo.</p>
        <form className="form-grid" onSubmit={consultar}>
          <input placeholder="Codigo. Ej: EP-2026-000123" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          <input placeholder="WhatsApp usado en el pedido" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <button><Search size={18} /> Consultar pedido</button>
        </form>
      </section>

      {buscado && !pedido && <section className="panel"><p>No encontramos un pedido con esos datos. Revisa el codigo o el numero de WhatsApp.</p></section>}

      {pedido && <section className="panel">
        <h2>{pedido.codigoSeguimiento || pedido.numero}</h2>
        <div className="tracking-summary">
          <div><b>Cliente</b><span>{pedido.cliente?.nombre}</span></div>
          <div><b>Total</b><span>{formatoC$(pedido.resumen?.total || pedido.total || 0)}</span></div>
          <div><b>Anticipo recibido</b><span>{formatoC$(pedido.anticipoRecibido || 0)}</span></div>
          <div><b>Saldo pendiente</b><span>{formatoC$(pedido.saldoPendiente || 0)}</span></div>
        </div>

        <h3>Estado actual: {etiquetasEstado[pedido.estadoProduccion] || pedido.estadoProduccion}</h3>
        <p className="note"><Clock size={15} /> Ãšltima actualizacion: {formatearFecha(ultimaActualizacion)}</p>

        {pedido.ordenTrabajo?.observaciones && (
          <div className="payment-box">
            <h3>Observacion de produccion</h3>
            <p>{pedido.ordenTrabajo.observaciones}</p>
          </div>
        )}

        <div className="timeline">
          {estadosProduccion.map((estado, idx) => (
            <div key={estado} className={idx <= indiceActual ? 'timeline-step done' : 'timeline-step'}>
              <span>{idx < indiceActual ? 'âœ“' : idx === indiceActual ? 'â—' : 'â—‹'}</span>
              <b>{etiquetasEstado[estado]}</b>
            </div>
          ))}
        </div>

        <section className="section-block">
          <h3>Evidencias del pedido</h3>
          {evidencias.length === 0 ? (
            <div className="evidencia-placeholder">Aun no hay fotos o videos cargados para este pedido.</div>
          ) : (
            <div className="evidencias-grid">
              {evidencias.map(({ tipo, label, evidencia }) => (
                <article className="evidencia-card" key={tipo}>
                  <h3>
                    {evidencia.tipo === 'video' ? <Video size={17} /> : <Camera size={17} />} {label}
                  </h3>

                  {evidencia.tipo === 'video' ? (
                    <video src={evidencia.url} controls playsInline style={{ width: '100%', borderRadius: 12, marginBottom: 10 }} />
                  ) : (
                    <img src={evidencia.url} alt={label} />
                  )}

                  <p className="note">Actualizado: {formatearFecha(evidencia.fecha)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>}
    </main>
  );
}

