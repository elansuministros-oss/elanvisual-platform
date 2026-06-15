const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (/\.(js|jsx|css)$/.test(full)) files.push(full);
  }
  return files;
}

const fixes = {
  'RotulaciÃ³n': 'Rotulacion',
  'ProducciÃ³n': 'Produccion',
  'Imagen Comercial': 'Imagen Comercial',
  'impresiÃ³n': 'impresion',
  'InstalaciÃ³n': 'Instalacion',
  'instalaciÃ³n': 'instalacion',
  'CategorÃa': 'Categoria',
  'SubcategorÃa': 'Subcategoria',
  'catÃ¡logo': 'catalogo',
  'CatÃ¡logo': 'Catalogo',
  'AdministraciÃ³n': 'Administracion',
  'administraciÃ³n': 'administracion',
  'Ãtem': 'Item',
  'Ã¡': 'a',
  'Ã©': 'e',
  'Ã­': 'i',
  'Ã³': 'o',
  'Ãº': 'u',
  'Ã±': 'n',
  'Â·': '-',
  'Â': '',
  '�': ''
};

for (const file of walk('src')) {
  let txt = fs.readFileSync(file, 'utf8');
  let out = txt;
  for (const [bad, good] of Object.entries(fixes)) {
    out = out.split(bad).join(good);
  }
  if (out !== txt) fs.writeFileSync(file, out, 'utf8');
}

console.log('OK texto limpiado');
