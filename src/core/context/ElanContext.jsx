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

const inicial = {
  categorias: categoriasIniciales || [],
  productos: productosIniciales || [],
  proveedores: proveedoresIniciales || [],
  materiales: materialesIniciales || [],
  vendedores: vendedoresIniciales || [],
  banners: bannersIniciales || [],
  bancos: bancosIniciales || [],
  estadosProduccion: estadosProduccion || [],
  usuarios: usuariosIniciales || [],
  clientes: [],
  leads: [],
  cotizaciones: [],
  pedidos: [],
  pagos: [],
  ordenes: [],
  producciones: [],
  comisiones: [],
  showroom: [],
  carrito: [],
  sesion: null,
};

function uid(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function hoyISO() {
  return new Date().toISOString();
}

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
    return { ...inicial, ...JSON.parse(raw) };
  } catch {
    return inicial;
  }
}

export function ElanProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state]);

  const patch = (updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  };

  const login = (usuario) => patch({ sesion: usuario });

  const logout = () => patch({ sesion: null });

  const agregarCarrito = (producto, cantidad = 1) => {
    const item = {
      id: uid('CART'),
      productoId: producto?.id,
      nombre: producto?.nombre || 'Producto',
      precio: Number(producto?.precio || 0),
      cantidad: Number(cantidad || 1),
      fecha: hoyISO(),
    };

    patch((prev) => ({
      carrito: [...prev.carrito, item],
    }));

    emitirEventoCRM('carrito_agregado', item);
    return item;
  };

  const crearLead = (data = {}) => {
    const lead = {
      id: uid('LEAD'),
      fecha: hoyISO(),
      estado: data.estado || 'Nuevo',
      origen: data.origen || 'ELANVISUAL',
      unidad: 'ELANVISUAL',
      ...data,
    };

    patch((prev) => ({
      leads: [lead, ...prev.leads],
    }));

    emitirEventoCRM('lead_creado', lead);
    return lead;
  };

  const guardarCotizacion = (data = {}) => {
    const cotizacion = {
      id: data.id || uid('COT'),
      codigo: data.codigo || `COT-${Date.now()}`,
      fecha: data.fecha || hoyISO(),
      estado: data.estado || 'Borrador',
      unidad: 'ELANVISUAL',
      items: data.items || [],
      subtotal: Number(data.subtotal || 0),
      descuento: Number(data.descuento || 0),
      iva: Number(data.iva || 0),
      total: Number(data.total || 0),
      clienteId: data.clienteId || '',
      clienteNombre: data.clienteNombre || data.cliente || '',
      vendedorId: data.vendedorId || '',
      notas: data.notas || '',
      ...data,
    };

    patch((prev) => {
      const existe = prev.cotizaciones.some((c) => c.id === cotizacion.id);
      return {
        cotizaciones: existe
          ? prev.cotizaciones.map((c) =>
              c.id === cotizacion.id ? { ...c, ...cotizacion } : c
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

    const total = Number(cotizacion.total || 0);
    const anticipo = Number(extras.anticipo || 0);

    const pedido = {
      id: uid('PED'),
      codigo: `PED-${Date.now()}`,
      fecha: hoyISO(),
      estado: 'Nuevo',
      unidad: 'ELANVISUAL',
      cotizacionId,
      clienteId: cotizacion.clienteId || '',
      clienteNombre: cotizacion.clienteNombre || cotizacion.cliente || '',
      vendedorId: cotizacion.vendedorId || '',
      items: cotizacion.items || [],
      subtotal: Number(cotizacion.subtotal || 0),
      iva: Number(cotizacion.iva || 0),
      total,
      pagado: anticipo,
      saldo: Math.max(total - anticipo, 0),
      anticipo,
      notas: extras.notas || cotizacion.notas || '',
      ...extras,
    };

    patch((prev) => ({
      pedidos: [pedido, ...prev.pedidos],
      cotizaciones: prev.cotizaciones.map((c) =>
        c.id === cotizacionId
          ? { ...c, estado: 'Convertida a pedido', pedidoId: pedido.id }
          : c
      ),
    }));

    emitirEventoCRM('pedido_creado_desde_cotizacion', pedido);
    return pedido;
  };

  const confirmarPedido = (data = {}) => {
    const pedido = {
      id: data.id || uid('PED'),
      codigo: data.codigo || `PED-${Date.now()}`,
      fecha: hoyISO(),
      estado: data.estado || 'Nuevo',
      unidad: 'ELANVISUAL',
      items: data.items || state.carrito || [],
      total: Number(data.total || 0),
      saldo: Number(data.saldo ?? data.total ?? 0),
      pagado: Number(data.pagado || 0),
      ...data,
    };

    patch((prev) => ({
      pedidos: [pedido, ...prev.pedidos],
      carrito: [],
    }));

    emitirEventoCRM('pedido_confirmado', pedido);
    return pedido;
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
        p.id === pedidoId
          ? { ...p, estado: 'En orden de trabajo', ordenId: orden.id }
          : p
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
        o.id === ordenId
          ? { ...o, estado: 'En producción', produccionId: produccion.id }
          : o
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

        return {
          ...p,
          pagado,
          saldo,
          estadoPago: saldo <= 0 ? 'Pagado' : 'Abono recibido',
        };
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
        p.id === pedidoId
          ? { ...p, comisionId: comision.id, comisionGenerada: true }
          : p
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
      };
    });

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

    return item;
  };

  const value = useMemo(
    () => ({
      ...state,

      login,
      logout,

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