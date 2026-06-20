import React, { useState } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import "./AIAssistant.css";

export default function AIAssistantPanel() {
  const { abierto, cerrarAI, contextoAI } = useAIAssistant();

  const [mensaje, setMensaje] = useState("");
  const [archivos, setArchivos] = useState([]);

  if (!abierto) return null;

  function manejarArchivos(e) {
    const lista = Array.from(e.target.files || []);
    setArchivos((prev) => [...prev, ...lista]);
  }

  return (
    <div className="elan-ai-panel">
      <div className="elan-ai-header">
        <h3>ELAN AI</h3>

        <button onClick={cerrarAI}>
          ×
        </button>
      </div>

      <div className="elan-ai-body">

        <div className="elan-ai-section">
          <strong>Asistente Operativo Global</strong>
        </div>

        <div className="elan-ai-section">
          <label>Adjuntar archivos</label>

          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.ai,.eps,.cdr,.zip"
            onChange={manejarArchivos}
          />

          {archivos.length > 0 && (
            <ul>
              {archivos.map((archivo, i) => (
                <li key={i}>
                  {archivo.name}
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

        <div className="elan-ai-section">
          <button type="button">
            Enviar
          </button>
        </div>

        <div className="elan-ai-section">
          <strong>Contexto actual</strong>

          <pre>
            {JSON.stringify(
              contextoAI,
              null,
              2
            )}
          </pre>
        </div>

      </div>
    </div>
  );
}
