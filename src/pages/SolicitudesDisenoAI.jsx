import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ESTADOS = [
  'ai_pending',
  'ai_processing',
  'review',
  'approved',
  'quoted',
  'closed',
  'failed',
];

const ETIQUETAS_ESTADO = {
  ai_pending: 'Pendiente IA',
  ai_processing: 'Generando diseño',
  review: 'Listo para revisión',
  approved: 'Aprobado',
  quoted: 'Cotizado',
  closed: 'Cerrado',
  failed: 'Con error',
};

const ETIQUETAS_TIPO = {
  rotulo: 'Rótulo',
  fachada: 'Fachada',
  logo: 'Logo',
  otro: 'Otro',
};

const grupoFecha = (fecha) => {
  const d = new Date(fecha || Date.now());
  const hoy = new Date();
  const a = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((a - b) / 86400000);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff <= 7) return 'Esta semana';
  if (d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()) return 'Este mes';
  return 'Anteriores';
};

const detectarCategoria = (s = {}) => {
  const texto = `${s.request_type || ''} ${s.design_notes || ''}`.toLowerCase();
  if (texto.includes('boton') || texto.includes('botón')) return 'Botones';
  if (texto.includes('letra')) return 'Letras';
  if (texto.includes('jalavista')) return 'Jalavistas';
  if (texto.includes('fachada')) return 'Fachadas';
  if (texto.includes('totem') || texto.includes('tótem')) return 'Tótems';
  if (texto.includes('señal') || texto.includes('senal')) return 'Señalización';
  if (s.request_type === 'logo') return 'Logos';
  if (s.request_type === 'rotulo') return 'Rótulos';
  return 'Otros';
};

const obtenerUrlArchivo = (archivo = {}) =>
  archivo.url || archivo.publicUrl || archivo.signedUrl || archivo.dataUrl || '';

const esImagenVisible = (url = '') => {
  const valor = String(url || '');
  return valor.startsWith('data:image') || valor.startsWith('http') || valor.startsWith('/');
};

