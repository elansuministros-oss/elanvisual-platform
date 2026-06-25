import { useMemo, useState } from 'react';
import {
  calcularResumenCompras,
  construirFacturaOC,
  construirOC,
  construirPagoOC,
  construirRecepcionOC,
  estadosOC,
} from '../../services/ot/comprasService';

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
    return calcularResumenCompras(ordenesCompra);
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

    const nuevaOC = construirOC({
      pedido,
      formOC,
      cantidadActual: ordenesCompra.length,
    });

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
      recepcion: construirRecepcionOC(),
    });
  };

  const registrarFactura = (ocId, montoFactura) => {
    actualizarOC(ocId, {
      estado: 'Facturada',
      factura: construirFacturaOC(montoFactura),
    });
  };

  const registrarPago = (ocId, montoPago) => {
    actualizarOC(ocId, {
      estado: 'Pagada',
      pago: construirPagoOC(montoPago),
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
