import React from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { useApp } from "../context/AppContext";
import "./AIAssistant.css";

export default function AIFloatingButton() {
  const { alternarAI } = useAIAssistant();
  const { usuario } = useApp();

  // El asistente flotante heredado usa ELANKAV CORE y permite análisis/cotización
  // preliminar. No es la autoridad comercial oficial y por eso no se expone a
  // vendedores. El rol ventas cotiza mediante ELAN/CONNECT con precios autorizados.
  if (String(usuario?.rol || '').toLowerCase() === 'ventas') return null;

  return (
    <button
      className="elan-ai-fab"
      onClick={alternarAI}
    >
      AI
    </button>
  );
}