export const AI_DESIGN_LIMIT = 3;

export const aiProductProfiles = [
  {
    id: 'boton-luminoso',
    nombre: 'Botón luminoso',
    keywords: ['boton', 'botón', 'circular', 'redondo'],
    medidaBase: '60 x 60 cm',
    acabadoBase: 'Botón luminoso con acabado del modelo seleccionado',
    salida: 'Render hiperrealista de botón luminoso manteniendo medida, acabado y precio base.',
  },
  {
    id: 'fachada-acm',
    nombre: 'Fachada ACM',
    keywords: ['fachada', 'acm', 'alucobond', 'panel'],
    medidaBase: 'Según fachada del cliente',
    acabadoBase: 'Fachada ACM con aplicación de marca',
    salida: 'Render hiperrealista de fachada ACM, sin convertirlo en otro producto.',
  },
  {
    id: 'roll-up',
    nombre: 'Roll Up',
    keywords: ['roll', 'rollup', 'roll up', 'banner'],
    medidaBase: '85 x 200 cm',
    acabadoBase: 'Diseño vertical aplicado sobre roll up',
    salida: 'Montaje realista del diseño del cliente en roll up.',
  },
  {
    id: 'display',
    nombre: 'Display',
    keywords: ['display', 'exhibidor', 'punto de venta'],
    medidaBase: 'Según modelo seleccionado',
    acabadoBase: 'Display promocional con marca aplicada',
    salida: 'Render hiperrealista del display manteniendo estructura y acabado.',
  },
  {
    id: 'mesa-degustadora',
    nombre: 'Mesa degustadora',
    keywords: ['mesa', 'degustadora', 'activacion', 'activación'],
    medidaBase: 'Mesa promocional estándar',
    acabadoBase: 'Branding aplicado al frente y laterales',
    salida: 'Render realista de mesa degustadora con la marca del cliente.',
  },
];

export function obtenerPerfilIA(producto = {}) {
  const texto = `${producto.nombre || ''} ${producto.categoria || ''} ${producto.descripcion || ''}`.toLowerCase();

  return (
    aiProductProfiles.find((perfil) =>
      perfil.keywords.some((keyword) => texto.includes(keyword))
    ) || {
      id: 'modelo-general',
      nombre: producto.categoria || 'Modelo personalizado',
      keywords: [],
      medidaBase: 'Según modelo seleccionado',
      acabadoBase: 'Acabado base del producto elegido',
      salida: 'Propuesta visual basada únicamente en el modelo seleccionado.',
    }
  );
}
