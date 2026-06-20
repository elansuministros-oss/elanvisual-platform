import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido"
    });
  }

  try {
    const { mensaje, contexto } = req.body || {};

    if (!mensaje) {
      return res.status(400).json({
        ok: false,
        error: "Falta mensaje"
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Eres ELANVISUAL AI Studio. Ayudas a vendedores a crear propuestas técnicas, fachadas, rótulos, ACM, PVC, acrílico, letras, iluminación, renders conceptuales y estimados rápidos. No inventes precios. Si falta precio, indica solicitud de costo. No modifiques precios oficiales."
        },
        {
          role: "user",
          content: `Contexto: ${contexto || "Sin contexto"}\n\nSolicitud: ${mensaje}`
        }
      ]
    });

    return res.status(200).json({
      ok: true,
      respuesta: response.output_text || ""
    });
  } catch (error) {
    console.error("Error ELAN AI:", error);
    return res.status(500).json({
      ok: false,
      error: "Error conectando ELAN AI"
    });
  }
}
