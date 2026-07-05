const AI23_ENDPOINT = 'https://elankav-core.vercel.app/api/elan-ai';
const AI23_TIMEOUT_MS = 6000;

export const AI23_STATUS = Object.freeze({
  VALIDATED: 'VALIDATED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
});

function normalizeAi23Status(status) {
  return Object.values(AI23_STATUS).includes(status) ? status : AI23_STATUS.PENDING;
}

function createPendingResult(message = 'AI-23 no disponible') {
  return {
    ai23Status: AI23_STATUS.PENDING,
    ai23Message: message,
    ai23Source: 'AI23_UNAVAILABLE',
  };
}

function createComponentFromQuoteLine(line = {}) {
  return {
    nombre: line.producto?.nombre || 'Producto registrado',
    tipo: line.producto?.categoria || 'producto',
    unidad: line.costUnit || line.unidad || '',
    cantidad: Number(line.cantidad || 0),
    costo_unitario: Number(line.unitCost || 0),
  };
}

async function postAI23(payload) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), AI23_TIMEOUT_MS);

  try {
    const response = await fetch(AI23_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'cotizar-ai23',
        ...payload,
      }),
      signal: controller.signal,
    });

    return await response.json();
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function validateQuoteLine(line = {}) {
  try {
    const response = await postAI23({
      componentes: [createComponentFromQuoteLine(line)],
      moneda: line.currency || 'NIO',
      margen_porcentaje: 150,
    });

    if (response?.ok) {
      return {
        ai23Status: AI23_STATUS.VALIDATED,
        ai23Message: response?.mensaje || 'Validado por AI-23',
        ai23Source: 'AI23',
      };
    }

    return {
      ai23Status: AI23_STATUS.FAILED,
      ai23Message: response?.error || response?.mensaje || 'AI-23 no valido la linea',
      ai23Source: 'AI23',
    };
  } catch {
    return createPendingResult();
  }
}

async function validateQuote(quote = {}) {
  const lineas = Array.isArray(quote.lineas) ? quote.lineas : [];
  const validations = await Promise.all(lineas.map((line) => validateQuoteLine(line)));

  return {
    quoteId: quote.id || '',
    ai23Status: normalizeAi23Status(
      validations.every((validation) => validation.ai23Status === AI23_STATUS.VALIDATED)
        ? AI23_STATUS.VALIDATED
        : validations.some((validation) => validation.ai23Status === AI23_STATUS.FAILED)
          ? AI23_STATUS.FAILED
          : AI23_STATUS.PENDING
    ),
    lineas: validations,
  };
}

export const AI23Connector = Object.freeze({
  validateQuoteLine,
  validateQuote,
});
