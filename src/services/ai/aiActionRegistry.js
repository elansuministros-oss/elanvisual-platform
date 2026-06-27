export const AI_ACTIONS = {
  BUSCAR_PEDIDO_OT: {
    id: 'buscar_pedido_ot',
    modulo: 'pedidos_ot',
    descripcion: 'Buscar pedido u orden de trabajo por texto, cliente, producto, código o seguimiento.',
    requiereConfirmacion: false,
    modificaDatos: false,
  },

  BUSCAR_PROVEEDOR: {
    id: 'buscar_proveedor',
    modulo: 'proveedores',
    descripcion: 'Buscar proveedor registrado por nombre, razón social, categoría o contacto.',
    requiereConfirmacion: false,
    modificaDatos: false,
  },

  REGISTRAR_COSTO_OT: {
    id: 'registrar_costo_ot',
    modulo: 'costos_ot',
    descripcion: 'Registrar costo real en una orden de trabajo y actualizar rentabilidad.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  REGISTRAR_GASTO_TRANSPORTE_OT: {
    id: 'registrar_gasto_transporte_ot',
    modulo: 'costos_ot',
    descripcion: 'Registrar gasto de transporte en una orden de trabajo.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  REGISTRAR_COSTO_PROVEEDOR_OT: {
    id: 'registrar_costo_proveedor_ot',
    modulo: 'compras_ot',
    descripcion: 'Registrar costo cobrado por proveedor en una orden de trabajo.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },
};

export function listarAccionesIA() {
  return Object.values(AI_ACTIONS);
}

export function obtenerAccionIA(id) {
  return listarAccionesIA().find((accion) => accion.id === id) || null;
}

export function accionExisteIA(id) {
  return Boolean(obtenerAccionIA(id));
}

export function accionRequiereConfirmacionIA(id) {
  return obtenerAccionIA(id)?.requiereConfirmacion === true;
}

export function accionModificaDatosIA(id) {
  return obtenerAccionIA(id)?.modificaDatos === true;
}
