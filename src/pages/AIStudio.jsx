import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { esAdminCRM, filtrarRegistrosCRM, obtenerFirmaVendedor } from '../services/permisosCRM';
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
    'Sin respuesta de IA'
  );
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
  const { usuario } = useApp();
  const firma = useMemo(() => obtenerFirmaVendedor(usuario || {}), [usuario]);
  const admin = esAdminCRM(usuario || {});

  const [proyectos, setProyectos] = useState([]);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', tipo_proyecto: 'Rotulación' });
  const [mensaje, setMensaje] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');

  const proyectosVisibles = useMemo(
    () => filtrarRegistrosCRM(usuario || {}, proyectos),
    [usuario, proyectos]
  );

  async function subirArchivo(file) {
    if (!file) return null;
    if (!supabase) return null;

    const nombre = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('ai-proyectos')
      .upload(nombre, file);

    if (error) {
      console.log('UPLOAD ERROR:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('ai-proyectos')
      .getPublicUrl(nombre);

    return urlData?.publicUrl || null;
  }

  async function cargarProyectos() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('proyectos_ai')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setProyectos(data || []);
    if (!proyectoActivo && data?.length) setProyectoActivo(data[0]);
  }

  async function cargarMensajes(proyectoId) {
    if (!supabase || !proyectoId) return;

    const { data, error } = await supabase
      .from('mensajes_ai')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: true });

    if (!error) setMensajes(data || []);
  }

  useEffect(() => {
    cargarProyectos();
  }, []);

  useEffect(() => {
    if (proyectoActivo?.id) cargarMensajes(proyectoActivo.id);
  }, [proyectoActivo?.id]);

  async function guardarMensaje(rol, contenido, metadata = {}) {
    const { data, error } = await supabase
      .from('mensajes_ai')
      .insert({
        proyecto_id: proyectoActivo.id,
        rol,
        contenido,
        canal: 'vendedor',
        vendedor_id: firma.vendedor_id,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function llamarCore(messages) {
    if (!CORE_URL) return { respuesta: 'CORE no configurado' };

    try {
      const res = await fetch(`${CORE_URL.replace(/\/$/, '')}/api/elan-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidad: 'ELANVISUAL',
          proyecto: proyectoActivo,
          usuario,
          messages,
        }),
      });

      return await res.json();
    } catch (err) {
      return { respuesta: 'Error de conexión con IA' };
    }
  }

  async function enviarMensaje(e) {
    e.preventDefault();
    if (!proyectoActivo || !mensaje.trim()) return;

    setCargando(true);
    setError('');
    setEstado('Procesando...');

    const texto = mensaje;
    setMensaje('');

    try {
      let archivoUrl = null;

      if (archivo) {
        archivoUrl = await subirArchivo(archivo);
        setArchivo(null);
      }

      const msgUser = await guardarMensaje('user', texto, {
        archivo: archivoUrl,
      });

      setMensajes((prev) => [...prev, msgUser]);

      const historial = [...mensajes, msgUser].map((m) => ({
        role: m.rol,
        content: m.contenido,
      }));

      const data = await llamarCore(historial);
      const respuesta = respuestaIA(data);

      const msgIA = await guardarMensaje('assistant', respuesta, { core: data });

      setMensajes((prev) => [...prev, msgIA]);

      await supabase
        .from('proyectos_ai')
        .update({
          updated_at: new Date().toISOString(),
          resumen: respuesta.slice(0, 500),
        })
        .eq('id', proyectoActivo.id);

      setEstado('Listo');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="ai-studio-page">

      <header className="ai-studio-header">
        <h1>AI Studio</h1>
      </header>

      <section className="ai-chat">

        <div className="ai-messages">
          {mensajes.map((m) => (
            <div key={m.id} className={`ai-msg ${m.rol}`}>
              {m.contenido}
            </div>
          ))}
        </div>

        <form onSubmit={enviarMensaje} className="ai-input">

          {estado && <div>{estado}</div>}
          {error && <div>{error}</div>}

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribí aquí..."
          />

          <input
            type="file"
            onChange={(e) => setArchivo(e.target.files[0])}
          />

          <button type="submit" disabled={cargando || !proyectoActivo}>
            Enviar
          </button>

        </form>

      </section>
    </main>
  );
}