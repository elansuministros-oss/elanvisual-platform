import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CoreContext = createContext(null);

const leerStorage = (clave, valorInicial) => {
  try {
    const data = localStorage.getItem(clave);
    return data ? JSON.parse(data) : valorInicial;
  } catch {
    return valorInicial;
  }
};

const guardarStorage = (clave, valor) => {
  localStorage.setItem(clave, JSON.stringify(valor));
};

const crearId = (prefijo) => `${prefijo}-${Date.now()}`;

const MODULOS_CRM_PERMISOS = [
  { id: 'dashboard', label: 'Dashboard', grupo: 'General' },
  { id: 'dashboard-gerencial', label: 'Dashboard Gerencial Corporativo', grupo: 'General' },
  { id: 'notificaciones', label: 'Notificaciones Internas', grupo: 'General' },
  { id: 'centro-whatsapp', label: 'Centro WhatsApp y Leads', grupo: 'General' },
  { id: 'empresas', label: 'Empresas', grupo: 'CRM' },
  { id: 'contactos', label: 'Contactos', grupo: 'CRM' },
  { id: 'clientes', label: 'Clientes', grupo: 'CRM' },
  { id: 'proveedores', label: 'Proveedores', grupo: 'CRM' },
  { id: 'compras', label: 'Compras', grupo: 'CRM' },
  { id: 'seguimiento', label: 'Seguimiento', grupo: 'CRM' },
  { id: 'crm-comercial', label: 'CRM Comercial Avanzado', grupo: 'CRM' },
  { id: 'vendedores', label: 'Vendedores', grupo: 'Ventas' },
  { id: 'cotizaciones', label: 'Cotizaciones', grupo: 'Ventas' },
  { id: 'pedidos', label: 'Pedidos', grupo: 'Ventas' },
  { id: 'ordenes', label: 'Órdenes Trabajo', grupo: 'Operación' },
  { id: 'produccion', label: 'Producción', grupo: 'Operación' },
  { id: 'inventario', label: 'Inventario', grupo: 'Operación' },
  { id: 'materiales', label: 'Materiales', grupo: 'Operación' },
  { id: 'cobros', label: 'Cobros', grupo: 'Finanzas' },
  { id: 'cuentas-cobrar', label: 'Cuentas por Cobrar', grupo: 'Finanzas' },
  { id: 'cuentas-pagar', label: 'Cuentas por Pagar', grupo: 'Finanzas' },
  { id: 'flujo-caja', label: 'Flujo de Caja', grupo: 'Finanzas' },
  { id: 'centro-utilidades', label: 'Centro Utilidades', grupo: 'Finanzas' },
  { id: 'estado-financiero', label: 'Estado Financiero', grupo: 'Finanzas' },
  { id: 'comisiones', label: 'Comisiones', grupo: 'Finanzas' },
  { id: 'reportes', label: 'Reportes', grupo: 'Finanzas' },
  { id: 'fiscal', label: 'Fiscal', grupo: 'Finanzas' },
  { id: 'metas-kpis', label: 'Metas y KPIs', grupo: 'Finanzas' },
  { id: 'veterinarias', label: 'Veterinarias', grupo: 'Unidades' },
  { id: 'afiliados', label: 'Afiliados', grupo: 'Unidades' },
  { id: 'portal-cliente', label: 'Portal Cliente', grupo: 'Unidades' },
  { id: 'portal-produccion', label: 'Portal Producción', grupo: 'Unidades' },
  { id: 'app-movil', label: 'App Móvil', grupo: 'Tecnología' },
  { id: 'elan-ai', label: 'ELAN AI', grupo: 'Tecnología' },
  { id: 'usuarios-permisos', label: 'Usuarios y Permisos', grupo: 'Administración' },
  { id: 'auditoria', label: 'Auditoría de Movimientos', grupo: 'Administración' },
  { id: 'automatizaciones', label: 'Automatizaciones', grupo: 'Administración' },
  { id: 'calendario', label: 'Calendario Corporativo', grupo: 'Administración' },
  { id: 'documentos', label: 'Documentos Corporativos', grupo: 'Administración' },
];

const UNIDADES_OFICIALES_CRM = [
  'Corporativo',
  'ELANPET',
  'ELANKAV VISUAL',
  'ELANKAV CENTER',
  'ELANKAV SOLAR',
  'ELAN AI',
];

const todosLosPermisosCRM = MODULOS_CRM_PERMISOS.map((modulo) => modulo.id);

const rolesCRMIniciales = [
  {
    id: 'rol-admin-general',
    nombre: 'Administrador General',
    descripcion: 'Acceso total a todos los módulos, unidades y funciones del CRM Central.',
    permisos: todosLosPermisosCRM,
    nivel: 'Total',
    estado: 'Activo',
  },
  {
    id: 'rol-gerencia',
    nombre: 'Gerencia',
    descripcion: 'Control ejecutivo, financiero, reportes y seguimiento operativo.',
    permisos: [
      'dashboard',
      'dashboard-gerencial',
      'notificaciones',
      'centro-whatsapp',
      'automatizaciones',
      'calendario',
      'documentos',
      'crm-comercial',
      'metas-kpis',
      'portal-cliente',
      'portal-produccion',
      'app-movil',
      'elan-ai',
      'empresas',
      'contactos',
      'cotizaciones',
      'pedidos',
      'ordenes',
      'produccion',
      'cobros',
      'cuentas-cobrar',
      'cuentas-pagar',
      'flujo-caja',
      'centro-utilidades',
      'estado-financiero',
      'reportes',
      'auditoria',
    ],
    nivel: 'Gerencial',
    estado: 'Activo',
  },
  {
    id: 'rol-ventas',
    nombre: 'Ventas',
    descripcion: 'Gestión comercial: empresas, contactos, cotizaciones, pedidos y cobros básicos.',
    permisos: ['dashboard', 'notificaciones', 'centro-whatsapp', 'empresas', 'contactos', 'clientes', 'cotizaciones', 'pedidos', 'cobros'],
    nivel: 'Operativo',
    estado: 'Activo',
  },
  {
    id: 'rol-produccion',
    nombre: 'Producción',
    descripcion: 'Órdenes de trabajo, producción, inventario y materiales.',
    permisos: ['dashboard', 'notificaciones', 'ordenes', 'produccion', 'inventario', 'materiales'],
    nivel: 'Operativo',
    estado: 'Activo',
  },
  {
    id: 'rol-contabilidad',
    nombre: 'Contabilidad',
    descripcion: 'Compras, cuentas, cobros, flujo de caja, fiscal y reportes financieros.',
    permisos: [
      'dashboard',
      'dashboard-gerencial',
      'notificaciones',
      'automatizaciones',
      'calendario',
      'documentos',
      'crm-comercial',
      'metas-kpis',
      'portal-cliente',
      'portal-produccion',
      'app-movil',
      'elan-ai',
      'compras',
      'cobros',
      'cuentas-cobrar',
      'cuentas-pagar',
      'flujo-caja',
      'estado-financiero',
      'reportes',
      'fiscal',
      'auditoria',
    ],
    nivel: 'Financiero',
    estado: 'Activo',
  },
];

