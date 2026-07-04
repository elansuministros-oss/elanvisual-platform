const REEMPLAZOS = [
  [/\bVINYL\b/gi, 'VINIL'],
  [/\bVYNIL\b/gi, 'VINIL'],
  [/\bACRILICO\b/gi, 'ACRÍLICO'],
  [/\bMICRO\s*PERFORADO\b/gi, 'MICROPERFORADO'],
  [/\bLIGHTBOX\b/gi, 'LIGHT BOX'],
  [/\bROLLER\s*UP\b/gi, 'ROLL UP'],
  [/\bESTRUTURA\b/gi, 'ESTRUCTURA'],
  [/\bDOBE\b/gi, 'DOBLE'],
  [/\bDESGUSTADORA\b/gi, 'DEGUSTADORA'],
];

const RUIDO = [
  /\|\s*Unidad:\s*[^|]+/gi,
  /\|\s*Precio\s*Usd:\s*[^|]*/gi,
  /\bUnidad:\s*[^|]+/gi,
  /\bPrecio\s*Usd:\s*[^|]*/gi,
];

export function normalizarNombreCatalogo(nombre = '') {
  let salida = String(nombre).trim();

  for (const patron of RUIDO) {
    salida = salida.replace(patron, ' ');
  }

  for (const [patron, reemplazo] of REEMPLAZOS) {
    salida = salida.replace(patron, reemplazo);
  }

  salida = salida
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();

  return salida;
}

export function esRegistroBasura(nombre = '') {
  const limpio = normalizarNombreCatalogo(nombre).toUpperCase();

  if (!limpio) return true;

  return [
    '| PRECIO USD:',
    'DE PRECIOS',
    'PRECIO USD',
    'OZXM',
    'XM',
  ].includes(limpio);
}
