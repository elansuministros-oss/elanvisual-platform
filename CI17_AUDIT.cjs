const fs = require("fs");

const files = [
  "src/pages/CotizadorDirecto.jsx",
  "src/pages/CotizacionesInteligentes.jsx"
];

for (const file of files) {
  const txt = fs.readFileSync(file, "utf8");
  console.log("\n==============================");
  console.log(file);
  console.log("LINEAS:", txt.split(/\r?\n/).length);
  console.log("==============================");

  const checks = [
    "localStorage",
    "elanvisual_cotizacion_item_activo",
    "cotizaciones_inteligentes",
    "URLSearchParams",
    "useSearchParams",
    "window.location.href",
    ".insert(",
    ".update(",
    ".from(",
    "guardar",
    "pedido",
    "PDF"
  ];

  for (const key of checks) {
    const found = txt.includes(key);
    console.log((found ? "OK " : "NO ") + key);
  }

  console.log("\n--- LINEAS CLAVE ---");
  txt.split(/\r?\n/).forEach((line, i) => {
    if (
      line.includes("localStorage") ||
      line.includes("elanvisual_cotizacion_item_activo") ||
      line.includes("window.location.href") ||
      line.includes("cotizaciones_inteligentes") ||
      line.includes(".insert(") ||
      line.includes(".update(") ||
      line.includes("async function guardar") ||
      line.includes("function guardar") ||
      line.includes("const guardar") ||
      line.includes("generarPDF") ||
      line.includes("guardarPedido") ||
      line.includes("crearPedido")
    ) {
      console.log((i + 1) + ": " + line);
    }
  });
}
