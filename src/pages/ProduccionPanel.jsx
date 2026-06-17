import React, { useMemo, useState } from 'react';
import {
  Camera,
  ClipboardList,
  ExternalLink,
  PackageCheck,
  Save,
  Send,
  Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generarProduccionAutomatica } from '../services/motorProduccion';

const ESTADOS_PRODUCCION_VISUAL = [
  'pendiente',
  'diseno',
  'aprobacion_cliente',
  'produccion',
  'instalacion',
  'entregado',
  'cerrado',
];

const ETIQUETAS_ESTADO_VISUAL = {
  pendiente: 'Pendiente',
  diseno: 'Diseño',
  aprobacion_cliente: 'Aprobación cliente',
  produccion: 'Producción',
  instalacion: 'Instalación',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
};

const evidenciaLabels = {
  inicial: 'Evidencia inicial',
  diseno: 'Diseño aprobado',
  proceso: 'Evidencia de producción',
  instalacion: 'Evidencia de instalación',
  entrega: 'Evidencia de entrega',
};

const estadoDefault = 'pendiente';
const seguimientoUrl = 'https://visual.elankav.com/seguimiento';

function estadoPedido(pedido) {
  return pedido.estadoProduccion || pedido.ordenTrabajo?.estadoProduccion || estadoDefault;
}

function limpiarNumero(valor) {
  return String(valor || '').replace(/[^0-9]/g, '');
}

function numeroWhatsApp(numero) {
  const limpio = limpiarNumero(numero);
  if (limpio.length === 8) return `505${limpio}`;
  return limpio;
}

function obtenerMonto(pedido) {
  return Number(
    pedido.total ||
      pedido.monto ||
      pedido.resumen?.total ||
      pedido.cotizacion?.total ||
      0
  );
}

function obtenerAnticipo(pedido) {
  return Number(
    pedido.anticipo ||
      pedido.montoAnticipo ||
      pedido.pago?.anticipo ||
      pedido.resumen?.anticipo ||
      obtenerMonto(pedido) * 0.6 ||
      0
  );
}

