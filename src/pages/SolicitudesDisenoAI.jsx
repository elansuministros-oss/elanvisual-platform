import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ESTADOS = [
  'pendiente_diseno_manual',
  'en_diseno',
  'render_listo',
  'cotizado',
  'enviado_whatsapp',
  'cerrado',
];

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

const detectarCategoria = (s) => {
  const t = `${s.producto || ''} ${s.modelo || ''} ${s.idea || ''}`.toLowerCase();
  if (t.includes('boton') || t.includes('botón')) return 'Botones';
  if (t.includes('letra')) return 'Letras';
  if (t.includes('jalavista')) return 'Jalavistas';
  if (t.includes('fachada')) return 'Fachadas';
  if (t.includes('totem') || t.includes('tótem')) return 'Tótems';
  if (t.includes('señal') || t.includes('senal')) return 'Señalización';
  return 'Otros';
};

export default function SolicitudesDisenoAI() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [estado, setEstado] = useState('Todos');
  const [abierta, setAbierta] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    if (!supabase) return;
    setCargando(true);

    const { data, error } = await supabase
      .from('elan_ai_solicitudes_render')
      .select('*')
      .order('creado_en', { ascending: false });

    if (!error) setSolicitudes(data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return solicitudes
      .map((s) => ({
        ...s,
        categoriaDetectada: detectarCategoria(s),
        grupoFecha: grupoFecha(s.creado_en),
      }))
      .filter((s) => categoria === 'Todas' || s.categoriaDetectada === categoria)
      .filter((s) => estado === 'Todos' || s.estado === estado)
      .filter((s) => {
        if (!q) return true;
        return `${s.whatsapp || ''} ${s.producto || ''} ${s.modelo || ''} ${s.idea || ''} ${s.estado || ''}`.toLowerCase().includes(q);
      });
  }, [solicitudes, busqueda, categoria, estado]);

  const cambiarEstado = async (s, nuevoEstado) => {
    if (!supabase || !s?.id) return;

    const { error } = await supabase
      .from('elan_ai_solicitudes_render')
      .update({ estado: nuevoEstado })
      .eq('id', s.id);

    if (!error) {
      setSolicitudes((prev) =>
        prev.map((item) => item.id === s.id ? { ...item, estado: nuevoEstado } : item)
      );
      setAbierta((prev) => prev?.id === s.id ? { ...prev, estado: nuevoEstado } : prev);
    }
  };

  const categorias = ['Todas', 'Botones', 'Letras', 'Jalavistas', 'Fachadas', 'Tótems', 'Señalización', 'Otros'];
  const fechas = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Anteriores'];

  return (
    <main className="dashboard">
      <section className="panel">
        <div className="title">
          <Sparkles size={22} />
          <div>
            <h1>Solicitudes AI</h1>
            <p>Diseños recibidos desde Tienda, clasificados por categoría, fecha y estado.</p>
          </div>
        </div>

        <div className="catalog-tools">
          <div className="search-box">
            <Search size={18} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar WhatsApp, modelo, idea o estado..."
            />
          </div>

          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option>Todos</option>
            {ESTADOS.map((e) => <option key={e}>{e}</option>)}
          </select>

          <button type="button" className="filter-label" onClick={cargar}>
            <RefreshCw size={18} />
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
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
                    <h3>{s.modelo || s.producto || 'Solicitud AI'}</h3>
                    <p><strong>WhatsApp:</strong> {s.whatsapp || 'No indicado'}</p>
                    <p><strong>Estado:</strong> {s.estado || 'pendiente'}</p>
                    <p><strong>Fecha:</strong> {s.creado_en ? new Date(s.creado_en).toLocaleString() : 'Sin fecha'}</p>
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

      {!lista.length && (
        <section className="panel">
          <p className="note">No hay solicitudes AI con estos filtros.</p>
        </section>
      )}

      {abierta && (
        <section className="ai-chat-modal" role="dialog" aria-modal="true">
          <div className="ai-chat-card">
            <button type="button" className="ai-chat-close" onClick={() => setAbierta(null)}>
              <X size={22} />
            </button>

            <div className="ai-chat-head">
              <span><Sparkles size={18} /> Expediente AI</span>
              <h2>{abierta.modelo || abierta.producto || 'Solicitud'}</h2>
              <p>{abierta.whatsapp}</p>
            </div>

            <div className="ai-chat-body">
              <label className="ai-chat-field">
                <select value={abierta.estado || 'pendiente_diseno_manual'} onChange={(e) => cambiarEstado(abierta, e.target.value)}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </label>

              <div className="ai-chat-result">
                <h3>Idea del cliente</h3>
                <p>{abierta.idea || 'Sin descripción.'}</p>
              </div>

              <div className="ai-chat-result">
                <h3>Orden técnica</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
                  {JSON.stringify(abierta.orden_tecnica || {}, null, 2)}
                </pre>
              </div>

              <div className="ai-chat-result">
                <h3>Archivos</h3>
                <p><strong>Logo / referencia:</strong> {abierta.logo_url ? 'Recibido' : 'No recibido'}</p>
                {abierta.logo_url ? (
                  <img
                    src={abierta.logo_url}
                    alt="Logo o referencia del cliente"
                    style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 14, background: '#fff', border: '1px solid #dbe5f0', marginTop: 10 }}
                  />
                ) : null}
                <p><strong>Foto lugar:</strong> {abierta.lugar_url ? 'Recibida' : 'No recibida'}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

