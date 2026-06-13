import React, { useMemo, useState } from 'react';
import { Camera, ClipboardList, ExternalLink, PackageCheck, Save, Send, Video } from 'lucide-react';
import { estadosProduccion, etiquetasEstado, useApp } from '../context/AppContext';

const evidenciaLabels = {
  inicial: 'Evidencia inicial',
  proceso: 'Evidencia proceso',
  terminado: 'Evidencia terminado',
  entrega: 'Evidencia entrega',
};

const estadoDefault = 'pendiente';
const seguimientoUrl = 'https://pet.elankav.com/seguimiento';

function estadoPedido(pedido) {
  return pedido.estadoProduccion || pedido.ordenTrabajo?.estadoProduccion || estadoDefault;
}

function crearOTBase(pedido) {
  const items = pedido.items || [];
  return {
    codigoOT:
      pedido.ordenTrabajo?.codigoOT ||
      `OT-${String(pedido.codigoSeguimiento || pedido.numero || pedido.id || Date.now()).replace(/[^0-9]/g, '').slice(-6)}`,
    pedido: pedido.codigoSeguimiento || pedido.numero || '',
    cliente: pedido.cliente?.nombre || '',
    veterinaria: pedido.veterinaria?.nombre || pedido.veterinariaNombre || '',
    producto: items.map((item) => item.nombre).join(', '),
    cantidad: items.reduce((total, item) => total + Number(item.cantidad || 0), 0),
    responsable: pedido.ordenTrabajo?.responsable || '',
    observaciones: pedido.ordenTrabajo?.observaciones || '',
    fecha: pedido.ordenTrabajo?.fecha || pedido.createdAt || new Date().toISOString(),
    estadoProduccion: estadoPedido(pedido),
    evidencias: {
      inicial: '',
      proceso: '',
      terminado: '',
      entrega: '',
      ...(pedido.ordenTrabajo?.evidencias || {}),
    },
  };
}

function leerArchivoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizarEvidencia(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') {
    return {
      url: valor,
      tipo: valor.startsWith('data:video') ? 'video' : 'imagen',
      mime: valor.slice(5, valor.indexOf(';')) || '',
      nombre: 'Evidencia cargada',
      fecha: '',
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
  if (!fecha) return '';
  try {
    return new Date(fecha).toLocaleString('es-NI', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return fecha;
  }
}

function numeroWhatsApp(numero) {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (limpio.length === 8) return `505${limpio}`;
  return limpio;
}

function crearMensajeWhatsApp(pedido, estado) {
  const codigo = pedido.codigoSeguimiento || pedido.numero || '';
  const cliente = pedido.cliente?.nombre || 'cliente';
  const estadoTexto = etiquetasEstado[estado] || estado || 'Actualizado';

  return [
    '🐾 ELANPET',
    '',
    `Hola ${cliente}.`,
    '',
    `Tu pedido ${codigo} fue actualizado.`,
    '',
    `Estado actual: ${estadoTexto}`,
    '',
    'Podés consultar el avance, fotos o videos desde:',
    seguimientoUrl,
    '',
    `Código: ${codigo}`,
  ].join('\n');
}

export default function ProduccionPanel() {
  const {
    usuario,
    pedidos,
    cambiarEstadoProduccion,
    actualizarOrdenTrabajo,
    guardarEvidenciaProduccion,
  } = useApp();

  const [pedidoActivoId, setPedidoActivoId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');

  const tieneAcceso = usuario?.rol === 'admin' || usuario?.rol === 'produccion';

  const pedidosProduccion = useMemo(() => {
    return pedidos
      .filter((pedido) => pedido.estado !== 'cancelado')
      .filter((pedido) => {
        const texto = `${pedido.codigoSeguimiento || ''} ${pedido.numero || ''} ${pedido.cliente?.nombre || ''} ${pedido.veterinaria?.nombre || ''}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase().trim());
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [pedidos, busqueda]);

  const conteos = useMemo(() => {
    return estadosProduccion.reduce((acc, estado) => {
      acc[estado] = pedidos.filter((pedido) => estadoPedido(pedido) === estado).length;
      return acc;
    }, {});
  }, [pedidos]);

  const pedidoActivo = pedidosProduccion.find((pedido) => pedido.id === pedidoActivoId) || pedidosProduccion[0];
  const ot = pedidoActivo ? crearOTBase(pedidoActivo) : null;

  const guardarCampoOT = (campo, valor) => {
    if (!pedidoActivo) return;
    actualizarOrdenTrabajo(pedidoActivo, { ...ot, [campo]: valor });
    setMensaje('Orden de trabajo actualizada.');
  };

  const cambiarEstado = (estado) => {
    if (!pedidoActivo) return;
    cambiarEstadoProduccion(pedidoActivo, estado);
    setMensaje(`Estado actualizado: ${etiquetasEstado[estado] || estado}.`);
  };

  const subirEvidencia = async (tipo, file) => {
    if (!pedidoActivo || !file) return;

    const esImagen = file.type.startsWith('image/');
    const esVideo = file.type.startsWith('video/');

    if (!esImagen && !esVideo) {
      setMensaje('Formato no permitido. Usá imagen o video.');
      return;
    }

    const maxMb = esVideo ? 25 : 8;
    if (file.size > maxMb * 1024 * 1024) {
      setMensaje(`Archivo muy pesado. Máximo recomendado: ${maxMb} MB.`);
      return;
    }

    try {
      const dataUrl = await leerArchivoComoBase64(file);
      const evidencia = {
        url: dataUrl,
        tipo: esVideo ? 'video' : 'imagen',
        mime: file.type,
        nombre: file.name,
        fecha: new Date().toISOString(),
        estado: estadoPedido(pedidoActivo),
      };

      guardarEvidenciaProduccion(pedidoActivo, tipo, evidencia);
      setMensaje(`${evidenciaLabels[tipo]} guardada. El cliente podrá verla en Seguimiento con su código.`);
    } catch {
      setMensaje('No se pudo cargar la evidencia.');
    }
  };

  const notificarWhatsApp = () => {
    if (!pedidoActivo) return;
    const numero = numeroWhatsApp(pedidoActivo.cliente?.whatsapp || pedidoActivo.cliente?.telefono);
    if (!numero) {
      setMensaje('Este pedido no tiene WhatsApp válido para notificar.');
      return;
    }

    const texto = encodeURIComponent(crearMensajeWhatsApp(pedidoActivo, estadoPedido(pedidoActivo)));
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank', 'noopener,noreferrer');
    setMensaje('Mensaje de WhatsApp preparado. No se envía la foto; el cliente la ve desde Seguimiento.');
  };

  if (!tieneAcceso) {
    return (
      <main>
        <section className="panel">
          <h1>Acceso restringido</h1>
          <p>Este panel es solo para administración y producción.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <h1>Producción ELANPET</h1>

      <section className="dashboard produccion-dashboard">
        {estadosProduccion.map((estado) => (
          <article className="panel stat-card" key={estado}>
            <span>{etiquetasEstado[estado] || estado}</span>
            <b>{conteos[estado] || 0}</b>
          </article>
        ))}
      </section>

      <section className="panel section-block">
        <h2>
          <ClipboardList size={20} /> Órdenes de trabajo
        </h2>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por pedido, cliente o veterinaria"
        />

        {pedidosProduccion.length === 0 ? (
          <p>No hay pedidos para producción todavía.</p>
        ) : (
          <div className="produccion-layout">
            <div className="produccion-lista">
              {pedidosProduccion.map((pedido) => (
                <button
                  type="button"
                  key={pedido.id}
                  className={`produccion-item ${pedidoActivo?.id === pedido.id ? 'active' : ''}`}
                  onClick={() => setPedidoActivoId(pedido.id)}
                >
                  <strong>{pedido.codigoSeguimiento || pedido.numero}</strong>
                  <span>{pedido.cliente?.nombre || 'Cliente sin nombre'}</span>
                  <small>{etiquetasEstado[estadoPedido(pedido)] || estadoPedido(pedido)}</small>
                </button>
              ))}
            </div>

            {pedidoActivo && ot && (
              <div className="produccion-detalle">
                <div className="ot-header">
                  <div>
                    <span className="badge">Orden de Trabajo</span>
                    <h2>{ot.codigoOT}</h2>
                  </div>
                  <PackageCheck size={32} />
                </div>

                <div className="form-grid">
                  <label>
                    Código OT
                    <input value={ot.codigoOT} onChange={(e) => guardarCampoOT('codigoOT', e.target.value)} />
                  </label>

                  <label>
                    Pedido
                    <input value={ot.pedido} readOnly />
                  </label>

                  <label>
                    Cliente
                    <input value={ot.cliente} readOnly />
                  </label>

                  <label>
                    Veterinaria
                    <input value={ot.veterinaria} readOnly />
                  </label>

                  <label>
                    Producto
                    <input value={ot.producto} readOnly />
                  </label>

                  <label>
                    Cantidad
                    <input value={ot.cantidad} readOnly />
                  </label>

                  <label>
                    Responsable
                    <input value={ot.responsable} onChange={(e) => guardarCampoOT('responsable', e.target.value)} placeholder="Nombre del responsable" />
                  </label>

                  <label>
                    Fecha
                    <input type="date" value={String(ot.fecha || '').slice(0, 10)} onChange={(e) => guardarCampoOT('fecha', e.target.value)} />
                  </label>

                  <label className="full-row">
                    Observaciones
                    <textarea value={ot.observaciones} onChange={(e) => guardarCampoOT('observaciones', e.target.value)} placeholder="Notas internas de producción" rows={3} />
                  </label>
                </div>

                <div className="actions-row">
                  <button type="button" className="btn-outline" onClick={notificarWhatsApp}>
                    <Send size={17} /> Avisar por WhatsApp
                  </button>
                  <button type="button" className="btn-outline" onClick={() => window.open(seguimientoUrl, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink size={17} /> Abrir seguimiento
                  </button>
                </div>

                <div className="estado-produccion-bar">
                  {estadosProduccion.map((estado) => (
                    <button
                      type="button"
                      key={estado}
                      className={estadoPedido(pedidoActivo) === estado ? 'active' : ''}
                      onClick={() => cambiarEstado(estado)}
                    >
                      {etiquetasEstado[estado] || estado}
                    </button>
                  ))}
                </div>

                <section className="evidencias-grid">
                  {Object.entries(evidenciaLabels).map(([tipo, label]) => {
                    const evidencia = normalizarEvidencia(ot.evidencias?.[tipo]);
                    return (
                      <article className="evidencia-card" key={tipo}>
                        <h3>
                          {evidencia?.tipo === 'video' ? <Video size={17} /> : <Camera size={17} />} {label}
                        </h3>

                        {evidencia?.url ? (
                          evidencia.tipo === 'video' ? (
                            <video src={evidencia.url} controls playsInline style={{ width: '100%', borderRadius: 12, marginBottom: 10 }} />
                          ) : (
                            <img src={evidencia.url} alt={label} />
                          )
                        ) : (
                          <div className="evidencia-placeholder">Sin evidencia</div>
                        )}

                        {evidencia?.fecha && <p className="note">Actualizado: {formatearFecha(evidencia.fecha)}</p>}

                        <input
                          type="file"
                          accept="image/*,video/mp4,video/quicktime,video/webm"
                          onChange={(e) => subirEvidencia(tipo, e.target.files?.[0])}
                        />
                      </article>
                    );
                  })}
                </section>

                {mensaje && (
                  <p className="success-msg">
                    <Save size={16} /> {mensaje}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
