import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { useApp } from "../context/AppContext";
import {
  prepararArchivosTemporalesAI,
  construirResumenArchivosTemporales,
} from "../services/aiTemporalService";
import {
  buildAIRuntimeContext,
  getAICapabilitiesForRole,
} from "./aiCapabilities";
import "./AIAssistant.css";

const CORE_URL = import.meta.env.VITE_ELANKAV_CORE_URL || "";

export default function AIAssistantPanel() {
  const { abierto, cerrarAI, contextoAI } = useAIAssistant();
  const { usuario } = useApp();

  const [mensaje, setMensaje] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [mensajesChat, setMensajesChat] = useState([
    {
      rol: "assistant",
      texto:
        "Hola. Soy ELAN. Puedo ayudarte con clientes, cotizaciones, señalización, impresión, materiales, análisis de imágenes y solicitudes creativas según tus permisos.",
    },
  ]);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [vozSalida, setVozSalida] = useState(false);
  const recognitionRef = useRef(null);

  const capabilities = useMemo(
    () => getAICapabilitiesForRole(usuario?.rol),
    [usuario?.rol]
  );

  const runtimeContext = useMemo(
    () => buildAIRuntimeContext({ usuario, contextoAI }),
    [usuario, contextoAI, abierto]
  );

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // El navegador puede haber cerrado ya la sesión de reconocimiento.
      }
    };
  }, []);

  if (!abierto || !capabilities.canUseAssistant) return null;

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

  function hablar(texto) {
    if (!vozSalida || typeof window === "undefined" || !window.speechSynthesis) return;
    const limpio = String(texto || "").trim();
    if (!limpio) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(limpio);
    utterance.lang = "es-NI";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function alternarEscucha() {
    if (!capabilities.canUseVoice) return;

    if (escuchando) {
      recognitionRef.current?.stop?.();
      setEscuchando(false);
      setEstado("");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Este navegador no ofrece reconocimiento de voz compatible. Podés seguir usando texto.");
      return;
    }

    setError("");
    const recognition = new SpeechRecognition();
    recognition.lang = "es-NI";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setEscuchando(true);
      setEstado("Escuchando...");
    };

    recognition.onresult = (event) => {
      let transcripcion = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcripcion += event.results[i][0]?.transcript || "";
      }
      if (transcripcion.trim()) setMensaje(transcripcion.trim());
    };

    recognition.onerror = (event) => {
      setEscuchando(false);
      setEstado("");
      if (event.error !== "aborted") {
        setError(`No se pudo usar el micrófono (${event.error || "error"}).`);
      }
    };

    recognition.onend = () => {
      setEscuchando(false);
      setEstado("");
    };

    recognitionRef.current = recognition;
    recognition.start();
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
    setEstado("Consultando ELAN...");

    try {
      const contextoEnVivo = buildAIRuntimeContext({ usuario, contextoAI });
      const res = await fetch(`${CORE_URL.replace(/\/$/, "")}/api/elan-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "copilot",
          unidad: "ELANVISUAL",
          canal: "web",
          contexto: contextoAI,
          runtime_context: contextoEnVivo,
          capabilities: capabilities,
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

      hablar(texto);
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
        <div>
          <h3>ELAN</h3>
          <div className="elan-ai-context-line">
            {runtimeContext.capabilities.role === "owner" ? "OWNER" : "VENTAS"}
            <span>·</span>
            {runtimeContext.pathname}
          </div>
        </div>
        <div className="elan-ai-header-actions">
          <button
            type="button"
            className={`elan-ai-voice-toggle ${vozSalida ? "active" : ""}`}
            onClick={() => setVozSalida((v) => !v)}
            title={vozSalida ? "Desactivar respuesta hablada" : "Activar respuesta hablada"}
          >
            {vozSalida ? "🔊" : "🔈"}
          </button>
          <button className="elan-ai-close" onClick={cerrarAI}>×</button>
        </div>
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
          <label className="elan-ai-attach" title="Adjuntar imagen o PDF">
            📎
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.svg,.pdf"
              onChange={manejarArchivos}
            />
          </label>

          <button
            type="button"
            className={`elan-ai-mic ${escuchando ? "listening" : ""}`}
            onClick={alternarEscucha}
            disabled={!capabilities.canUseVoice || cargando}
            title={escuchando ? "Detener escucha" : "Hablar con ELAN"}
          >
            {escuchando ? "●" : "🎙"}
          </button>

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={enviarConEnter}
            placeholder="Pedile algo a ELAN..."
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