const Archivos = ({ titulo, archivos = [] }) => {
  const lista = Array.isArray(archivos) ? archivos : [];

  return (
    <div className="ai-chat-result">
      <h3>{titulo}</h3>
      {!lista.length && <p>No hay archivos registrados.</p>}
      {lista.map((archivo, index) => {
        const url = obtenerUrlArchivo(archivo);
        return (
          <div key={`${archivo.path || archivo.name || 'archivo'}-${index}`} style={{ marginTop: 14 }}>
            <p>
              <strong>{archivo.kind || 'archivo'}:</strong> {archivo.name || archivo.path || 'Archivo recibido'}
            </p>
            {url && esImagenVisible(url) && (
              <img
                src={url}
                alt={archivo.name || titulo}
                style={{
                  width: '100%',
                  maxHeight: 360,
                  objectFit: 'contain',
                  borderRadius: 14,
                  background: '#fff',
                  border: '1px solid #dbe5f0',
                  marginTop: 10,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function SolicitudesDisenoAI() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [estado, setEstado] = useState('Todos');
  const [abierta, setAbierta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const cargar = async () => {
    if (!supabase) {
      setErrorCarga('Supabase no está configurado en esta instalación.');
      return;
    }

    setCargando(true);
    setErrorCarga('');

    const { data, error } = await supabase
      .from('design_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando solicitudes de diseño:', error);
      setErrorCarga('No fue posible cargar las solicitudes de diseño.');
      setSolicitudes([]);
    } else {
      setSolicitudes(data || []);
    }

    setCargando(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return solicitudes
      .map((s) => ({
        ...s,
        categoriaDetectada: detectarCategoria(s),
        grupoFecha: grupoFecha(s.created_at),
      }))
      .filter((s) => categoria === 'Todas' || s.categoriaDetectada === categoria)
      .filter((s) => estado === 'Todos' || s.status === estado)
      .filter((s) => {
        if (!q) return true;
        return `${s.request_code || ''} ${s.customer_name || ''} ${s.business_name || ''} ${s.whatsapp || ''} ${s.request_type || ''} ${s.design_notes || ''} ${s.status || ''}`
          .toLowerCase()
          .includes(q);
      });
  }, [solicitudes, busqueda, categoria, estado]);

  const cambiarEstado = async (solicitud, nuevoEstado) => {
    if (!supabase || !solicitud?.id) return;

    const { error } = await supabase
      .from('design_requests')
      .update({
        status: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', solicitud.id);

    if (error) {
      window.alert('No fue posible actualizar el estado.');
      return;
    }

    setSolicitudes((prev) =>
      prev.map((item) => (item.id === solicitud.id ? { ...item, status: nuevoEstado } : item))
    );
    setAbierta((prev) => (prev?.id === solicitud.id ? { ...prev, status: nuevoEstado } : prev));
  };

  const categorias = [
    'Todas',
    'Botones',
    'Letras',
    'Jalavistas',
    'Fachadas',
    'Tótems',
    'Señalización',
    'Logos',
    'Rótulos',
    'Otros',
  ];

  const fechas = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Anteriores'];

  return (
    <main className="dashboard">
      <section className="panel">
        <div className="title">
          <Sparkles size={22} />
          <div>
            <h1>Solicitudes de Diseño</h1>
            <p>Expedientes creados por el diseñador, identificados por su código DESIGN.</p>
          </div>
        </div>

        <div className="catalog-tools">
          <div className="search-box">
            <Search size={18} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar código, cliente, negocio, WhatsApp o estado..."
            />
          </div>

          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option>Todos</option>
            {ESTADOS.map((item) => (
              <option key={item} value={item}>{ETIQUETAS_ESTADO[item] || item}</option>
            ))}
          </select>

          <button type="button" className="filter-label" onClick={cargar}>
            <RefreshCw size={18} />
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {errorCarga && <p className="error-text">{errorCarga}</p>}
      </section>

      {fechas.map((grupo) => {
        const items = lista.filter((s) => s.grupoFecha === grupo);
        if (!items.length) return null;

        return (
          <section className="panel" key={grupo}>
            <div className="title">
              <CalendarDays size={20} />
              <h2>{grupo}</h2>
            </div>

            <div className="product-grid">
              {items.map((s) => (
                <article className="product-card" key={s.id}>
                  <div className="product-body">
                    <span className="store-ai-badge">{s.categoriaDetectada}</span>
                    <h3>{s.business_name || s.customer_name || 'Solicitud de diseño'}</h3>
                    <p><strong>Código:</strong> {s.request_code}</p>
                    <p><strong>Cliente:</strong> {s.customer_name || 'No indicado'}</p>
                    <p><strong>WhatsApp:</strong> {s.whatsapp || 'No indicado'}</p>
                    <p><strong>Tipo:</strong> {ETIQUETAS_TIPO[s.request_type] || s.request_type || 'No indicado'}</p>
                    <p><strong>Estado:</strong> {ETIQUETAS_ESTADO[s.status] || s.status || 'Pendiente'}</p>
                    <p>
                      <strong>Fecha:</strong>{' '}
                      {s.created_at ? new Date(s.created_at).toLocaleString() : 'Sin fecha'}
                    </p>
                    <button type="button" className="product-main-action" onClick={() => setAbierta(s)}>
                      Abrir expediente
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {!cargando && !lista.length && !errorCarga && (
        <section className="panel">
          <p className="note">No hay solicitudes de diseño con estos filtros.</p>
        </section>
      )}

      {abierta && (
        <section className="ai-chat-modal" role="dialog" aria-modal="true">
          <div className="ai-chat-card">
            <button type="button" className="ai-chat-close" onClick={() => setAbierta(null)}>
              <X size={22} />
            </button>

            <div className="ai-chat-head">
              <span><Sparkles size={18} /> Expediente DESIGN</span>
              <h2>{abierta.request_code}</h2>
              <p>{abierta.customer_name} · {abierta.business_name} · {abierta.whatsapp}</p>
            </div>

            <div className="ai-chat-body">
              <label className="ai-chat-field">
                <span>Estado</span>
                <select
                  value={abierta.status || 'ai_pending'}
                  onChange={(e) => cambiarEstado(abierta, e.target.value)}
                >
                  {ESTADOS.map((item) => (
                    <option key={item} value={item}>{ETIQUETAS_ESTADO[item] || item}</option>
                  ))}
                </select>
              </label>

              <div className="ai-chat-result">
                <h3>Datos del proyecto</h3>
                <p><strong>Tipo:</strong> {ETIQUETAS_TIPO[abierta.request_type] || abierta.request_type}</p>
                <p><strong>Ubicación:</strong> {abierta.installation_environment || 'No aplica'}</p>
                <p><strong>Medidas:</strong> {abierta.width_cm || '—'} × {abierta.height_cm || '—'} cm</p>
                <p><strong>Indicaciones:</strong> {abierta.design_notes || 'Sin descripción.'}</p>
              </div>

              <Archivos titulo="Archivos enviados por el cliente" archivos={abierta.files} />
              <Archivos titulo="Resultados generados" archivos={abierta.result_files} />

              <div className="ai-chat-result">
                <h3>Estado técnico</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
                  {JSON.stringify({
                    workflow_stage: abierta.workflow_stage,
                    revision_number: abierta.revision_number,
                    delivery_status: abierta.delivery_status,
                    delivered_at: abierta.delivered_at,
                    last_error_code: abierta.last_error_code,
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
