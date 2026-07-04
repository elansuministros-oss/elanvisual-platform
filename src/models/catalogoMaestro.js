export const CATALOGO_TIPOS = Object.freeze({
  PRODUCTO: 'PRODUCTO',
  MATERIAL: 'MATERIAL',
  COMPONENTE: 'COMPONENTE',
  PROCESO: 'PROCESO',
  MANO_OBRA: 'MANO_OBRA',
  ACABADO: 'ACABADO',
  SERVICIO: 'SERVICIO',
  EQUIPO: 'EQUIPO',
  PROVEEDOR: 'PROVEEDOR',
  RECETA_AI23: 'RECETA_AI23',
});

export const CATALOGO_ESTADOS = Object.freeze({
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  OBSOLETO: 'OBSOLETO',
});

export function esTipoCatalogoValido(tipo) {
  return Object.values(CATALOGO_TIPOS).includes(tipo);
}
