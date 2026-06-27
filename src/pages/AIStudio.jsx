import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { esAdminCRM, filtrarRegistrosCRM, obtenerFirmaVendedor } from '../services/permisosCRM';
import { prepararArchivosTemporalesAI, construirResumenArchivosTemporales } from '../services/aiTemporalService';
import { cargarMemoriaOperativaElan } from '../services/memoriaOperativaElan';
import { crearSolicitudesCostosFaltantes } from '../services/solicitudesCostosService';
import { ejecutarAccionIA } from '../services/ai/aiDispatcher';
import '../styles/AIStudio.css';

const CORE_URL = import.meta.env.VITE_ELANKAV_CORE_URL || '';

const tiposProyecto = [
  'Rotulación',
  'Fachada ACM',
  'Letras 3D',
  'Botón luminoso',
  'PVC / Acrílico',
  'Impresión digital',
  'BTL / Exhibición',
  'Interiorismo',
  'Otro',
];

function respuestaIA(data) {
  return (
    data?.respuesta ||
    data?.message ||
    data?.content ||
    data?.texto ||
    data?.output_text ||
    data?.data?.respuesta ||
    'La IA respondiÃ³, pero no se recibiÃ³ texto legible.'
  );
}

function codigoCotización() {
  return `AI-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now().toString().slice(-5)}`;
}


function guardarBorradorCotizadorAI06C(memoriaOperativa = null, proyectoActivo = null) {
  const paquete = memoriaOperativa?.ai06c_items_cotizables;
  if (!paquete?.puede_enviar_cotizador) return false;

  const payload = {
    version: 'AI-06C',
    creado_en: new Date().toISOString(),
    origen: 'AI Studio',
    proyecto_ai: proyectoActivo,
    items: paquete.items,
    estado: 'borrador_ai_cotizador',
  };

  localStorage.setItem('elanvisual_cotizacion_ai_borrador', JSON.stringify(payload));
  localStorage.setItem('elanvisual_cotizacion_item_activo', JSON.stringify(payload.items?.[0] || null));

  return true;
}

