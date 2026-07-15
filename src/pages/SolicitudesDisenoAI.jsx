import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Sparkles, X } from 'lucide-react';
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

export default function SolicitudesDisenoAI() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
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

    setCargando(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

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

        <div className="catalog-tools">
          <div className="search-box">
            <Search size={18} />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar código, cliente, negocio o WhatsApp..."
            />
          </div>

          <button type="button" className="filter-label" onClick={cargar}>
            <RefreshCw size={18} />
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {errorCarga && <p className="error-text">{errorCarga}</p>}
      </section>

      {!cargando && !errorCarga && (
        <section className="panel">
          <div className="product-grid">
            {lista.map((solicitud) => (
              <article className="product-card" key={solicitud.id}>
                <div className="product-body">
                  <span className="store-ai-badge">
                    {ETIQUETAS_ESTADO[solicitud.status] || solicitud.status || 'Pendiente'}
                  </span>
                  <h3>{solicitud.request_code}</h3>
                  <p><strong>Cliente:</strong> {solicitud.customer_name || 'No indicado'}</p>
                  <p><strong>Negocio:</strong> {solicitud.business_name || 'No indicado'}</p>
                  <p><strong>WhatsApp:</strong> {solicitud.whatsapp || 'No indicado'}</p>
                  <p><strong>Tipo:</strong> {ETIQUETAS_TIPO[solicitud.request_type] || solicitud.request_type || 'No indicado'}</p>
                  <p><strong>Fecha:</strong> {formatearFecha(solicitud.created_at)}</p>
                  <button
                    type="button"
                    className="product-main-action"
                    onClick={() => setAbierta(solicitud)}
                  >
                    Abrir expediente
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!lista.length && (
            <p className="note">No hay solicitudes que coincidan con la búsqueda.</p>
          )}
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
              <p>{abierta.customer_name} · {abierta.whatsapp}</p>
            </div>

            <div className="ai-chat-body">
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
