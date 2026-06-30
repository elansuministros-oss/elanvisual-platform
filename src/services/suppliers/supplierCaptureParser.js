export const SUPPLIER_CATEGORIES = [
  'Impresión',
  'Suministros',
  'PVC / Acrílico',
  'CNC / Láser',
  'Metal / Estructuras',
  'Electricidad / LED',
  'Instalación',
  'Transporte',
  'Otro',
];

const reglas = [
  { categoria: 'PVC / Acrílico', claves: ['acrilico', 'acrílico', 'pvc', 'policarbonato', 'plexi'] },
  { categoria: 'Impresión', claves: ['lona', 'vinil', 'microperforado', 'impresion', 'impresión', 'uv', 'solvente', 'latex', 'látex'] },
  { categoria: 'CNC / Láser', claves: ['cnc', 'laser', 'láser', 'router', 'corte'] },
  { categoria: 'Metal / Estructuras', claves: ['metal', 'hierro', 'tubo', 'estructura', 'soldadura', 'aluminio'] },
  { categoria: 'Electricidad / LED', claves: ['led', 'fuente', 'transformador', 'neon', 'neón', 'modulo', 'módulo'] },
  { categoria: 'Instalación', claves: ['instala', 'instalacion', 'instalación', 'montaje', 'andamio'] },
  { categoria: 'Transporte', claves: ['transporte', 'flete', 'envio', 'envío', 'cargo'] },
  { categoria: 'Suministros', claves: ['suministro', 'materiales', 'ferreteria', 'ferretería', 'pintura', 'adhesivo'] },
];

const departamentos = [
  'Managua','Chinandega','León','Masaya','Granada','Carazo','Rivas','Estelí','Matagalpa',
  'Jinotega','Boaco','Chontales','Nueva Segovia','Madriz','Río San Juan','RAAN','RAAS'
];

function limpiarTexto(valor = '') {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function detectarNombre(texto = '') {
  const limpio = limpiarTexto(texto);
  const patrones = [
    /(?:proveedor|empresa|negocio|tienda)\s+([A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .&-]{2,60})/i,
    /^([A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .&-]{2,60})(?:\s+vende|\s+ofrece|\s+distribuye|\s+trabaja|\s+está|\s+esta)/i,
  ];

  for (const patron of patrones) {
    const match = limpio.match(patron);
    if (match?.[1]) return limpiarTexto(match[1]).replace(/[.,;:]$/, '');
  }

  return limpio.split(/[.,;\n]/)[0]?.slice(0, 60) || '';
}

function detectarWhatsapp(texto = '') {
  const match = texto.match(/(?:\+?505)?[\s-]?\d{4}[\s-]?\d{4}/);
  return match ? match[0].replace(/\s+/g, ' ').trim() : '';
}

function detectarCorreo(texto = '') {
  const match = texto.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
}

function detectarDepartamento(texto = '') {
  const normal = texto.toLowerCase();
  return departamentos.find((dep) => normal.includes(dep.toLowerCase())) || 'Managua';
}

function detectarCapacidades(texto = '') {
  const normal = texto.toLowerCase();
  const capacidades = [];

  reglas.forEach((regla) => {
    regla.claves.forEach((clave) => {
      if (normal.includes(clave) && !capacidades.includes(clave)) {
        capacidades.push(clave);
      }
    });
  });

  return capacidades.map((item) => item.charAt(0).toUpperCase() + item.slice(1));
}

function detectarCategoria(texto = '') {
  const normal = texto.toLowerCase();

  for (const regla of reglas) {
    if (regla.claves.some((clave) => normal.includes(clave))) {
      return regla.categoria;
    }
  }

  return 'Suministros';
}

export function parseSupplierCapture(texto = '') {
  const descripcion = limpiarTexto(texto);
  const capacidades = detectarCapacidades(descripcion);
  const categoria = detectarCategoria(descripcion);

  return {
    nombre: detectarNombre(descripcion),
    razonSocial: '',
    ruc: '',
    contacto: '',
    cargoContacto: '',
    whatsapp: detectarWhatsapp(descripcion),
    telefonoAlterno: '',
    correo: detectarCorreo(descripcion),
    sitioWeb: '',
    direccion: '',
    departamento: detectarDepartamento(descripcion),
    municipio: '',
    zonaCobertura: detectarDepartamento(descripcion),
    categoria,
    subcategorias: capacidades.join(', '),
    observaciones: descripcion,
    activo: true,
  };
}
