const registeredProducts = Object.freeze([
  Object.freeze({
    id: 'prod-rotulo-acm',
    nombre: 'Rotulo ACM',
    categoria: 'Rotulacion',
  }),
  Object.freeze({
    id: 'prod-letras-3d',
    nombre: 'Letras 3D',
    categoria: 'Fabricacion',
  }),
  Object.freeze({
    id: 'prod-lona-impresa',
    nombre: 'Lona impresa',
    categoria: 'Impresion',
  }),
  Object.freeze({
    id: 'prod-vinil-adhesivo',
    nombre: 'Vinil adhesivo',
    categoria: 'Impresion',
  }),
  Object.freeze({
    id: 'prod-roll-up',
    nombre: 'Roll Up',
    categoria: 'POP',
  }),
]);

export const RegisteredProductService = Object.freeze({
  list() {
    return [...registeredProducts];
  },

  getById(productId) {
    return registeredProducts.find((product) => product.id === productId) || null;
  },
});
