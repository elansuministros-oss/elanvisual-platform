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
  const [respuesta, setRespuesta] = useState("");
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  async function manejarArchivos(e) {
    const lista = Array.from(e.target.files || []);
    if (!lista.length) return;

    setError("");
    setEstado("Leyendo archivos temporalmente...");

    try {
      const preparados = await prepararArchivosTemporalesAI(lista);
      setArchivos((prev) => [...prev, ...preparados]);
      setEstado("Archivos listos para análisis temporal. No se guardaron en Storage.");
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

    setCargando(true);
    setError("");
    setEstado("Consultando ELANKAV CORE...");

    try {
      const resumenArchivos = construirResumenArchivosTemporales(archivos);

      const contenidoUsuario = [
        mensaje.trim(),
        resumenArchivos
          ? "\n\nARCHIVOS TEMPORALES ADJUNTOS:\n" + resumenArchivos
          : "",
      ].join("");

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

      setRespuesta(texto);
      setMensaje("");
      setArchivos([]);
      setEstado("Respuesta recibida.");
    } catch (err) {
      setError(err.message || "No se pudo consultar ELANKAV CORE.");
      setEstado("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="elan-ai-panel">
      <div className="elan-ai-header">
        <h3>ELAN AI</h3>
        <button onClick={cerrarAI}>×</button>
      </div>

      <div className="elan-ai-body">
        <div className="elan-ai-section">
          <strong>Asistente Operativo Global</strong>
        </div>

        {respuesta && (
          <div className="elan-ai-section">
            <strong>Respuesta</strong>
            <div className="elan-ai-respuesta">{respuesta}</div>
          </div>
        )}

        <div className="elan-ai-section">
          <label>Adjuntar JPG, PNG, SVG o PDF para análisis temporal</label>

          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.svg,.pdf"
            onChange={manejarArchivos}
          />

          {archivos.length > 0 && (
            <ul>
              {archivos.map((archivo, i) => (
                <li key={`${archivo.nombre}-${i}`}>
                  {archivo.ok ? "Temporal" : "Error"} — {archivo.nombre}
                  <button type="button" onClick={() => quitarArchivo(i)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="elan-ai-section">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escriba una consulta..."
            rows={4}
            style={{ width: "100%" }}
          />
        </div>

        {estado && <div className="elan-ai-section">{estado}</div>}
        {error && <div className="elan-ai-section" style={{ color: "red" }}>{error}</div>}

        <div className="elan-ai-section">
          <button type="button" onClick={enviarMensaje} disabled={cargando}>
            {cargando ? "Consultando..." : "Enviar"}
          </button>
        </div>

        <div className="elan-ai-section">
          <strong>Contexto actual</strong>
          <pre>{JSON.stringify(contextoAI, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
