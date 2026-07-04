import { CATALOGO_TIPOS } from '../models/catalogoMaestro';

export function normalizarItemCatalogo(item = {}) {
  return {
    codigo: item.codigo || null,
    nombre: String(item.nombre || '').trim(),
    tipo: item.tipo || CATALOGO_TIPOS.MATERIAL,
    familia: item.familia || null,
    subfamilia: item.subfamilia || null,
    descripcion: item.descripcion || null,
    unidad_base: item.unidad_base || item.unidad || null,
    estado: item.estado || 'ACTIVO',
    origen: item.origen || 'EMC',
  };
}

export function normalizarProveedorItem(data = {}) {
  return {
    item_id: data.item_id,
    proveedor_id: data.proveedor_id || null,
    nombre_proveedor: data.nombre_proveedor,
    codigo_proveedor: data.codigo_proveedor || null,
    presentacion: data.presentacion || null,
    disponibilidad: data.disponibilidad || null,
    precio: data.precio ?? null,
    moneda: data.moneda || 'USD',
    unidad_compra: data.unidad_compra || null,
    lista_precio_id: data.lista_precio_id || null,
    estado: data.estado || 'ACTIVO',
  };
}
