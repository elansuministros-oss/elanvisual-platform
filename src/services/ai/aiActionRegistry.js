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

  CONSULTAR_CONNECT: {
    id: 'consultar_connect',
    modulo: 'connect',
    descripcion: 'Consultar entidades autorizadas del ecosistema desde CONNECT.',
    requiereConfirmacion: false,
    modificaDatos: false,
  },

  CREAR_CONNECT: {
    id: 'crear_connect',
    modulo: 'connect',
    descripcion: 'Crear registros autorizados del ecosistema mediante CONNECT.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  EDITAR_CONNECT: {
    id: 'editar_connect',
    modulo: 'connect',
    descripcion: 'Editar registros autorizados del ecosistema mediante CONNECT.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  ELIMINAR_CONNECT: {
    id: 'eliminar_connect',
    modulo: 'connect',
    descripcion: 'Eliminar registros autorizados mediante CONNECT con permisos y auditoria.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  SUBIR_ARCHIVO_CONNECT: {
    id: 'subir_archivo_connect',
    modulo: 'archivos',
    descripcion: 'Subir archivos autorizados a bibliotecas centralizadas mediante CONNECT.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  DESCARGAR_ARCHIVO_CONNECT: {
    id: 'descargar_archivo_connect',
    modulo: 'archivos',
    descripcion: 'Descargar recursos autorizados desde CONNECT.',
    requiereConfirmacion: false,
    modificaDatos: false,
  },

  MOVER_ARCHIVO_CONNECT: {
    id: 'mover_archivo_connect',
    modulo: 'archivos',
    descripcion: 'Mover o renombrar archivos autorizados mediante CONNECT.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  ORGANIZAR_BIBLIOTECA_CONNECT: {
    id: 'organizar_biblioteca_connect',
    modulo: 'archivos',
    descripcion: 'Organizar bibliotecas, carpetas y recursos autorizados mediante CONNECT.',
    requiereConfirmacion: true,
    modificaDatos: true,
  },

  INDEXAR_ARCHIVO_CONNECT: {
    id: 'indexar_archivo_connect',
    modulo: 'knowledge_base',
    descripcion: 'Solicitar indexacion/OCR/transcripcion de archivos mediante CONNECT y Orchestrator.',
    requiereConfirmacion: false,
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