const usuariosCRMIniciales = [
  {
    id: 'usuario-admin-general',
    nombre: 'Administrador General',
    correo: 'admin@elankav.com',
    usuario: 'admin',
    telefono: '',
    cargo: 'Administrador General',
    rolId: 'rol-admin-general',
    unidadNegocio: 'Corporativo',
    estado: 'Activo',
    notas: 'Usuario maestro inicial del CRM Central ELANKAV.',
    fechaRegistro: new Date().toISOString(),
    actualizado: new Date().toISOString(),
  },
];


const crearRegistro = (prefijo, datos) => ({
  id: datos.id || crearId(prefijo),
  ...datos,
  fechaRegistro: datos.fechaRegistro || new Date().toISOString(),
  actualizado: new Date().toISOString(),
});

const actualizarLista = (lista, id, datos) =>
  lista.map((item) =>
    item.id === id
      ? {
          ...item,
          ...datos,
          actualizado: new Date().toISOString(),
        }
      : item
  );

const eliminarDeLista = (lista, id) => lista.filter((item) => item.id !== id);

export function CoreProvider({ children }) {
  const [empresas, setEmpresas] = useState(() =>
    leerStorage('elankav_empresas', [])
  );

  const [contactos, setContactos] = useState(() =>
    leerStorage('elankav_contactos', [])
  );

  const [seguimiento, setSeguimiento] = useState(() =>
    leerStorage('elankav_seguimiento', [])
  );

  const [vendedores, setVendedores] = useState(() =>
    leerStorage('elankav_vendedores', [])
  );

  const [veterinarias, setVeterinarias] = useState(() =>
    leerStorage('elankav_veterinarias', [])
  );

  const [afiliados, setAfiliados] = useState(() =>
    leerStorage('elankav_afiliados', [])
  );

  const [proveedores, setProveedores] = useState(() =>
    leerStorage('elankav_proveedores', [])
  );

  const [compras, setCompras] = useState(() =>
    leerStorage('elankav_compras', [])
  );

  const [cuentasPorPagar, setCuentasPorPagar] = useState(() =>
    leerStorage('elankav_cuentas_por_pagar', [])
  );

  const [cuentasPorCobrar, setCuentasPorCobrar] = useState(() =>
    leerStorage('elankav_cuentas_por_cobrar', [])
  );

  const [flujoCaja, setFlujoCaja] = useState(() =>
    leerStorage('elankav_flujo_caja', [])
  );

  const [cotizaciones, setCotizaciones] = useState(() =>
    leerStorage('elankav_cotizaciones', [])
  );

  const [pedidos, setPedidos] = useState(() =>
    leerStorage('elankav_pedidos', [])
  );

  const [ordenesTrabajo, setOrdenesTrabajo] = useState(() =>
    leerStorage('elankav_ordenes_trabajo', [])
  );

  const [produccion, setProduccion] = useState(() =>
    leerStorage('elankav_produccion', [])
  );

  const [cobros, setCobros] = useState(() =>
    leerStorage('elankav_cobros', [])
  );

  const [comisiones, setComisiones] = useState(() =>
    leerStorage('elankav_comisiones', [])
  );

  const [inventario, setInventario] = useState(() =>
    leerStorage('elankav_inventario', [])
  );

  const [materiales, setMateriales] = useState(() =>
    leerStorage('elankav_materiales', [])
  );

  const [auditoriaCRM, setAuditoriaCRM] = useState(() =>
    leerStorage('elankav_auditoria_crm', [])
  );

  const [notificacionesCRM, setNotificacionesCRM] = useState(() =>
    leerStorage('elankav_notificaciones_crm', [])
  );

  const [leadsWhatsApp, setLeadsWhatsApp] = useState(() =>
    leerStorage('elankav_leads_whatsapp', [])
  );


  const [usuariosCRM, setUsuariosCRM] = useState(() =>
    leerStorage('elankav_usuarios_crm', usuariosCRMIniciales)
  );

  const [rolesCRM, setRolesCRM] = useState(() =>
    leerStorage('elankav_roles_crm', rolesCRMIniciales)
  );

  const [usuarioActivoCRMId, setUsuarioActivoCRMId] = useState(() =>
    leerStorage('elankav_usuario_activo_crm', 'usuario-admin-general')
  );

  useEffect(() => guardarStorage('elankav_empresas', empresas), [empresas]);
  useEffect(() => guardarStorage('elankav_contactos', contactos), [contactos]);
  useEffect(() => guardarStorage('elankav_seguimiento', seguimiento), [seguimiento]);
  useEffect(() => guardarStorage('elankav_vendedores', vendedores), [vendedores]);
  useEffect(() => guardarStorage('elankav_veterinarias', veterinarias), [veterinarias]);
  useEffect(() => guardarStorage('elankav_afiliados', afiliados), [afiliados]);
  useEffect(() => guardarStorage('elankav_proveedores', proveedores), [proveedores]);
  useEffect(() => guardarStorage('elankav_compras', compras), [compras]);
  useEffect(() => guardarStorage('elankav_cuentas_por_pagar', cuentasPorPagar), [cuentasPorPagar]);
  useEffect(() => guardarStorage('elankav_cuentas_por_cobrar', cuentasPorCobrar), [cuentasPorCobrar]);
  useEffect(() => guardarStorage('elankav_flujo_caja', flujoCaja), [flujoCaja]);
  useEffect(() => guardarStorage('elankav_cotizaciones', cotizaciones), [cotizaciones]);
  useEffect(() => guardarStorage('elankav_pedidos', pedidos), [pedidos]);
  useEffect(() => guardarStorage('elankav_ordenes_trabajo', ordenesTrabajo), [ordenesTrabajo]);
  useEffect(() => guardarStorage('elankav_produccion', produccion), [produccion]);
  useEffect(() => guardarStorage('elankav_cobros', cobros), [cobros]);
  useEffect(() => guardarStorage('elankav_comisiones', comisiones), [comisiones]);
  useEffect(() => guardarStorage('elankav_inventario', inventario), [inventario]);
  useEffect(() => guardarStorage('elankav_materiales', materiales), [materiales]);
  useEffect(() => guardarStorage('elankav_auditoria_crm', auditoriaCRM), [auditoriaCRM]);
  useEffect(() => guardarStorage('elankav_notificaciones_crm', notificacionesCRM), [notificacionesCRM]);
  useEffect(() => guardarStorage('elankav_leads_whatsapp', leadsWhatsApp), [leadsWhatsApp]);

  useEffect(() => guardarStorage('elankav_usuarios_crm', usuariosCRM), [usuariosCRM]);
  useEffect(() => guardarStorage('elankav_roles_crm', rolesCRM), [rolesCRM]);
  useEffect(() => guardarStorage('elankav_usuario_activo_crm', usuarioActivoCRMId), [usuarioActivoCRMId]);

  const registrarAuditoriaCRM = ({
    modulo = 'Sistema',
    accion = 'MOVIMIENTO',
    detalle = '',
    entidadId = '',
    entidadTipo = '',
    datos = null,
  }) => {
    const usuarioActual =
      usuariosCRM.find((usuario) => usuario.id === usuarioActivoCRMId) || usuariosCRMIniciales[0];

    const rolActual =
      rolesCRM.find((rol) => rol.id === usuarioActual.rolId) || rolesCRMIniciales[0];

    const registro = {
      id: crearId('auditoria'),
      fecha: new Date().toISOString(),
      usuarioId: usuarioActual.id,
      usuarioNombre: usuarioActual.nombre || 'Administrador General',
      usuarioCorreo: usuarioActual.correo || '',
      usuarioRol: rolActual.nombre || 'Administrador General',
      unidadNegocio: usuarioActual.unidadNegocio || 'Corporativo',
      modulo,
      accion,
      detalle,
      entidadId,
      entidadTipo,
      datos,
    };

    setAuditoriaCRM((prev) => [registro, ...prev].slice(0, 1000));

    return registro;
  };

  const limpiarAuditoriaCRM = () => {
    setAuditoriaCRM([]);
    registrarAuditoriaCRM({
      modulo: 'Auditoría',
      accion: 'LIMPIAR',
      detalle: 'Se limpió el historial de auditoría del CRM.',
      entidadTipo: 'auditoria',
    });
  };

  const crearEmpresa = (datos) => {
    const registro = crearRegistro('empresa', datos);
    setEmpresas((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Empresas',
      accion: 'CREAR',
      detalle: `Empresa creada: ${registro.nombre || registro.razonSocial || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'empresa',
      datos: registro,
    });
    return registro;
  };

  const actualizarEmpresa = (id, datos) => {
    setEmpresas((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Empresas',
      accion: 'EDITAR',
      detalle: `Empresa actualizada: ${datos.nombre || datos.razonSocial || id}`,
      entidadId: id,
      entidadTipo: 'empresa',
      datos,
    });
  };

  const eliminarEmpresa = (id) => {
    const empresa = empresas.find((item) => item.id === id);
    setEmpresas((prev) => eliminarDeLista(prev, id));
    setContactos((prev) =>
      prev.map((contacto) =>
        contacto.empresaId === id ? { ...contacto, empresaId: '' } : contacto
      )
    );
    registrarAuditoriaCRM({
      modulo: 'Empresas',
      accion: 'ELIMINAR',
      detalle: `Empresa eliminada: ${empresa?.nombre || empresa?.razonSocial || id}`,
      entidadId: id,
      entidadTipo: 'empresa',
      datos: empresa || null,
    });
  };

  const crearContacto = (datos) => {
    const registro = crearRegistro('contacto', datos);
    setContactos((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Contactos',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'contacto',
      datos: registro,
    });
    return registro;
  };

  const actualizarContacto = (id, datos) => {
    setContactos((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Contactos',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'contacto',
      datos,
    });
  };

  const eliminarContacto = (id) => {
    const registro = contactos.find((item) => item.id === id);
    setContactos((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Contactos',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'contacto',
      datos: registro || null,
    });
  };

  const crearSeguimiento = (datos) => {
    const registro = crearRegistro('seguimiento', datos);
    setSeguimiento((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Seguimiento',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.titulo || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'seguimiento',
      datos: registro,
    });
    return registro;
  };

  const actualizarSeguimiento = (id, datos) => {
    setSeguimiento((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Seguimiento',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.titulo || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'seguimiento',
      datos,
    });
  };

  const eliminarSeguimiento = (id) => {
    const registro = seguimiento.find((item) => item.id === id);
    setSeguimiento((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Seguimiento',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.titulo || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'seguimiento',
      datos: registro || null,
    });
  };

  const crearVendedor = (datos) => {
    const registro = crearRegistro('vendedor', datos);
    setVendedores((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Vendedores',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'vendedor',
      datos: registro,
    });
    return registro;
  };

  const actualizarVendedor = (id, datos) => {
    setVendedores((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Vendedores',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'vendedor',
      datos,
    });
  };

  const eliminarVendedor = (id) => {
    const registro = vendedores.find((item) => item.id === id);
    setVendedores((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Vendedores',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'vendedor',
      datos: registro || null,
    });
  };

  const crearVeterinaria = (datos) => {
    const registro = crearRegistro('veterinaria', datos);
    setVeterinarias((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Veterinarias',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'veterinaria',
      datos: registro,
    });
    return registro;
  };

  const actualizarVeterinaria = (id, datos) => {
    setVeterinarias((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Veterinarias',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'veterinaria',
      datos,
    });
  };

  const eliminarVeterinaria = (id) => {
    const registro = veterinarias.find((item) => item.id === id);
    setVeterinarias((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Veterinarias',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'veterinaria',
      datos: registro || null,
    });
  };

  const crearAfiliado = (datos) => {
    const registro = crearRegistro('afiliado', datos);
    setAfiliados((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Afiliados',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'afiliado',
      datos: registro,
    });
    return registro;
  };

  const actualizarAfiliado = (id, datos) => {
    setAfiliados((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Afiliados',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'afiliado',
      datos,
    });
  };

  const eliminarAfiliado = (id) => {
    const registro = afiliados.find((item) => item.id === id);
    setAfiliados((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Afiliados',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'afiliado',
      datos: registro || null,
    });
  };

  const crearProveedor = (datos) => {
    const registro = crearRegistro('proveedor', datos);
    setProveedores((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Proveedores',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'proveedor',
      datos: registro,
    });
    return registro;
  };

  const actualizarProveedor = (id, datos) => {
    setProveedores((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Proveedores',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'proveedor',
      datos,
    });
  };

  const eliminarProveedor = (id) => {
    const registro = proveedores.find((item) => item.id === id);
    setProveedores((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Proveedores',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'proveedor',
      datos: registro || null,
    });
  };

  const crearCompra = (datos) => {
    const registro = crearRegistro('compra', datos);
    setCompras((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Compras',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.proveedor || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'compra',
      datos: registro,
    });
    return registro;
  };

  const actualizarCompra = (id, datos) => {
    setCompras((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Compras',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.proveedor || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'compra',
      datos,
    });
  };

  const eliminarCompra = (id) => {
    const registro = compras.find((item) => item.id === id);
    setCompras((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Compras',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.proveedor || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'compra',
      datos: registro || null,
    });
  };

  const crearCuentaPorPagar = (datos) => {
    const registro = crearRegistro('cuenta-pagar', datos);
    setCuentasPorPagar((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Cuentas por Pagar',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.proveedor || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'cuenta_por_pagar',
      datos: registro,
    });
    return registro;
  };

  const actualizarCuentaPorPagar = (id, datos) => {
    setCuentasPorPagar((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Cuentas por Pagar',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.proveedor || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cuenta_por_pagar',
      datos,
    });
  };

  const eliminarCuentaPorPagar = (id) => {
    const registro = cuentasPorPagar.find((item) => item.id === id);
    setCuentasPorPagar((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Cuentas por Pagar',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.proveedor || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cuenta_por_pagar',
      datos: registro || null,
    });
  };

  const crearCuentaPorCobrar = (datos) => {
    const registro = crearRegistro('cuenta-cobrar', datos);
    setCuentasPorCobrar((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Cuentas por Cobrar',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.cliente || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'cuenta_por_cobrar',
      datos: registro,
    });
    return registro;
  };

  const actualizarCuentaPorCobrar = (id, datos) => {
    setCuentasPorCobrar((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Cuentas por Cobrar',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.cliente || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cuenta_por_cobrar',
      datos,
    });
  };

  const eliminarCuentaPorCobrar = (id) => {
    const registro = cuentasPorCobrar.find((item) => item.id === id);
    setCuentasPorCobrar((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Cuentas por Cobrar',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.cliente || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cuenta_por_cobrar',
      datos: registro || null,
    });
  };

  const crearMovimientoFlujoCaja = (datos) => {
    const registro = crearRegistro('flujo-caja', datos);
    setFlujoCaja((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Flujo de Caja',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.concepto || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'flujo_caja',
      datos: registro,
    });
    return registro;
  };

  const actualizarMovimientoFlujoCaja = (id, datos) => {
    setFlujoCaja((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Flujo de Caja',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.concepto || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'flujo_caja',
      datos,
    });
  };

  const eliminarMovimientoFlujoCaja = (id) => {
    const registro = flujoCaja.find((item) => item.id === id);
    setFlujoCaja((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Flujo de Caja',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.concepto || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'flujo_caja',
      datos: registro || null,
    });
  };

  const crearCotizacion = (datos) => {
    const registro = crearRegistro('cotizacion', datos);
    setCotizaciones((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Cotizaciones',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.cliente || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'cotizacion',
      datos: registro,
    });
    return registro;
  };

  const actualizarCotizacion = (id, datos) => {
    setCotizaciones((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Cotizaciones',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.cliente || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cotizacion',
      datos,
    });
  };

  const eliminarCotizacion = (id) => {
    const registro = cotizaciones.find((item) => item.id === id);
    setCotizaciones((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Cotizaciones',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.cliente || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cotizacion',
      datos: registro || null,
    });
  };

  const crearPedido = (datos) => {
    const registro = crearRegistro('pedido', datos);
    setPedidos((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Pedidos',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.cliente || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'pedido',
      datos: registro,
    });
    return registro;
  };

  const actualizarPedido = (id, datos) => {
    setPedidos((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Pedidos',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.cliente || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'pedido',
      datos,
    });
  };

  const eliminarPedido = (id) => {
    const registro = pedidos.find((item) => item.id === id);
    setPedidos((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Pedidos',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.cliente || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'pedido',
      datos: registro || null,
    });
  };

  const crearOrdenTrabajo = (datos) => {
    const registro = crearRegistro('orden-trabajo', datos);
    setOrdenesTrabajo((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Órdenes de Trabajo',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.cliente || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'orden_trabajo',
      datos: registro,
    });
    return registro;
  };

  const actualizarOrdenTrabajo = (id, datos) => {
    setOrdenesTrabajo((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Órdenes de Trabajo',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.cliente || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'orden_trabajo',
      datos,
    });
  };

  const eliminarOrdenTrabajo = (id) => {
    const registro = ordenesTrabajo.find((item) => item.id === id);
    setOrdenesTrabajo((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Órdenes de Trabajo',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.cliente || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'orden_trabajo',
      datos: registro || null,
    });
  };

  const crearProduccion = (datos) => {
    const registro = crearRegistro('produccion', datos);
    setProduccion((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Producción',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.producto || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'produccion',
      datos: registro,
    });
    return registro;
  };

  const actualizarProduccion = (id, datos) => {
    setProduccion((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Producción',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.producto || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'produccion',
      datos,
    });
  };

  const eliminarProduccion = (id) => {
    const registro = produccion.find((item) => item.id === id);
    setProduccion((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Producción',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.producto || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'produccion',
      datos: registro || null,
    });
  };

  const crearCobro = (datos) => {
    const registro = crearRegistro('cobro', datos);
    setCobros((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Cobros',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.cliente || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'cobro',
      datos: registro,
    });
    return registro;
  };

  const actualizarCobro = (id, datos) => {
    setCobros((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Cobros',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.cliente || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cobro',
      datos,
    });
  };

  const eliminarCobro = (id) => {
    const registro = cobros.find((item) => item.id === id);
    setCobros((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Cobros',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.cliente || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'cobro',
      datos: registro || null,
    });
  };

  const crearComision = (datos) => {
    const registro = crearRegistro('comision', datos);
    setComisiones((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Comisiones',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.vendedor || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'comision',
      datos: registro,
    });
    return registro;
  };

  const actualizarComision = (id, datos) => {
    setComisiones((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Comisiones',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.vendedor || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'comision',
      datos,
    });
  };

  const eliminarComision = (id) => {
    const registro = comisiones.find((item) => item.id === id);
    setComisiones((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Comisiones',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.vendedor || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'comision',
      datos: registro || null,
    });
  };

  const crearInventario = (datos) => {
    const registro = crearRegistro('inventario', datos);
    setInventario((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Inventario',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'inventario',
      datos: registro,
    });
    return registro;
  };

  const actualizarInventario = (id, datos) => {
    setInventario((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Inventario',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'inventario',
      datos,
    });
  };

  const eliminarInventario = (id) => {
    const registro = inventario.find((item) => item.id === id);
    setInventario((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Inventario',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'inventario',
      datos: registro || null,
    });
  };

  const crearMaterial = (datos) => {
    const registro = crearRegistro('material', datos);
    setMateriales((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Materiales',
      accion: 'CREAR',
      detalle: `Registro creado: ${registro.nombre || registro.nombre || registro.concepto || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'material',
      datos: registro,
    });
    return registro;
  };

  const actualizarMaterial = (id, datos) => {
    setMateriales((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Materiales',
      accion: 'EDITAR',
      detalle: `Registro actualizado: ${datos.nombre || datos.nombre || datos.concepto || id}`,
      entidadId: id,
      entidadTipo: 'material',
      datos,
    });
  };

  const eliminarMaterial = (id) => {
    const registro = materiales.find((item) => item.id === id);
    setMateriales((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Materiales',
      accion: 'ELIMINAR',
      detalle: `Registro eliminado: ${registro?.nombre || registro?.nombre || registro?.concepto || id}`,
      entidadId: id,
      entidadTipo: 'material',
      datos: registro || null,
    });
  };

  const crearUsuarioCRM = (datos) => {
    const registro = crearRegistro('usuario-crm', datos);
    setUsuariosCRM((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'CREAR_USUARIO',
      detalle: `Usuario CRM creado: ${registro.nombre || registro.usuario || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'usuario_crm',
      datos: registro,
    });
    return registro;
  };

  const actualizarUsuarioCRM = (id, datos) => {
    setUsuariosCRM((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'EDITAR_USUARIO',
      detalle: `Usuario CRM actualizado: ${datos.nombre || datos.usuario || id}`,
      entidadId: id,
      entidadTipo: 'usuario_crm',
      datos,
    });
  };

  const eliminarUsuarioCRM = (id) => {
    if (id === 'usuario-admin-general') return;

    const usuario = usuariosCRM.find((item) => item.id === id);
    setUsuariosCRM((prev) => eliminarDeLista(prev, id));

    if (usuarioActivoCRMId === id) {
      setUsuarioActivoCRMId('usuario-admin-general');
    }

    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'ELIMINAR_USUARIO',
      detalle: `Usuario CRM eliminado: ${usuario?.nombre || usuario?.usuario || id}`,
      entidadId: id,
      entidadTipo: 'usuario_crm',
      datos: usuario || null,
    });
  };

  const cambiarUsuarioActivoCRM = (id) => {
    const usuario = usuariosCRM.find((item) => item.id === id && item.estado !== 'Inactivo');
    const nuevoUsuarioId = usuario ? id : 'usuario-admin-general';
    setUsuarioActivoCRMId(nuevoUsuarioId);
    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'CAMBIAR_USUARIO_ACTIVO',
      detalle: `Usuario activo cambiado a: ${usuario?.nombre || 'Administrador General'}`,
      entidadId: nuevoUsuarioId,
      entidadTipo: 'usuario_crm',
      datos: usuario || null,
    });
  };

  const crearRolCRM = (datos) => {
    const registro = crearRegistro('rol-crm', datos);
    setRolesCRM((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'CREAR_ROL',
      detalle: `Rol CRM creado: ${registro.nombre || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'rol_crm',
      datos: registro,
    });
    return registro;
  };

  const actualizarRolCRM = (id, datos) => {
    setRolesCRM((prev) => actualizarLista(prev, id, datos));
    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'EDITAR_ROL',
      detalle: `Rol CRM actualizado: ${datos.nombre || id}`,
      entidadId: id,
      entidadTipo: 'rol_crm',
      datos,
    });
  };

  const eliminarRolCRM = (id) => {
    if (id === 'rol-admin-general') return;

    const rol = rolesCRM.find((item) => item.id === id);
    setRolesCRM((prev) => eliminarDeLista(prev, id));
    setUsuariosCRM((prev) =>
      prev.map((usuario) =>
        usuario.rolId === id ? { ...usuario, rolId: 'rol-admin-general' } : usuario
      )
    );
    registrarAuditoriaCRM({
      modulo: 'Usuarios y Permisos',
      accion: 'ELIMINAR_ROL',
      detalle: `Rol CRM eliminado: ${rol?.nombre || id}`,
      entidadId: id,
      entidadTipo: 'rol_crm',
      datos: rol || null,
    });
  };


  const normalizarTextoCRM = (valor = '') => String(valor || '').trim().toLowerCase();

  const convertirNumeroCRM = (valor) => {
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
    const limpio = String(valor ?? '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : 0;
  };

  const obtenerFechaCRM = (registro = {}, campos = []) => {
    const campo = campos.find((nombre) => registro?.[nombre]);
    if (!campo) return null;
    const fecha = new Date(registro[campo]);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };

  const diasEntreCRM = (fechaObjetivo) => {
    if (!fechaObjetivo) return null;
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioObjetivo = new Date(
      fechaObjetivo.getFullYear(),
      fechaObjetivo.getMonth(),
      fechaObjetivo.getDate()
    );
    return Math.ceil((inicioObjetivo.getTime() - inicioHoy.getTime()) / 86400000);
  };

  const estaCerradoCRM = (estado = '') => {
    const texto = normalizarTextoCRM(estado);
    return ['pagado', 'pagada', 'cancelado', 'cancelada', 'cerrado', 'cerrada', 'completado', 'completada', 'finalizado', 'finalizada', 'entregado', 'entregada', 'recibido', 'recibida'].some((palabra) => texto.includes(palabra));
  };

  const crearNotificacionInternaCRM = ({
    id,
    tipo = 'Sistema',
    prioridad = 'Media',
    titulo = 'Notificación interna',
    detalle = '',
    modulo = 'Sistema',
    unidadNegocio = 'Corporativo',
    fechaObjetivo = null,
    entidadId = '',
    entidadTipo = '',
    accionSugerida = 'Revisar',
  }) => {
    const registroManual = notificacionesCRM.find((item) => item.id === id);

    return {
      id,
      tipo,
      prioridad,
      titulo,
      detalle,
      modulo,
      unidadNegocio: unidadNegocio || 'Corporativo',
      fechaObjetivo: fechaObjetivo ? fechaObjetivo.toISOString() : '',
      entidadId,
      entidadTipo,
      accionSugerida,
      leida: Boolean(registroManual?.leida),
      archivada: Boolean(registroManual?.archivada),
      fechaLectura: registroManual?.fechaLectura || '',
      fechaRegistro: registroManual?.fechaRegistro || new Date().toISOString(),
    };
  };

  const notificacionesInternasCRM = useMemo(() => {
    const alertas = [];

    cuentasPorCobrar.forEach((cuenta) => {
      if (estaCerradoCRM(cuenta.estado)) return;

      const fecha = obtenerFechaCRM(cuenta, ['fechaVencimiento', 'vencimiento', 'fechaLimite', 'fechaPago', 'fecha']);
      const dias = diasEntreCRM(fecha);
      const saldo = convertirNumeroCRM(cuenta.saldo ?? cuenta.pendiente ?? cuenta.montoPendiente ?? cuenta.total ?? cuenta.monto);

      if (dias !== null && dias <= 7) {
        alertas.push(
          crearNotificacionInternaCRM({
            id: `cxc-${cuenta.id}`,
            tipo: dias < 0 ? 'Cobro vencido' : 'Cobro próximo',
            prioridad: dias < 0 ? 'Alta' : 'Media',
            titulo: dias < 0 ? 'Cuenta por cobrar vencida' : 'Cuenta por cobrar próxima',
            detalle: `${cuenta.cliente || cuenta.empresa || cuenta.concepto || 'Cliente'} · Saldo estimado C$ ${saldo.toLocaleString('es-NI')} · ${dias < 0 ? `${Math.abs(dias)} día(s) vencida` : `vence en ${dias} día(s)`}`,
            modulo: 'Cuentas por Cobrar',
            unidadNegocio: cuenta.unidadNegocio || 'Corporativo',
            fechaObjetivo: fecha,
            entidadId: cuenta.id,
            entidadTipo: 'cuenta_por_cobrar',
            accionSugerida: 'Gestionar cobro',
          })
        );
      }
    });

    cuentasPorPagar.forEach((cuenta) => {
      if (estaCerradoCRM(cuenta.estado)) return;

      const fecha = obtenerFechaCRM(cuenta, ['fechaVencimiento', 'vencimiento', 'fechaLimite', 'fechaPago', 'fecha']);
      const dias = diasEntreCRM(fecha);
      const saldo = convertirNumeroCRM(cuenta.saldo ?? cuenta.pendiente ?? cuenta.montoPendiente ?? cuenta.total ?? cuenta.monto);

      if (dias !== null && dias <= 7) {
        alertas.push(
          crearNotificacionInternaCRM({
            id: `cxp-${cuenta.id}`,
            tipo: dias < 0 ? 'Pago vencido' : 'Pago próximo',
            prioridad: dias < 0 ? 'Alta' : 'Media',
            titulo: dias < 0 ? 'Cuenta por pagar vencida' : 'Cuenta por pagar próxima',
            detalle: `${cuenta.proveedor || cuenta.empresa || cuenta.concepto || 'Proveedor'} · Saldo estimado C$ ${saldo.toLocaleString('es-NI')} · ${dias < 0 ? `${Math.abs(dias)} día(s) vencida` : `vence en ${dias} día(s)`}`,
            modulo: 'Cuentas por Pagar',
            unidadNegocio: cuenta.unidadNegocio || 'Corporativo',
            fechaObjetivo: fecha,
            entidadId: cuenta.id,
            entidadTipo: 'cuenta_por_pagar',
            accionSugerida: 'Programar pago',
          })
        );
      }
    });

    produccion.forEach((item) => {
      if (estaCerradoCRM(item.estado)) return;

      const fecha = obtenerFechaCRM(item, ['fechaEntrega', 'fechaCompromiso', 'fechaFin', 'fechaVencimiento', 'entrega']);
      const dias = diasEntreCRM(fecha);

      if (dias !== null && dias < 0) {
        alertas.push(
          crearNotificacionInternaCRM({
            id: `produccion-${item.id}`,
            tipo: 'Producción atrasada',
            prioridad: 'Alta',
            titulo: 'Producción atrasada',
            detalle: `${item.producto || item.proyecto || item.cliente || item.concepto || 'Producción'} · ${Math.abs(dias)} día(s) de atraso`,
            modulo: 'Producción',
            unidadNegocio: item.unidadNegocio || 'Corporativo',
            fechaObjetivo: fecha,
            entidadId: item.id,
            entidadTipo: 'produccion',
            accionSugerida: 'Revisar producción',
          })
        );
      }
    });

    ordenesTrabajo.forEach((orden) => {
      if (estaCerradoCRM(orden.estado)) return;

      const fecha = obtenerFechaCRM(orden, ['fechaEntrega', 'fechaCompromiso', 'fechaFin', 'fechaVencimiento', 'entrega']);
      const dias = diasEntreCRM(fecha);

      if (dias !== null && dias < 0) {
        alertas.push(
          crearNotificacionInternaCRM({
            id: `orden-${orden.id}`,
            tipo: 'Orden atrasada',
            prioridad: 'Alta',
            titulo: 'Orden de trabajo atrasada',
            detalle: `${orden.cliente || orden.proyecto || orden.concepto || orden.id} · ${Math.abs(dias)} día(s) de atraso`,
            modulo: 'Órdenes de Trabajo',
            unidadNegocio: orden.unidadNegocio || 'Corporativo',
            fechaObjetivo: fecha,
            entidadId: orden.id,
            entidadTipo: 'orden_trabajo',
            accionSugerida: 'Actualizar orden',
          })
        );
      }
    });

    compras.forEach((compra) => {
      if (estaCerradoCRM(compra.estado)) return;

      const estado = normalizarTextoCRM(compra.estado);
      const fecha = obtenerFechaCRM(compra, ['fechaEntrega', 'fechaRecepcion', 'fechaVencimiento', 'fecha']);
      const dias = diasEntreCRM(fecha);
      const esPendienteRecepcion = estado.includes('pendiente') || estado.includes('ordenada') || estado.includes('solicitada');

      if (esPendienteRecepcion || (dias !== null && dias < 0)) {
        alertas.push(
          crearNotificacionInternaCRM({
            id: `compra-${compra.id}`,
            tipo: 'Compra pendiente',
            prioridad: dias !== null && dias < 0 ? 'Alta' : 'Media',
            titulo: 'Compra pendiente de recepción',
            detalle: `${compra.proveedor || compra.concepto || compra.id} · ${dias !== null && dias < 0 ? `${Math.abs(dias)} día(s) de atraso` : 'requiere seguimiento'}`,
            modulo: 'Compras',
            unidadNegocio: compra.unidadNegocio || 'Corporativo',
            fechaObjetivo: fecha,
            entidadId: compra.id,
            entidadTipo: 'compra',
            accionSugerida: 'Confirmar recepción',
          })
        );
      }
    });

    inventario.forEach((item) => {
      const cantidad = convertirNumeroCRM(item.cantidad ?? item.stock ?? item.existencia ?? item.existencias);
      const minimo = convertirNumeroCRM(item.stockMinimo ?? item.minimo ?? item.minimoStock ?? item.puntoReorden);
      const debeAlertar = minimo > 0 ? cantidad <= minimo : cantidad <= 0;

      if (debeAlertar) {
        alertas.push(
          crearNotificacionInternaCRM({
            id: `inventario-${item.id}`,
            tipo: 'Inventario bajo',
            prioridad: cantidad <= 0 ? 'Alta' : 'Media',
            titulo: cantidad <= 0 ? 'Inventario agotado' : 'Inventario bajo',
            detalle: `${item.nombre || item.material || item.codigo || item.id} · existencia ${cantidad}${minimo > 0 ? ` / mínimo ${minimo}` : ''}`,
            modulo: 'Inventario',
            unidadNegocio: item.unidadNegocio || 'Corporativo',
            entidadId: item.id,
            entidadTipo: 'inventario',
            accionSugerida: 'Reponer inventario',
          })
        );
      }
    });

    return alertas
      .filter((alerta) => !alerta.archivada)
      .sort((a, b) => {
        const pesoPrioridad = { Alta: 3, Media: 2, Baja: 1 };
        const pesoA = pesoPrioridad[a.prioridad] || 0;
        const pesoB = pesoPrioridad[b.prioridad] || 0;
        if (pesoA !== pesoB) return pesoB - pesoA;
        return String(a.fechaObjetivo || '').localeCompare(String(b.fechaObjetivo || ''));
      });
  }, [compras, cuentasPorCobrar, cuentasPorPagar, inventario, notificacionesCRM, ordenesTrabajo, produccion]);

  const resumenNotificacionesCRM = useMemo(() => {
    const total = notificacionesInternasCRM.length;
    const noLeidas = notificacionesInternasCRM.filter((item) => !item.leida).length;
    const altaPrioridad = notificacionesInternasCRM.filter((item) => item.prioridad === 'Alta').length;
    const porUnidad = notificacionesInternasCRM.reduce((acc, item) => {
      const unidad = item.unidadNegocio || 'Corporativo';
      acc[unidad] = (acc[unidad] || 0) + 1;
      return acc;
    }, {});

    return { total, noLeidas, altaPrioridad, porUnidad };
  }, [notificacionesInternasCRM]);

  const marcarNotificacionCRMLeida = (id) => {
    setNotificacionesCRM((prev) => {
      const existe = prev.some((item) => item.id === id);
      if (existe) {
        return prev.map((item) =>
          item.id === id ? { ...item, leida: true, fechaLectura: new Date().toISOString() } : item
        );
      }
      return [{ id, leida: true, archivada: false, fechaLectura: new Date().toISOString(), fechaRegistro: new Date().toISOString() }, ...prev];
    });
    registrarAuditoriaCRM({
      modulo: 'Notificaciones',
      accion: 'MARCAR_LEIDA',
      detalle: `Notificación marcada como leída: ${id}`,
      entidadId: id,
      entidadTipo: 'notificacion',
    });
  };

  const archivarNotificacionCRM = (id) => {
    setNotificacionesCRM((prev) => {
      const existe = prev.some((item) => item.id === id);
      if (existe) {
        return prev.map((item) =>
          item.id === id ? { ...item, archivada: true, fechaArchivada: new Date().toISOString() } : item
        );
      }
      return [{ id, leida: true, archivada: true, fechaArchivada: new Date().toISOString(), fechaRegistro: new Date().toISOString() }, ...prev];
    });
    registrarAuditoriaCRM({
      modulo: 'Notificaciones',
      accion: 'ARCHIVAR',
      detalle: `Notificación archivada: ${id}`,
      entidadId: id,
      entidadTipo: 'notificacion',
    });
  };

  const marcarTodasNotificacionesCRMLeidas = () => {
    const fecha = new Date().toISOString();
    setNotificacionesCRM((prev) => {
      const mapa = new Map(prev.map((item) => [item.id, item]));
      notificacionesInternasCRM.forEach((item) => {
        mapa.set(item.id, { ...(mapa.get(item.id) || {}), id: item.id, leida: true, archivada: false, fechaLectura: fecha, fechaRegistro: mapa.get(item.id)?.fechaRegistro || fecha });
      });
      return Array.from(mapa.values());
    });
    registrarAuditoriaCRM({
      modulo: 'Notificaciones',
      accion: 'MARCAR_TODAS_LEIDAS',
      detalle: 'Todas las notificaciones visibles fueron marcadas como leídas.',
      entidadTipo: 'notificacion',
    });
  };


  const crearLeadWhatsApp = (datos) => {
    const registro = crearRegistro('lead-whatsapp', {
      nombre: datos.nombre || '',
      whatsapp: datos.whatsapp || '',
      mensaje: datos.mensaje || '',
      unidadNegocio: datos.unidadNegocio || 'ELANKAV VISUAL',
      servicioSolicitado: datos.servicioSolicitado || '',
      origenMensaje: datos.origenMensaje || 'WhatsApp',
      tipoCliente: datos.tipoCliente || 'Nuevo',
      estadoLead: datos.estadoLead || 'Nuevo',
      clasificacion: datos.clasificacion || 'Información',
      seguimiento: datos.seguimiento || '',
      responsable: datos.responsable || '',
      contactoId: datos.contactoId || '',
      cotizacionId: datos.cotizacionId || '',
      fechaUltimoSeguimiento: datos.fechaUltimoSeguimiento || new Date().toISOString(),
    });

    setLeadsWhatsApp((prev) => [registro, ...prev]);
    registrarAuditoriaCRM({
      modulo: 'Centro WhatsApp',
      accion: 'CREAR',
      detalle: `Lead creado: ${registro.nombre || registro.whatsapp || registro.id}`,
      entidadId: registro.id,
      entidadTipo: 'lead_whatsapp',
      datos: registro,
    });
    return registro;
  };

  const actualizarLeadWhatsApp = (id, datos) => {
    setLeadsWhatsApp((prev) => actualizarLista(prev, id, {
      ...datos,
      fechaUltimoSeguimiento: datos.fechaUltimoSeguimiento || new Date().toISOString(),
    }));
    registrarAuditoriaCRM({
      modulo: 'Centro WhatsApp',
      accion: 'EDITAR',
      detalle: `Lead actualizado: ${datos.nombre || datos.whatsapp || id}`,
      entidadId: id,
      entidadTipo: 'lead_whatsapp',
      datos,
    });
  };

  const eliminarLeadWhatsApp = (id) => {
    const registro = leadsWhatsApp.find((item) => item.id === id);
    setLeadsWhatsApp((prev) => eliminarDeLista(prev, id));
    registrarAuditoriaCRM({
      modulo: 'Centro WhatsApp',
      accion: 'ELIMINAR',
      detalle: `Lead eliminado: ${registro?.nombre || registro?.whatsapp || id}`,
      entidadId: id,
      entidadTipo: 'lead_whatsapp',
      datos: registro || null,
    });
  };

  const convertirLeadWhatsAppAContacto = (id) => {
    const lead = leadsWhatsApp.find((item) => item.id === id);
    if (!lead) return null;

    const contacto = crearContacto({
      nombre: lead.nombre || 'Contacto WhatsApp',
      cargo: lead.tipoCliente || 'Lead',
      whatsapp: lead.whatsapp || '',
      correo: '',
      empresaId: '',
      rol: lead.tipoCliente || 'Cliente',
      estado: 'Activo',
      unidadNegocio: lead.unidadNegocio || 'ELANKAV VISUAL',
      origen: lead.origenMensaje || 'WhatsApp',
      notas: `Lead generado desde Centro WhatsApp. Servicio: ${lead.servicioSolicitado || 'No definido'}. Clasificación: ${lead.clasificacion || 'No definida'}. Mensaje: ${lead.mensaje || ''}`,
    });

    actualizarLeadWhatsApp(id, {
      contactoId: contacto.id,
      estadoLead: lead.estadoLead === 'Nuevo' ? 'Respondido' : lead.estadoLead,
      nombre: lead.nombre,
      whatsapp: lead.whatsapp,
      mensaje: lead.mensaje,
      unidadNegocio: lead.unidadNegocio,
      servicioSolicitado: lead.servicioSolicitado,
      origenMensaje: lead.origenMensaje,
      tipoCliente: lead.tipoCliente,
      clasificacion: lead.clasificacion,
      seguimiento: lead.seguimiento,
      responsable: lead.responsable,
      cotizacionId: lead.cotizacionId || '',
    });

    return contacto;
  };

  const crearCotizacionDesdeLeadWhatsApp = (id) => {
    const lead = leadsWhatsApp.find((item) => item.id === id);
    if (!lead) return null;

    const cotizacion = crearCotizacion({
      codigo: `COT-WA-${Date.now()}`,
      cliente: lead.nombre || lead.whatsapp || 'Cliente WhatsApp',
      empresa: '',
      contacto: lead.nombre || '',
      descripcion: lead.servicioSolicitado || lead.mensaje || 'Solicitud recibida por WhatsApp',
      categoria: lead.clasificacion || 'Cotización',
      unidadNegocio: lead.unidadNegocio || 'ELANKAV VISUAL',
      moneda: 'C$',
      subtotal: 0,
      iva: 15,
      descuento: 0,
      total: 0,
      estado: 'Borrador',
      fecha: new Date().toISOString().slice(0, 10),
      vencimiento: '',
      observaciones: `Origen: ${lead.origenMensaje || 'WhatsApp'}. WhatsApp: ${lead.whatsapp || ''}. Tipo cliente: ${lead.tipoCliente || ''}. Mensaje: ${lead.mensaje || ''}`,
    });

    actualizarLeadWhatsApp(id, {
      cotizacionId: cotizacion.id,
      estadoLead: 'Cotizado',
      nombre: lead.nombre,
      whatsapp: lead.whatsapp,
      mensaje: lead.mensaje,
      unidadNegocio: lead.unidadNegocio,
      servicioSolicitado: lead.servicioSolicitado,
      origenMensaje: lead.origenMensaje,
      tipoCliente: lead.tipoCliente,
      clasificacion: lead.clasificacion,
      seguimiento: lead.seguimiento,
      responsable: lead.responsable,
      contactoId: lead.contactoId || '',
    });

    return cotizacion;
  };

  const usuarioActivoCRM =
    usuariosCRM.find((usuario) => usuario.id === usuarioActivoCRMId) || usuariosCRMIniciales[0];

  const rolUsuarioActivoCRM =
    rolesCRM.find((rol) => rol.id === usuarioActivoCRM.rolId) || rolesCRMIniciales[0];

  const usuarioTienePermisoCRM = (moduloId) => {
    if (!moduloId) return false;
    if (usuarioActivoCRM.estado === 'Inactivo') return false;
    if (rolUsuarioActivoCRM.id === 'rol-admin-general') return true;
    return Array.isArray(rolUsuarioActivoCRM.permisos) && rolUsuarioActivoCRM.permisos.includes(moduloId);
  };

  const valor = useMemo(
    () => ({
      empresas,
      contactos,
      seguimiento,
      vendedores,
      veterinarias,
      afiliados,
      proveedores,
      compras,
      cuentasPorPagar,
      cuentasPorCobrar,
      flujoCaja,

      cotizaciones,
      pedidos,
      ordenesTrabajo,
      produccion,
      cobros,
      comisiones,
      inventario,
      materiales,
      auditoriaCRM,
      notificacionesCRM,
      leadsWhatsApp,
      notificacionesInternasCRM,
      resumenNotificacionesCRM,
      usuariosCRM,
      rolesCRM,
      usuarioActivoCRMId,
      usuarioActivoCRM,
      rolUsuarioActivoCRM,
      modulosCRMPermisos: MODULOS_CRM_PERMISOS,
      unidadesOficialesCRM: UNIDADES_OFICIALES_CRM,

      crearEmpresa,
      actualizarEmpresa,
      eliminarEmpresa,

      crearContacto,
      actualizarContacto,
      eliminarContacto,

      crearSeguimiento,
      actualizarSeguimiento,
      eliminarSeguimiento,

      crearVendedor,
      actualizarVendedor,
      eliminarVendedor,

      crearVeterinaria,
      actualizarVeterinaria,
      eliminarVeterinaria,

      crearAfiliado,
      actualizarAfiliado,
      eliminarAfiliado,

      crearProveedor,
      actualizarProveedor,
      eliminarProveedor,

      crearCompra,
      actualizarCompra,
      eliminarCompra,

      crearCuentaPorPagar,
      actualizarCuentaPorPagar,
      eliminarCuentaPorPagar,

      crearCuentaPorCobrar,
      actualizarCuentaPorCobrar,
      eliminarCuentaPorCobrar,

      crearMovimientoFlujoCaja,
      actualizarMovimientoFlujoCaja,
      eliminarMovimientoFlujoCaja,

      crearCotizacion,
      actualizarCotizacion,
      eliminarCotizacion,

      crearPedido,
      actualizarPedido,
      eliminarPedido,

      crearOrdenTrabajo,
      actualizarOrdenTrabajo,
      eliminarOrdenTrabajo,

      crearProduccion,
      actualizarProduccion,
      eliminarProduccion,

      crearCobro,
      actualizarCobro,
      eliminarCobro,

      crearComision,
      actualizarComision,
      eliminarComision,

      crearInventario,
      actualizarInventario,
      eliminarInventario,

      crearMaterial,
      actualizarMaterial,
      eliminarMaterial,

      crearUsuarioCRM,
      actualizarUsuarioCRM,
      eliminarUsuarioCRM,
      cambiarUsuarioActivoCRM,
      crearRolCRM,
      actualizarRolCRM,
      eliminarRolCRM,
      registrarAuditoriaCRM,
      limpiarAuditoriaCRM,
      marcarNotificacionCRMLeida,
      archivarNotificacionCRM,
      marcarTodasNotificacionesCRMLeidas,
      crearLeadWhatsApp,
      actualizarLeadWhatsApp,
      eliminarLeadWhatsApp,
      convertirLeadWhatsAppAContacto,
      crearCotizacionDesdeLeadWhatsApp,
      usuarioTienePermisoCRM,
    }),
    [
      empresas,
      contactos,
      seguimiento,
      vendedores,
      veterinarias,
      afiliados,
      proveedores,
      compras,
      cuentasPorPagar,
      cuentasPorCobrar,
      flujoCaja,
      cotizaciones,
      pedidos,
      ordenesTrabajo,
      produccion,
      cobros,
      comisiones,
      inventario,
      materiales,
      auditoriaCRM,
      notificacionesCRM,
      leadsWhatsApp,
      notificacionesInternasCRM,
      resumenNotificacionesCRM,
      usuariosCRM,
      rolesCRM,
      usuarioActivoCRMId,
      usuarioActivoCRM,
      rolUsuarioActivoCRM,
    ]
  );

  return <CoreContext.Provider value={valor}>{children}</CoreContext.Provider>;
}

export function useCore() {
  const context = useContext(CoreContext);

  if (!context) {
    throw new Error('useCore debe usarse dentro de CoreProvider');
  }

  return context;
}