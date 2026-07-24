import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';
import {
  isWahaFlowUnavailableError,
  routeWahaMessageToOrchestrator,
} from '../modules/connect/services/wahaConnectFlowClient.js';

const UNIDADES_NEGOCIO = [
  'ELANVISUAL',
  'ELANKAV CENTER',
  'ELANHOME',
  'ELAN AI',
];

const ORIGENES_MENSAJE = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Referido', 'Web', 'Llamada'];
const TIPOS_CLIENTE = ['Nuevo', 'Recurrente', 'Empresa', 'Proveedor', 'Aliado'];
const ESTADOS_LEAD = ['Nuevo', 'Respondido', 'Cotizado', 'Ganado', 'Perdido'];
const CLASIFICACIONES = ['Precio', 'Información', 'Ubicación', 'Catálogo', 'Cotización', 'Seguimiento'];

const SERVICIOS_POR_UNIDAD = {
  ELANVISUAL: [
    'Rotulación',
    'Impresión digital',
    'Rótulo 3D',
    'Caja de luz',
    'Fachada comercial',
    'Acrílico / PVC / CNC / Láser',
    'Displays y material POP',
  ],
  'ELANKAV CENTER': [
    'Centro de cómputo',
    'Diseño gráfico',
    'Capacitación',
    'Servicio empresarial',
    'Consulta general CENTER',
  ],
  ELANHOME: [
    'Decoración',
    'Grama artificial',
    'Luces decorativas',
    'Lámparas',
    'Paneles solares',
    'Instalación',
  ],
  'ELAN AI': [
    'Automatización con IA',
    'Asistente para negocio',
    'CRM / ERP / Sistema web',
    'Contenido con IA',
    'Consulta general IA',
  ],
};

const RESPUESTA_BASE = `Hola, gracias por escribirnos.

Con gusto te ayudo.

Para cotizarte correctamente necesito:

1. Medida aproximada
2. Foto del lugar
3. Ciudad o ubicación
4. Tipo de trabajo que necesitás

Con eso te preparo una propuesta clara y detallada.`;

const PLANTILLAS_RAPIDAS = [
  {
    nombre: 'Solicitud de datos para cotizar',
    texto: RESPUESTA_BASE,
  },
  {
    nombre: 'Enviar catálogo',
    texto: 'Claro, te puedo enviar el catálogo. Decime por favor qué tipo de producto o servicio estás buscando para mandarte la información correcta.',
  },
  {
    nombre: 'Ubicación y visita técnica',
    texto: 'Para revisar bien el trabajo necesito la ubicación exacta o una referencia del lugar. Si amerita visita técnica, te confirmo disponibilidad y costo antes de programarla.',
  },
  {
    nombre: 'Seguimiento comercial',
    texto: 'Hola, solo te doy seguimiento a la solicitud. Si todavía estás interesado, puedo prepararte la propuesta o ajustar la cotización según lo que necesitás.',
  },
  {
    nombre: 'Cierre ganado',
    texto: 'Perfecto, gracias por confirmar. Para iniciar el trabajo dejamos registrado el pedido y coordinamos anticipo, medidas finales y fecha de entrega.',
  },
];

const formInicial = {
  nombre: '',
  whatsapp: '',
  mensaje: '',
  unidadNegocio: 'ELANVISUAL',
  servicioSolicitado: 'Rotulación',
  origenMensaje: 'WhatsApp',
  tipoCliente: 'Nuevo',
  estadoLead: 'Nuevo',
  clasificacion: 'Información',
  seguimiento: '',
  responsable: '',
};

