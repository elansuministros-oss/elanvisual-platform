import { useMemo, useState } from 'react';
import { getCodigoOT } from './useOrdenTrabajo';

const n = (v) => Number(v || 0);

const estadosOC = [
  'Pendiente',
  'Solicitada',
  'Cotizada',
  'Aprobada',
  'En proceso',
  'Recibida',
  'Facturada',
  'Pagada',
  'Cerrada',
];

const crearId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `oc-${Date.now()}`;
};

const limpiarCodigoBase = (codigoOT) => {
  const limpio = String(codigoOT || 'OT-000000').replace(/^OT-/i, '');
  return limpio || '000000';
};

const crearCodigoOC = (pedido, cantidadActual) => {
  const base = limpiarCodigoBase(getCodigoOT(pedido));
  const secuencia = String(cantidadActual + 1).padStart(2, '0');
  return `OC-${base}-${secuencia}`;
};

export default function useComprasOT({ pedido, actualizarPedido }) {
  const [formOC, setFormOC] = useState({
    concepto: '',
    categoria: 'Impresión',
    proveedor: '',
    monto: '',
    fechaSolicitud: new Date().toISOString().slice(0, 10),
    fechaEntrega: '',
    estado: 'Pendiente',
    notas: '',
  });

  const ordenesCompra = useMemo(() => {
    return Array.isArray(pedido?.compras?.ordenesCompra)
      ? pedido.compras.ordenesCompra
      : [];
  }, [pedido]);

  const resumenCompras = useMemo(() => {
    const total = ordenesCompra.reduce((sum, oc) => sum + n(oc.monto), 0);
    const pagado = ordenesCompra
      .filter((oc) => oc.estado === 'Pagada' || oc.pago?.estado === 'Pagado')
      .reduce((sum, oc) => sum + n(oc.monto), 0);

    return {
      total,
      cantidad: ordenesCompra.length,
      pagado,
      pendiente: Math.max(total - pagado, 0),
    };
  }, [ordenesCompra]);

  const actualizarCampoOC = (campo, valor) => {
    setFormOC((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limpiarOC = () => {
    setFormOC({
      concepto: '',
      categoria: 'Impresión',
      proveedor: '',
      monto: '',
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      fechaEntrega: '',
      estado: 'Pendiente',
      notas: '',
    });
  };

  const guardarOrdenes = (ordenesActualizadas) => {
    actualizarPedido?.(pedido.id, {
      compras: {
        ...(pedido.compras || {}),
        ordenesCompra: ordenesActualizadas,
        actualizadoEn: new Date().toISOString(),
      },
    });
  };

  const crearOC = () => {
    if (!pedido) return { ok: false, mensaje: 'No hay OT seleccionada.' };

    if (!formOC.concepto.trim()) {
      return { ok: false, mensaje: 'Indicá el concepto de la Orden de Compra.' };
    }

    const nuevaOC = {
      id: crearId(),
      codigo: crearCodigoOC(pedido, ordenesCompra.length),
      ot: getCodigoOT(pedido),
      concepto: formOC.concepto.trim(),
      categoria: formOC.categoria,
      proveedor: formOC.proveedor.trim(),
      monto: n(formOC.monto),
      fechaSolicitud: formOC.fechaSolicitud,
      fechaEntrega: formOC.fechaEntrega,
      estado: formOC.estado,
      notas: formOC.notas.trim(),
      recepcion: {
        estado: 'Pendiente',
        fecha: '',
        nota: '',
      },
      factura: {
        numero: '',
        fecha: '',
        monto: 0,
        estado: 'Pendiente',
      },
      pago: {
        estado: 'Pendiente',
        fecha: '',
        monto: 0,
        referencia: '',
      },
      creadoEn: new Date().toISOString(),
    };

    guardarOrdenes([...ordenesCompra, nuevaOC]);
    limpiarOC();

    return { ok: true, mensaje: `${nuevaOC.codigo} creada correctamente.` };
  };

  const actualizarOC = (ocId, cambios) => {
    if (!pedido) return;

    const ordenesActualizadas = ordenesCompra.map((oc) =>
      oc.id === ocId
        ? {
            ...oc,
            ...cambios,
            actualizadoEn: new Date().toISOString(),
          }
        : oc
    );

    guardarOrdenes(ordenesActualizadas);
  };

  const registrarRecepcion = (ocId) => {
    actualizarOC(ocId, {
      estado: 'Recibida',
      recepcion: {
        estado: 'Recibida',
        fecha: new Date().toISOString().slice(0, 10),
        nota: 'Recepción registrada desde OT Compras.',
      },
    });
  };

  const registrarFactura = (ocId, montoFactura) => {
    const monto = n(montoFactura);

    actualizarOC(ocId, {
      estado: 'Facturada',
      factura: {
        numero: '',
        fecha: new Date().toISOString().slice(0, 10),
        monto,
        estado: 'Facturada',
      },
    });
  };

  const registrarPago = (ocId, montoPago) => {
    const monto = n(montoPago);

    actualizarOC(ocId, {
      estado: 'Pagada',
      pago: {
        estado: 'Pagado',
        fecha: new Date().toISOString().slice(0, 10),
        monto,
        referencia: '',
      },
    });
  };

  return {
    estadosOC,
    formOC,
    ordenesCompra,
    resumenCompras,
    actualizarCampoOC,
    crearOC,
    actualizarOC,
    registrarRecepcion,
    registrarFactura,
    registrarPago,
  };
}
