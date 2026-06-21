const fs = require("fs");

function printRange(file, start, end) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  console.log("\n\n==============================");
  console.log(file + "  LINEAS " + start + " - " + end);
  console.log("==============================");
  for (let i = start; i <= end && i <= lines.length; i++) {
    console.log(String(i).padStart(4, " ") + ": " + lines[i - 1]);
  }
}

printRange("src/pages/CotizadorDirecto.jsx", 1, 140);
printRange("src/pages/CotizadorDirecto.jsx", 140, 260);
printRange("src/pages/CotizadorDirecto.jsx", 260, 460);
printRange("src/pages/CotizadorDirecto.jsx", 520, 620);
printRange("src/pages/CotizacionesInteligentes.jsx", 250, 305);
