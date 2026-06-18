const fs = require("fs");
const path = require("path");

const root = "src";
const exts = new Set([".js", ".jsx"]);

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (exts.has(path.extname(full).toLowerCase())) files.push(full);
  }
  return files;
}

function fixText(txt) {
  return txt
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Â·/g, "-")
    .replace(/Ã—/g, "x")
    .replace(/â†’/g, "-")
    .replace(/â€”/g, "-")
    .replace(/âœ“/g, "OK")
    .replace(/âœ…/g, "OK")
    .replace(/ðŸ[^'",<\]\)\s]*/g, "")
    .replace(/ðŸ/g, "")
    .replace(/Ãrea/g, "Área")
    .replace(/MÃ“DULO/g, "MÓDULO")
    .replace(/AcrÃlico/g, "Acrílico")
    .replace(/LÃ¡ser/g, "Láser")
    .replace(/EstelÃ/g, "Estelí")
    .replace(/RÃo/g, "Río")
    .replace(/CategorÃa/g, "Categoría")
    .replace(/TelÃ©fono/g, "Teléfono")
    .replace(/UbicaciÃ³n/g, "Ubicación")
    .replace(/DirecciÃ³n/g, "Dirección")
    .replace(/crÃ©dito/g, "crédito")
    .replace(/SÃ</g, "Sí<")
    .replace(/DÃas/g, "Días")
    .replace(/producciÃ³n/g, "producción")
    .replace(/EvaluaciÃ³n/g, "Evaluación")
    .replace(/Cotizacion/g, "Cotización")
    .replace(/Produccion/g, "Producción")
    .replace(/Comision/g, "Comisión")
    .replace(/Operacion/g, "Operación")
    .replace(/Instalacion/g, "Instalación")
    .replace(/aprobacion/g, "aprobación")
    .replace(/revision/g, "revisión")
    .replace(/fabricacion/g, "fabricación")
    .replace(/rapida/g, "rápida")
    .replace(/criticas/g, "críticas")
    .replace(/automatizacion/g, "automatización")
    .replace(/Rotulacion/g, "Rotulación")
    .replace(/impresion/g, "impresión")
    .replace(/Construccion/g, "Construcción")
    .replace(/Energia/g, "Energía")
    .replace(/Ultimas/g, "Últimas")
    .replace(/Ordenes/g, "Órdenes");
}

let changed = [];

for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  const fixed = fixText(original);

  if (fixed !== original) {
    fs.writeFileSync(file, fixed, "utf8");
    changed.push(file);
  }
}

console.log("FILES_CHANGED:");
console.log(changed.join("\n"));
