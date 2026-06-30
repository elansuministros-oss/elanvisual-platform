const departamentos = [
  'Managua','Chinandega','León','Masaya','Granada','Carazo','Rivas','Estelí','Matagalpa',
  'Jinotega','Boaco','Chontales','Nueva Segovia','Madriz','Río San Juan','RAAN','RAAS'
];

const categorias = [
  { categoria: 'PVC / Acrílico', claves: ['acrílico', 'acrilico', 'pvc', 'coroplast', 'lámina', 'lamina'] },
  { categoria: 'Impresión', claves: ['lona', 'vinil', 'microperforado', 'impresión', 'impresion', 'sublimación', 'sublimacion'] },
  { categoria: 'Electricidad / LED', claves: ['led', 'fuente', 'transformador', 'neón', 'neon'] },
  { categoria: 'Displays / POP', claves: ['roller up', 'mesa degustadora', 'pluma publicitaria', 'caja de luz'] },
  { categoria: 'Suministros para Rotulación e Impresión Digital', claves: ['3m', 'insumos', 'rotulación', 'rotulacion', 'publicitaria'] },
];

function limpiar(v = '') {
  return String(v || '').replace(/\s+/g, ' ').trim();
}

function extraerPorEtiqueta(texto, etiquetas = []) {
  for (const etiqueta of etiquetas) {
    const re = new RegExp(`${etiqueta}\\s*:\\s*([^\\.\\n]+)`, 'i');
    const m = texto.match(re);
    if (m?.[1]) return limpiar(m[1]);
  }
  return '';
}

function detectarNombre(texto) {
  const porEtiqueta = extraerPorEtiqueta(texto, ['Proveedor', 'Empresa', 'Nombre comercial']);
  if (porEtiqueta) return porEtiqueta;

  const inicio = texto.match(/^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .&-]{2,45})\s+es\s+/i);
  if (inicio?.[1]) return limpiar(inicio[1]);

  const conocido = texto.match(/\b(Vargas Centro|Centro de Pintura Vargas|Play Marketing|Impresiones Vida)\b/i);
  if (conocido?.[1]) return limpiar(conocido[1]);

  return '';
}

function detectarTelefono(texto, etiqueta) {
  const porEtiqueta = extraerPorEtiqueta(texto, [etiqueta]);
  if (porEtiqueta) {
    const m = porEtiqueta.match(/(?:\+?505[\s-]?)?\d{4}[\s-]?\d{4}|\d{4}[\s-]?\d{4}/);
    if (m) return limpiar(m[0]);
  }
  return '';
}

function detectarPrimerTelefono(texto) {
  const m = texto.match(/(?:\+?505[\s-]?)?\d{4}[\s-]?\d{4}|\d{4}[\s-]?\d{4}/);
  return m ? limpiar(m[0]) : '';
}

function detectarCorreo(texto) {
  const m = texto.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? limpiar(m[0]) : '';
}

function detectarWeb(texto) {
  const m = texto.match(/(?:https?:\/\/)?(?:www\.)?[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!m) return '';
  const web = limpiar(m[0]);
  return web.includes('@') ? '' : web;
}

function detectarDepartamento(texto) {
  const normal = texto.toLowerCase();
  return departamentos.find((d) => normal.includes(d.toLowerCase())) || 'Managua';
}

function detectarDireccion(texto) {
  const porEtiqueta = extraerPorEtiqueta(texto, ['Dirección', 'Direccion', 'Ubicación', 'Ubicacion']);
  if (porEtiqueta) return porEtiqueta;

  const m = texto.match(/(?:ubicada|ubicado|sede principal está ubicada|sede principal esta ubicada)\s+en\s+([^\\.]+)/i);
  return m?.[1] ? limpiar(m[1]) : '';
}

function detectarCobertura(texto) {
  const porEtiqueta = extraerPorEtiqueta(texto, ['Cobertura', 'Zona de cobertura']);
  if (porEtiqueta) return porEtiqueta;
  if (/nacional/i.test(texto)) return 'Nacional';
  return detectarDepartamento(texto);
}

function detectarCategoria(texto) {
  const normal = texto.toLowerCase();

  if (normal.includes('insumos') && (normal.includes('rotulación') || normal.includes('rotulacion') || normal.includes('impresión') || normal.includes('impresion'))) {
    return 'Suministros para Rotulación e Impresión Digital';
  }

  for (const item of categorias) {
    if (item.claves.some((c) => normal.includes(c))) return item.categoria;
  }

  return 'Suministros';
}

function detectarCapacidades(texto) {
  const catalogo = [
    'Viniles adhesivos',
    'Lonas para impresión',
    'PVC espumado',
    'Coroplast',
    'Acrílicos',
    'Resinas',
    'Reflectivos',
    'Polarizados',
    'Productos 3M',
    'Cajas de luz',
    'Roller Up',
    'Mesas degustadoras',
    'Papel de sublimación',
    'Transfer tape',
    'Cintas VHB',
    'Adhesivos',
    'Herramientas para aplicación de viniles',
    'Materiales para publicidad exterior',
    'Insumos para rotulación',
    'Impresión digital'
  ];

  const normal = texto.toLowerCase();
  return catalogo.filter((item) => normal.includes(item.toLowerCase().split(' ')[0])).join(', ');
}

export function parseSupplierCapture(texto = '') {
  const descripcion = limpiar(texto);

  const nombre = detectarNombre(descripcion);
  const razonSocial = extraerPorEtiqueta(descripcion, ['Razón social', 'Razon social']) || '';
  const contacto = extraerPorEtiqueta(descripcion, ['Contacto principal', 'Contacto']) || '';
  const cargo = extraerPorEtiqueta(descripcion, ['Cargo']) || '';
  const whatsapp = detectarTelefono(descripcion, 'WhatsApp') || detectarPrimerTelefono(descripcion);
  const telefono = detectarTelefono(descripcion, 'Teléfono de oficina') || detectarTelefono(descripcion, 'Telefono de oficina');
  const correo = detectarCorreo(descripcion);
  const sitioWeb = detectarWeb(descripcion);
  const departamento = detectarDepartamento(descripcion);
  const direccion = detectarDireccion(descripcion);
  const cobertura = detectarCobertura(descripcion);

  return {
    nombre,
    razonSocial,
    ruc: '',
    contacto,
    cargoContacto: cargo,
    whatsapp,
    telefonoAlterno: telefono,
    correo,
    sitioWeb,
    direccion,
    departamento,
    municipio: departamento,
    zonaCobertura: cobertura,
    categoria: detectarCategoria(descripcion),
    subcategorias: detectarCapacidades(descripcion),
    observaciones: descripcion,
    activo: true,
  };
}
