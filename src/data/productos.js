const imgServicio = (titulo, subtitulo = 'ELANVISUAL') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="#0B1220"/>
  <rect x="58" y="58" width="964" height="964" rx="64" fill="#111827" stroke="#D4AF37" stroke-width="8"/>
  <circle cx="860" cy="180" r="92" fill="#D4AF37" opacity="0.95"/>
  <text x="90" y="150" fill="#D4AF37" font-family="Arial" font-size="42" font-weight="900">ELANVISUAL</text>
  <text x="90" y="505" fill="#FFFFFF" font-family="Arial" font-size="86" font-weight="900">${titulo}</text>
  <text x="90" y="585" fill="#CBD5E1" font-family="Arial" font-size="34" font-weight="700">${subtitulo}</text>
  <rect x="90" y="760" width="420" height="76" rx="24" fill="#D4AF37"/>
  <text x="130" y="810" fill="#0B1220" font-family="Arial" font-size="32" font-weight="900">A COTIZAR</text>
</svg>
`)}`;

export const productosIniciales = [
  {
    id: 'letras-pvc',
    nombre: 'Letras PVC',
    categoria: 'Letras y logos',
    medidas: 'PVC 6 mm / 10 mm / 15 mm · según diseño',
    precio: 0,
    imagen: imgServicio('Letras PVC', 'PVC cortado CNC'),
    descripcion: 'Letras y logotipos en PVC para interiores, recepciones, oficinas y fondos corporativos.',
    etiqueta: 'Interior',
  },
  {
    id: 'letras-acrilicas',
    nombre: 'Letras Acrílicas',
    categoria: 'Letras y logos',
    medidas: 'Acrílico 3 mm / 5 mm · instalación con separadores',
    precio: 0,
    imagen: imgServicio('Letras Acrílicas', 'Acrílico premium'),
    descripcion: 'Letras en acrílico transparente, lechoso, color sólido o espejo para marcas premium.',
    etiqueta: 'Premium',
  },
  {
    id: 'letras-3d',
    nombre: 'Letras 3D',
    categoria: 'Letras y logos',
    medidas: 'Profundidad 4–8 cm · luz frontal o sin iluminación',
    precio: 0,
    imagen: imgServicio('Letras 3D', 'Cajuela fabricada'),
    descripcion: 'Letras tipo cajuela para fachadas, interiores comerciales y marcas de alto impacto.',
    etiqueta: 'Alto impacto',
  },
  {
    id: 'fachadas-comerciales',
    nombre: 'Fachadas Comerciales',
    categoria: 'Rotulación exterior',
    medidas: 'Según levantamiento técnico en sitio',
    precio: 0,
    imagen: imgServicio('Fachadas', 'Rotulación exterior'),
    descripcion: 'Diseño, fabricación e instalación de fachadas con ACM, PVC, acrílico, vinil, estructura metálica e iluminación.',
    etiqueta: 'Exterior',
  },
  {
    id: 'jalavistas',
    nombre: 'Jalavistas',
    categoria: 'Rotulación exterior',
    medidas: '60 × 60 cm / 80 × 80 cm / personalizado',
    precio: 0,
    imagen: imgServicio('Jalavistas', 'Doble cara'),
    descripcion: 'Rótulos doble cara con brazo metálico para visibilidad peatonal y vehicular.',
    etiqueta: 'Doble cara',
  },
  {
    id: 'botones-luminosos',
    nombre: 'Botones Luminosos',
    categoria: 'Rotulación exterior',
    medidas: '50–100 cm diámetro · circular o personalizado',
    precio: 0,
    imagen: imgServicio('Botones LED', 'Iluminación'),
    descripcion: 'Botones luminosos con acrílico, vinil, PVC, estructura interna e iluminación LED.',
    etiqueta: 'LED',
  },
  {
    id: 'vinil-rotulacion',
    nombre: 'Vinil de Rotulación',
    categoria: 'Impresión y vinil',
    medidas: 'Por m² · corte, impresión o instalación',
    precio: 0,
    imagen: imgServicio('Vinil', 'Impresión y corte'),
    descripcion: 'Vinil impreso, recortado, microperforado, decorativo o corporativo para vidrios, paredes y vehículos.',
    etiqueta: 'Por m²',
  },
  {
    id: 'impresion-uv',
    nombre: 'Impresión UV',
    categoria: 'Impresión y vinil',
    medidas: 'Sobre PVC, acrílico, madera, metal o materiales planos',
    precio: 0,
    imagen: imgServicio('Impresión UV', 'Alta definición'),
    descripcion: 'Impresión directa UV para piezas rígidas, señalización, displays, placas y acabados especiales.',
    etiqueta: 'Alta definición',
  },
  {
    id: 'dtf-uv',
    nombre: 'DTF UV',
    categoria: 'Impresión y vinil',
    medidas: 'Stickers transferibles · por diseño o pliego',
    precio: 0,
    imagen: imgServicio('DTF UV', 'Transfer premium'),
    descripcion: 'DTF UV para logos, empaques, botellas, acrílicos, promocionales y superficies rígidas.',
    etiqueta: 'Transfer',
  },
  {
    id: 'corte-cnc',
    nombre: 'Corte CNC',
    categoria: 'CNC y láser',
    medidas: 'Lámina 122 × 244 cm · piezas según plano',
    precio: 0,
    imagen: imgServicio('Corte CNC', 'Producción'),
    descripcion: 'Corte CNC para PVC, acrílico, MDF, letras, bases, piezas seriadas y producción por lote.',
    etiqueta: 'Producción',
  },
  {
    id: 'corte-laser',
    nombre: 'Corte Láser',
    categoria: 'CNC y láser',
    medidas: 'Acrílico, MDF, cuero, cartón y piezas especiales',
    precio: 0,
    imagen: imgServicio('Corte Láser', 'Precisión'),
    descripcion: 'Corte y grabado láser para acrílicos, señalética, prototipos y productos personalizados.',
    etiqueta: 'Precisión',
  },
  {
    id: 'estructuras-metalicas',
    nombre: 'Estructuras Metálicas',
    categoria: 'Estructuras',
    medidas: 'Tubo, angular, lámina y soportes según carga',
    precio: 0,
    imagen: imgServicio('Estructuras', 'Instalación'),
    descripcion: 'Estructuras para rótulos, fachadas, soportes, marcos, bases, tótems y montaje exterior.',
    etiqueta: 'Instalación',
  },
];

export const categoriasHome = [
  { nombre: 'Letras y logos', categoria: 'Letras y logos', imagen: imgServicio('Letras', 'PVC / Acrílico / 3D') },
  { nombre: 'Rotulación exterior', categoria: 'Rotulación exterior', imagen: imgServicio('Rotulación', 'Exterior') },
  { nombre: 'Impresión UV', categoria: 'Impresión y vinil', imagen: imgServicio('UV', 'Alta definición') },
  { nombre: 'DTF UV', categoria: 'Impresión y vinil', imagen: imgServicio('DTF UV', 'Transfer') },
  { nombre: 'CNC y láser', categoria: 'CNC y láser', imagen: imgServicio('CNC', 'Corte técnico') },
  { nombre: 'Estructuras', categoria: 'Estructuras', imagen: imgServicio('Metal', 'Soportes') },
];

export const veterinariaDemo = null;