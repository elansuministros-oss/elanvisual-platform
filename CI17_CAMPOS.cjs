const fs = require("fs");

const txt = fs.readFileSync("src/pages/CotizacionesInteligentes.jsx", "utf8");
const usados = [...txt.matchAll(/cotizacion\.([a-zA-Z0-9_]+)/g)]
  .map(m => m[1]);

const unicos = [...new Set(usados)].sort();

console.log("CAMPOS cotizacion.* USADOS:");
for (const c of unicos) console.log("- " + c);

console.log("\nLINEAS CON cotizacion.");
txt.split(/\r?\n/).forEach((line, i) => {
  if (line.includes("cotizacion.")) {
    console.log(String(i + 1).padStart(4, " ") + ": " + line);
  }
});
