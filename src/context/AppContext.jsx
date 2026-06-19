import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { productosIniciales } from '../data/productos';
import { resumenCarrito } from '../lib/calculos';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

const configuracionInicial = {
  nombreSitio: 'ELANVISUAL',
  slogan: 'Rotulacin, impresin y fabricacin visual profesional',
  logoTexto: 'ELANVISUAL',
  logo: '',
  whatsapp: '+505 8522 8183',
  correo: 'elansuministros@gmail.com',
  instagram: '@elanvisual',
  colorPrincipal: '#111827',
  colorSecundario: '#C9A227',
  textoHero: 'Rotulacin profesional para negocios reales',
  descripcionHero:
    'Rtulos, letras 3D, acrlico, PVC, impresin UV, DTF UV, CNC, lser, fachadas y displays fabricables desde una solicitud mvil.',
  instruccionesPago:
    'Despus de transferir, responde este mensaje enviando el comprobante para confirmar tu solicitud.',
  anticipoPorcentaje: 60,
};

const cuentasIniciales = [];

const bannersIniciales = [
  {
    id: 'hero-principal-default',
    titulo: 'Rotulacin profesional para negocios reales',
    subtitulo:
      'Letras 3D, fachadas, acrlico, PVC, impresin UV, DTF UV, CNC, lser y displays fabricables.',
    ubicacion: 'hero-principal',
    link: 'catalogo',
    activo: true,
    imagen: '/productos/portada-visual.png',
    imagenRuta: '/productos/portada-visual.png',
    createdAt: 1,
    actualizadoEn: 1,
  },
];

const trabajosIniciales = [
  {
    id: 'trabajo-1',
    titulo: 'Letras PVC para recepcin',
    tipo: 'Foto',
    descripcion: 'Fabricacin en PVC con acabado limpio para instalacin interior.',
    imagen: '/productos/letras-pvc.jpg',
    activo: true,
  },
  {
    id: 'trabajo-2',
    titulo: 'Fachada comercial',
    tipo: 'Foto',
    descripcion: 'Rotulacin exterior con estructura, frente visual y montaje tcnico.',
    imagen: '/productos/fachada.jpg',
    activo: true,
  },
  {
    id: 'trabajo-3',
    titulo: 'Display y sealizacin',
    tipo: 'Foto',
    descripcion: 'Piezas fabricadas para punto de venta, orientacin y presentacin de marca.',
    imagen: '/productos/display.jpg',
    activo: true,
  },
];

const clientesIniciales = [];

const usuariosIniciales = [
  {
    id: 'admin-1',
    usuario: 'admin',
    email: 'elansuministros@gmail.com',
    password: 'ElanAdmin2026#Seguro',
    rol: 'admin',
    activo: true,
  },
  {
    id: 'ventas-1',
    usuario: 'ventas',
    email: 'ventas@visual.elankav.com',
    password: 'VentasElan2026#Seguro',
    rol: 'ventas',
    activo: true,
  },
  {
    id: 'prod-1',
    usuario: 'produccion',
    email: 'produccion@visual.elankav.com',
    password: 'ProdElan2026#Seguro',
    rol: 'produccion',
    activo: true,
  },
];

export const rolesSistema = ['admin', 'ventas', 'produccion'];

export const estadosProduccion = [
  'pendiente',
  'diseno',
  'produccion',
  'control_calidad',
  'listo',
  'entregado',
];

export const etiquetasEstado = {
  pendiente: 'Pendiente',
  pendiente_pago: 'Pendiente de pago',
  pedido_recibido: 'Pedido recibido',
  anticipo_confirmado: 'Anticipo confirmado',
  pago_total_confirmado: 'Pago total confirmado',
  diseno: 'Diseo',
  produccion: 'Produccin',
  corte_cnc: 'Corte CNC',
  armado: 'Armado',
  pintura_acabado: 'Pintura / acabado',
  control_calidad: 'Control de calidad',
  listo: 'Listo',
  listo_entrega: 'Listo para entrega',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function esDataUrl(valor) {
  return String(valor || '').trim().startsWith('data:image/');
}

function limpiarRutaPublica(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  if (esDataUrl(texto)) return texto;
  if (texto.startsWith('http://') || texto.startsWith('https://')) return texto;
  return texto.startsWith('/') ? texto : `/${texto}`;
}

function normalizarBanner(banner = {}) {
  const rutaPublica = limpiarRutaPublica(
    banner.imagenRuta || banner.rutaImagen || banner.imagenPublica || banner.imagen
  );

  return {
    ...banner,
    imagenRuta: rutaPublica,
    imagenDesktop: banner.imagenDesktop || banner.imagen_desktop || rutaPublica,
    imagenMobile: banner.imagenMobile || banner.imagen_mobile || '',
    imagen: rutaPublica,
    activo: banner.activo !== false,
    ubicacion: banner.ubicacion || 'hero-principal',
    link: banner.link || 'catalogo',
  };
}

function normalizarBanners(lista, valorInicial = []) {
  const origen = Array.isArray(lista) && lista.length ? lista : valorInicial;
  return origen.map(normalizarBanner);
}

function leerStorage(clave, valorInicial) {
  try {
    const guardado = localStorage.getItem(clave);
    if (!guardado) return valorInicial;

    const datos = JSON.parse(guardado);

    if (clave === 'elanvisual_banners') {
      return normalizarBanners(datos, valorInicial);
    }

    return datos;
  } catch {
    return valorInicial;
  }
}

function guardarStorage(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin accin.
  }
}

const APP_STATE_TABLE = 'elanvisual_app_state';
const APP_STATE_ID = 'global';

function construirEstadoCompartido({
  configuracion,
  cuentasBancarias,
  banners,
  trabajos,
  productos,
  imagenes,
}) {
  return {
    configuracion: {
      ...configuracionInicial,
      ...(configuracion || {}),
    },
    cuentasBancarias: Array.isArray(cuentasBancarias) ? cuentasBancarias : cuentasIniciales,
    banners: normalizarBanners(banners, bannersIniciales),
    trabajos: Array.isArray(trabajos) ? trabajos : trabajosIniciales,
    productos: Array.isArray(productos) ? productos : productosIniciales,
    imagenes: Array.isArray(imagenes) ? imagenes : [],
    actualizadoEn: new Date().toISOString(),
  };
}

function estadoCompartidoTieneDatos(data) {
  if (!data || typeof data !== 'object') return false;

  return Boolean(
    (Array.isArray(data.productos) && data.productos.length > 0) ||
      (Array.isArray(data.banners) && data.banners.length > 0) ||
      (Array.isArray(data.trabajos) && data.trabajos.length > 0) ||
      (Array.isArray(data.imagenes) && data.imagenes.length > 0) ||
      (Array.isArray(data.cuentasBancarias) && data.cuentasBancarias.length > 0) ||
      (data.configuracion && Object.keys(data.configuracion).length > 0)
  );
}

function generarCodigoSeguimiento() {
  const year = new Date().getFullYear();
  const correlativo = String(Date.now()).slice(-6);
  return `EV-${year}-${correlativo}`;
}

