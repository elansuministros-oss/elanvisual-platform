export const proveedorPilotoRPI = {
  nombre: 'NAUFFAR GERMANY DOORS AND WINDOWS S.A.',
  razon_social: 'NAUFFAR GERMANY DOORS AND WINDOWS S.A.',
  pais: 'Nicaragua',
  ciudad: '',
  contacto: '',
  telefono: '',
  whatsapp: '',
  correo: '',
  direccion: '',
  tipo_proveedor: 'Proveedor técnico de sistemas arquitectónicos',
  estado: 'activo',
  notas: 'Proveedor piloto RPI-01. Base técnica sin precios obligatorios.'
};

export const catalogoPilotoRPI = [
  'PVC Serie 60',
  'PVC Serie 80',
  'PVC Serie 88',
  'PVC madera',
  'PVC negro foleado',
  'PVC Honduras',
  'PVC línea francesa',
  'Refuerzos PVC',
  'Herrajes PVC',
  'Accesorios PVC',
  'Vidrios',
  'Espejos LED',
  'ACM 4 mm',
  'Vitrinas',
  'Aluminio ISO',
  'Ventana liviana',
  'Puertas abatibles',
  'Tubería arquitectónica',
  'Duchas templadas',
  'Blackline',
  'Eurofold',
  'Tornillería',
  'WPC',
  'Tablilla PVC'
].map((producto) => ({
  categoria: detectarCategoria(producto),
  linea: 'Catálogo técnico NAUFFAR',
  producto,
  descripcion: 'Registro técnico inicial para aprendizaje IA. Sin precio obligatorio.',
  materiales: '',
  uso_recomendado: '',
  aplicaciones: '',
  observaciones: 'Pendiente completar medidas, espesores, colores, compatibilidades y usos reales.',
  tiene_precio: false,
  estado: 'activo'
}));

function detectarCategoria(producto) {
  const p = producto.toLowerCase();

  if (p.includes('pvc')) return 'PVC arquitectónico';
  if (p.includes('vidrio') || p.includes('espejo') || p.includes('ducha')) return 'Vidrio y templado';
  if (p.includes('acm')) return 'Panel compuesto ACM';
  if (p.includes('aluminio') || p.includes('blackline') || p.includes('eurofold')) return 'Aluminio arquitectónico';
  if (p.includes('wpc') || p.includes('tablilla')) return 'Revestimientos';
  if (p.includes('torniller')) return 'Tornillería y fijación';
  if (p.includes('herraje') || p.includes('accesorio') || p.includes('refuerzo')) return 'Componentes y accesorios';

  return 'Sistema arquitectónico';
}