const fechaLegible = (valor) => {
  if (!valor) return 'Sin fecha';

  try {
    return new Date(valor).toLocaleString('es-NI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return valor;
  }
};

export default function CentroWhatsApp() {
  const {
    leadsWhatsApp,
    crearLeadWhatsApp,
    actualizarLeadWhatsApp,
    eliminarLeadWhatsApp,
    convertirLeadWhatsAppAContacto,
    crearCotizacionDesdeLeadWhatsApp,
  } = useCore();

  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [filtroUnidad, setFiltroUnidad] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroOrigen, setFiltroOrigen] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(RESPUESTA_BASE);

  const serviciosDisponibles = SERVICIOS_POR_UNIDAD[form.unidadNegocio] || [];

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };

      if (name === 'unidadNegocio') {
        nuevo.servicioSolicitado = (SERVICIOS_POR_UNIDAD[value] || [])[0] || '';
      }

      return nuevo;
    });
  };

  const limpiar = () => {
    setForm(formInicial);
    setEditandoId(null);
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() && !form.whatsapp.trim() && !form.mensaje.trim()) return;

    const datos = {
      nombre: form.nombre.trim(),
      whatsapp: form.whatsapp.trim(),
      mensaje: form.mensaje.trim(),
      unidadNegocio: form.unidadNegocio,
      servicioSolicitado: form.servicioSolicitado,
      origenMensaje: form.origenMensaje,
      tipoCliente: form.tipoCliente,
      estadoLead: form.estadoLead,
      clasificacion: form.clasificacion,
      seguimiento: form.seguimiento.trim(),
      responsable: form.responsable.trim(),
    };

    if (!editandoId && datos.origenMensaje === 'WhatsApp') {
      try {
        await routeWahaMessageToOrchestrator({ lead: datos });
      } catch (error) {
        if (!isWahaFlowUnavailableError(error)) throw error;
      }
    }

    if (editandoId) {
      actualizarLeadWhatsApp(editandoId, datos);
    } else {
      crearLeadWhatsApp(datos);
    }

    limpiar();
  };

  const editar = (lead) => {
    setEditandoId(lead.id);
    setForm({
      nombre: lead.nombre || '',
      whatsapp: lead.whatsapp || '',
      mensaje: lead.mensaje || '',
      unidadNegocio: lead.unidadNegocio || 'ELANVISUAL',
      servicioSolicitado: lead.servicioSolicitado || 'Rotulación',
      origenMensaje: lead.origenMensaje || 'WhatsApp',
      tipoCliente: lead.tipoCliente || 'Nuevo',
      estadoLead: lead.estadoLead || 'Nuevo',
      clasificacion: lead.clasificacion || 'Información',
      seguimiento: lead.seguimiento || '',
      responsable: lead.responsable || '',
    });
  };

  const cambiarEstadoRapido = (lead, estadoLead) => {
    actualizarLeadWhatsApp(lead.id, {
      ...lead,
      estadoLead,
    });
  };

  const crearContacto = (lead) => {
    convertirLeadWhatsAppAContacto(lead.id);
  };

  const crearCotizacion = (lead) => {
    crearCotizacionDesdeLeadWhatsApp(lead.id);
  };

  const copiarRespuesta = async () => {
    try {
      await navigator.clipboard.writeText(respuestaSeleccionada);
    } catch {
      const area = document.createElement('textarea');
      area.value = respuestaSeleccionada;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
  };

  const leadsFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return (leadsWhatsApp || []).filter((lead) => {
      const coincideUnidad = filtroUnidad === 'Todas' || lead.unidadNegocio === filtroUnidad;
      const coincideEstado = filtroEstado === 'Todos' || lead.estadoLead === filtroEstado;
      const coincideOrigen = filtroOrigen === 'Todos' || lead.origenMensaje === filtroOrigen;
      const coincideTexto = !texto || [
        lead.nombre,
        lead.whatsapp,
        lead.mensaje,
        lead.servicioSolicitado,
        lead.clasificacion,
        lead.tipoCliente,
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto);

      return coincideUnidad && coincideEstado && coincideOrigen && coincideTexto;
    });
  }, [leadsWhatsApp, filtroUnidad, filtroEstado, filtroOrigen, busqueda]);

  const resumen = useMemo(() => {
    const lista = leadsWhatsApp || [];

    return {
      total: lista.length,
      nuevos: lista.filter((item) => item.estadoLead === 'Nuevo').length,
      cotizados: lista.filter((item) => item.estadoLead === 'Cotizado').length,
      ganados: lista.filter((item) => item.estadoLead === 'Ganado').length,
      perdidos: lista.filter((item) => item.estadoLead === 'Perdido').length,
    };
  }, [leadsWhatsApp]);

  return (
    <div className="page centro-whatsapp-page">
      <style>
        {`
          .centro-whatsapp-page .wa-layout {
            display: grid;
            grid-template-columns: minmax(320px, 420px) 1fr;
            gap: 18px;
            align-items: start;
          }

          .centro-whatsapp-page .wa-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
            border: 1px solid #e5e7eb;
          }

          .centro-whatsapp-page .wa-card h3 {
            margin: 0 0 12px;
            color: #111827;
          }

          .centro-whatsapp-page .wa-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .centro-whatsapp-page label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 13px;
            font-weight: 800;
            color: #374151;
          }

          .centro-whatsapp-page input,
          .centro-whatsapp-page select,
          .centro-whatsapp-page textarea {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 10px 12px;
            font: inherit;
            background: #ffffff;
            color: #111827;
          }

          .centro-whatsapp-page textarea {
            min-height: 96px;
            resize: vertical;
          }

          .centro-whatsapp-page .wa-full {
            grid-column: 1 / -1;
          }

          .centro-whatsapp-page .wa-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
          }

          .centro-whatsapp-page .wa-btn {
            border: 0;
            border-radius: 12px;
            padding: 10px 13px;
            font-weight: 900;
            cursor: pointer;
            background: #e5e7eb;
            color: #111827;
          }

          .centro-whatsapp-page .wa-btn.primary {
            background: #0f766e;
            color: #ffffff;
          }

          .centro-whatsapp-page .wa-btn.blue {
            background: #1d4ed8;
            color: #ffffff;
          }

          .centro-whatsapp-page .wa-btn.danger {
            background: #dc2626;
            color: #ffffff;
          }

          .centro-whatsapp-page .wa-resumen {
            display: grid;
            grid-template-columns: repeat(5, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 18px;
          }

          .centro-whatsapp-page .wa-resumen-item {
            background: #ffffff;
            border-radius: 16px;
            padding: 15px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
            border: 1px solid #e5e7eb;
          }

          .centro-whatsapp-page .wa-resumen-item span {
            display: block;
            color: #6b7280;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .centro-whatsapp-page .wa-resumen-item strong {
            display: block;
            margin-top: 6px;
            color: #111827;
            font-size: 24px;
          }

          .centro-whatsapp-page .wa-filtros {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 14px;
          }

          .centro-whatsapp-page .wa-lead {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 12px;
            background: #ffffff;
          }

          .centro-whatsapp-page .wa-lead-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
          }

          .centro-whatsapp-page .wa-lead h4 {
            margin: 0;
            color: #111827;
          }

          .centro-whatsapp-page .wa-lead p {
            margin: 5px 0;
            color: #4b5563;
          }

          .centro-whatsapp-page .wa-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 10px 0;
          }

          .centro-whatsapp-page .wa-tag {
            border-radius: 999px;
            padding: 5px 9px;
            background: #eaf2ff;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 900;
          }

          .centro-whatsapp-page .wa-tag.green {
            background: #dcfce7;
            color: #166534;
          }

          .centro-whatsapp-page .wa-tag.orange {
            background: #ffedd5;
            color: #9a3412;
          }

          .centro-whatsapp-page .wa-template {
            white-space: pre-wrap;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 12px;
            color: #374151;
            min-height: 150px;
          }

          @media (max-width: 1100px) {
            .centro-whatsapp-page .wa-layout,
            .centro-whatsapp-page .wa-filtros,
            .centro-whatsapp-page .wa-resumen {
              grid-template-columns: 1fr;
            }

            .centro-whatsapp-page .wa-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="page-header">
        <div>
          <h2>Centro de WhatsApp y Leads</h2>
          <p>
            Clasificación comercial para mensajes de WhatsApp, redes sociales,
            referidos y seguimiento de oportunidades.
          </p>
        </div>
      </div>

      <div className="wa-resumen">
        <div className="wa-resumen-item"><span>Total leads</span><strong>{resumen.total}</strong></div>
        <div className="wa-resumen-item"><span>Nuevos</span><strong>{resumen.nuevos}</strong></div>
        <div className="wa-resumen-item"><span>Cotizados</span><strong>{resumen.cotizados}</strong></div>
        <div className="wa-resumen-item"><span>Ganados</span><strong>{resumen.ganados}</strong></div>
        <div className="wa-resumen-item"><span>Perdidos</span><strong>{resumen.perdidos}</strong></div>
      </div>

      <div className="wa-layout">
        <div className="wa-card">
          <h3>{editandoId ? 'Editar lead' : 'Registrar lead'}</h3>

          <form onSubmit={guardar}>
            <div className="wa-grid">
              <label>
                Unidad de negocio
                <select name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>
                  {UNIDADES_NEGOCIO.map((unidad) => <option key={unidad} value={unidad}>{unidad}</option>)}
                </select>
              </label>

              <label>
                Servicio solicitado
                <select name="servicioSolicitado" value={form.servicioSolicitado} onChange={cambiar}>
                  {serviciosDisponibles.map((servicio) => <option key={servicio} value={servicio}>{servicio}</option>)}
                </select>
              </label>

              <label>
                Origen del mensaje
                <select name="origenMensaje" value={form.origenMensaje} onChange={cambiar}>
                  {ORIGENES_MENSAJE.map((origen) => <option key={origen} value={origen}>{origen}</option>)}
                </select>
              </label>

              <label>
                Tipo de cliente
                <select name="tipoCliente" value={form.tipoCliente} onChange={cambiar}>
                  {TIPOS_CLIENTE.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </label>

              <label>
                Estado del lead
                <select name="estadoLead" value={form.estadoLead} onChange={cambiar}>
                  {ESTADOS_LEAD.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
              </label>

              <label>
                Clasificación
                <select name="clasificacion" value={form.clasificacion} onChange={cambiar}>
                  {CLASIFICACIONES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label>
                Nombre
                <input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Nombre del cliente" />
              </label>

              <label>
                WhatsApp
                <input name="whatsapp" value={form.whatsapp} onChange={cambiar} placeholder="+505 0000 0000" />
              </label>

              <label className="wa-full">
                Mensaje recibido
                <textarea name="mensaje" value={form.mensaje} onChange={cambiar} placeholder="Copiar aquí lo que escribió el cliente" />
              </label>

              <label className="wa-full">
                Seguimiento comercial
                <textarea name="seguimiento" value={form.seguimiento} onChange={cambiar} placeholder="Pendiente, próxima acción, observaciones o acuerdo" />
              </label>

              <label className="wa-full">
                Responsable
                <input name="responsable" value={form.responsable} onChange={cambiar} placeholder="Persona que dará seguimiento" />
              </label>
            </div>

            <div className="wa-actions">
              <button type="submit" className="wa-btn primary">{editandoId ? 'Guardar cambios' : 'Guardar lead'}</button>
              {editandoId && <button type="button" className="wa-btn" onClick={limpiar}>Cancelar edición</button>}
            </div>
          </form>
        </div>

        <div>
          <div className="wa-card" style={{ marginBottom: '18px' }}>
            <h3>Respuestas rápidas</h3>

            <label>
              Plantilla
              <select
                value={respuestaSeleccionada}
                onChange={(e) => setRespuestaSeleccionada(e.target.value)}
              >
                {PLANTILLAS_RAPIDAS.map((plantilla) => (
                  <option key={plantilla.nombre} value={plantilla.texto}>{plantilla.nombre}</option>
                ))}
              </select>
            </label>

            <div className="wa-template" style={{ marginTop: '12px' }}>{respuestaSeleccionada}</div>

            <div className="wa-actions">
              <button type="button" className="wa-btn blue" onClick={copiarRespuesta}>Copiar respuesta</button>
            </div>
          </div>

          <div className="wa-card">
            <h3>Leads registrados</h3>

            <div className="wa-filtros">
              <label>
                Unidad
                <select value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)}>
                  <option value="Todas">Todas</option>
                  {UNIDADES_NEGOCIO.map((unidad) => <option key={unidad} value={unidad}>{unidad}</option>)}
                </select>
              </label>

              <label>
                Estado
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {ESTADOS_LEAD.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
              </label>

              <label>
                Origen
                <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {ORIGENES_MENSAJE.map((origen) => <option key={origen} value={origen}>{origen}</option>)}
                </select>
              </label>

              <label>
                Buscar
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, número o servicio" />
              </label>
            </div>

            {leadsFiltrados.length === 0 ? (
              <p>No hay leads registrados con estos filtros.</p>
            ) : (
              leadsFiltrados.map((lead) => (
                <div className="wa-lead" key={lead.id}>
                  <div className="wa-lead-head">
                    <div>
                      <h4>{lead.nombre || 'Cliente sin nombre'}</h4>
                      <p><strong>WhatsApp:</strong> {lead.whatsapp || 'No registrado'}</p>
                      <p><strong>Servicio:</strong> {lead.servicioSolicitado || 'No definido'}</p>
                    </div>

                    <span className="wa-tag green">{lead.estadoLead || 'Nuevo'}</span>
                  </div>

                  <div className="wa-tags">
                    <span className="wa-tag">{lead.unidadNegocio || 'Sin unidad'}</span>
                    <span className="wa-tag">{lead.origenMensaje || 'Sin origen'}</span>
                    <span className="wa-tag orange">{lead.clasificacion || 'Sin clasificación'}</span>
                    <span className="wa-tag">{lead.tipoCliente || 'Sin tipo'}</span>
                  </div>

                  {lead.mensaje && <p><strong>Mensaje:</strong> {lead.mensaje}</p>}
                  {lead.seguimiento && <p><strong>Seguimiento:</strong> {lead.seguimiento}</p>}

                  <p><strong>Último movimiento:</strong> {fechaLegible(lead.actualizado || lead.fechaRegistro)}</p>
                  {lead.contactoId && <p><strong>Contacto creado:</strong> Sí</p>}
                  {lead.cotizacionId && <p><strong>Cotización creada:</strong> Sí</p>}

                  <div className="wa-actions">
                    <button type="button" className="wa-btn" onClick={() => editar(lead)}>Editar</button>
                    <button type="button" className="wa-btn" onClick={() => cambiarEstadoRapido(lead, 'Respondido')}>Respondido</button>
                    <button type="button" className="wa-btn primary" onClick={() => crearContacto(lead)}>Crear contacto</button>
                    <button type="button" className="wa-btn blue" onClick={() => crearCotizacion(lead)}>Crear cotización</button>
                    <button type="button" className="wa-btn" onClick={() => cambiarEstadoRapido(lead, 'Ganado')}>Ganado</button>
                    <button type="button" className="wa-btn" onClick={() => cambiarEstadoRapido(lead, 'Perdido')}>Perdido</button>
                    <button type="button" className="wa-btn danger" onClick={() => eliminarLeadWhatsApp(lead.id)}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
