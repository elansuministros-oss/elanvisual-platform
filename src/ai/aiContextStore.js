const AI_CONTEXT_KEY = "elanvisual_ai_context_v1";

export const contextoInicialAI = {
  moduloActual: "general",
  clienteActivo: null,
  proyectoActivo: null,
  cotizacionActiva: null,
  pedidoActivo: null,
  ultimoCambio: null,
  historialContexto: [],
};

export function cargarContextoAI() {
  try {
    const raw = localStorage.getItem(AI_CONTEXT_KEY);
    if (!raw) return contextoInicialAI;
    return { ...contextoInicialAI, ...JSON.parse(raw) };
  } catch {
    return contextoInicialAI;
  }
}

export function guardarContextoAI(contexto) {
  localStorage.setItem(AI_CONTEXT_KEY, JSON.stringify(contexto));
}

export function limpiarContextoAI() {
  localStorage.removeItem(AI_CONTEXT_KEY);
}