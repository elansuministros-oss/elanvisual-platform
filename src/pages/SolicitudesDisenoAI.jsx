import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const formatearFecha = (valor) => {
  if (!valor) return 'Sin fecha';
  return new Date(valor).toLocaleString();
};

const normalizarArchivos = (valor) => (Array.isArray(valor) ? valor : []);

const obtenerUrlDirecta = (archivo = {}) =>
  archivo.signedUrl || archivo.publicUrl || archivo.url || archivo.dataUrl || '';

async function firmarArchivos(archivos = []) {
  return Promise.all(
    normalizarArchivos(archivos).map(async (archivo) => {
      const directa = obtenerUrlDirecta(archivo);
      if (directa) return { ...archivo, signedUrl: directa };
      if (!archivo?.bucket || !archivo?.path || !supabase) {
        return { ...archivo, signedUrlError: 'El archivo no tiene bucket o ruta registrada.' };
      }

      const { data, error } = await supabase.storage
        .from(archivo.bucket)
        .createSignedUrl(archivo.path, 60 * 30);

      if (error) return { ...archivo, signedUrlError: error.message };
      return { ...archivo, signedUrl: data?.signedUrl || '' };
    })
  );
}

function GaleriaArchivos({ titulo, archivos = [] }) {
  const lista = normalizarArchivos(archivos);

  return (
    <div className="ai-chat-result">
      <h3>{titulo}</h3>
      {!lista.length && <p>No hay archivos registrados.</p>}
      {!!lista.length && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {lista.map((archivo, index) => (
            <article
              key={`${archivo.path || archivo.name || 'archivo'}-${index}`}
              style={{ border: '1px solid #dbe5f0', borderRadius: 14, padding: 12, background: '#fff' }}
            >
              {archivo.signedUrl ? (
                <a href={archivo.signedUrl} target="_blank" rel="noreferrer">
                  <img
                    src={archivo.signedUrl}
                    alt={archivo.name || titulo}
                    style={{ width: '100%', height: 220, objectFit: 'contain', borderRadius: 10, background: '#f8fafc' }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    minHeight: 130,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    padding: 12,
                    borderRadius: 10,
                    background: '#fff7ed',
                    color: '#9a3412',
                  }}
                >
                  {archivo.signedUrlError || 'Archivo registrado sin vista previa.'}
                </div>
              )}
              <p style={{ marginTop: 8, overflowWrap: 'anywhere' }}>
                <strong>{archivo.kind || 'archivo'}:</strong> {archivo.name || archivo.path || 'Archivo'}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SolicitudesDisenoAI() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);

  const cargar = async () => {
    if (!supabase) {
      setErrorCarga('Supabase no está configurado en esta instalación.');
      return;
    }

    setCargando(true);
    setErrorCarga('');

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData?.session?.access_token) {
        setSolicitudes([]);
        setErrorCarga('Sesión administrativa requerida. Cierra sesión e ingresa nuevamente para abrir Diseñador.');
        return;
      }

      const { data, error } = await supabase
        .from('design_requests')
        .select([
          'id',
          'request_code',
          'customer_name',
          'business_name',
          'whatsapp',
          'request_type',
          'installation_environment',
          'width_cm',
          'height_cm',
          'design_notes',
          'status',
          'created_at',
          'files',
          'result_files',
        ].join(','))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando solicitudes de diseño:', error);
        setSolicitudes([]);
        setErrorCarga(`No fue posible cargar las solicitudes: ${error.message}`);
      } else {
        setSolicitudes(data || []);
      }
    } catch (error) {
      console.error('Error validando la sesión administrativa:', error);
      setSolicitudes([]);
      setErrorCarga(`No fue posible validar la sesión administrativa: ${error?.message || 'Error desconocido'}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, porPagina]);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return solicitudes;

    return solicitudes.filter((solicitud) =>
      [
        solicitud.request_code,
        solicitud.customer_name,
        solicitud.business_name,
        solicitud.whatsapp,
        solicitud.request_type,
        solicitud.status,
      ]
        .map((valor) => String(valor || '').toLowerCase())
        .some((valor) => valor.includes(q))
    );
  }, [solicitudes, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = lista.slice(inicio, inicio + porPagina);

  const abrirExpediente = async (solicitud) => {
    setCargandoExpediente(true);
    const [files, resultFiles] = await Promise.all([
      firmarArchivos(solicitud.files),
      firmarArchivos(solicitud.result_files),
    ]);
    setAbierta({ ...solicitud, files, result_files: resultFiles });
    setCargandoExpediente(false);
  };

  return (
    <main className="dashboard">
      <section className="panel">
        <div className="title">
          <Sparkles size={22} />
          <div>
            <h1>Solicitudes de Diseño</h1>
            <p>{solicitudes.length} expedientes registrados.</p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) 150px auto',
            gap: 12,
            alignItems: 'center',
            marginTop: 18,
          }}
        >
          <label
            style={{
              minHeight: 52,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 16px',
              border: '1px solid #cbd5e1',
              borderRadius: 14,
              background: '#fff',
            }}
          >
            <Search size={20} />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por código DESIGN, nombre, negocio o WhatsApp"
              style={{ width: '100%', border: 0, outline: 0, background: 'transparent', fontSize: 16 }}
            />
          </label>

          <select
            value={porPagina}
            onChange={(event) => setPorPagina(Number(event.target.value))}
            style={{ minHeight: 52, borderRadius: 14, border: '1px solid #cbd5e1', padding: '0 12px', background: '#fff' }}
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>

          <button type="button" className="filter-label" onClick={cargar} disabled={cargando}>
            <RefreshCw size={18} />
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {errorCarga && <p className="error-text">{errorCarga}</p>}
      </section>

      {!cargando && !errorCarga && (
        <section className="panel">
          <div style={{ display: 'grid', gap: 8 }}>
            {visibles.map((solicitud) => (
              <button
                key={solicitud.id}
                type="button"
                onClick={() => void abrirExpediente(solicitud)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(150px, .8fr) auto',
                  gap: 16,
                  alignItems: 'center',
                  textAlign: 'left',
                  padding: '14px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#0f172a',
                }}
              >
                <span>
                  <strong style={{ display: 'block', fontSize: 16 }}>{solicitud.customer_name || 'Sin nombre'}</strong>
                  <small style={{ display: 'block', marginTop: 4 }}>{solicitud.request_code}</small>
                </span>
                <span>{solicitud.business_name || 'Sin negocio'}</span>
                <span>{solicitud.whatsapp || 'Sin WhatsApp'}</span>
                <span className="store-ai-badge">
                  {ETIQUETAS_ESTADO[solicitud.status] || solicitud.status || 'Pendiente'}
                </span>
              </button>
            ))}
          </div>

          {!visibles.length && (
            <p className="note">No hay solicitudes que coincidan con la búsqueda.</p>
          )}

          {lista.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <span>
                Mostrando {inicio + 1}–{Math.min(inicio + porPagina, lista.length)} de {lista.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                  disabled={paginaActual <= 1}
                  className="filter-label"
                >
                  <ChevronLeft size={18} /> Anterior
                </button>
                <strong>{paginaActual} / {totalPaginas}</strong>
                <button
                  type="button"
                  onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
                  disabled={paginaActual >= totalPaginas}
                  className="filter-label"
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {cargandoExpediente && (
        <section className="ai-chat-modal" role="status">
          <div className="ai-chat-card">
            <div className="ai-chat-body"><p>Cargando expediente...</p></div>
          </div>
        </section>
      )}

      {abierta && !cargandoExpediente && (
        <section className="ai-chat-modal" role="dialog" aria-modal="true">
          <div className="ai-chat-card">
            <button type="button" className="ai-chat-close" onClick={() => setAbierta(null)}>
              <X size={22} />
            </button>

            <div className="ai-chat-head">
              <span><Sparkles size={18} /> Expediente DESIGN</span>
              <h2>{abierta.request_code}</h2>
              <p>{abierta.customer_name} · {abierta.whatsapp}</p>
            </div>

            <div className="ai-chat-body">
              <GaleriaArchivos titulo="Diseños realizados" archivos={abierta.result_files} />
              <GaleriaArchivos titulo="Archivos enviados" archivos={abierta.files} />

              <div className="ai-chat-result">
                <h3>Cliente</h3>
                <p><strong>Nombre:</strong> {abierta.customer_name || 'No indicado'}</p>
                <p><strong>Negocio:</strong> {abierta.business_name || 'No indicado'}</p>
                <p><strong>WhatsApp:</strong> {abierta.whatsapp || 'No indicado'}</p>
              </div>

              <div className="ai-chat-result">
                <h3>Solicitud</h3>
                <p><strong>Tipo:</strong> {ETIQUETAS_TIPO[abierta.request_type] || abierta.request_type || 'No indicado'}</p>
                <p><strong>Ubicación:</strong> {abierta.installation_environment || 'No aplica'}</p>
                <p><strong>Medidas:</strong> {abierta.width_cm || '—'} × {abierta.height_cm || '—'} cm</p>
                <p><strong>Estado:</strong> {ETIQUETAS_ESTADO[abierta.status] || abierta.status || 'Pendiente'}</p>
                <p><strong>Indicaciones:</strong> {abierta.design_notes || 'Sin descripción.'}</p>
                <p><strong>Fecha:</strong> {formatearFecha(abierta.created_at)}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
