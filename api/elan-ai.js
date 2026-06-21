import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extraerTexto(reqBody = {}) {
  if (reqBody.mensaje) return String(reqBody.mensaje);

  if (Array.isArray(reqBody.messages)) {
    return reqBody.messages
      .map((m) => m?.content || "")
      .filter(Boolean)
      .join("\n\n");
  }

  return "";
}

function prepararImagenesTemporales(archivos = []) {
  return Array.from(archivos || [])
    .filter((a) => {
      return (
        a &&
        a.dataUrl &&
        typeof a.dataUrl === "string" &&
        a.dataUrl.startsWith("data:image/")
      );
    })
    .slice(0, 4)
    .map((a) => ({
      type: "input_image",
      image_url: a.dataUrl,
    }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "ELANKAV CORE AI",
      endpoint: "/api/elan-ai",
      status: "online",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido",
    });
  }

  try {
    const body = req.body || {};
    const texto = extraerTexto(body);
    const contexto = body.contexto || body.proyecto || "Sin contexto";
    const imagenes = prepararImagenesTemporales(body.archivos_temporales);

    if (!texto && imagenes.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Falta mensaje o archivo visual",
      });
    }

    const contenidoUsuario = [
      {
        type: "input_text",
        text: [
          `Contexto: ${JSON.stringify(contexto)}`,
          "",
          "Solicitud:",
          texto || "Analiza los archivos adjuntos.",
        ].join("\n"),
      },
      ...imagenes,
    ];

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Eres ELANVISUAL AI Studio. Ayudas a vendedores a analizar imágenes, fachadas, logos, rótulos, ACM, PVC, acrílico, letras, iluminación, impresión, materiales, proveedores y propuestas técnicas. Primero describe lo visible. Luego recomienda solución fabricable. No inventes precios. Si falta precio, indica solicitud de costo o revisión en CotizadorDirecto. Si recibes una imagen, analízala visualmente y no digas que no puedes verla.",
        },
        {
          role: "user",
          content: contenidoUsuario,
        },
      ],
    });

    return res.status(200).json({
      ok: true,
      respuesta: response.output_text || "",
      vision: imagenes.length > 0,
      archivos_recibidos: Array.isArray(body.archivos_temporales)
        ? body.archivos_temporales.length
        : 0,
    });
  } catch (error) {
    console.error("Error ELAN AI:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Error conectando ELAN AI",
    });
  }
}
