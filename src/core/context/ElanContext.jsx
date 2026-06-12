import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  categoriasIniciales,
  productosIniciales,
  proveedoresIniciales,
  materialesIniciales,
  vendedoresIniciales,
  bannersIniciales,
  bancosIniciales,
  estadosProduccion,
  usuariosIniciales,
} from '../../data/initialData.js';

import { emitirEventoCRM } from '../bridge/CentralBridge.js';

const Ctx = createContext(null);
const key = 'elanvisual_state_v2';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_KEY ||
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
    ''
);

const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const TABLAS_SUPABASE = [
  'categorias',
  'productos',
  'proveedores',
  'materiales',
  'inventario',
  'vendedores',
  'banners',
  'bancos',
  'usuarios',
  'clientes',
  'leads',
  'cotizaciones',
  'pedidos',
  'pagos',
  'ordenes',
  'producciones',
  'comisiones',
  'showroom',
  'multimedia',
];

function supabaseActivo() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function normalizarRegistroSupabase(row = {}) {
  if (row && typeof row.data === 'object' && row.data !== null) {
    return {
      id: row.id || row.data.id,
      ...row.data,
    };
  }

  return row;
}

async function leerTablaSupabase(tabla) {
  if (!supabaseActivo()) return [];

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?select=*`, {
      headers: SUPABASE_HEADERS,
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizarRegistroSupabase) : [];
  } catch {
    return [];
  }
}

async function guardarRegistroSupabase(tabla, item = {}) {
  if (!supabaseActivo() || !item?.id) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?on_conflict=id`, {
      method: 'POST',
      headers: {
        ...SUPABASE_HEADERS,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(item),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return Array.isArray(data) ? normalizarRegistroSupabase(data[0]) : null;
  } catch {
    return null;
  }
}

async function eliminarRegistroSupabase(tabla, id) {
  if (!supabaseActivo() || !id) return false;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'return=minimal',
        },
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

async function cargarEstadoSupabase() {
  if (!supabaseActivo()) return null;

  const remoto = {};

  await Promise.all(
    TABLAS_SUPABASE.map(async (tabla) => {
      const filas = await leerTablaSupabase(tabla);
      if (filas.length > 0) remoto[tabla] = filas;
    })
  );

  return Object.keys(remoto).length > 0 ? remoto : null;
}

function mezclarEstado(prev, remoto) {
  const merged = { ...prev, ...(remoto || {}) };

  merged.usuarios = unirUsuariosBase(merged.usuarios || []);

  if (!Array.isArray(merged.inventario) || merged.inventario.length === 0) {
    merged.inventario = inventarioDesdeMateriales(merged.materiales || []);
  }

  if (!Array.isArray(merged.movimientosInventario)) {
    merged.movimientosInventario = [];
  }

  if (!Array.isArray(merged.producciones)) {
    merged.producciones = [];
  }

  if (!Array.isArray(merged.multimedia)) {
    merged.multimedia = [];
  }

  return merged;
}


const usuariosAccesoBase = [
  {
    id: 'USR-ADMIN-ELANVISUAL',
    nombre: 'Administrador ELANVISUAL',
    correo: 'admin@elanvisual.com',
    password: 'admin123',
    rol: 'admin',
    estado: 'Activo',
    unidad: 'ELANVISUAL',
  },
  {
    id: 'USR-VENDEDOR-ELANVISUAL',
    nombre: 'Vendedor ELANVISUAL',
    correo: 'vendedor@elanvisual.com',
    password: 'vend123',
    rol: 'vendedor',
    estado: 'Activo',
    unidad: 'ELANVISUAL',
  },
  {
    id: 'USR-PRODUCCION-ELANVISUAL',
    nombre: 'Producción ELANVISUAL',
    correo: 'produccion@elanvisual.com',
    password: 'prod123',
    rol: 'produccion',
    estado: 'Activo',
    unidad: 'ELANVISUAL',
  },
];

function uid(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function hoyISO() {
  return new Date().toISOString();
}

function unirUsuariosBase(usuarios = []) {
  const lista = Array.isArray(usuarios) ? usuarios : [];
  const correos = new Set(
    lista.map((u) => String(u.correo || '').toLowerCase().trim())
  );

  const faltantes = usuariosAccesoBase.filter(
    (u) => !correos.has(String(u.correo || '').toLowerCase().trim())
  );

  return [...lista, ...faltantes];
}

function inventarioDesdeMateriales(materiales = []) {
  return materiales.map((m) => ({
    id: `INV-${m.id}`,
    materialId: m.id,
    nombre: m.nombre || 'Material',
    unidad: m.unidad || 'unidad',
    existencia: Number(m.stock || 0),
    stockMinimo: Number(m.stockMinimo || 0),
    costo: Number(m.costo || 0),
    proveedor: m.proveedor || '',
    estado: 'Activo',
    actualizado: hoyISO(),
  }));
}

const inicial = {
  categorias: categoriasIniciales || [],
  productos: productosIniciales || [],
  proveedores: proveedoresIniciales || [],
  materiales: materialesIniciales || [],
  inventario: inventarioDesdeMateriales(materialesIniciales || []),
  movimientosInventario: [],
  vendedores: vendedoresIniciales || [],
  banners: bannersIniciales || [],
  bancos: bancosIniciales || [],
  estadosProduccion: estadosProduccion || [],
  usuarios: unirUsuariosBase(usuariosIniciales || []),
  clientes: [],
  leads: [],
  cotizaciones: [],
  pedidos: [],
  pagos: [],
  ordenes: [],
  producciones: [],
  comisiones: [],
  showroom: [],
  multimedia: [],
  carrito: [],
  sesion: null,
};

export function convertirAMetros(valor, unidad = 'm') {
  const numero = Number(valor || 0);
  const u = String(unidad || 'm').toLowerCase().trim();

  if (u === 'm' || u === 'metro' || u === 'metros') return numero;
  if (u === 'cm' || u === 'centimetro' || u === 'centimetros') return numero / 100;
  if (u === 'mm' || u === 'milimetro' || u === 'milimetros') return numero / 1000;
  if (u === 'in' || u === 'pulgada' || u === 'pulgadas' || u === '"') return numero * 0.0254;
  if (u === 'ft' || u === 'pie' || u === 'pies') return numero * 0.3048;

  return numero;
}

function load() {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return inicial;

    const parsed = JSON.parse(raw);
    const merged = { ...inicial, ...parsed };

    merged.usuarios = unirUsuariosBase(merged.usuarios || []);

    if (!Array.isArray(merged.inventario) || merged.inventario.length === 0) {
      merged.inventario = inventarioDesdeMateriales(merged.materiales || []);
    }

    if (!Array.isArray(merged.movimientosInventario)) {
      merged.movimientosInventario = [];
    }

    if (!Array.isArray(merged.producciones)) {
      merged.producciones = [];
    }

    if (!Array.isArray(merged.multimedia)) {
      merged.multimedia = [];
    }

    return merged;
  } catch {
    return inicial;
  }
}

export function ElanProvider({ children }) {
  const [state, setState] = useState(load);
  const [cargandoSupabase, setCargandoSupabase] = useState(false);

  useEffect(() => {
    let vivo = true;

    async function iniciarSupabase() {
      if (!supabaseActivo()) return;

      setCargandoSupabase(true);

      const remoto = await cargarEstadoSupabase();

      if (vivo && remoto) {
        setState((prev) => mezclarEstado(prev, remoto));
      }

      if (vivo) setCargandoSupabase(false);
    }

    iniciarSupabase();

    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state]);

  const patch = (updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  };

  const login = (correo, password) => {
    const correoNormalizado = String(correo || '').toLowerCase().trim();
    const passwordNormalizado = String(password || '').trim();
    const usuariosDisponibles = unirUsuariosBase(state.usuarios || []);

    const usuario = usuariosDisponibles.find(
      (u) =>
        String(u.correo || '').toLowerCase().trim() === correoNormalizado &&
        String(u.password || '').trim() === passwordNormalizado &&
        String(u.estado || 'Activo').toLowerCase().trim() !== 'inactivo'
    );

    if (!usuario) return null;

    const usuarioSesion = {
      ...usuario,
      ultimoAcceso: hoyISO(),
    };

    patch((prev) => ({
      usuarios: unirUsuariosBase(prev.usuarios || []).map((u) =>
        u.id === usuarioSesion.id ? { ...u, ...usuarioSesion } : u
      ),
      sesion: usuarioSesion,
    }));

    return usuarioSesion;
  };

  const logout = () => patch({ sesion: null });

  const guardarCliente = (data = {}) => {
    const cliente = {
      id: data.id || uid('CLI'),
      fecha: data.fecha || hoyISO(),
      estado: data.estado || 'Activo',
      tipo: data.tipo || 'Cliente',
      nombre: data.nombre || data.clienteNombre || 'Cliente sin nombre',
      empresa: data.empresa || '',
      contacto: data.contacto || '',
      whatsapp: data.whatsapp || '',
      correo: data.correo || '',
      direccion: data.direccion || '',
      observaciones: data.observaciones || '',
      unidad: 'ELANVISUAL',
      ...data,
    };

    patch((prev) => {
      const existe = prev.clientes.some((x) => x.id === cliente.id);
      return {
        clientes: existe
          ? prev.clientes.map((x) =>
              x.id === cliente.id ? { ...x, ...cliente, actualizado: hoyISO() } : x
            )
          : [cliente, ...prev.clientes],
      };
    });

    emitirEventoCRM('cliente_guardado', cliente);
    return cliente;
  };

  const actualizarCliente = (id, cambios = {}) => {
    let actualizado = null;
    patch((prev) => ({
      clientes: prev.clientes.map((c) => {
        if (c.id !== id) return c;
        actualizado = { ...c, ...cambios, actualizado: hoyISO() };
        return actualizado;
      }),
    }));
    if (actualizado) emitirEventoCRM('cliente_actualizado', actualizado);
    return actualizado;
  };

  const eliminarCliente = (id) => {
    patch((prev) => ({ clientes: prev.clientes.filter((c) => c.id !== id) }));
    emitirEventoCRM('cliente_eliminado', { id, unidad: 'ELANVISUAL' });
    return true;
  };

  const guardarUsuario = (data = {}) => {
    const usuario = {
      id: data.id || uid('USR'),
      fecha: data.fecha || hoyISO(),
      nombre: data.nombre || 'Usuario',
      correo: data.correo || '',
      password: data.password || '',
      rol: data.rol || 'vendedor',
      estado: data.estado || 'Activo',
      vendedorId: data.vendedorId || '',
      permisos: data.permisos || [],
      unidad: 'ELANVISUAL',
      ...data,
    };

    patch((prev) => {
      const existe = prev.usuarios.some((x) => x.id === usuario.id);
      return {
        usuarios: existe
          ? prev.usuarios.map((x) =>
              x.id === usuario.id ? { ...x, ...usuario, actualizado: hoyISO() } : x
            )
          : [usuario, ...prev.usuarios],
      };
    });

    emitirEventoCRM('usuario_guardado', usuario);
    return usuario;
  };

  const actualizarUsuario = (id, cambios = {}) => {
    let actualizado = null;
    patch((prev) => ({
      usuarios: prev.usuarios.map((u) => {
        if (u.id !== id) return u;
        actualizado = { ...u, ...cambios, actualizado: hoyISO() };
        return actualizado;
      }),
    }));
    if (actualizado) emitirEventoCRM('usuario_actualizado', actualizado);
    return actualizado;
  };

  const eliminarUsuario = (id) => {
    patch((prev) => ({ usuarios: prev.usuarios.filter((u) => u.id !== id) }));
    emitirEventoCRM('usuario_eliminado', { id, unidad: 'ELANVISUAL' });
    return true;
  };

  const guardarInventario = (data = {}) => {
    const item = {
      id: data.id || uid('INV'),
      materialId: data.materialId || '',
      nombre: data.nombre || 'Material',
      unidad: data.unidad || 'unidad',
      existencia: Number(data.existencia ?? data.stock ?? 0),
      stockMinimo: Number(data.stockMinimo || 0),
      costo: Number(data.costo || 0),
      proveedor: data.proveedor || '',
      estado: data.estado || 'Activo',
      actualizado: hoyISO(),
      ...data,
    };

    patch((prev) => {
      const existe = prev.inventario.some((x) => x.id === item.id);
      return {
        inventario: existe
          ? prev.inventario.map((x) => (x.id === item.id ? { ...x, ...item } : x))
          : [item, ...prev.inventario],
      };
    });

    emitirEventoCRM('inventario_guardado', item);
    return item;
  };

  const actualizarInventario = (id, cambios = {}) => {
    let actualizado = null;
    patch((prev) => ({
      inventario: prev.inventario.map((i) => {
        if (i.id !== id) return i;
        actualizado = { ...i, ...cambios, actualizado: hoyISO() };
        return actualizado;
      }),
    }));
    if (actualizado) emitirEventoCRM('inventario_actualizado', actualizado);
    return actualizado;
  };

  const registrarMovimientoInventario = (data = {}) => {
    const tipo = data.tipo || 'Salida';
    const cantidad = Number(data.cantidad || 0);
    const inventarioId = data.inventarioId || data.id || '';

    const movimiento = {
      id: uid('MOV'),
      fecha: hoyISO(),
      tipo,
      inventarioId,
      materialId: data.materialId || '',
      nombre: data.nombre || '',
      cantidad,
      unidad: data.unidad || '',
      referencia: data.referencia || '',
      ordenId: data.ordenId || '',
      pedidoId: data.pedidoId || '',
      responsable: data.responsable || '',
      observaciones: data.observaciones || '',
      unidadNegocio: 'ELANVISUAL',
      ...data,
    };

    patch((prev) => ({
      movimientosInventario: [movimiento, ...prev.movimientosInventario],
      inventario: prev.inventario.map((item) => {
        if (item.id !== inventarioId && item.materialId !== movimiento.materialId) return item;

        const actual = Number(item.existencia || 0);
        const nuevaExistencia =
          tipo === 'Entrada'
            ? actual + cantidad
            : tipo === 'Ajuste'
              ? cantidad
              : Math.max(actual - cantidad, 0);

        return { ...item, existencia: nuevaExistencia, actualizado: hoyISO() };
      }),
    }));

    emitirEventoCRM('movimiento_inventario_registrado', movimiento);
    return movimiento;
  };

  const agregarCarrito = (producto, cantidad = 1) => {
    const item = {
      id: uid('CART'),
      productoId: producto?.id,
      nombre: producto?.nombre || 'Producto',
      precio: Number(producto?.precio || producto?.precioVenta || 0),
      cantidad: Number(cantidad || 1),
      fecha: hoyISO(),
    };

    patch((prev) => ({ carrito: [...prev.carrito, item] }));
    emitirEventoCRM('carrito_agregado', item);
    return item;
  };

  const crearLead = (data = {}) => {
    const lead = {
      id: data.id || uid('LEAD'),
      fecha: data.fecha || hoyISO(),
      estado: data.estado || 'Nuevo',
      origen: data.origen || 'ELANVISUAL',
      unidad: 'ELANVISUAL',
      ...data,
    };

    patch((prev) => ({ leads: [lead, ...prev.leads] }));
    emitirEventoCRM('lead_creado', lead);
    return lead;
  };

  const guardarCotizacion = (data = {}) => {
    const total = Number(data.total ?? data.totalVenta ?? 0);

    const cotizacion = {
      id: data.id || uid('COT'),
      codigo: data.codigo || `COT-${Date.now()}`,
      fecha: data.fecha || hoyISO(),
      estado: data.estado || 'Borrador',
      unidad: 'ELANVISUAL',
      clienteId: data.clienteId || '',
      clienteNombre: data.clienteNombre || data.cliente || '',
      vendedorId: data.vendedorId || state.sesion?.vendedorId || state.sesion?.id || '',
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: Number(data.subtotal || total),
      iva: Number(data.iva || 0),
      total,
      margen: Number(data.margen || 0),
      observaciones: data.observaciones || data.observacion || '',
      ...data,
    };

    patch((prev) => {
      const existe = prev.cotizaciones.some((x) => x.id === cotizacion.id);
      return {
        cotizaciones: existe
          ? prev.cotizaciones.map((x) =>
              x.id === cotizacion.id ? { ...x, ...cotizacion, actualizado: hoyISO() } : x
            )
          : [cotizacion, ...prev.cotizaciones],
      };
    });

    emitirEventoCRM('cotizacion_guardada', cotizacion);
    return cotizacion;
  };

  const actualizarCotizacion = (id, cambios = {}) => {
    let actualizada = null;
    patch((prev) => ({
      cotizaciones: prev.cotizaciones.map((c) => {
        if (c.id !== id) return c;
        actualizada = { ...c, ...cambios, actualizado: hoyISO() };
        return actualizada;
      }),
    }));
    if (actualizada) emitirEventoCRM('cotizacion_actualizada', actualizada);
    return actualizada;
  };

  const crearPedidoDesdeCotizacion = (cotizacionId, extras = {}) => {
    const cotizacion = state.cotizaciones.find((c) => c.id === cotizacionId);
    if (!cotizacion) return null;

    const pedido = {
      id: uid('PED'),
      codigo: `PED-${Date.now()}`,
      fecha: hoyISO(),
      estado: 'Pedido creado',
      estadoPago: 'Pendiente',
      unidad: 'ELANVISUAL',
      cotizacionId,
      clienteId: cotizacion.clienteId || '',
      clienteNombre: cotizacion.clienteNombre || cotizacion.cliente || '',
      vendedorId: cotizacion.vendedorId || '',
      items: cotizacion.items || [],
      subtotal: Number(cotizacion.subtotal || 0),
      iva: Number(cotizacion.iva || 0),
      total: Number(cotizacion.total || 0),
      pagado: Number(extras.pagado || 0),
      saldo: Math.max(Number(cotizacion.total || 0) - Number(extras.pagado || 0), 0),
      notas: extras.notas || cotizacion.observaciones || '',
      ...extras,
    };

    patch((prev) => ({
      pedidos: [pedido, ...prev.pedidos],
      cotizaciones: prev.cotizaciones.map((c) =>
        c.id === cotizacionId
          ? { ...c, estado: 'Aprobada', pedidoId: pedido.id, actualizado: hoyISO() }
          : c
      ),
    }));

    emitirEventoCRM('pedido_creado_desde_cotizacion', pedido);
    return pedido;
  };

  const confirmarPedido = (pedidoId, extras = {}) => {
    let confirmado = null;

    patch((prev) => ({
      pedidos: prev.pedidos.map((p) => {
        if (p.id !== pedidoId) return p;
        confirmado = {
          ...p,
          estado: 'Confirmado',
          confirmado: true,
          confirmadoEn: hoyISO(),
          ...extras,
        };
        return confirmado;
      }),
    }));

    if (confirmado) emitirEventoCRM('pedido_confirmado', confirmado);
    return confirmado;
  };

  const actualizarPedido = (id, cambios = {}) => {
    let actualizado = null;

    patch((prev) => ({
      pedidos: prev.pedidos.map((p) => {
        if (p.id !== id) return p;
        actualizado = { ...p, ...cambios, actualizado: hoyISO() };
        return actualizado;
      }),
    }));

    if (actualizado) emitirEventoCRM('pedido_actualizado', actualizado);
    return actualizado;
  };

  const crearOrdenDesdePedido = (pedidoId, extras = {}) => {
    const pedido = state.pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return null;

    const orden = {
      id: uid('OT'),
      codigo: `OT-${Date.now()}`,
      fecha: hoyISO(),
      estado: 'Pendiente',
      unidad: 'ELANVISUAL',
      pedidoId,
      cotizacionId: pedido.cotizacionId || '',
      clienteId: pedido.clienteId || '',
      clienteNombre: pedido.clienteNombre || '',
      items: pedido.items || [],
      responsable: extras.responsable || '',
      fechaEntrega: extras.fechaEntrega || '',
      instrucciones: extras.instrucciones || pedido.notas || '',
      prioridad: extras.prioridad || 'Normal',
      ...extras,
    };

    patch((prev) => ({
      ordenes: [orden, ...prev.ordenes],
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, estado: 'En orden de trabajo', ordenId: orden.id } : p
      ),
    }));

    emitirEventoCRM('orden_creada_desde_pedido', orden);
    return orden;
  };

  const actualizarOrden = (id, cambios = {}) => {
    let actualizada = null;

    patch((prev) => ({
      ordenes: prev.ordenes.map((o) => {
        if (o.id !== id) return o;
        actualizada = { ...o, ...cambios, actualizado: hoyISO() };
        return actualizada;
      }),
    }));

    if (actualizada) emitirEventoCRM('orden_actualizada', actualizada);
    return actualizada;
  };

  const actualizarEstadoOT = (id, estado) => actualizarOrden(id, { estado });

  const crearProduccionDesdeOT = (ordenId, extras = {}) => {
    const orden = state.ordenes.find((o) => o.id === ordenId);
    if (!orden) return null;

    const produccion = {
      id: uid('PROD'),
      codigo: `PROD-${Date.now()}`,
      fecha: hoyISO(),
      estado: 'En cola',
      unidad: 'ELANVISUAL',
      ordenId,
      pedidoId: orden.pedidoId || '',
      clienteId: orden.clienteId || '',
      clienteNombre: orden.clienteNombre || '',
      items: orden.items || [],
      responsable: extras.responsable || orden.responsable || '',
      avance: Number(extras.avance || 0),
      observaciones: extras.observaciones || '',
      ...extras,
    };

    patch((prev) => ({
      producciones: [produccion, ...prev.producciones],
      ordenes: prev.ordenes.map((o) =>
        o.id === ordenId ? { ...o, estado: 'En producción', produccionId: produccion.id } : o
      ),
    }));

    emitirEventoCRM('produccion_creada_desde_ot', produccion);
    return produccion;
  };

  const actualizarProduccion = (id, cambios = {}) => {
    let actualizada = null;

    patch((prev) => ({
      producciones: prev.producciones.map((p) => {
        if (p.id !== id) return p;
        actualizada = { ...p, ...cambios, actualizado: hoyISO() };
        return actualizada;
      }),
    }));

    if (actualizada) emitirEventoCRM('produccion_actualizada', actualizada);
    return actualizada;
  };

  const validarPago = (data = {}) => {
    const pago = {
      id: data.id || uid('PAGO'),
      fecha: hoyISO(),
      estado: 'Validado',
      unidad: 'ELANVISUAL',
      monto: Number(data.monto || 0),
      pedidoId: data.pedidoId || '',
      cotizacionId: data.cotizacionId || '',
      bancoId: data.bancoId || '',
      referencia: data.referencia || '',
      ...data,
    };

    patch((prev) => ({
      pagos: [pago, ...prev.pagos],
      pedidos: prev.pedidos.map((p) => {
        if (p.id !== pago.pedidoId) return p;
        const pagado = Number(p.pagado || 0) + pago.monto;
        const saldo = Math.max(Number(p.total || 0) - pagado, 0);
        return { ...p, pagado, saldo, estadoPago: saldo <= 0 ? 'Pagado' : 'Abono recibido' };
      }),
    }));

    emitirEventoCRM('pago_validado', pago);
    return pago;
  };

  const crearComisionDesdePedido = (pedidoId, extras = {}) => {
    const pedido = state.pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return null;

    const porcentaje = Number(extras.porcentaje ?? 10);
    const base = Number(extras.base ?? pedido.total ?? 0);
    const monto = Number(extras.monto ?? (base * porcentaje) / 100);

    const comision = {
      id: uid('COM'),
      codigo: `COM-${Date.now()}`,
      fecha: hoyISO(),
      estado: 'Pendiente',
      unidad: 'ELANVISUAL',
      pedidoId,
      vendedorId: pedido.vendedorId || extras.vendedorId || '',
      clienteNombre: pedido.clienteNombre || '',
      base,
      porcentaje,
      monto,
      ...extras,
    };

    patch((prev) => ({
      comisiones: [comision, ...prev.comisiones],
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, comisionId: comision.id, comisionGenerada: true } : p
      ),
    }));

    emitirEventoCRM('comision_creada_desde_pedido', comision);
    return comision;
  };

  const guardarProducto = (data = {}) => {
    const item = { id: data.id || uid('PRODCT'), ...data };

    patch((prev) => {
      const existe = prev.productos.some((x) => x.id === item.id);
      return {
        productos: existe
          ? prev.productos.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev.productos],
      };
    });

    guardarRegistroSupabase('productos', item);
    emitirEventoCRM('producto_guardado', item);
    return item;
  };

  const guardarCategoria = (data = {}) => {
    const item = { id: data.id || uid('CAT'), ...data };

    patch((prev) => {
      const existe = prev.categorias.some((x) => x.id === item.id);
      return {
        categorias: existe
          ? prev.categorias.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev.categorias],
      };
    });

    guardarRegistroSupabase('categorias', item);
    return item;
  };

  const guardarProveedor = (data = {}) => {
    const item = { id: data.id || uid('PROV'), ...data };

    patch((prev) => {
      const existe = prev.proveedores.some((x) => x.id === item.id);
      return {
        proveedores: existe
          ? prev.proveedores.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev.proveedores],
      };
    });

    guardarRegistroSupabase('proveedores', item);
    return item;
  };

  const guardarMaterial = (data = {}) => {
    const item = { id: data.id || uid('MAT'), ...data };

    patch((prev) => {
      const existe = prev.materiales.some((x) => x.id === item.id);
      return {
        materiales: existe
          ? prev.materiales.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev.materiales],
        inventario: existe
          ? prev.inventario.map((i) =>
              i.materialId === item.id
                ? {
                    ...i,
                    nombre: item.nombre || i.nombre,
                    unidad: item.unidad || i.unidad,
                    stockMinimo: Number(item.stockMinimo ?? i.stockMinimo ?? 0),
                    costo: Number(item.costo ?? i.costo ?? 0),
                    proveedor: item.proveedor || i.proveedor,
                    actualizado: hoyISO(),
                  }
                : i
            )
          : [
              {
                id: `INV-${item.id}`,
                materialId: item.id,
                nombre: item.nombre || 'Material',
                unidad: item.unidad || 'unidad',
                existencia: Number(item.stock || 0),
                stockMinimo: Number(item.stockMinimo || 0),
                costo: Number(item.costo || 0),
                proveedor: item.proveedor || '',
                estado: 'Activo',
                actualizado: hoyISO(),
              },
              ...prev.inventario,
            ],
      };
    });

    guardarRegistroSupabase('materiales', item);
    emitirEventoCRM('material_guardado', item);
    return item;
  };

  const guardarVendedor = (data = {}) => {
    const item = { id: data.id || uid('VEN'), ...data };

    patch((prev) => {
      const existe = prev.vendedores.some((x) => x.id === item.id);
      return {
        vendedores: existe
          ? prev.vendedores.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev.vendedores],
      };
    });

    guardarRegistroSupabase('vendedores', item);
    return item;
  };

  const guardarBanco = (data = {}) => {
    const item = { id: data.id || uid('BANCO'), ...data };

    patch((prev) => {
      const existe = prev.bancos.some((x) => x.id === item.id);
      return {
        bancos: existe
          ? prev.bancos.map((x) => (x.id === item.id ? item : x))
          : [item, ...prev.bancos],
      };
    });

    guardarRegistroSupabase('bancos', item);
    return item;
  };

  const agregarMultimedia = (data = {}) => {
    const item = {
      id: data.id || uid('MEDIA'),
      nombre: data.nombre || '',
      categoria: data.categoria || 'General',
      imagen: data.imagen || '',
      fecha: data.fecha || hoyISO(),
      estado: data.estado || 'Activo',
    };

    patch((prev) => ({
      multimedia: [item, ...(prev.multimedia || [])],
    }));

    guardarRegistroSupabase('multimedia', item);
    emitirEventoCRM('multimedia_agregada', item);
    return item;
  };

  const actualizarMultimedia = (id, cambios = {}) => {
    let actualizado = null;

    patch((prev) => ({
      multimedia: (prev.multimedia || []).map((item) => {
        if (item.id !== id) return item;
        actualizado = { ...item, ...cambios, actualizado: hoyISO() };
        return actualizado;
      }),
    }));

    if (actualizado) {
      guardarRegistroSupabase('multimedia', actualizado);
      emitirEventoCRM('multimedia_actualizada', actualizado);
    }
    return actualizado;
  };

  const eliminarMultimedia = (id) => {
    patch((prev) => ({
      multimedia: (prev.multimedia || []).filter((item) => item.id !== id),
    }));

    eliminarRegistroSupabase('multimedia', id);
    emitirEventoCRM('multimedia_eliminada', { id, unidad: 'ELANVISUAL' });
    return true;
  };

  const value = useMemo(
    () => ({
      ...state,
      cargandoSupabase,
      supabaseConectado: supabaseActivo(),
      login,
      logout,
      guardarCliente,
      actualizarCliente,
      eliminarCliente,
      guardarUsuario,
      actualizarUsuario,
      eliminarUsuario,
      guardarInventario,
      actualizarInventario,
      registrarMovimientoInventario,
      agregarCarrito,
      crearLead,
      guardarCotizacion,
      actualizarCotizacion,
      crearPedidoDesdeCotizacion,
      confirmarPedido,
      actualizarPedido,
      crearOrdenDesdePedido,
      actualizarOrden,
      actualizarEstadoOT,
      crearProduccionDesdeOT,
      actualizarProduccion,
      validarPago,
      crearComisionDesdePedido,
      guardarProducto,
      guardarCategoria,
      guardarProveedor,
      guardarMaterial,
      guardarVendedor,
      guardarBanco,
      agregarMultimedia,
      actualizarMultimedia,
      eliminarMultimedia,
    }),
    [state]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useElan() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error('useElan debe usarse dentro de ElanProvider');
  }

  return ctx;
}

export default ElanProvider;