function crearOTBase(pedido) {
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const monto = obtenerMonto(pedido);
  const anticipo = obtenerAnticipo(pedido);
  const saldo = Math.max(monto - anticipo, 0);

  return {
    codigoOT:
      pedido.ordenTrabajo?.codigoOT ||
      `OTV-${String(
        pedido.codigoSeguimiento || pedido.numero || pedido.id || Date.now()
      )
        .replace(/[^0-9]/g, '')
        .slice(-6)}`,
    pedido: pedido.codigoSeguimiento || pedido.numero || '',
    cliente: pedido.cliente?.nombre || pedido.clienteNombre || '',
    vendedor: pedido.vendedor || pedido.vendedorNombre || '',
    fecha: pedido.ordenTrabajo?.fecha || pedido.createdAt || new Date().toISOString(),
    servicio:
      pedido.ordenTrabajo?.servicio ||
      pedido.servicio ||
      pedido.tipoServicio ||
      items.map((item) => item.nombre).join(', ') ||
      'Servicio ELANVISUAL',
    monto: pedido.ordenTrabajo?.monto ?? monto,
    anticipo: pedido.ordenTrabajo?.anticipo ?? anticipo,
    saldo: pedido.ordenTrabajo?.saldo ?? saldo,
    responsable: pedido.ordenTrabajo?.responsable || '',
    observaciones: pedido.ordenTrabajo?.observaciones || '',
    estadoProduccion: estadoPedido(pedido),
    evidencias: {
      inicial: '',
      diseno: '',
      proceso: '',
      instalacion: '',
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
    tipo:
      valor.tipo ||
      (String(valor.mime || '').startsWith('video') ? 'video' : 'imagen'),
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

function formatearDinero(valor) {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

function crearMensajeWhatsApp(pedido, estado, ot) {
  const codigo = ot.codigoOT || pedido.codigoSeguimiento || pedido.numero || '';
  const cliente = ot.cliente || pedido.cliente?.nombre || 'cliente';
  const estadoTexto = ETIQUETAS_ESTADO_VISUAL[estado] || estado || 'Actualizado';

  return [
    'ELANVISUAL',
    '',
    `Hola ${cliente}.`,
    '',
    `Tu orden de trabajo ${codigo} fue actualizada.`,
    '',
    `Servicio: ${ot.servicio}`,
    `Estado actual: ${estadoTexto}`,
    '',
    'Podés consultar el avance desde:',
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
    const lista = Array.isArray(pedidos) ? pedidos : [];

    return lista
      .filter((pedido) => pedido.estado !== 'cancelado')
      .filter((pedido) => {
        const ot = crearOTBase(pedido);

        const texto = `
          ${ot.codigoOT}
          ${ot.pedido}
          ${ot.cliente}
          ${ot.vendedor}
          ${ot.servicio}
          ${pedido.cliente?.whatsapp || ''}
          ${pedido.cliente?.correo || ''}
        `.toLowerCase();

        return texto.includes(busqueda.toLowerCase().trim());
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [pedidos, busqueda]);

  const conteos = useMemo(() => {
    const lista = Array.isArray(pedidos) ? pedidos : [];

    return ESTADOS_PRODUCCION_VISUAL.reduce((acc, estado) => {
      acc[estado] = lista.filter((pedido) => estadoPedido(pedido) === estado).length;
      return acc;
    }, {});
  }, [pedidos]);

  const pedidoActivo =
    pedidosProduccion.find((pedido) => pedido.id === pedidoActivoId) ||
    pedidosProduccion[0];

  const ot = pedidoActivo ? crearOTBase(pedidoActivo) : null;

  const guardarCampoOT = (campo, valor) => {
    if (!pedidoActivo || !ot) return;

    const nuevaOT = {
      ...ot,
      [campo]: valor,
    };

    const monto = Number(campo === 'monto' ? valor : nuevaOT.monto || 0);
    const anticipo = Number(campo === 'anticipo' ? valor : nuevaOT.anticipo || 0);

    nuevaOT.saldo = Math.max(monto - anticipo, 0);

    actualizarOrdenTrabajo(pedidoActivo, nuevaOT);
    setMensaje('Orden de trabajo actualizada.');
  };

  const cambiarEstado = (estado) => {
    if (!pedidoActivo) return;

    cambiarEstadoProduccion(pedidoActivo, estado);
    setMensaje(`Estado actualizado: ${ETIQUETAS_ESTADO_VISUAL[estado] || estado}.`);
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
      setMensaje(`${evidenciaLabels[tipo]} guardada correctamente.`);
    } catch {
      setMensaje('No se pudo cargar la evidencia.');
    }
  };

  const notificarWhatsApp = () => {
    if (!pedidoActivo || !ot) return;

    const numero = numeroWhatsApp(
      pedidoActivo.cliente?.whatsapp ||
        pedidoActivo.cliente?.telefono ||
        pedidoActivo.whatsapp
    );

    if (!numero) {
      setMensaje('Este pedido no tiene WhatsApp válido para notificar.');
      return;
    }

    const texto = encodeURIComponent(
      crearMensajeWhatsApp(pedidoActivo, estadoPedido(pedidoActivo), ot)
    );

    window.open(
      `https://wa.me/${numero}?text=${texto}`,
      '_blank',
      'noopener,noreferrer'
    );

    setMensaje('Mensaje de WhatsApp preparado.');
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
      <h1>Producción ELANVISUAL</h1>

      <section className="dashboard produccion-dashboard">
        {ESTADOS_PRODUCCION_VISUAL.map((estado) => (
          <article className="panel stat-card" key={estado}>
            <span>{ETIQUETAS_ESTADO_VISUAL[estado] || estado}</span>
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
          placeholder="Buscar por OT, cliente, vendedor o servicio"
        />

        {pedidosProduccion.length === 0 ? (
          <p>No hay órdenes de trabajo para producción todavía.</p>
        ) : (
          <div className="produccion-layout">
            <div className="produccion-lista">
              {pedidosProduccion.map((pedido) => {
                const otLista = crearOTBase(pedido);
                const estadoActual = estadoPedido(pedido);

                return (
                  <button
                    type="button"
                    key={pedido.id}
                    className={`produccion-item ${
                      pedidoActivo?.id === pedido.id ? 'active' : ''
                    }`}
                    onClick={() => setPedidoActivoId(pedido.id)}
                  >
                    <strong>{otLista.codigoOT}</strong>
                    <span>{otLista.cliente || 'Cliente sin nombre'}</span>
                    <small>
                      {ETIQUETAS_ESTADO_VISUAL[estadoActual] || estadoActual}
                    </small>
                  </button>
                );
              })}
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
                    <input
                      value={ot.codigoOT}
                      onChange={(e) => guardarCampoOT('codigoOT', e.target.value)}
                    />
                  </label>

                  <label>
                    Cliente
                    <input
                      value={ot.cliente}
                      onChange={(e) => guardarCampoOT('cliente', e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                  </label>

                  <label>
                    Vendedor
                    <input
                      value={ot.vendedor}
                      onChange={(e) => guardarCampoOT('vendedor', e.target.value)}
                      placeholder="Nombre del vendedor"
                    />
                  </label>

                  <label>
                    Fecha
                    <input
                      type="date"
                      value={String(ot.fecha || '').slice(0, 10)}
                      onChange={(e) => guardarCampoOT('fecha', e.target.value)}
                    />
                  </label>

                  <label className="full-row">
                    Servicio
                    <input
                      value={ot.servicio}
                      onChange={(e) => guardarCampoOT('servicio', e.target.value)}
                      placeholder="Ej. Rótulo luminoso, vinil, letras PVC, acrílico"
                    />
                  </label>

                  <label>
                    Monto
                    <input
                      type="number"
                      min="0"
                      value={ot.monto}
                      onChange={(e) => guardarCampoOT('monto', e.target.value)}
                    />
                    <small>{formatearDinero(ot.monto)}</small>
                  </label>

                  <label>
                    Anticipo
                    <input
                      type="number"
                      min="0"
                      value={ot.anticipo}
                      onChange={(e) => guardarCampoOT('anticipo', e.target.value)}
                    />
                    <small>{formatearDinero(ot.anticipo)}</small>
                  </label>

                  <label>
                    Saldo
                    <input value={formatearDinero(ot.saldo)} readOnly />
                  </label>

                  <label>
                    Responsable
                    <input
                      value={ot.responsable}
                      onChange={(e) =>
                        guardarCampoOT('responsable', e.target.value)
                      }
                      placeholder="Responsable de producción"
                    />
                  </label>

                  <label className="full-row">
                    Observaciones
                    <textarea
                      value={ot.observaciones}
                      onChange={(e) =>
                        guardarCampoOT('observaciones', e.target.value)
                      }
                      placeholder="Notas internas: materiales, medidas, instalación, pendientes o restricciones técnicas"
                      rows={3}
                    />
                  </label>
                </div>

                {(() => {
                  const auto = generarProduccionAutomatica({
                    pedido: pedidoActivo,
                    sistemaConstructivo: pedidoActivo?.sistemaConstructivo || pedidoActivo?.cotizacion?.sistemaConstructivo,
                    proveedores,
                  });

                  return (
                    <section className="panel" style={{ margin: '14px 0', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                      <h2>Producción automática CI-16D</h2>
                      <p><b>Tecnología:</b> {auto.tecnologia}</p>
                      <p><b>Origen:</b> {auto.origen}</p>

                      <h3>Materiales y cantidades</h3>
                      {(auto.materiales || []).map((m) => (
                        <p key={m.id}>{m.nombre}: {Number(m.cantidad || 0).toFixed(2)} {m.unidad}</p>
                      ))}

                      <h3>Proceso fabricación</h3>
                      {(auto.procesoFabricacion || []).map((p, i) => <p key={`fab-${i}`}>{p}</p>)}

                      <h3>Proceso instalación</h3>
                      {(auto.procesoInstalacion || []).map((p, i) => <p key={`ins-${i}`}>{p}</p>)}

                      <h3>Proveedor sugerido</h3>
                      <p>{auto.proveedorSugerido?.nombre || 'Sin proveedor sugerido todavía'}</p>
                    </section>
                  );
                })()}

                <div className="actions-row">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={notificarWhatsApp}
                  >
                    <Send size={17} /> Avisar por WhatsApp
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() =>
                      window.open(
                        seguimientoUrl,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <ExternalLink size={17} /> Abrir seguimiento
                  </button>
                </div>

                <div className="estado-produccion-bar">
                  {ESTADOS_PRODUCCION_VISUAL.map((estado) => (
                    <button
                      type="button"
                      key={estado}
                      className={estadoPedido(pedidoActivo) === estado ? 'active' : ''}
                      onClick={() => cambiarEstado(estado)}
                    >
                      {ETIQUETAS_ESTADO_VISUAL[estado] || estado}
                    </button>
                  ))}
                </div>

                <section className="evidencias-grid">
                  {Object.entries(evidenciaLabels).map(([tipo, label]) => {
                    const evidencia = normalizarEvidencia(ot.evidencias?.[tipo]);

                    return (
                      <article className="evidencia-card" key={tipo}>
                        <h3>
                          {evidencia?.tipo === 'video' ? (
                            <Video size={17} />
                          ) : (
                            <Camera size={17} />
                          )}
                          {label}
                        </h3>

                        {evidencia?.url ? (
                          evidencia.tipo === 'video' ? (
                            <video
                              src={evidencia.url}
                              controls
                              playsInline
                              style={{
                                width: '100%',
                                borderRadius: 12,
                                marginBottom: 10,
                              }}
                            />
                          ) : (
                            <img src={evidencia.url} alt={label} />
                          )
                        ) : (
                          <div className="evidencia-placeholder">
                            Sin evidencia
                          </div>
                        )}

                        {evidencia?.fecha && (
                          <p className="note">
                            Actualizado: {formatearFecha(evidencia.fecha)}
                          </p>
                        )}

                        <input
                          type="file"
                          accept="image/*,video/mp4,video/quicktime,video/webm"
                          onChange={(e) =>
                            subirEvidencia(tipo, e.target.files?.[0])
                          }
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