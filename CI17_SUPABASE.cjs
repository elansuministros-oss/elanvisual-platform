const fs = require("fs");

const lines = fs.readFileSync(
 "src/pages/CotizacionesInteligentes.jsx",
 "utf8"
).split(/\r?\n/);

for(let i=1;i<=160;i++){
 console.log(String(i).padStart(4," ")+": "+lines[i-1]);
}
