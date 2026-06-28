import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELAN_AI_BOTONES = `
Eres ELAN AI BOTONES.

Solo puedes diseñar botones luminosos comerciales.
No puedes diseñar fachadas ACM, letras 3D, roll up, displays, mesas, neón, directorios ni tótems.

Mantén siempre:
- Formato de botón.
- Medida base del producto.
- Precio base del producto.
- Acabado base del modelo.
- Construcción fabricable por ELANVISUAL.
- Materiales reales: acrílico, PVC, dorado espejo, frost, LED, estructura interna.
- Iluminación frontal, rebote o contorno según el modelo.

Modelos permitidos:
1. Botón Transparente — referencia Beauty Therapy — desde USD 100.
2. Botón con Impresión — referencia La Casa de las Gorras — desde USD 130.
3. Botón Impresión UV Premium — referencia Fiesta Naty — desde USD 150.
4. Botón Premium Combinado — referencia Lanza's Ranch — desde USD 190.

Render:
- Hiperrealista.
- Escala real.
- Cámara 50 mm.
- Fondo limpio.
- Sombras reales.
- Reflejos reales.
- No usar fondos fantasiosos.
- No generar productos fuera de la categoría botón.

No entregar archivos CNC, DXF, vectores finales ni archivos de producción.
La propuesta es conceptual. La digitalización final se realiza al confirmar pedido.
`;

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

async function generarRenderBotones(body = {}) {
  const producto = body.producto || {};
  const cliente = body.cliente || {};
  const contexto = body.contexto || {};
  const archivos = prepararImagenesTemporales(body.archivos_temporales);

  const prompt = [
    ELAN_AI_BOTONES,
    "",
    "PRODUCTO SELECCIONADO:",
    `Nombre: ${producto.nombre || "Botón luminoso"}`,
    `Categoría: ${producto.categoria || "Botones Publicitarios Premium"}`,
    `Precio base: ${producto.precio ? `USD ${producto.precio}` : "Consultar"}`,
    `Medida base: ${contexto.medidaBase || "60 x 60 cm"}`,
    "",
    "DATOS DEL CLIENTE:",
    `Negocio: ${cliente.negocio || "No indicado"}`,
    `WhatsApp: ${cliente.whatsapp || "No indicado"}`,
    "",
    "IDEA DEL CLIENTE:",
    cliente.idea || body.mensaje || "Crear propuesta visual elegante para el modelo seleccionado.",
    "",
    "INSTRUCCIÓN FINAL:",
    "Genera un render conceptual hiperrealista del botón seleccionado. Mantén el formato de botón, la medida base, el acabado del modelo y el precio base. Usa los archivos adjuntos como referencia visual si existen. No salgas de la categoría Botones.",
  ].join("\n");

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: prompt,
        },
        ...archivos,
      ],
    },
  ];

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input,
    tools: [{ type: "image_generation" }],
  });

  const imageOutput = response.output?.find((item) => item.type === "image_generation_call");
  const imageBase64 = imageOutput?.result || "";

  return {
    prompt,
    render_base64: imageBase64,
    respuesta: response.output_text || "Render solicitado.",
  };
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

    if (body.tipo === "render-botones") {
      const render = await generarRenderBotones(body);

      return res.status(200).json({
        ok: true,
        tipo: "render-botones",
        ...render,
      });
    }

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
