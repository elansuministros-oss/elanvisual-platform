const fs = require("fs");
const lines = fs.readFileSync(
 "src/pages/CotizadorDirecto.jsx",
 "utf8"
).split(/\r?\n/);

for(let i=538;i<=590;i++){
 console.log(String(i).padStart(4," ")+": "+lines[i-1]);
}
