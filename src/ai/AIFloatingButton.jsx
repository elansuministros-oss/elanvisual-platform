import React from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import "./AIAssistant.css";

export default function AIFloatingButton() {
  const { alternarAI } = useAIAssistant();

  return (
    <button
      className="elan-ai-fab"
      onClick={alternarAI}
    >
      AI
    </button>
  );
}