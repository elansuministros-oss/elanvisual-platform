import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  cargarContextoAI,
  guardarContextoAI,
  contextoInicialAI,
} from "./aiContextStore";

const AIAssistantContext = createContext(null);

export function AIAssistantProvider({ children }) {
  const [abierto, setAbierto] = useState(false);
  const [contextoAI, setContextoAI] = useState(() =>
    cargarContextoAI()
  );

  useEffect(() => {
    guardarContextoAI(contextoAI);
  }, [contextoAI]);

  const value = useMemo(
    () => ({
      abierto,
      contextoAI,
      abrirAI: () => setAbierto(true),
      cerrarAI: () => setAbierto(false),
      alternarAI: () => setAbierto((v) => !v),
      setContextoAI,
      resetearContexto: () =>
        setContextoAI(contextoInicialAI),
    }),
    [abierto, contextoAI]
  );

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);

  if (!ctx) {
    throw new Error(
      "useAIAssistant debe usarse dentro de AIAssistantProvider"
    );
  }

  return ctx;
}