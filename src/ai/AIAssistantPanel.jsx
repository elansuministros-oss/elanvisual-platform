import React from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import "./AIAssistant.css";

export default function AIAssistantPanel() {
  const { abierto, cerrarAI, contextoAI } =
    useAIAssistant();

  if (!abierto) return null;

  return (
    <div className="elan-ai-panel">
      <div className="elan-ai-header">
        <h3>ELAN AI</h3>

        <button onClick={cerrarAI}>
          ×
        </button>
      </div>

      <div className="elan-ai-body">
        <p>
          Asistente operativo global.
        </p>

        <pre>
          {JSON.stringify(
            contextoAI,
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}