function crearSlug(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizarUsuario(texto) {
  return String(texto || '').toLowerCase().trim();
}

function normalizarWhatsAppNicaragua(numero) {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (!limpio) return '';
  if (limpio.length === 8) return `505${limpio}`;
  if (limpio.startsWith('505') && limpio.length === 11) return limpio;
  return limpio;
}

function whatsappValidoNicaragua(numero) {
  const limpio = normalizarWhatsAppNicaragua(numero);
  return limpio.startsWith('505') && limpio.length === 11;
}

function asegurarUsuariosBase(listaUsuarios = []) {
  const salida = [...listaUsuarios];

  usuariosIniciales.forEach((usuarioBase) => {
    const existe = salida.some(
      (u) =>
        normalizarUsuario(u.usuario) === normalizarUsuario(usuarioBase.usuario) ||
        normalizarUsuario(u.email) === normalizarUsuario(usuarioBase.email)
    );

    if (!existe) salida.push(usuarioBase);
  });

  return salida;
}

function normalizarRol(rol) {
  const valor = String(rol || '').toLowerCase().trim();
  if (valor === 'veterinaria') return 'ventas';
  if (rolesSistema.includes(valor)) return valor;
  return 'produccion';
}


function codigoVendedorElanvisual(usuario = {}) {
  if (usuario.codigoVendedor) return usuario.codigoVendedor;
  if (usuario.codigoQR) return usuario.codigoQR;
  if (usuario.usuario === 'admin') return 'ERICK-001';
  if (usuario.rol === 'ventas') {
    return `VEN-${String(usuario.usuario || usuario.id || '001')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')}`;
  }
  return String(usuario.id || 'USR-001').toUpperCase();
}

function obtenerReferenciaVendedorElanvisual(usuarios = [], usuarioActivo = null) {
  const ref = String(localStorage.getItem('elanvisual_ref_vendedor') || '').trim();

  const buscar = (valor) => {
    const normal = String(valor || '').toLowerCase().trim();
    if (!normal) return null;

    return usuarios.find((u) => {
      const codigo = codigoVendedorElanvisual(u).toLowerCase();
      return (
        codigo === normal ||
        String(u.usuario || '').toLowerCase() === normal ||
        String(u.email || '').toLowerCase() === normal ||
        String(u.id || '').toLowerCase() === normal
      );
    });
  };

  const desdeRef = buscar(ref);
  if (desdeRef) {
    return {
      id: desdeRef.id,
      nombre: desdeRef.nombre || desdeRef.usuario || desdeRef.email,
      usuario: desdeRef.usuario,
      email: desdeRef.email,
      codigo: codigoVendedorElanvisual(desdeRef),
      rol: desdeRef.rol,
    };
  }

  if (usuarioActivo?.rol === 'ventas' || usuarioActivo?.usuario === 'admin') {
    return {
      id: usuarioActivo.id,
      nombre: usuarioActivo.nombre || usuarioActivo.usuario || usuarioActivo.email,
      usuario: usuarioActivo.usuario,
      email: usuarioActivo.email,
      codigo: codigoVendedorElanvisual(usuarioActivo),
      rol: usuarioActivo.rol,
    };
  }

  return null;
}

function crearComisionInicialElanvisual({ total = 0, costoProduccion = 0, vendedor = null }) {
  const venta = Number(total || 0);
  const costo = Number(costoProduccion || 0);
  const utilidadRealEstimada = Math.max(venta - costo, 0);
  const fondoComunitario = utilidadRealEstimada * 0.05;
  const direccionGeneral = utilidadRealEstimada * 0.05;
  const baseDistribuible = Math.max(utilidadRealEstimada - fondoComunitario - direccionGeneral, 0);
  const comisionVendedor = vendedor ? baseDistribuible * 0.4 : 0;
  const elanvisual = baseDistribuible - comisionVendedor;
  const fondoIncentivoVendedor = vendedor ? elanvisual * 0.05 : 0;

  return {
    estado: 'en_proceso',
    vendedorId: vendedor?.id || '',
    vendedorCodigo: vendedor?.codigo || '',
    vendedorNombre: vendedor?.nombre || '',
    utilidadRealEstimada,
    fondoComunitario,
    direccionGeneral,
    baseDistribuible,
    comisionVendedor,
    fondoIncentivoVendedor,
    utilidadElanvisual: Math.max(elanvisual - fondoIncentivoVendedor, 0),
    pagada: false,
    pagoSolicitado: false,
    historial: [
      {
        estado: 'en_proceso',
        fecha: new Date().toISOString(),
        nota: 'Comisin creada en proceso. Se valida hasta trabajo finalizado y pago cancelado.',
      },
    ],
  };
}

function mapUsuarioFromDb(row) {
  return {
    id: row.id,
    nombre: row.nombre || row.usuario || row.email || '',
    usuario: row.usuario || '',
    email: row.email || '',
    password: row.password || '',
    rol: normalizarRol(row.rol),
    clienteId: row.cliente_id || row.vendedor_id || row.veterinaria_id || '',
    activo: row.activo !== false,
    debeCambiarPassword: row.debe_cambiar_password === true,
    creadoEn: row.created_at || '',
  };
}

function mapUsuarioToDb(usuario) {
  return {
    nombre: usuario.nombre || usuario.usuario || usuario.email || '',
    usuario: normalizarUsuario(usuario.usuario),
    email: normalizarUsuario(usuario.email),
    password: String(usuario.password || '').trim(),
    rol: normalizarRol(usuario.rol),
    veterinaria_id: null,
    activo: usuario.activo !== false,
    debe_cambiar_password: usuario.debeCambiarPassword === true,
  };
}

function mapPedidoFromDb(row) {
  const resumen = row.resumen || {};
  const origenComercial = row.origen_comercial || row.origenComercial || null;
  const cliente = row.cliente || {};

  return {
    id: row.id || row.numero || `pedido-${Date.now()}`,
    numero: row.numero || '',
    codigoSeguimiento: row.codigo_seguimiento || row.codigoSeguimiento || '',
    cliente,
    origenComercial,
    vendedor: origenComercial,
    veterinaria: null,
    items: Array.isArray(row.items) ? row.items : [],
    origenComercialId: row.origen_comercial_id || row.origenComercialId || '',
    vendedorId: row.vendedor_id || row.origen_comercial_id || row.origenComercialId || '',
    veterinariaId: '',
    origenComercialCodigo: row.origen_comercial_codigo || row.origenComercialCodigo || '',
    vendedorCodigo: row.vendedor_codigo || row.origen_comercial_codigo || row.origenComercialCodigo || '',
    veterinariaCodigo: '',
    resumen: {
      subtotal: Number(resumen.subtotal || 0),
      descuentoPorcentaje: Number(resumen.descuentoPorcentaje || resumen.descuento_porcentaje || 0),
      descuentoMonto: Number(resumen.descuentoMonto || resumen.descuento_monto || 0),
      total: Number(resumen.total || row.total || 0),
      comision: Number(resumen.comision || row.comision || 0),
    },
    pagoTipo: row.pago_tipo || row.pagoTipo || 'anticipo',
    anticipoPorcentaje: Number(row.anticipo_porcentaje ?? row.anticipoPorcentaje ?? 60),
    montoSolicitado: Number(row.monto_solicitado ?? row.montoSolicitado ?? 0),
    anticipoRequerido: Number(row.anticipo_requerido ?? row.anticipoRequerido ?? 0),
    anticipoRecibido: Number(row.anticipo_recibido ?? row.anticipoRecibido ?? 0),
    saldoPendiente: Number(row.saldo_pendiente ?? row.saldoPendiente ?? 0),
    estado: row.estado || 'pendiente_pago',
    estadoProduccion: row.estado_produccion || row.estadoProduccion || 'pendiente',
    pagoEstado: row.pago_estado || row.pagoEstado || 'pendiente_transferencia',
    seguimientoEstado: row.seguimiento_estado || row.seguimientoEstado || row.estado || 'pendiente_pago',
    comisionEstado: row.comision_estado || row.comisionEstado || 'no_generada',
    ordenTrabajo: row.orden_trabajo || row.ordenTrabajo || {},
    historial: Array.isArray(row.historial) ? row.historial : [],
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    fechaEstimada: row.fecha_estimada || row.fechaEstimada || '',
  };
}

function mapPedidoToDb(pedido) {
  return {
    numero: pedido.numero || '',
    codigo_seguimiento: pedido.codigoSeguimiento || '',
    cliente: pedido.cliente || {},
    veterinaria: null,
    items: pedido.items || [],
    veterinaria_id: null,
    veterinaria_codigo: '',
    resumen: pedido.resumen || {},
    pago_tipo: pedido.pagoTipo || 'anticipo',
    anticipo_porcentaje: Number(pedido.anticipoPorcentaje || 60),
    monto_solicitado: Number(pedido.montoSolicitado || 0),
    anticipo_requerido: Number(pedido.anticipoRequerido || 0),
    anticipo_recibido: Number(pedido.anticipoRecibido || 0),
    saldo_pendiente: Number(pedido.saldoPendiente || 0),
    estado: pedido.estado || 'pendiente_pago',
    estado_produccion: pedido.estadoProduccion || 'pendiente',
    pago_estado: pedido.pagoEstado || 'pendiente_transferencia',
    seguimiento_estado: pedido.seguimientoEstado || pedido.estado || 'pendiente_pago',
    comision_estado: pedido.comisionEstado || 'no_generada',
    orden_trabajo: pedido.ordenTrabajo || {},
    historial: pedido.historial || [],
    fecha_estimada: pedido.fechaEstimada || null,
  };
}

function unirPedidos(locales = [], remotos = []) {
  const mapa = new Map();

  [...locales, ...remotos].forEach((pedido) => {
    const clave = pedido.id || pedido.numero || pedido.codigoSeguimiento;
    if (!clave) return;
    mapa.set(clave, { ...(mapa.get(clave) || {}), ...pedido });
  });

  return Array.from(mapa.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

function esUuid(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(valor || '')
  );
}

export function AppProvider({ children }) {

  const [configuracion, setConfiguracion] = useState(() =>
    leerStorage('elanvisual_configuracion', configuracionInicial)
  );
  const [cuentasBancarias, setCuentasBancarias] = useState(() =>
    leerStorage('elanvisual_cuentas_bancarias', cuentasIniciales)
  );
  const [banners, setBanners] = useState(() => leerStorage('elanvisual_banners', bannersIniciales));
  const [trabajos, setTrabajos] = useState(() =>
    leerStorage('elanvisual_trabajos', trabajosIniciales)
  );
  const [productos, setProductos] = useState(() =>
    leerStorage('elanvisual_productos', productosIniciales)
  );
  const [imagenes, setImagenes] = useState(() => leerStorage('elanvisual_imagenes', []));
  const [clientes, setClientes] = useState(() =>
    leerStorage('elanvisual_clientes', clientesIniciales)
  );
  const [clienteActual, setClienteActual] = useState(() =>
    leerStorage('elanvisual_cliente_actual', null)
  );
  const [carrito, setCarrito] = useState([]);
  const [pedidos, setPedidos] = useState(() => leerStorage('elanvisual_pedidos', []));
  const [usuario, setUsuario] = useState(() => leerStorage('elanvisual_usuario_actual', null));
  const [usuarios, setUsuarios] = useState(() =>
  asegurarUsuariosBase(usuariosIniciales)
);
  const [supabaseListo, setSupabaseListo] = useState(false);
  const [proveedores, setProveedores] = useState(() => leerStorage('elanvisual_proveedores_costos', []));
  const [productosProveedor, setProductosProveedor] = useState(() => leerStorage('elanvisual_productos_proveedor', []));
  const [cotizacionesProveedor, setCotizacionesProveedor] = useState(() => leerStorage('elanvisual_cotizaciones_proveedor', []));
  const [inventarioReal, setInventarioReal] = useState(() => leerStorage('elanvisual_inventario_real', []));
  const [costosReales, setCostosReales] = useState(() =>
  leerStorage('elanvisual_costos_reales', [])
);

const [utilidadesReales, setUtilidadesReales] = useState(() =>
  leerStorage('elanvisual_utilidades_reales', [])
);

const [comisionesAutomaticas, setComisionesAutomaticas] = useState(() =>
  leerStorage('elanvisual_comisiones_automaticas', [])
);

const [fondoComunidad, setFondoComunidad] = useState(() =>
  leerStorage('elanvisual_fondo_comunidad', [])
);

const [fondoIncentivo, setFondoIncentivo] = useState(() =>
  leerStorage('elanvisual_fondo_incentivo', [])
);

const [fondoDireccion, setFondoDireccion] = useState(() =>
  leerStorage('elanvisual_fondo_direccion', [])
);
  const [estadoCompartidoCargado, setEstadoCompartidoCargado] = useState(false);

  useEffect(() => guardarStorage('elanvisual_configuracion', configuracion), [configuracion]);
  useEffect(() => guardarStorage('elanvisual_cuentas_bancarias', cuentasBancarias), [cuentasBancarias]);
  useEffect(() => guardarStorage('elanvisual_banners', banners), [banners]);
  useEffect(() => guardarStorage('elanvisual_trabajos', trabajos), [trabajos]);
  useEffect(() => guardarStorage('elanvisual_productos', productos), [productos]);
  useEffect(() => guardarStorage('elanvisual_imagenes', imagenes), [imagenes]);
  useEffect(() => guardarStorage('elanvisual_clientes', clientes), [clientes]);
  useEffect(() => guardarStorage('elanvisual_pedidos', pedidos), [pedidos]);
  // Usuarios migrados a Supabase
  useEffect(() => guardarStorage('elanvisual_proveedores_costos', proveedores), [proveedores]);
  useEffect(() => guardarStorage('elanvisual_productos_proveedor', productosProveedor), [productosProveedor]);
  useEffect(() => guardarStorage('elanvisual_cotizaciones_proveedor', cotizacionesProveedor), [cotizacionesProveedor]);
  useEffect(() => guardarStorage('elanvisual_inventario_real', inventarioReal), [inventarioReal]);
  useEffect(() => guardarStorage('elanvisual_costos_reales', costosReales), [costosReales]);

useEffect(() => guardarStorage('elanvisual_utilidades_reales', utilidadesReales), [utilidadesReales]);

useEffect(() => guardarStorage('elanvisual_comisiones_automaticas', comisionesAutomaticas), [comisionesAutomaticas]);

useEffect(() => guardarStorage('elanvisual_fondo_comunidad', fondoComunidad), [fondoComunidad]);

useEffect(() => guardarStorage('elanvisual_fondo_incentivo', fondoIncentivo), [fondoIncentivo]);

useEffect(() => guardarStorage('elanvisual_fondo_direccion', fondoDireccion), [fondoDireccion]);

  useEffect(() => {
    if (usuario) guardarStorage('elanvisual_usuario_actual', usuario);
    else localStorage.removeItem('elanvisual_usuario_actual');
  }, [usuario]);

  useEffect(() => {
    if (clienteActual) guardarStorage('elanvisual_cliente_actual', clienteActual);
    else localStorage.removeItem('elanvisual_cliente_actual');
  }, [clienteActual]);

  useEffect(() => {
    let activo = true;

    const cargarEstadoCompartido = async () => {
      if (!supabase) {
        setEstadoCompartidoCargado(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(APP_STATE_TABLE)
          .select('data')
          .eq('id', APP_STATE_ID)
          .maybeSingle();

        if (error) throw error;

        const remoto = data?.data;

        if (estadoCompartidoTieneDatos(remoto)) {
          if (!activo) return;

          setConfiguracion({
            ...configuracionInicial,
            ...(remoto.configuracion || {}),
            nombreSitio: 'ELANVISUAL',
            logoTexto: 'ELANVISUAL',
          });

          setCuentasBancarias(
            Array.isArray(remoto.cuentasBancarias) ? remoto.cuentasBancarias : cuentasIniciales
          );

          setBanners(normalizarBanners(remoto.banners, bannersIniciales));

          setTrabajos(Array.isArray(remoto.trabajos) ? remoto.trabajos : trabajosIniciales);

          setProductos(Array.isArray(remoto.productos) ? remoto.productos : productosIniciales);

          setImagenes(Array.isArray(remoto.imagenes) ? remoto.imagenes : []);
        } else {
          const estadoInicialCompartido = construirEstadoCompartido({
            configuracion,
            cuentasBancarias,
            banners,
            trabajos,
            productos,
            imagenes,
          });

          await supabase.from(APP_STATE_TABLE).upsert(
            {
              id: APP_STATE_ID,
              data: estadoInicialCompartido,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }

        if (activo) setEstadoCompartidoCargado(true);
      } catch (error) {
        console.error('Error cargando estado compartido ELANVISUAL:', error);
        if (activo) setEstadoCompartidoCargado(true);
      }
    };

    cargarEstadoCompartido();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !estadoCompartidoCargado) return;

    const timer = window.setTimeout(async () => {
      const estadoCompartido = construirEstadoCompartido({
        configuracion,
        cuentasBancarias,
        banners,
        trabajos,
        productos,
        imagenes,
      });

      try {
        const { error } = await supabase.from(APP_STATE_TABLE).upsert(
          {
            id: APP_STATE_ID,
            data: estadoCompartido,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        if (error) throw error;
      } catch (error) {
        console.error('Error guardando estado compartido ELANVISUAL:', error);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    estadoCompartidoCargado,
    configuracion,
    cuentasBancarias,
    banners,
    trabajos,
    productos,
    imagenes,
  ]);

  useEffect(() => {
    let activo = true;

    const cargarDatosSupabase = async () => {
      if (!supabase) {
        setSupabaseListo(false);
        return;
      }

      try {
        const { data: usersData, error: usersError } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        const users = asegurarUsuariosBase((usersData || []).map(mapUsuarioFromDb));

        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('unidad_negocio', 'ELANVISUAL')
          .order('created_at', { ascending: false });

        if (pedidosError) throw pedidosError;

        const pedidosRemotos = (pedidosData || []).map(mapPedidoFromDb);

        if (!activo) return;

                setUsuarios((prev) => {
          const locales = Array.isArray(prev) ? prev : [];
          const mapa = new Map();

          users.forEach((u) => {
            mapa.set(String(u.id || u.usuario || u.email), u);
          });

          locales.forEach((u) => {
            const key = String(u.id || u.usuario || u.email);
            const remoto = mapa.get(key);

            mapa.set(key, {
              ...(remoto || {}),
              ...u,
              password: u.password || remoto?.password || '',
              actualizadoEn: u.actualizadoEn || remoto?.actualizadoEn || '',
            });
          });

          return asegurarUsuariosBase(Array.from(mapa.values()));
        });
        setPedidos((prev) => unirPedidos(prev, pedidosRemotos));

        const usuarioActual = leerStorage('elanvisual_usuario_actual', null);
        if (usuarioActual?.id) {
          const usuarioSincronizado = users.find(
            (u) => u.id === usuarioActual.id || u.usuario === usuarioActual.usuario
          );
          if (usuarioSincronizado) {
            setUsuario(usuarioSincronizado);
          }
        }

        setSupabaseListo(true);
      } catch (error) {
        console.error('Error cargando datos desde Supabase:', error);
        setSupabaseListo(false);
      }
    };

    cargarDatosSupabase();

    return () => {
      activo = false;
    };
  }, []);

  const actualizarConfiguracion = (datos) => {
    const nuevaConfiguracion = {
      ...configuracionInicial,
      ...configuracion,
      ...datos,
      nombreSitio: datos?.nombreSitio || configuracion?.nombreSitio || 'ELANVISUAL',
      logoTexto:
        datos?.logoTexto ||
        datos?.nombreSitio ||
        configuracion?.logoTexto ||
        configuracion?.nombreSitio ||
        'ELANVISUAL',
      anticipoPorcentaje: Number(datos?.anticipoPorcentaje ?? configuracion?.anticipoPorcentaje ?? 60),
    };

    setConfiguracion(nuevaConfiguracion);
    guardarStorage('elanvisual_configuracion', nuevaConfiguracion);
    return { ok: true, configuracion: nuevaConfiguracion };
  };

  const crearImagen = (imagen) =>
    setImagenes((prev) => [
      {
        ...imagen,
        id: imagen.id || `img-${Date.now()}`,
        src: imagen.src || imagen.url || imagen.imagen || '',
        categoria: imagen.categoria || 'general',
        fecha: imagen.fecha || new Date().toISOString(),
      },
      ...prev,
    ]);

  const actualizarImagen = (imagenActualizada) =>
    setImagenes((prev) =>
      prev.map((img) =>
        String(img.id) === String(imagenActualizada.id)
          ? {
              ...img,
              ...imagenActualizada,
              src:
                imagenActualizada.src ||
                imagenActualizada.url ||
                imagenActualizada.imagen ||
                img.src ||
                '',
              categoria:
                imagenActualizada.categoria ||
                img.categoria ||
                'general',
            }
          : img
      )
    );

  const eliminarImagen = (id) =>
    setImagenes((prev) => prev.filter((img) => String(img.id) !== String(id)));

  const crearCliente = (datos) => {
    const slug = crearSlug(datos.nombre || datos.empresa || datos.codigo);
    const codigo = datos.codigo || `VEN${String(clientes.length + 1).padStart(3, '0')}`;

    const nuevo = {
      id: datos.id || `cliente-${Date.now()}`,
      codigo,
      nombre: datos.nombre || datos.empresa || '',
      empresa: datos.empresa || datos.nombre || '',
      slug,
      telefono: datos.telefono || datos.whatsapp || '',
      whatsapp: datos.whatsapp || datos.telefono || '',
      email: datos.email || datos.correo || '',
      direccion: datos.direccion || '',
      responsable: datos.responsable || '',
      origen: datos.origen || 'vendedor',
      activo: datos.activo !== false,
      createdAt: datos.createdAt || new Date().toISOString(),
    };

    setClientes((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const actualizarCliente = (datosCliente) => {
    const slug = datosCliente.slug || crearSlug(datosCliente.nombre || datosCliente.empresa || datosCliente.codigo);
    const actualizado = { ...datosCliente, slug };

    setClientes((prev) => prev.map((c) => (c.id === actualizado.id ? { ...c, ...actualizado } : c)));

    if (clienteActual?.id === actualizado.id) {
      setClienteActual((prev) => ({ ...prev, ...actualizado }));
    }
  };

  const eliminarCliente = (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setUsuarios((prev) => prev.map((u) => (u.clienteId === id ? { ...u, clienteId: '', activo: false } : u)));
    if (clienteActual?.id === id) setClienteActual(null);
  };

  const vendedores = clientes;
  const setVendedores = setClientes;
  const vendedor = clienteActual;
  const setVendedor = setClienteActual;
  const crearVendedor = crearCliente;
  const actualizarVendedor = actualizarCliente;
  const eliminarVendedor = eliminarCliente;

  const veterinarias = clientes;
  const setVeterinarias = setClientes;
  const veterinaria = clienteActual;
  const setVeterinaria = setClienteActual;
  const crearVeterinaria = crearCliente;
  const actualizarVeterinaria = actualizarCliente;
  const eliminarVeterinaria = eliminarCliente;

  const agregar = (p) =>
    setCarrito((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      return ex
        ? prev.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...prev, { ...p, cantidad: 1 }];
    });

  const cambiarCantidad = (id, cantidad) =>
    setCarrito((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Number(cantidad) || 1) } : i))
    );

  const quitar = (id) => setCarrito((prev) => prev.filter((i) => i.id !== id));
  const limpiar = () => setCarrito([]);
  const resumen = useMemo(() => resumenCarrito(carrito), [carrito]);

  const crearPedidoTransferencia = ({ cliente, pagoTipo = 'anticipo' }) => {
    if (!whatsappValidoNicaragua(cliente?.whatsapp || cliente?.telefono)) {
      throw new Error('whatsapp_invalido');
    }

    const clienteNormalizado = {
      ...cliente,
      whatsapp: normalizarWhatsAppNicaragua(cliente?.whatsapp || cliente?.telefono),
      telefono: normalizarWhatsAppNicaragua(cliente?.telefono || cliente?.whatsapp),
    };

    const numero = `SOL-${String(Date.now()).slice(-6)}`;
    const anticipoPorcentaje = Number(configuracion.anticipoPorcentaje || 60);
    const montoSolicitado =
      pagoTipo === 'total' ? resumen.total : resumen.total * (anticipoPorcentaje / 100);
    const origenComercial = clienteActual ? { ...clienteActual } : null;

    const pedido = {
      id: `pedido-${Date.now()}`,
      numero,
      codigoSeguimiento: '',
      cliente: clienteNormalizado,
      origenComercial,
      vendedor: origenComercial,
      veterinaria: null,
      items: carrito,
      origenComercialId: origenComercial?.id || '',
      vendedorId: origenComercial?.id || '',
      veterinariaId: '',
      origenComercialCodigo: origenComercial?.codigo || '',
      vendedorCodigo: origenComercial?.codigo || '',
      veterinariaCodigo: '',
      resumen: {
        ...resumen,
        comision: 0,
      },
      pagoTipo,
      anticipoPorcentaje,
      montoSolicitado,
      anticipoRequerido: resumen.total * (anticipoPorcentaje / 100),
      anticipoRecibido: 0,
      saldoPendiente: resumen.total,
      estado: 'pendiente_pago',
      estadoProduccion: 'pendiente',
      pagoEstado: 'pendiente_transferencia',
      seguimientoEstado: 'pendiente_pago',
      comisionEstado: 'no_generada',
      ordenTrabajo: {
        codigoOT: `OT-${String(Date.now()).slice(-6)}`,
        responsable: '',
        observaciones: '',
        fecha: new Date().toISOString(),
        estadoProduccion: 'pendiente',
        evidencias: { inicial: '', proceso: '', terminado: '', entrega: '' },
      },
      historial: [
        {
          estado: 'pendiente_pago',
          fecha: new Date().toISOString(),
          nota: 'Solicitud creada desde app ELANVISUAL.',
        },
      ],
      createdAt: new Date().toISOString(),
      fechaEstimada: '',
    };

    setPedidos((prev) => [pedido, ...prev]);

    if (supabase) {
      supabase
        .from('pedidos')
        .insert(mapPedidoToDb(pedido))
        .select('*')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error guardando solicitud en Supabase:', error);
            window.alert(
              'La solicitud fue creada y el WhatsApp sali, pero no se pudo guardar en Supabase. Revis la tabla pedidos.'
            );
            return;
          }

          const pedidoGuardado = mapPedidoFromDb(data);
          setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, ...pedidoGuardado } : p)));
        });
    }

       return pedido;
  };

  const crearPedidoOperativo = (pedidoBase) => {
    const fecha = pedidoBase.fecha || pedidoBase.createdAt || new Date().toISOString();
    const numero = pedidoBase.numero || pedidoBase.numeroPedido || `PED-${String(Date.now()).slice(-6)}`;
    const numeroOT = pedidoBase.numeroOT || pedidoBase.ordenTrabajo?.codigoOT || `OT-${String(Date.now()).slice(-6)}`;

    const clienteNormalizado = {
      nombre:
        pedidoBase.cliente?.nombre ||
        pedidoBase.cliente?.empresa ||
        pedidoBase.cliente?.contacto ||
        'Cliente',
      empresa: pedidoBase.cliente?.empresa || pedidoBase.cliente?.nombre || '',
      contacto: pedidoBase.cliente?.contacto || '',
      whatsapp: pedidoBase.cliente?.whatsapp || pedidoBase.cliente?.telefono || '',
      telefono: pedidoBase.cliente?.telefono || pedidoBase.cliente?.whatsapp || '',
      correo: pedidoBase.cliente?.correo || pedidoBase.cliente?.email || '',
      email: pedidoBase.cliente?.email || pedidoBase.cliente?.correo || '',
    };

    const items = Array.isArray(pedidoBase.items) ? pedidoBase.items : [];
    const total = Number(pedidoBase.resumen?.total || pedidoBase.total || 0);
    const costoProduccionEstimado = items.reduce(
      (acc, item) =>
        acc +
        Number(item.costoProduccion || 0) +
        (Array.isArray(item.accesoriosProduccion)
          ? item.accesoriosProduccion.reduce((suma, accItem) => suma + Number(accItem.total || accItem.precio || 0), 0)
          : 0),
      0
    );
    const vendedorReferencia =
      pedidoBase.vendedor ||
      pedidoBase.origenComercial ||
      obtenerReferenciaVendedorElanvisual(usuarios, usuario);
    const comisionInicial = crearComisionInicialElanvisual({
      total,
      costoProduccion: costoProduccionEstimado,
      vendedor: vendedorReferencia,
    });
    const anticipo = Number(pedidoBase.resumen?.anticipo || total * 0.6);
    const saldo = Number(pedidoBase.resumen?.saldo || Math.max(total - anticipo, 0));

    const pedido = {
      ...pedidoBase,
      vendedor: vendedorReferencia || pedidoBase.vendedor || null,
      vendedorId: vendedorReferencia?.id || pedidoBase.vendedorId || '',
      vendedorNombre: vendedorReferencia?.nombre || pedidoBase.vendedorNombre || '',
      codigoVendedor: vendedorReferencia?.codigo || pedidoBase.codigoVendedor || '',
      costos: {
        ...(pedidoBase.costos || {}),
        produccionEstimada: costoProduccionEstimado,
      },
      comisiones: pedidoBase.comisiones || comisionInicial,
      utilidad: pedidoBase.utilidad || {
        utilidadRealEstimada: comisionInicial.utilidadRealEstimada,
        fondoComunitario: comisionInicial.fondoComunitario,
        direccionGeneral: comisionInicial.direccionGeneral,
        comisionVendedor: comisionInicial.comisionVendedor,
        fondoIncentivoVendedor: comisionInicial.fondoIncentivoVendedor,
        utilidadElanvisual: comisionInicial.utilidadElanvisual,
      },
      id: pedidoBase.id || `pedido-${Date.now()}`,
      numero,
      numeroPedido: pedidoBase.numeroPedido || numero,
      numeroOT,
      codigoSeguimiento: pedidoBase.codigoSeguimiento || '',
      fecha,
      createdAt: pedidoBase.createdAt || fecha,
      cliente: clienteNormalizado,
      items,
      resumen: {
        subtotal: Number(pedidoBase.resumen?.subtotal || 0),
        descuento: Number(pedidoBase.resumen?.descuento || 0),
        total,
        anticipo,
        saldo,
        comision: Number(pedidoBase.resumen?.comision || 0),
      },
      estado: pedidoBase.estado || 'Pedido creado',
      estadoProduccion:
        pedidoBase.estadoProduccion ||
        pedidoBase.produccion?.estado ||
        pedidoBase.ordenTrabajo?.estadoProduccion ||
        'pendiente',
      pagoEstado: pedidoBase.pagoEstado || pedidoBase.pagos?.estadoPago || 'Pendiente anticipo',
      seguimientoEstado: pedidoBase.seguimientoEstado || 'pendiente',
      comisionEstado: pedidoBase.comisionEstado || 'no_generada',
      anticipoRequerido: anticipo,
      anticipoRecibido: Number(pedidoBase.anticipoRecibido || pedidoBase.pagos?.anticipoRecibido || 0),
      saldoPendiente: Number(pedidoBase.saldoPendiente || saldo),
      ordenTrabajo: {
        codigoOT: numeroOT,
        pedido: numero,
        cliente: clienteNormalizado.nombre,
        origenComercial: pedidoBase.vendedor?.nombre || '',
        producto: items.map((item) => item.descripcion || item.nombre).join(', '),
        cantidad: items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
        responsable: pedidoBase.ordenTrabajo?.responsable || '',
        observaciones:
          pedidoBase.ordenTrabajo?.observaciones ||
          pedidoBase.produccion?.observaciones ||
          '',
        fecha,
        estadoProduccion:
          pedidoBase.estadoProduccion ||
          pedidoBase.produccion?.estado ||
          'pendiente',
        evidencias: {
          inicial: '',
          diseno: '',
          proceso: '',
          instalacion: '',
          entrega: '',
          ...(pedidoBase.ordenTrabajo?.evidencias || {}),
        },
      },
      historial: Array.isArray(pedidoBase.historial)
        ? pedidoBase.historial
        : [
            {
              estado: pedidoBase.estado || 'Pedido creado',
              fecha,
              nota: 'Pedido operativo creado desde Cotizador Visual.',
            },
          ],
    };

    setPedidos((prev) => [pedido, ...prev.filter((p) => p.id !== pedido.id)]);

    return pedido;
  };

  const actualizarPedido = (pedido) => {
    const pedidoActualizado = { ...pedido };

    setPedidos((prev) => prev.map((p) => (p.id === pedidoActualizado.id ? { ...p, ...pedidoActualizado } : p)));

    if (supabase && esUuid(pedidoActualizado.id)) {
      supabase
        .from('pedidos')
        .update(mapPedidoToDb(pedidoActualizado))
        .eq('id', pedidoActualizado.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error actualizando solicitud en Supabase:', error);
            window.alert('No se pudo actualizar la solicitud en Supabase.');
          }
        });
    }
  };

  const crearOrdenTrabajoBase = (pedido) => ({
    codigoOT:
      pedido?.ordenTrabajo?.codigoOT ||
      `OT-${String(pedido?.id || Date.now()).replace(/[^0-9]/g, '').slice(-6) || Date.now()}`,
    pedido: pedido?.codigoSeguimiento || pedido?.numero || '',
    cliente: pedido?.cliente?.nombre || '',
    origenComercial:
      pedido?.origenComercial?.nombre ||
      pedido?.origenComercial?.empresa ||
      pedido?.vendedor?.nombre ||
      pedido?.vendedor?.empresa ||
      '',
    producto: (pedido?.items || []).map((i) => i.nombre).join(', '),
    cantidad: (pedido?.items || []).reduce((a, i) => a + Number(i.cantidad || 0), 0),
    responsable: pedido?.ordenTrabajo?.responsable || '',
    observaciones: pedido?.ordenTrabajo?.observaciones || '',
    fecha: pedido?.ordenTrabajo?.fecha || new Date().toISOString(),
    estadoProduccion: pedido?.estadoProduccion || 'pendiente',
    evidencias: {
      inicial: '',
      proceso: '',
      terminado: '',
      entrega: '',
      ...(pedido?.ordenTrabajo?.evidencias || {}),
    },
  });

  const confirmarAnticipo = (pedido, pagoTipoConfirmado = pedido.pagoTipo || 'anticipo') => {
    const esTotal = pagoTipoConfirmado === 'total';
    const codigo = pedido.codigoSeguimiento || generarCodigoSeguimiento();
    const anticipoRecibido = esTotal
      ? pedido.resumen.total
      : pedido.anticipoRequerido || pedido.resumen.total * 0.6;
    const saldoPendiente = Math.max(0, pedido.resumen.total - anticipoRecibido);

    actualizarPedido({
      ...pedido,
      codigoSeguimiento: codigo,
      pagoTipo: pagoTipoConfirmado,
      anticipoRecibido,
      saldoPendiente,
      estado: 'pago_validado',
      estadoProduccion: 'produccion',
      pagoEstado: esTotal ? 'pago_total_confirmado' : 'anticipo_confirmado',
      seguimientoEstado: 'produccion',
      comisionEstado: 'pendiente_entrega',
      ordenTrabajo: crearOrdenTrabajoBase({
        ...pedido,
        codigoSeguimiento: codigo,
        estadoProduccion: 'produccion',
      }),
      historial: [
        ...(pedido.historial || []),
        {
          estado: esTotal ? 'pago_total_confirmado' : 'anticipo_confirmado',
          fecha: new Date().toISOString(),
          nota: 'Pago validado por administracin.',
        },
      ],
    });

    return codigo;
  };

  const cambiarEstadoProduccion = (pedido, estadoProduccion) => {
    const entregado = estadoProduccion === 'entregado';
    const ordenTrabajo = {
      ...crearOrdenTrabajoBase(pedido),
      ...(pedido.ordenTrabajo || {}),
      estadoProduccion,
    };

    actualizarPedido({
      ...pedido,
      estado: entregado ? 'entregado' : pedido.estado,
      estadoProduccion,
      seguimientoEstado: estadoProduccion,
      ordenTrabajo,
      comisionEstado: entregado ? 'pendiente' : pedido.comisionEstado,
      historial: [
        ...(pedido.historial || []),
        {
          estado: estadoProduccion,
          fecha: new Date().toISOString(),
          nota: etiquetasEstado[estadoProduccion] || estadoProduccion,
        },
      ],
    });
  };

  const actualizarOrdenTrabajo = (pedido, datosOrden) => {
    const ordenTrabajo = {
      ...crearOrdenTrabajoBase(pedido),
      ...(pedido.ordenTrabajo || {}),
      ...datosOrden,
      evidencias: {
        ...crearOrdenTrabajoBase(pedido).evidencias,
        ...(pedido.ordenTrabajo?.evidencias || {}),
        ...(datosOrden.evidencias || {}),
      },
    };

    actualizarPedido({
      ...pedido,
      ordenTrabajo,
      estadoProduccion: ordenTrabajo.estadoProduccion || pedido.estadoProduccion || 'pendiente',
      seguimientoEstado: ordenTrabajo.estadoProduccion || pedido.seguimientoEstado,
    });
  };

  const guardarEvidenciaProduccion = (pedido, tipo, imagen) => {
    actualizarOrdenTrabajo(pedido, {
      evidencias: {
        ...(pedido.ordenTrabajo?.evidencias || {}),
        [tipo]: imagen,
      },
    });
  };

  const buscarPedidoSeguimiento = ({ codigo, whatsapp }) => {
    const c = String(codigo || '').trim().toUpperCase();
    const w = String(whatsapp || '').replace(/[^0-9]/g, '');

    return pedidos.find(
      (p) =>
        String(p.codigoSeguimiento || '').toUpperCase() === c &&
        String(p.cliente?.whatsapp || '').replace(/[^0-9]/g, '').endsWith(w.slice(-8))
    );
  };

  const login = ({ email, password }) => {
    const acceso = normalizarUsuario(email);
    const clave = String(password || '').trim();

    const usuarioEncontrado = usuarios.find((u) => {
      const usuarioNormalizado = normalizarUsuario(u.usuario);
      const emailNormalizado = normalizarUsuario(u.email);

      return (
        u.activo !== false &&
        (usuarioNormalizado === acceso || emailNormalizado === acceso) &&
        String(u.password || '').trim() === clave
      );
    });

    if (!usuarioEncontrado) return { ok: false };

    setUsuario(usuarioEncontrado);
    return {
      ok: true,
      rol: usuarioEncontrado.rol,
      usuario: usuarioEncontrado,
      supabaseListo,
    };
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('elanvisual_usuario_actual');
  };

  const crearUsuario = (datos) => {
    const usuarioLimpio = normalizarUsuario(datos.usuario);
    const emailLimpio = normalizarUsuario(datos.email);

    const existe = usuarios.some((u) => {
      const mismoUsuario = usuarioLimpio && normalizarUsuario(u.usuario) === usuarioLimpio;
      const mismoEmail = emailLimpio && normalizarUsuario(u.email) === emailLimpio;
      return mismoUsuario || mismoEmail;
    });

    if (existe) return { ok: false, error: 'usuario_duplicado' };

    const tempId = `user-temp-${Date.now()}`;
    const nuevo = {
      id: tempId,
      nombre: datos.nombre || usuarioLimpio,
      usuario: usuarioLimpio,
      email: emailLimpio,
      password: String(datos.password || 'Temporal2026#').trim(),
      rol: normalizarRol(datos.rol || 'produccion'),
      clienteId: datos.clienteId || '',
      activo: datos.activo !== false,
      debeCambiarPassword: datos.debeCambiarPassword === true,
      creadoEn: new Date().toISOString(),
    };

    setUsuarios((prev) => [nuevo, ...prev]);

    if (supabase) {
      supabase
        .from('usuarios')
        .insert(mapUsuarioToDb(nuevo))
        .select('*')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error creando usuario en Supabase:', error);
            setUsuarios((prev) => prev.filter((u) => u.id !== tempId));
            window.alert('No se pudo guardar el usuario en Supabase. Revis duplicados.');
            return;
          }

          const creado = mapUsuarioFromDb(data);
          setUsuarios((prev) => prev.map((u) => (u.id === tempId ? creado : u)));
        });
    }

    return { ok: true, usuario: nuevo };
  };

  const actualizarUsuario = (usuarioActualizado) => {
    let actualizadoFinal = null;

    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id !== usuarioActualizado.id) return u;

        actualizadoFinal = {
          ...u,
          ...usuarioActualizado,
          usuario: normalizarUsuario(usuarioActualizado.usuario || u.usuario),
          email: normalizarUsuario(usuarioActualizado.email || u.email),
          password: Object.prototype.hasOwnProperty.call(usuarioActualizado, 'password')
            ? String(usuarioActualizado.password || '').trim()
            : u.password,
          rol: normalizarRol(usuarioActualizado.rol || u.rol),
          clienteId: usuarioActualizado.clienteId || u.clienteId || '',
          activo: usuarioActualizado.activo !== false,
        };

        return actualizadoFinal;
      })
    );

    if (usuario?.id === usuarioActualizado.id && actualizadoFinal) setUsuario(actualizadoFinal);

    if (supabase && esUuid(usuarioActualizado.id)) {
      const datosDb = mapUsuarioToDb({
        ...usuarioActualizado,
        password: Object.prototype.hasOwnProperty.call(usuarioActualizado, 'password')
          ? String(usuarioActualizado.password || '').trim()
          : usuarios.find((u) => u.id === usuarioActualizado.id)?.password || '',
      });

      supabase
        .from('usuarios')
        .update(datosDb)
        .eq('id', usuarioActualizado.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error actualizando usuario en Supabase:', error);
            window.alert('No se pudo actualizar el usuario en Supabase.');
          }
        });
    }
  };

  const eliminarUsuario = (id) => {
    setUsuarios((prev) => {
      const usuarioEliminar = prev.find((u) => u.id === id);
      const adminsActivos = prev.filter((u) => u.rol === 'admin' && u.activo !== false);

      if (usuarioEliminar?.rol === 'admin' && adminsActivos.length <= 1) return prev;

      return prev.filter((u) => u.id !== id);
    });

    if (usuario?.id === id) setUsuario(null);

    if (supabase && esUuid(id)) {
      supabase
        .from('usuarios')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Error eliminando usuario en Supabase:', error);
            window.alert('No se pudo eliminar el usuario en Supabase.');
          }
        });
    }
  };

  const crearProveedor = (datos) => {
    const nuevo = { ...datos, id: datos.id || `prov-${Date.now()}`, activo: datos.activo !== false, creadoEn: new Date().toISOString() };
    setProveedores((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const actualizarProveedor = (datos) => {
    const actualizado = {
      ...datos,
      actualizadoEn: new Date().toISOString(),
      calidad: Number(datos.calidad || 5),
      cumplimiento: Number(datos.cumplimiento || 5),
      precio: Number(datos.precio || 5),
      tiempo: Number(datos.tiempo || 5),
      diasCredito: Number(datos.diasCredito || 0),
      activo: datos.activo !== false,
      preferido: datos.preferido === true,
    };

    setProveedores((prev) =>
      prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
    );

    return actualizado;
  };

  const eliminarProveedor = (id) => {
    setProveedores((prev) => prev.filter((p) => p.id !== id));
    setProductosProveedor((prev) => prev.filter((p) => p.proveedorId !== id));
  };

  const crearProductoProveedor = (datos) => {
    const proveedor = proveedores.find((p) => p.id === datos.proveedorId);
    const nuevo = {
      ...datos,
      id: datos.id || `prov-prod-${Date.now()}`,
      proveedorNombre: proveedor?.nombre || '',
      costo: Number(datos.costo || 0),
      creadoEn: new Date().toISOString(),
    };
    setProductosProveedor((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const eliminarProductoProveedor = (id) => setProductosProveedor((prev) => prev.filter((p) => p.id !== id));

  const crearSolicitudProveedor = (pedido) => {
    const codigo = `RC-${String(Date.now()).slice(-6)}`;
    const solicitud = {
      id: `rc-${Date.now()}`,
      codigo,
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido || pedido.numero || '',
      numeroOT: pedido.numeroOT || pedido.ordenTrabajo?.codigoOT || '',
      cliente: pedido.cliente?.empresa || pedido.cliente?.nombre || pedido.cliente?.contacto || '',
      items: pedido.items || [],
      estado: 'pendiente_respuesta',
      respuestas: [],
      creadoEn: new Date().toISOString(),
    };

    setCotizacionesProveedor((prev) => [solicitud, ...prev]);

    actualizarPedido({
      ...pedido,
      costeoReal: {
        ...(pedido.costeoReal || {}),
        solicitudProveedorId: solicitud.id,
        codigoRecotizacion: codigo,
        estado: 'recotizando',
      },
    });

    return solicitud;
  };

  const registrarRespuestaProveedor = ({ solicitudId, proveedorId, monto, tiempoEntrega, nota }) => {
    let actualizada = null;

    setCotizacionesProveedor((prev) =>
      prev.map((s) => {
        if (s.id !== solicitudId) return s;
        const proveedor = proveedores.find((p) => p.id === proveedorId);
        actualizada = {
          ...s,
          respuestas: [
            ...(s.respuestas || []),
            {
              id: `resp-${Date.now()}`,
              proveedorId,
              proveedorNombre: proveedor?.nombre || '',
              monto: Number(monto || 0),
              tiempoEntrega: tiempoEntrega || '',
              nota: nota || '',
              fecha: new Date().toISOString(),
            },
          ],
        };
        return actualizada;
      })
    );

    return actualizada;
  };

  const asignarProveedorPedido = ({ pedidoId, proveedorId, costoReal, tiempoEntrega, nota }) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return null;

    const proveedor = proveedores.find((p) => p.id === proveedorId);
    const total = Number(pedido.resumen?.total || pedido.total || 0);
    const costo = Number(costoReal || 0);
    const utilidadReal = Math.max(total - costo, 0);

    const actualizado = {
      ...pedido,
      costos: {
        ...(pedido.costos || {}),
        realProveedor: costo,
      },
      costeoReal: {
        ...(pedido.costeoReal || {}),
        estado: 'proveedor_asignado',
        proveedorId,
        proveedorNombre: proveedor?.nombre || '',
        costoReal: costo,
        tiempoEntrega,
        nota,
        actualizadoEn: new Date().toISOString(),
      },
      utilidad: {
        ...(pedido.utilidad || {}),
        utilidadReal,
      },
    };

    actualizarPedido(actualizado);
    return actualizado;
  };

  const areaInventario = (item = {}) => {
    const ancho = Number(item.ancho || 0);
    const largo = Number(item.largo || 0);
    const cantidad = Number(item.cantidad || 1);
    if (ancho > 0 && largo > 0) return ancho * largo * cantidad;
    return cantidad;
  };

  const crearInventarioReal = (datos) => {
    const area = areaInventario(datos);
    const nuevo = {
      ...datos,
      id: datos.id || `inv-${Date.now()}`,
      ancho: Number(datos.ancho || 0),
      largo: Number(datos.largo || 0),
      cantidad: Number(datos.cantidad || 1),
      costoCompra: Number(datos.costoCompra || 0),
      costoDisponible: Number(datos.costoCompra || 0),
      estado: datos.estado || 'Disponible',
      creadoEn: new Date().toISOString(),
      historial: [
        {
          tipo: 'entrada',
          fecha: new Date().toISOString(),
          area,
          nota: datos.observaciones || 'Entrada de inventario.',
        },
      ],
    };

    setInventarioReal((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const actualizarInventarioReal = (itemActualizado) => {
    setInventarioReal((prev) =>
      prev.map((item) =>
        item.id === itemActualizado.id
          ? {
              ...item,
              ...itemActualizado,
              ancho: Number(itemActualizado.ancho || 0),
              largo: Number(itemActualizado.largo || 0),
              cantidad: Number(itemActualizado.cantidad || 1),
              costoCompra: Number(itemActualizado.costoCompra || 0),
              costoDisponible: Number(
                itemActualizado.costoDisponible ?? itemActualizado.costoCompra ?? 0
              ),
              actualizadoEn: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const eliminarInventarioReal = (id) => setInventarioReal((prev) => prev.filter((i) => i.id !== id));

  const reservarInventarioReal = ({ id, ancho, largo, cantidad = 1, ot = '', nota = '' }) => {
    setInventarioReal((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          estado: 'Reservado',
          otReserva: ot,
          reserva: { ancho: Number(ancho || 0), largo: Number(largo || 0), cantidad: Number(cantidad || 1), ot, nota },
          historial: [
            ...(item.historial || []),
            { tipo: 'reserva', fecha: new Date().toISOString(), nota: nota || `Reservado para ${ot || 'OT'}` },
          ],
        };
      })
    );
  };

  const liberarReservaInventarioReal = (id) => {
    setInventarioReal((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          estado: 'Disponible',
          otReserva: '',
          reserva: null,
          historial: [
            ...(item.historial || []),
            { tipo: 'liberacion', fecha: new Date().toISOString(), nota: 'Reserva liberada.' },
          ],
        };
      })
    );
  };

  const consumirInventarioReal = ({ id, ancho, largo, cantidad = 1, ot = '', nota = '' }) => {
    setInventarioReal((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      const anchoUso = Number(ancho || item.ancho || 0);
      const largoUso = Number(largo || item.largo || 0);
      const cantidadUso = Number(cantidad || 1);
      const areaOriginal = areaInventario(item);
      const areaUsada = anchoUso > 0 && largoUso > 0 ? anchoUso * largoUso * cantidadUso : cantidadUso;
      const proporcion = areaOriginal > 0 ? Math.min(areaUsada / areaOriginal, 1) : 1;
      const costoUsado = Number(item.costoDisponible ?? item.costoCompra ?? 0) * proporcion;
      const areaRestante = Math.max(areaOriginal - areaUsada, 0);
      const costoRestante = Math.max(Number(item.costoDisponible ?? item.costoCompra ?? 0) - costoUsado, 0);

      const consumido = {
        ...item,
        estado: 'Consumido',
        consumidoEn: new Date().toISOString(),
        otConsumo: ot,
        areaConsumida: areaUsada,
        costoConsumido: costoUsado,
        historial: [
          ...(item.historial || []),
          { tipo: 'consumo', fecha: new Date().toISOString(), area: areaUsada, costo: costoUsado, nota: nota || `Consumido para ${ot || 'OT'}` },
        ],
      };

      const salida = prev.map((i) => (i.id === id ? consumido : i));

      if (areaRestante > 0.05 && item.ancho > 0 && item.largo > 0) {
        const retazo = {
          ...item,
          id: `ret-${Date.now()}`,
          tipo: 'Retazo',
          cantidad: 1,
          ancho: Number(item.ancho || 0),
          largo: Number((areaRestante / Math.max(Number(item.ancho || 1), 0.01)).toFixed(2)),
          costoCompra: costoRestante,
          costoDisponible: costoRestante,
          estado: 'Disponible',
          origen: `Retazo de ${item.material}`,
          otOrigen: ot,
          creadoEn: new Date().toISOString(),
          historial: [
            { tipo: 'retazo', fecha: new Date().toISOString(), area: areaRestante, costo: costoRestante, nota: `Retazo generado por consumo de ${ot || 'OT'}` },
          ],
        };
        return [retazo, ...salida];
      }

      return salida;
    });
  };

  const actualizarProducto = (producto) =>
    setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, ...producto } : p)));

  const crearProducto = (producto) => {
    const id = producto.id || crearSlug(producto.nombre);
    setProductos((prev) => [{ ...producto, id, precio: Number(producto.precio || 0), activo: true }, ...prev]);
  };

  const eliminarProducto = (id) => setProductos((prev) => prev.filter((p) => p.id !== id));

  const crearBanner = (banner) =>
    setBanners((prev) => {
      const nuevoBanner = normalizarBanner({
        ...banner,
        id: `banner-${Date.now()}`,
        activo: banner.activo ?? true,
        createdAt: Date.now(),
        actualizadoEn: Date.now(),
      });

      const bannersPrevios = normalizarBanners(prev, []);

      if (nuevoBanner.activo && nuevoBanner.ubicacion === 'hero-principal') {
        return [
          nuevoBanner,
          ...bannersPrevios.map((b) =>
            b.ubicacion === 'hero-principal' ? { ...b, activo: false } : b
          ),
        ];
      }

      return [nuevoBanner, ...bannersPrevios];
    });

  const actualizarBanner = (banner) =>
    setBanners((prev) => {
      const bannerNormalizado = normalizarBanner({
        ...banner,
        actualizadoEn: Date.now(),
      });

      return normalizarBanners(prev, []).map((b) => {
        if (
          bannerNormalizado.activo &&
          bannerNormalizado.ubicacion === 'hero-principal' &&
          b.ubicacion === 'hero-principal' &&
          b.id !== bannerNormalizado.id
        ) {
          return { ...b, activo: false };
        }

        if (b.id === bannerNormalizado.id) {
          return {
            ...b,
            ...bannerNormalizado,
          };
        }

        return b;
      });
    });

  const eliminarBanner = (id) => setBanners((prev) => prev.filter((b) => b.id !== id));

  const crearTrabajo = (trabajo) =>
    setTrabajos((prev) => [{ ...trabajo, id: `trabajo-${Date.now()}`, activo: true }, ...prev]);

  const actualizarTrabajo = (trabajo) =>
    setTrabajos((prev) => prev.map((t) => (t.id === trabajo.id ? { ...t, ...trabajo } : t)));

  const eliminarTrabajo = (id) => setTrabajos((prev) => prev.filter((t) => t.id !== id));

  const crearCuentaBancaria = (cuenta) =>
    setCuentasBancarias((prev) => [
      { ...cuenta, id: `cta-${Date.now()}`, activa: true, visible: true },
      ...prev,
    ]);

  const actualizarCuentaBancaria = (cuenta) =>
    setCuentasBancarias((prev) => prev.map((c) => (c.id === cuenta.id ? { ...c, ...cuenta } : c)));

  const eliminarCuentaBancaria = (id) =>
    setCuentasBancarias((prev) => prev.filter((c) => c.id !== id));
const calcularCostoReal = ({
  otId,
  costoInventario = 0,
  costoProveedor = 0,
  costoImpresion = 0,
  costoEstructura = 0,
  costoTransporte = 0,
  costoInstalacion = 0,
  costoAdministracion = 0,
}) => {
  const costoTotalReal =
    Number(costoInventario) +
    Number(costoProveedor) +
    Number(costoImpresion) +
    Number(costoEstructura) +
    Number(costoTransporte) +
    Number(costoInstalacion) +
    Number(costoAdministracion);

  const registro = {
    id: `cost-${Date.now()}`,
    otId,
    fecha: new Date().toISOString(),
    costoInventario,
    costoProveedor,
    costoImpresion,
    costoEstructura,
    costoTransporte,
    costoInstalacion,
    costoAdministracion,
    costoTotalReal,
  };

  setCostosReales((prev) => [registro, ...prev]);

  return registro;
};

const calcularUtilidadReal = ({
  otId,
  ventaCliente,
  costoReal,
}) => {
  const utilidadReal =
    Number(ventaCliente) - Number(costoReal);

  const porcentajeUtilidad =
    ventaCliente > 0
      ? (utilidadReal / ventaCliente) * 100
      : 0;

  const registro = {
    id: `util-${Date.now()}`,
    otId,
    ventaCliente,
    costoReal,
    utilidadReal,
    porcentajeUtilidad,
    fecha: new Date().toISOString(),
  };

  setUtilidadesReales((prev) => [registro, ...prev]);

  return registro;
};

const distribuirUtilidadReal = ({
  utilidadReal,
  vendedorId = '',
  vendedorNombre = '',
}) => {
  const vendedor = utilidadReal * 0.40;

  const bloqueElan = utilidadReal * 0.60;

  const incentivo = bloqueElan * 0.05;
  const comunidad = bloqueElan * 0.05;
  const direccion = bloqueElan * 0.05;

  const utilidadElan =
    bloqueElan -
    incentivo -
    comunidad -
    direccion;

  return {
    vendedor,
    incentivo,
    comunidad,
    direccion,
    utilidadElan,
    vendedorId,
    vendedorNombre,
  };
};

const generarComisionAutomatica = ({
  otId,
  utilidadReal,
  vendedorId,
  vendedorNombre,
}) => {
  const datos = distribuirUtilidadReal({
    utilidadReal,
    vendedorId,
    vendedorNombre,
  });

  const comision = {
    id: `com-${Date.now()}`,
    otId,
    vendedorId,
    vendedorNombre,
    utilidadReal,
    comision: datos.vendedor,
    estado: 'Pendiente',
    fecha: new Date().toISOString(),
  };

  setComisionesAutomaticas((prev) => [comision, ...prev]);

  setFondoComunidad((prev) => [
    {
      id: `fc-${Date.now()}`,
      otId,
      monto: datos.comunidad,
      fecha: new Date().toISOString(),
    },
    ...prev,
  ]);

  setFondoIncentivo((prev) => [
    {
      id: `fi-${Date.now()}`,
      otId,
      vendedorId,
      monto: datos.incentivo,
      fecha: new Date().toISOString(),
    },
    ...prev,
  ]);

  setFondoDireccion((prev) => [
    {
      id: `fd-${Date.now()}`,
      otId,
      monto: datos.direccion,
      fecha: new Date().toISOString(),
    },
    ...prev,
  ]);

  return comision;
};

  return (
    <AppContext.Provider
      value={{
        configuracion,
        setConfiguracion,
        actualizarConfiguracion,

        cuentasBancarias,
        crearCuentaBancaria,
        actualizarCuentaBancaria,
        eliminarCuentaBancaria,

        banners,
        crearBanner,
        actualizarBanner,
        eliminarBanner,

        trabajos,
        crearTrabajo,
        actualizarTrabajo,
        eliminarTrabajo,

        productos,
        setProductos,
        actualizarProducto,
        crearProducto,
        eliminarProducto,

        imagenes,
        crearImagen,
        actualizarImagen,
        eliminarImagen,

        clientes,
        setClientes,
        crearCliente,
        actualizarCliente,
        eliminarCliente,
        clienteActual,
        setClienteActual,

        vendedores,
        setVendedores,
        crearVendedor,
        actualizarVendedor,
        eliminarVendedor,
        vendedor,
        setVendedor,

        veterinarias,
        setVeterinarias,
        crearVeterinaria,
        actualizarVeterinaria,
        eliminarVeterinaria,
        veterinaria,
        setVeterinaria,

        carrito,
        agregar,
        cambiarCantidad,
        quitar,
        limpiar,
        resumen,

         pedidos,
        crearPedidoTransferencia,
        crearPedidoOperativo,
        actualizarPedido,
        confirmarAnticipo,
        cambiarEstadoProduccion,
        actualizarOrdenTrabajo,
        guardarEvidenciaProduccion,
        buscarPedidoSeguimiento,
                proveedores,
        productosProveedor,
        cotizacionesProveedor,
        crearProveedor,
        actualizarProveedor,
        eliminarProveedor,
        crearProductoProveedor,
        actualizarProductoProveedor,
        eliminarProductoProveedor,

        usuario,
        login,
        logout,

        usuarios,
        crearUsuario,
        actualizarUsuario,
        eliminarUsuario,

        rolesSistema,

        inventarioReal,
        crearInventarioReal,
        actualizarInventarioReal,
        eliminarInventarioReal,
        reservarInventarioReal,
        consumirInventarioReal,
        liberarReservaInventarioReal,

        costosReales,
        utilidadesReales,
        comisionesAutomaticas,

        fondoComunidad,
        fondoIncentivo,
        fondoDireccion,

        calcularCostoReal,
        calcularUtilidadReal,
        distribuirUtilidadReal,
        generarComisionAutomatica,
        supabaseListo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);