function extraerJSON(texto) {
  try {
    const limpio = String(texto || '').replace(/```json|```/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (inicio >= 0 && fin > inicio) return JSON.parse(limpio.slice(inicio, fin + 1));
    return JSON.parse(limpio);
  } catch {
    return null;
  }
}

export default function AIStudio({ setPage }) {
  const {
    usuario,
    pedidos = [],
    proveedores = [],
  } = useApp();
  const firma = useMemo(() => obtenerFirmaVendedor(usuario || {}), [usuario]);
  const admin = esAdminCRM(usuario || {});

  const [proyectos, setProyectos] = useState([]);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', tipo_proyecto: 'Rotulación' });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [archivosTemporales, setArchivosTemporales] = useState([]);

  const proyectosVisibles = useMemo(
    () => filtrarRegistrosCRM(usuario || {}, proyectos),
    [usuario, proyectos]
  );

  async function cargarProyectos() {
    setError('');
    if (!supabase) {
      setError('Supabase no estÃ¡ configurado.');
      return;
    }

    const { data, error: err } = await supabase
      .from('proyectos_ai')
      .select('*')
      .order('updated_at', { ascending: false });

    if (err) {
      setError(`Error cargando proyectos AI: ${err.message}`);
      return;
    }

    const lista = data || [];
    setProyectos(lista);
    const visibles = filtrarRegistrosCRM(usuario || {}, lista);
    if (!proyectoActivo && visibles.length) setProyectoActivo(visibles[0]);
  }

  async function cargarMensajes(proyectoId) {
    if (!supabase || !proyectoId) return;
    const { data, error: err } = await supabase
      .from('mensajes_ai')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: true });

    if (err) {
      setError(`Error cargando mensajes: ${err.message}`);
      return;
    }
    setMensajes(data || []);
  }

  useEffect(() => {
    cargarProyectos();
  }, []);

  useEffect(() => {
    if (proyectoActivo?.id) cargarMensajes(proyectoActivo.id);
  }, [proyectoActivo?.id]);

  async function crearProyecto(e) {
    e.preventDefault();
    setError('');
    if (!supabase) return setError('Supabase no estÃ¡ configurado.');
    if (!nuevo.nombre.trim()) return setError('IngresÃ¡ el nombre del proyecto.');

    const payload = {
      nombre: nuevo.nombre.trim(),
      tipo_proyecto: nuevo.tipo_proyecto,
      estado: 'activo',
      ...firma,
    };

    const { data, error: err } = await supabase
      .from('proyectos_ai')
      .insert(payload)
      .select()
      .single();

    if (err) return setError(`Error creando proyecto: ${err.message}`);

    setNuevo({ nombre: '', tipo_proyecto: 'Rotulación' });
    setProyectoActivo(data);
    setMensajes([]);
    await cargarProyectos();
  }

  async function guardarMensaje(rol, contenido, metadata = {}) {
    const payload = {
      proyecto_id: proyectoActivo.id,
      rol,
      contenido,
      canal: 'vendedor',
      vendedor_id: firma.vendedor_id,
      metadata,
    };

    const { data, error: err } = await supabase
      .from('mensajes_ai')
      .insert(payload)
      .select()
      .single();

    if (err) throw new Error(err.message);
    return data;
  }

  async function llamarCore(messages, modo = 'chat', memoriaOperativa = null) {
    if (!CORE_URL) throw new Error('Falta VITE_ELANKAV_CORE_URL en .env / Vercel.');

    const res = await fetch(`${CORE_URL.replace(/\/$/, '')}/api/elan-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo,
        unidad: 'ELANVISUAL',
        proyecto: proyectoActivo,
        usuario: {
          id: usuario?.id,
          nombre: usuario?.nombre || usuario?.usuario || usuario?.email,
          rol: usuario?.rol,
          codigo_vendedor: firma.codigo_vendedor,
        },
        messages,
        memoria_operativa: memoriaOperativa,
        archivos_temporales: archivosTemporales
          .filter((a) => a.ok)
          .map((a) => ({
            nombre: a.nombre,
            tipo: a.tipo,
            extension: a.extension,
            tamano: a.tamano,
            dataUrl: a.dataUrl,
            metadata: a.metadata,
            temporal: true,
            guardar_permanente: false,
          })),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || data?.message || 'Error llamando ELANKAV CORE.');
    }
    return data;
  }

  async function manejarArchivosTemporales(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError('');
    setEstado('Leyendo archivos temporalmente...');

    try {
      const preparados = await prepararArchivosTemporalesAI(files);
      setArchivosTemporales((prev) => [...prev, ...preparados]);
      setEstado('Archivos listos para análisis temporal. No se guardaron en Storage.');
    } catch (err) {
      setError(err.message || 'No se pudieron leer los archivos.');
    }

    e.target.value = '';
  }

  function eliminarArchivoTemporal(index) {
    setArchivosTemporales((prev) => prev.filter((_, i) => i !== index));
  }

  async function enviarMensaje(e) {
    e.preventDefault();
    if (!proyectoActivo) return setError('Primero creá o Seleccioná un proyecto.');
    if (!mensaje.trim() && archivosTemporales.length === 0) return;

    const resumenArchivosTemporales = construirResumenArchivosTemporales(archivosTemporales);
    const contenidoUsuario = [
      mensaje.trim(),
      resumenArchivosTemporales
        ? "\n\nARCHIVOS TEMPORALES ADJUNTOS:\n" + resumenArchivosTemporales
        : "",
    ].join("");

    setCargando(true);
    setError('');
    setEstado('Consultando ELANKAV CORE...');

    try {
      const msgUser = await guardarMensaje('user', contenidoUsuario, {
        archivos_temporales: archivosTemporales.map((a) => ({
          ok: a.ok,
          nombre: a.nombre,
          tipo: a.tipo,
          extension: a.extension,
          tamano: a.tamano,
          temporal: true,
          guardado_storage: false,
        })),
      });

      setMensaje('');

      const historial = [...mensajes, msgUser].map((m) => ({
        role: m.rol,
        content: m.contenido,
      }));

      setEstado('Consultando memoria operativa ELAN...');

      const memoriaOperativa = await cargarMemoriaOperativaElan({
        mensaje: contenidoUsuario,
        proyectoActivo,
        usuario,
        firma,
      });
        setEstado('Analizando contexto ERP...');

      const busquedaPedidoIA = await ejecutarAccionIA({
        accion: 'buscar_pedido_ot',
        contexto: {
          texto: contenidoUsuario,
          pedidos,
        },
      });

      const busquedaProveedorIA = await ejecutarAccionIA({
        accion: 'buscar_proveedor',
        contexto: {
          texto: contenidoUsuario,
          proveedores,
        },
      });

      memoriaOperativa.ai16_acciones_erp = {
        motor: 'AI-16D',
        modo: 'solo_lectura',
        pedido_detectado: busquedaPedidoIA?.pedido
          ? {
              id: busquedaPedidoIA.pedido.id,
              numero: busquedaPedidoIA.pedido.numero,
              codigoSeguimiento: busquedaPedidoIA.pedido.codigoSeguimiento,
              codigoOT: busquedaPedidoIA.pedido.ordenTrabajo?.codigoOT,
              cliente: busquedaPedidoIA.pedido.cliente,
              total: busquedaPedidoIA.pedido.resumen?.total || busquedaPedidoIA.pedido.total || 0,
              requiereConfirmacion: busquedaPedidoIA.requiereConfirmacion,
            }
          : null,
        proveedor_detectado: busquedaProveedorIA?.proveedor
          ? {
              id: busquedaProveedorIA.proveedor.id,
              nombre: busquedaProveedorIA.proveedor.nombre,
              categoria: busquedaProveedorIA.proveedor.categoria,
            }
          : null,
      };

      const solicitudesCostosAI06D = await crearSolicitudesCostosFaltantes({
        faltantes: memoriaOperativa.ai06d_costos_faltantes || [],
        mensajeOriginal: contenidoUsuario,
        proyectoActivo,
        usuario,
        firma,
      });

      if (solicitudesCostosAI06D.length > 0) {
        memoriaOperativa.ai06d_solicitudes_creadas = solicitudesCostosAI06D.map((s) => ({
          id: s.id,
          codigo: s.codigo,
          tipo: s.tipo,
          estado: s.estado,
          descripcion: s.descripcion_solicitada,
        }));
      }

      setEstado('Consultando ELANKAV CORE...');

      const data = await llamarCore(historial, 'chat', memoriaOperativa);
      const texto = respuestaIA(data);
      const msgIA = await guardarMensaje('assistant', texto, { core: data });

      setMensajes((prev) => [...prev, msgUser, msgIA]);
      setArchivosTemporales([]);

      await supabase
        .from('proyectos_ai')
        .update({ updated_at: new Date().toISOString(), resumen: texto.slice(0, 500) })
        .eq('id', proyectoActivo.id);

      setEstado('');
      await cargarProyectos();
    } catch (err) {
      setError(err.message);
      setEstado('');
    } finally {
      setCargando(false);
    }
  }
  async function generarCotización() {
    if (!proyectoActivo) return setError('Seleccioná un proyecto.');
    if (!mensajes.length) return setError('No hay conversaciÃ³n suficiente para generar Cotización.');

    const resumenArchivosTemporales = construirResumenArchivosTemporales(archivosTemporales);
    const contenidoUsuario = [
      mensaje.trim(),
      resumenArchivosTemporales
        ? "\n\nARCHIVOS TEMPORALES ADJUNTOS:\n" + resumenArchivosTemporales
        : "",
    ].join("");

    setCargando(true);
    setError('');
    setEstado('Extrayendo datos para Cotización...');

    try {
      const prompt = `De la conversaciÃ³n siguiente extraÃ© datos para crear una Cotización ELANVISUAL. RespondÃ© SOLO JSON vÃ¡lido con estas claves: cliente_nombre, celular, ubicacion, biblioteca_nombre, descripcion, ancho, alto, cantidad, precio_b, costo_produccion, costo_instalacion, costo_transporte, costo_viaticos, costo_equipo, costo_empresa, estado, observaciones. Si falta un dato, usÃ¡ vacÃ­o o 0. ConversaciÃ³n:\n${mensajes.map((m) => `${m.rol}: ${m.contenido}`).join('\n')}`;
      const memoriaOperativa = await cargarMemoriaOperativaElan({
        mensaje: prompt,
        proyectoActivo,
        usuario,
        firma,
      });

      const data = await llamarCore(
        [{ role: 'user', content: prompt }],
        'extraer_Cotización',
        memoriaOperativa
      );
      const texto = respuestaIA(data);
      const datos = extraerJSON(texto) || {};
      const codigo = codigoCotización();

      const payload = {
        codigo,
        cliente_nombre: datos.cliente_nombre || proyectoActivo.nombre || 'Cliente AI',
        celular: datos.celular || '',
        ubicacion: datos.ubicacion || '',
        biblioteca_nombre: datos.biblioteca_nombre || datos.tipo_proyecto || proyectoActivo.tipo_proyecto || 'Proyecto AI',
        descripcion: datos.descripcion || datos.observaciones || `Generado desde AI Studio: ${proyectoActivo.nombre}`,
        ancho: Number(datos.ancho || 0),
        alto: Number(datos.alto || 0),
        cantidad: Number(datos.cantidad || 1),
        precio_b: Number(datos.precio_b || 0),
        costo_produccion: Number(datos.costo_produccion || 0),
        costo_instalacion: Number(datos.costo_instalacion || 0),
        costo_transporte: Number(datos.costo_transporte || 0),
        costo_viaticos: Number(datos.costo_viaticos || 0),
        costo_equipo: Number(datos.costo_equipo || 0),
        costo_empresa: Number(datos.costo_empresa || 0),
        estado: datos.estado || 'borrador_ai',
        observaciones: datos.observaciones || 'Borrador generado desde AI Studio. Revisar antes de aprobar.',
        ...firma,
        origen_ai_proyecto_id: proyectoActivo.id,
      };

      const { data: Cotización, error: err } = await supabase
        .from('cotizaciones_inteligentes')
        .insert(payload)
        .select()
        .single();

      if (err) throw new Error(err.message);

      await supabase
        .from('proyectos_ai')
        .update({
          estado: 'Cotización_borrador',
          datos_Cotización: datos,
          Cotización_id: Cotización?.id || null,
          Cotización_codigo: codigo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proyectoActivo.id);

      await guardarMensaje('assistant', `Borrador de Cotización generado: ${codigo}. Revisar en Cotizaciónes Inteligentes.`, { Cotización });
      setEstado(`Cotización borrador creada: ${codigo}`);

localStorage.setItem(
  'elanvisual_Cotización_ai_activa',
  JSON.stringify({
    id: Cotización?.id || null,
    codigo,
    proyectoId: proyectoActivo.id,
  })
);

setPage?.('CotizacionesInteligentes');
      await cargarMensajes(proyectoActivo.id);
      await cargarProyectos();
    } catch (err) {
      setError(`No se pudo generar Cotización: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="ai-studio-page ai-studio-v2">
      <aside className="ai-studio-sidebar">
        <div className="ai-studio-brand">
          <span>ELAN AI</span>
          <small>Estudio de proyectos</small>
        </div>

        <form className="ai-new-form" onSubmit={crearProyecto}>
          <input
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            placeholder="Nuevo proyecto..."
          />

          <select
            value={nuevo.tipo_proyecto}
            onChange={(e) => setNuevo({ ...nuevo, tipo_proyecto: e.target.value })}
          >
            {tiposProyecto.map((t) => <option key={t}>{t}</option>)}
          </select>

          <button className="ai-primary" type="submit">Crear</button>
        </form>

        <div className="ai-project-list-title">
          {admin ? 'Todos los proyectos' : 'Mis proyectos'}
        </div>

        <div className="ai-project-list">
          {proyectosVisibles.map((p) => (
            <button
              key={p.id}
              className={`ai-project-btn ${proyectoActivo?.id === p.id ? 'active' : ''}`}
              type="button"
              onClick={() => setProyectoActivo(p)}
            >
              <strong>{p.nombre}</strong>
              <span>{p.tipo_proyecto}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="ai-chat-panel">
        <header className="ai-chat-header">
          <div>
            <h1>{proyectoActivo?.nombre || 'Seleccioná un proyecto'}</h1>
            <p>{proyectoActivo?.tipo_proyecto || 'Conversación guardada en Supabase'}</p>
          </div>

          <div className="ai-chat-header-actions">
            <button className="ai-secondary" type="button" onClick={() => cargarProyectos()}>
              Actualizar
            </button>
            <button
              className="ai-primary"
              type="button"
              onClick={generarCotización}
              disabled={!proyectoActivo || cargando}
            >
              Generar Cotización
            </button>
          </div>
        </header>

        <div className="ai-messages">
          {!mensajes.length && (
            <div className="ai-row assistant">
              <div className="ai-avatar">✦</div>
              <div className="ai-msg assistant">
                Hola. Soy ELAN AI. Puedo ayudarte a levantar información técnica, analizar imágenes, preparar propuestas y convertir esta conversación en una Cotización.
              </div>
            </div>
          )}

          {mensajes.map((m) => (
            <div key={m.id} className={`ai-row ${m.rol}`}>
              {m.rol === 'assistant' && <div className="ai-avatar">✦</div>}
              <div className={`ai-msg ${m.rol}`}>{m.contenido}</div>
            </div>
          ))}

          {cargando && (
            <div className="ai-row assistant">
              <div className="ai-avatar">✦</div>
              <div className="ai-msg assistant">Analizando...</div>
            </div>
          )}
        </div>

        <form className="ai-composer" onSubmit={enviarMensaje}>
          {archivosTemporales.length > 0 && (
            <div className="ai-file-chips">
              {archivosTemporales.map((archivo, index) => (
                <span key={`${archivo.nombre}-${index}`} className="ai-file-chip">
                  {archivo.ok ? '📎' : '⚠'} {archivo.nombre}
                  <button type="button" onClick={() => eliminarArchivoTemporal(index)}>×</button>
                </span>
              ))}
            </div>
          )}

          {estado && <div className="ai-status">{estado}</div>}
          {error && <div className="ai-error">{error}</div>}

          <div className="ai-inputbar">
            <label className="ai-attach">
              📎
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.svg,.pdf"
                onChange={manejarArchivosTemporales}
              />
            </label>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribí una consulta..."
              rows={1}
            />

            <button className="ai-send" type="submit" disabled={cargando || !proyectoActivo}>
              ➤
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}









