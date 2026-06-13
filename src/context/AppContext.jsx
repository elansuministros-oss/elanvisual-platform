import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { productosIniciales } from '../data/productos';
import { resumenCarrito } from '../lib/calculos';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

const configuracionInicial = {
  nombreSitio: 'ELANPET',
  slogan: 'Muebles funcionales para mascotas felices',
  logoTexto: 'ELANPET',
  logo: '',
  whatsapp: '+505 8522 8183',
  correo: 'elansuministros@gmail.com',
  instagram: '@elanpet',
  colorPrincipal: '#1E5AA8',
  colorSecundario: '#058B8C',
  textoHero: 'Tu mascota merece más',
  descripcionHero:
    'Muebles funcionales, resistentes y fabricados para el bienestar de perros y gatos. Compra fácil desde tu celular.',
  instruccionesPago:
    'Después de transferir, responde este mensaje enviando el comprobante para confirmar tu pedido.',
  anticipoPorcentaje: 60,
};

const cuentasIniciales = [];

const bannersIniciales = [
  {
    id: 'hero-principal-default',
    titulo: 'Tu mascota merece más',
    subtitulo: 'Muebles funcionales, resistentes y fabricados para el bienestar de perros y gatos.',
    ubicacion: 'hero-principal',
    link: 'catalogo',
    activo: true,
    imagen: '/productos/portada2-01.png',
    imagenRuta: '/productos/portada2-01.png',
    createdAt: 1,
    actualizadoEn: 1,
  },
  {
    id: 'slide-1',
    titulo: 'Muebles funcionales para mascotas felices',
    subtitulo: 'Casas, camas, comederos y torres fabricadas para durar.',
    ubicacion: 'slider-home',
    link: 'catalogo',
    activo: false,
    imagen: '/productos/producto-04.jpg',
    createdAt: 2,
    actualizadoEn: 2,
  },
  {
    id: 'slide-2',
    titulo: 'Compra desde tu veterinaria de confianza',
    subtitulo: 'Cada QR registra el origen del pedido y mantiene todo organizado.',
    ubicacion: 'slider-home',
    link: 'catalogo',
    activo: false,
    imagen: '/productos/producto-05.jpg',
    createdAt: 3,
    actualizadoEn: 3,
  },
  {
    id: 'slide-3',
    titulo: 'Productos destacados para perros y gatos',
    subtitulo: 'Diseños pensados para comodidad, orden y bienestar diario.',
    ubicacion: 'slider-home',
    link: 'catalogo',
    activo: false,
    imagen: '/productos/producto-10.jpg',
    createdAt: 4,
    actualizadoEn: 4,
  },
  {
    id: 'promo-1',
    titulo: 'Promoción destacada',
    subtitulo: 'Descuentos automáticos por cantidad en productos seleccionados.',
    ubicacion: 'home',
    link: 'catalogo',
    activo: false,
    imagen: '',
    createdAt: 5,
    actualizadoEn: 5,
  },
];

const trabajosIniciales = [
  { id: 'trabajo-1', titulo: 'Casa premium con terraza', tipo: 'Foto', descripcion: 'Producto entregado con acabado resistente y diseño funcional.', imagen: '/productos/producto-04.jpg', activo: true },
  { id: 'trabajo-2', titulo: 'Comedero elevado doble', tipo: 'Foto', descripcion: 'Comedero funcional con doble plato y acabado limpio.', imagen: '/productos/producto-05.jpg', activo: true },
  { id: 'trabajo-3', titulo: 'Torre para gatos', tipo: 'Foto', descripcion: 'Mueble vertical para descanso, juego y rascado.', imagen: '/productos/producto-10.jpg', activo: true },
];

const veterinariasIniciales = [];

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
    id: 'prod-1',
    usuario: 'produccion',
    email: 'produccion@pet.elankav.com',
    password: 'ProdElan2026#Seguro',
    rol: 'produccion',
    activo: true,
  },
];

export const estadosProduccion = ['pendiente', 'diseno', 'produccion', 'control_calidad', 'listo', 'entregado'];

export const etiquetasEstado = {
  pendiente: 'Pendiente',
  pendiente_pago: 'Pendiente de pago',
  pedido_recibido: 'Pedido recibido',
  anticipo_confirmado: 'Anticipo confirmado',
  pago_total_confirmado: 'Pago total confirmado',
  diseno: 'Diseño',
  produccion: 'Producción',
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
  if (esDataUrl(texto)) return '';
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

    if (clave === 'elanpet_banners') {
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
    // sin acción
  }
}


