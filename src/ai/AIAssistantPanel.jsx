import React, { useState } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import {
  prepararArchivosTemporalesAI,
  construirResumenArchivosTemporales,
} from "../services/aiTemporalService";
import "./AIAssistant.css";

const CORE_URL = import.meta.env.VITE_ELANKAV_CORE_URL || "";

export default function AIAssistantPanel() {
  const { abierto, cerrarAI, contextoAI } = useAIAssistant();

  const [mensaje, setMensaje] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [mensajesChat, setMensajesChat] = useState([
    {
      rol: "assistant",
      texto:
        "Hola. Soy ELAN AI. Puedo ayudarte con señalización, impresión, materiales, proveedores, cotización preliminar y análisis de imágenes.",
    },
  ]);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  async function manejarArchivos(e) {
    const lista = Array.from(e.target.files || []);
    if (!lista.length) return;

    setError("");
    setEstado("Leyendo archivos...");

    try {
      const preparados = await prepararArchivosTemporalesAI(lista);
      setArchivos((prev) => [...prev, ...preparados]);
      setEstado("");
    } catch (err) {
      setError(err.message || "No se pudieron preparar los archivos.");
    }

    e.target.value = "";
  }

  function quitarArchivo(index) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  async function enviarMensaje() {
    if (!mensaje.trim() && archivos.length === 0) return;

    if (!CORE_URL) {
      setError("Falta VITE_ELANKAV_CORE_URL en .env / Vercel.");
      return;
    }

    const resumenArchivos = construirResumenArchivosTemporales(archivos);
    const contenidoUsuario = [
      mensaje.trim(),
      resumenArchivos
        ? "\n\nARCHIVOS TEMPORALES ADJUNTOS:\n" + resumenArchivos
        : "",
    ].join("");

    const textoVisibleUsuario =
      mensaje.trim() ||
      `Archivo adjunto: ${archivos.map((a) => a.nombre).join(", ")}`;

    setMensajesChat((prev) => [
      ...prev,
      {
        rol: "user",
        texto: textoVisibleUsuario,
      },
    ]);

    setCargando(true);
    setError("");
    setEstado("Consultando...");

    try {
      const res = await fetch(`${CORE_URL.replace(/\/$/, "")}/api/elan-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "flotante",
          unidad: "ELANVISUAL",
          contexto: contextoAI,
          messages: [
            {
              role: "user",
              content: contenidoUsuario,
            },
          ],
          archivos_temporales: archivos
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

      if (!res.ok) {
        throw new Error(`CORE respondió ${res.status}`);
      }

      const data = await res.json();
      const texto =
        data?.texto ||
        data?.respuesta ||
        data?.message ||
        data?.content ||
        "Respuesta recibida sin texto.";

      setMensajesChat((prev) => [
        ...prev,
        {
          rol: "assistant",
          texto,
        },
      ]);

      setMensaje("");
      setArchivos([]);
      setEstado("");
    } catch (err) {
      const textoError = err.message || "No se pudo consultar ELANKAV CORE.";
      setError(textoError);
      setMensajesChat((prev) => [
        ...prev,
        {
          rol: "assistant",
          texto: `No pude conectar con ELANKAV CORE. ${textoError}`,
          error: true,
        },
      ]);
      setEstado("");
    } finally {
      setCargando(false);
    }
  }

  function enviarConEnter(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  return (
    <div className="elan-ai-panel">
      <div className="elan-ai-header">
        <h3>ELAN AI</h3>
        <button className="elan-ai-close" onClick={cerrarAI}>×</button>
      </div>

      <div className="elan-ai-chat">
        {mensajesChat.map((m, index) => (
          <div key={index} className={`elan-ai-row ${m.rol}`}>
            {m.rol === "assistant" && <div className="elan-ai-avatar">✦</div>}
            <div className={`elan-ai-bubble ${m.rol} ${m.error ? "error" : ""}`}>
              {m.texto}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="elan-ai-row assistant">
            <div className="elan-ai-avatar">✦</div>
            <div className="elan-ai-bubble assistant">Analizando...</div>
          </div>
        )}
      </div>

      <div className="elan-ai-composer">
        {archivos.length > 0 && (
          <div className="elan-ai-files">
            {archivos.map((archivo, i) => (
              <span key={`${archivo.nombre}-${i}`} className="elan-ai-file-chip">
                {archivo.ok ? "📎" : "⚠"} {archivo.nombre}
                <button type="button" onClick={() => quitarArchivo(i)}>×</button>
              </span>
            ))}
          </div>
        )}

        {error && <div className="elan-ai-error">{error}</div>}
        {estado && <div className="elan-ai-status">{estado}</div>}

        <div className="elan-ai-inputbar">
          <label className="elan-ai-attach">
            📎
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.svg,.pdf"
              onChange={manejarArchivos}
            />
          </label>

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={enviarConEnter}
            placeholder="Escriba una consulta..."
            rows={1}
          />

          <button type="button" className="elan-ai-send" onClick={enviarMensaje} disabled={cargando}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
