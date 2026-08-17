import React from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { useApp } from "../context/AppContext";
import { getAICapabilitiesForRole } from "./aiCapabilities";
import "./AIAssistant.css";

export default function AIFloatingButton() {
  const { alternarAI } = useAIAssistant();
  const { usuario } = useApp();
  const capabilities = getAICapabilitiesForRole(usuario?.rol);
  if (!capabilities.canUseAssistant) return null;

  return (
    <button className="elan-ai-fab" onClick={alternarAI} aria-label="Abrir ELAN Copilot">
      <span className="elan-ai-fab-core">✦</span>
      <span className="elan-ai-fab-label">ELAN</span>
    </button>
  );
}