const APP_STATE_TABLE = 'elanpet_app_state';
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
  return `EP-${year}-${correlativo}`;
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

function esCuentaReal(cuenta) {
  const numero = String(cuenta?.numero || '').replace(/[^0-9]/g, '');
  return cuenta?.activa !== false && cuenta?.visible !== false && numero.length >= 6 && !/^0+$/.test(numero);
}

function asegurarUsuariosBase(listaUsuarios = []) {
  const base = usuariosIniciales;
  const existeAcceso = (lista, usuarioBase) =>
    lista.some(
      (u) =>
        normalizarUsuario(u.usuario) === normalizarUsuario(usuarioBase.usuario) ||
        normalizarUsuario(u.email) === normalizarUsuario(usuarioBase.email)
    );

  const salida = [...listaUsuarios];
  base.forEach((usuarioBase) => {
    if (!existeAcceso(salida, usuarioBase)) salida.push(usuarioBase);
  });
  return salida;
}

function mapVeterinariaFromDb(row) {
  return {
    id: row.id,
    codigo: row.codigo || '',
    nombre: row.nombre || '',
    slug: row.slug || crearSlug(row.nombre || row.codigo || row.id),
    telefono: row.telefono || row.whatsapp || '',
    whatsapp: row.whatsapp || row.telefono || '',
    email: row.email || row.correo || '',
    direccion: row.direccion || '',
    responsable: row.responsable || '',
    logo: row.logo || '',
    comisionPorcentaje: Number(row.comision_porcentaje ?? 10),
    linkAfiliado: row.link_afiliado || `/v/${row.codigo || row.slug || crearSlug(row.nombre || row.id)}`,
    activa: row.activa !== false,
    escaneos: Number(row.escaneos || 0),
    pedidos: Number(row.pedidos || 0),
    ventas: Number(row.ventas || 0),
    comision: Number(row.comision || 0),
    createdAt: row.created_at || '',
  };
}

function mapVeterinariaToDb(vet) {
  const slug = vet.slug || crearSlug(vet.nombre);
  return {
    codigo: vet.codigo || '',
    nombre: vet.nombre || '',
    slug,
    telefono: vet.telefono || vet.whatsapp || '',
    whatsapp: vet.whatsapp || vet.telefono || '',
    correo: vet.email || vet.correo || '',
    email: vet.email || vet.correo || '',
    direccion: vet.direccion || '',
    responsable: vet.responsable || '',
    logo: vet.logo || '',
    comision_porcentaje: Number(vet.comisionPorcentaje ?? vet.comision_porcentaje ?? 10),
    link_afiliado: vet.linkAfiliado || `/v/${vet.codigo || slug}`,
    activa: vet.activa !== false,
    escaneos: Number(vet.escaneos || 0),
    pedidos: Number(vet.pedidos || 0),
    ventas: Number(vet.ventas || 0),
    comision: Number(vet.comision || 0),
  };
}

function mapUsuarioFromDb(row) {
  return {
    id: row.id,
    nombre: row.nombre || row.usuario || row.email || '',
    usuario: row.usuario || '',
    email: row.email || '',
    password: row.password || '',
    rol: row.rol || 'veterinaria',
    veterinariaId: row.veterinaria_id || '',
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
    rol: usuario.rol || 'veterinaria',
    veterinaria_id: (usuario.rol || 'veterinaria') === 'veterinaria' ? usuario.veterinariaId || null : null,
    activo: usuario.activo !== false,
    debe_cambiar_password: usuario.debeCambiarPassword === true,
  };
}


function mapPedidoFromDb(row) {
  const resumen = row.resumen || {};
  const veterinaria = row.veterinaria || null;
  const cliente = row.cliente || {};

  return {
    id: row.id || row.numero || `pedido-${Date.now()}`,
    numero: row.numero || '',
    codigoSeguimiento: row.codigo_seguimiento || row.codigoSeguimiento || '',
    cliente,
    veterinaria,
    items: Array.isArray(row.items) ? row.items : [],
    veterinariaId: row.veterinaria_id || row.veterinariaId || veterinaria?.id || '',
    veterinariaCodigo: row.veterinaria_codigo || row.veterinariaCodigo || veterinaria?.codigo || '',
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
    veterinaria: pedido.veterinaria || null,
    items: pedido.items || [],
    veterinaria_id: esUuid(pedido.veterinariaId) ? pedido.veterinariaId : null,
    veterinaria_codigo: pedido.veterinariaCodigo || pedido.veterinaria?.codigo || '',
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
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(valor || ''));
}

export function AppProvider({ children }) {
  const [configuracion, setConfiguracion] = useState(() => leerStorage('elanpet_configuracion', configuracionInicial));
  const [cuentasBancarias, setCuentasBancarias] = useState(() => leerStorage('elanpet_cuentas_bancarias', cuentasIniciales));
  const [banners, setBanners] = useState(() => leerStorage('elanpet_banners', bannersIniciales));
  const [trabajos, setTrabajos] = useState(() => leerStorage('elanpet_trabajos', trabajosIniciales));
  const [productos, setProductos] = useState(() => leerStorage('elanpet_productos', productosIniciales));
  const [imagenes, setImagenes] = useState(() => leerStorage('elanpet_imagenes', []));
  const [veterinarias, setVeterinarias] = useState(() => leerStorage('elanpet_veterinarias', veterinariasIniciales));
  const [veterinaria, setVeterinaria] = useState(() => leerStorage('elanpet_veterinaria_actual', null));
  const [carrito, setCarrito] = useState([]);
  const [pedidos, setPedidos] = useState(() => leerStorage('elanpet_pedidos', []));
  const [usuario, setUsuario] = useState(() => leerStorage('elanpet_usuario_actual', null));
  const [usuarios, setUsuarios] = useState(() => asegurarUsuariosBase(leerStorage('elanpet_usuarios', usuariosIniciales)));
  const [supabaseListo, setSupabaseListo] = useState(false);
  const [estadoCompartidoCargado, setEstadoCompartidoCargado] = useState(false);

  useEffect(() => guardarStorage('elanpet_configuracion', configuracion), [configuracion]);
  useEffect(() => guardarStorage('elanpet_cuentas_bancarias', cuentasBancarias), [cuentasBancarias]);
  useEffect(() => guardarStorage('elanpet_banners', banners), [banners]);
  useEffect(() => guardarStorage('elanpet_trabajos', trabajos), [trabajos]);
  useEffect(() => guardarStorage('elanpet_productos', productos), [productos]);
  useEffect(() => guardarStorage('elanpet_imagenes', imagenes), [imagenes]);
  useEffect(() => guardarStorage('elanpet_veterinarias', veterinarias), [veterinarias]);
  useEffect(() => guardarStorage('elanpet_pedidos', pedidos), [pedidos]);
  useEffect(() => guardarStorage('elanpet_usuarios', usuarios), [usuarios]);

  useEffect(() => {
    if (usuario) guardarStorage('elanpet_usuario_actual', usuario);
    else localStorage.removeItem('elanpet_usuario_actual');
  }, [usuario]);

  useEffect(() => {
    if (veterinaria) guardarStorage('elanpet_veterinaria_actual', veterinaria);
    else localStorage.removeItem('elanpet_veterinaria_actual');
  }, [veterinaria]);

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
          });

          setCuentasBancarias(
            Array.isArray(remoto.cuentasBancarias)
              ? remoto.cuentasBancarias
              : cuentasIniciales
          );

          setBanners(normalizarBanners(remoto.banners, bannersIniciales));

          setTrabajos(
            Array.isArray(remoto.trabajos)
              ? remoto.trabajos
              : trabajosIniciales
          );

          setProductos(
            Array.isArray(remoto.productos)
              ? remoto.productos
              : productosIniciales
          );

          setImagenes(
            Array.isArray(remoto.imagenes)
              ? remoto.imagenes
              : []
          );
        } else {
          const estadoInicialCompartido = construirEstadoCompartido({
            configuracion,
            cuentasBancarias,
            banners,
            trabajos,
            productos,
            imagenes,
          });

          await supabase
            .from(APP_STATE_TABLE)
            .upsert(
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
        console.error('Error cargando estado compartido ELANPET:', error);
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
        const { error } = await supabase
          .from(APP_STATE_TABLE)
          .upsert(
            {
              id: APP_STATE_ID,
              data: estadoCompartido,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (error) throw error;
      } catch (error) {
        console.error('Error guardando estado compartido ELANPET:', error);
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
        const { data: vetsData, error: vetsError } = await supabase
          .from('veterinarias')
          .select('*')
          .order('created_at', { ascending: false });

        if (vetsError) throw vetsError;

        let vets = (vetsData || []).map(mapVeterinariaFromDb);

        const { data: usersData, error: usersError } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        let users = asegurarUsuariosBase((usersData || []).map(mapUsuarioFromDb));

        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false });

        if (pedidosError) throw pedidosError;

        const pedidosRemotos = (pedidosData || []).map(mapPedidoFromDb);

        if (!activo) return;

        setVeterinarias(vets);
        setUsuarios(users);
        setPedidos((prev) => unirPedidos(prev, pedidosRemotos));

        const veterinariaActual = leerStorage('elanpet_veterinaria_actual', null);
        if (veterinariaActual?.id) {
          const veterinariaSincronizada = vets.find((v) => v.id === veterinariaActual.id || v.codigo === veterinariaActual.codigo);
          setVeterinaria(veterinariaSincronizada || null);
        } else if (vets.length === 0) {
          setVeterinaria(null);
        }

        const usuarioActual = leerStorage('elanpet_usuario_actual', null);
        if (usuarioActual?.id) {
          const usuarioSincronizado = users.find((u) => u.id === usuarioActual.id || u.usuario === usuarioActual.usuario);
          if (usuarioSincronizado) {
            setUsuario(usuarioSincronizado);
            if (usuarioSincronizado.rol === 'veterinaria') {
              const vetAsignada = vets.find((v) => v.id === usuarioSincronizado.veterinariaId);
              if (vetAsignada) setVeterinaria(vetAsignada);
            }
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
      nombreSitio: datos?.nombreSitio || configuracion?.nombreSitio || 'ELANPET',
      logoTexto: datos?.logoTexto || datos?.nombreSitio || configuracion?.logoTexto || configuracion?.nombreSitio || 'ELANPET',
      anticipoPorcentaje: Number(datos?.anticipoPorcentaje ?? configuracion?.anticipoPorcentaje ?? 60),
    };

    setConfiguracion(nuevaConfiguracion);
    guardarStorage('elanpet_configuracion', nuevaConfiguracion);
    return { ok: true, configuracion: nuevaConfiguracion };
  };

  const crearImagen = (imagen) => setImagenes((prev) => [imagen, ...prev]);
  const eliminarImagen = (id) => setImagenes((prev) => prev.filter((img) => img.id !== id));

  const crearVeterinaria = (datos) => {
    const slug = crearSlug(datos.nombre);
    const codigo = datos.codigo || `VET${String(veterinarias.length + 1).padStart(3, '0')}`;
    const tempId = `vet-temp-${Date.now()}`;

    const nueva = {
      id: tempId,
      codigo,
      nombre: datos.nombre,
      slug,
      telefono: datos.telefono || datos.whatsapp || '',
      whatsapp: datos.whatsapp || datos.telefono || '',
      email: datos.email || datos.correo || '',
      direccion: datos.direccion || '',
      responsable: datos.responsable || '',
      logo: datos.logo || '',
      comisionPorcentaje: Number(datos.comisionPorcentaje || 10),
      linkAfiliado: `/v/${codigo}`,
      activa: datos.activa !== false,
      escaneos: 0,
      pedidos: 0,
      ventas: 0,
      comision: 0,
    };

    setVeterinarias((prev) => [nueva, ...prev]);

    if (supabase) {
      supabase
        .from('veterinarias')
        .insert(mapVeterinariaToDb(nueva))
        .select('*')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error creando veterinaria en Supabase:', error);
            setVeterinarias((prev) => prev.filter((v) => v.id !== tempId));
            window.alert('No se pudo guardar la veterinaria en Supabase. Revisá si el código ya existe.');
            return;
          }

          const creada = mapVeterinariaFromDb(data);
          setVeterinarias((prev) => prev.map((v) => (v.id === tempId ? creada : v)));
        });
    }

    return nueva;
  };

  const actualizarVeterinaria = (datosVeterinaria) => {
    const slug = datosVeterinaria.slug || crearSlug(datosVeterinaria.nombre);
    const actualizada = { ...datosVeterinaria, slug, linkAfiliado: `/v/${datosVeterinaria.codigo || slug}` };

    setVeterinarias((prev) => prev.map((v) => (v.id === actualizada.id ? { ...v, ...actualizada } : v)));
    if (veterinaria?.id === actualizada.id) setVeterinaria((prev) => ({ ...prev, ...actualizada }));

    if (supabase && esUuid(actualizada.id)) {
      supabase
        .from('veterinarias')
        .update(mapVeterinariaToDb(actualizada))
        .eq('id', actualizada.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error actualizando veterinaria en Supabase:', error);
            window.alert('No se pudo actualizar la veterinaria en Supabase.');
          }
        });
    }
  };

  const eliminarVeterinaria = (id) => {
    setVeterinarias((prev) => prev.filter((v) => v.id !== id));
    setUsuarios((prev) => prev.map((u) => (u.veterinariaId === id ? { ...u, veterinariaId: '', activo: false } : u)));

    if (supabase && esUuid(id)) {
      supabase
        .from('veterinarias')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Error eliminando veterinaria en Supabase:', error);
            window.alert('No se pudo eliminar la veterinaria en Supabase.');
          }
        });
    }
  };

  const agregar = (p) =>
    setCarrito((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      return ex ? prev.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)) : [...prev, { ...p, cantidad: 1 }];
    });

  const cambiarCantidad = (id, cantidad) =>
    setCarrito((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Number(cantidad) || 1) } : i)));

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

    const numero = `PED-${String(Date.now()).slice(-6)}`;
    const anticipoPorcentaje = Number(configuracion.anticipoPorcentaje || 60);
    const montoSolicitado = pagoTipo === 'total' ? resumen.total : resumen.total * (anticipoPorcentaje / 100);
    const veterinariaActual = veterinaria ? { ...veterinaria, linkAfiliado: `/v/${veterinaria.codigo || veterinaria.slug}` } : null;

    const pedido = {
      id: `pedido-${Date.now()}`,
      numero,
      codigoSeguimiento: '',
      cliente: clienteNormalizado,
      veterinaria: veterinariaActual,
      items: carrito,
      veterinariaId: veterinariaActual?.id || '',
      veterinariaCodigo: veterinariaActual?.codigo || '',
      resumen: {
        ...resumen,
        comision: veterinariaActual ? (Number(resumen.total || 0) * Number(veterinariaActual.comisionPorcentaje || 10)) / 100 : 0,
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
      historial: [{ estado: 'pendiente_pago', fecha: new Date().toISOString(), nota: 'Pedido creado desde carrito.' }],
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
            console.error('Error guardando pedido en Supabase:', error);
            window.alert('El pedido fue creado y el WhatsApp salió, pero no se pudo guardar en Supabase. Revisá la tabla pedidos.');
            return;
          }

          const pedidoGuardado = mapPedidoFromDb(data);
          setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, ...pedidoGuardado } : p)));
        });
    }

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
            console.error('Error actualizando pedido en Supabase:', error);
            window.alert('No se pudo actualizar el pedido en Supabase.');
          }
        });
    }
  };

  const confirmarAnticipo = (pedido, pagoTipoConfirmado = pedido.pagoTipo || 'anticipo') => {
    const esTotal = pagoTipoConfirmado === 'total';
    const codigo = pedido.codigoSeguimiento || generarCodigoSeguimiento();
    const anticipoRecibido = esTotal ? pedido.resumen.total : pedido.anticipoRequerido || pedido.resumen.total * 0.6;
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
      ordenTrabajo: crearOrdenTrabajoBase({ ...pedido, codigoSeguimiento: codigo, estadoProduccion: 'produccion' }),
      historial: [...(pedido.historial || []), { estado: esTotal ? 'pago_total_confirmado' : 'anticipo_confirmado', fecha: new Date().toISOString(), nota: 'Pago validado por administración.' }],
    });
    return codigo;
  };

  const crearOrdenTrabajoBase = (pedido) => ({
    codigoOT: pedido?.ordenTrabajo?.codigoOT || `OT-${String(pedido?.id || Date.now()).replace(/[^0-9]/g, '').slice(-6) || Date.now()}`,
    pedido: pedido?.codigoSeguimiento || pedido?.numero || '',
    cliente: pedido?.cliente?.nombre || '',
    veterinaria: pedido?.veterinaria?.nombre || '',
    producto: (pedido?.items || []).map((i) => i.nombre).join(', '),
    cantidad: (pedido?.items || []).reduce((a, i) => a + Number(i.cantidad || 0), 0),
    responsable: pedido?.ordenTrabajo?.responsable || '',
    observaciones: pedido?.ordenTrabajo?.observaciones || '',
    fecha: pedido?.ordenTrabajo?.fecha || new Date().toISOString(),
    estadoProduccion: pedido?.estadoProduccion || 'pendiente',
    evidencias: { inicial: '', proceso: '', terminado: '', entrega: '', ...(pedido?.ordenTrabajo?.evidencias || {}) },
  });

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
      historial: [...(pedido.historial || []), { estado: estadoProduccion, fecha: new Date().toISOString(), nota: etiquetasEstado[estadoProduccion] || estadoProduccion }],
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
      (p) => String(p.codigoSeguimiento || '').toUpperCase() === c && String(p.cliente?.whatsapp || '').replace(/[^0-9]/g, '').endsWith(w.slice(-8))
    );
  };

  const login = ({ email, password }) => {

    const acceso = normalizarUsuario(email);
    const clave = String(password || '').trim();

    const usuarioEncontrado = usuarios.find((u) => {
      const usuarioNormalizado = normalizarUsuario(u.usuario);
      const emailNormalizado = normalizarUsuario(u.email);
      return u.activo !== false && (usuarioNormalizado === acceso || emailNormalizado === acceso) && String(u.password || '').trim() === clave;
    });

    if (!usuarioEncontrado) return { ok: false };

    if (usuarioEncontrado.rol === 'veterinaria') {
      const vetAsignada = veterinarias.find((v) => v.id === usuarioEncontrado.veterinariaId);
      if (!vetAsignada || vetAsignada.activa === false) return { ok: false };
      setVeterinaria(vetAsignada);
    }

    setUsuario(usuarioEncontrado);
    return { ok: true, rol: usuarioEncontrado.rol, usuario: usuarioEncontrado, supabaseListo };
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('elanpet_usuario_actual');
  };

  const crearUsuario = (datos) => {
    const usuarioLimpio = normalizarUsuario(datos.usuario);
    const emailLimpio = normalizarUsuario(datos.email);

    const existe = usuarios.some((u) => {
      const mismoUsuario = usuarioLimpio && normalizarUsuario(u.usuario) === usuarioLimpio;
      const mismoEmail = emailLimpio && normalizarUsuario(u.email) === emailLimpio;
      const mismaVeterinaria = datos.rol === 'veterinaria' && datos.veterinariaId && u.veterinariaId === datos.veterinariaId && u.activo !== false;
      return mismoUsuario || mismoEmail || mismaVeterinaria;
    });

    if (existe) return { ok: false, error: 'usuario_duplicado' };

    const tempId = `user-temp-${Date.now()}`;
    const nuevo = {
      id: tempId,
      nombre: datos.nombre || usuarioLimpio,
      usuario: usuarioLimpio,
      email: emailLimpio,
      password: String(datos.password || 'Temporal2026#').trim(),
      rol: datos.rol || 'veterinaria',
      veterinariaId: datos.rol === 'veterinaria' ? datos.veterinariaId || '' : '',
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
            window.alert('No se pudo guardar el usuario en Supabase. Revisá duplicados.');
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
          veterinariaId: (usuarioActualizado.rol || u.rol) === 'veterinaria' ? usuarioActualizado.veterinariaId || '' : '',
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

  const actualizarProducto = (producto) => setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, ...producto } : p)));

  const crearProducto = (producto) => {
    const id = producto.id || crearSlug(producto.nombre);
    setProductos((prev) => [{ ...producto, id, precio: Number(producto.precio || 0), activo: true }, ...prev]);
  };

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
            b.ubicacion === 'hero-principal'
              ? { ...b, activo: false }
              : b
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

  const crearTrabajo = (trabajo) => setTrabajos((prev) => [{ ...trabajo, id: `trabajo-${Date.now()}`, activo: true }, ...prev]);
  const actualizarTrabajo = (trabajo) => setTrabajos((prev) => prev.map((t) => (t.id === trabajo.id ? { ...t, ...trabajo } : t)));

  const crearCuentaBancaria = (cuenta) => setCuentasBancarias((prev) => [{ ...cuenta, id: `cta-${Date.now()}`, activa: true, visible: true }, ...prev]);
  const actualizarCuentaBancaria = (cuenta) => setCuentasBancarias((prev) => prev.map((c) => (c.id === cuenta.id ? { ...c, ...cuenta } : c)));
  const eliminarCuentaBancaria = (id) => setCuentasBancarias((prev) => prev.filter((c) => c.id !== id));

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
        productos,
        setProductos,
        actualizarProducto,
        crearProducto,
        imagenes,
        crearImagen,
        eliminarImagen,
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
        actualizarPedido,
        confirmarAnticipo,
        cambiarEstadoProduccion,
        actualizarOrdenTrabajo,
        guardarEvidenciaProduccion,
        buscarPedidoSeguimiento,
        usuario,
        login,
        logout,
        usuarios,
        crearUsuario,
        actualizarUsuario,
        eliminarUsuario,
        supabaseListo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

