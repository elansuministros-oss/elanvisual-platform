import { useMemo, useState } from 'react';
import { getPagadoOT, getSaldoOT, getTotalOT } from './useOrdenTrabajo';

const n = (v) => Number(v || 0);

const crearId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pago-${Date.now()}`;
};

const convertirPagoAUSD = ({ moneda, monto, tipoCambio }) => {
  const valor = n(monto);

  if (moneda === 'USD') return valor;

  const cambio = n(tipoCambio);
  if (cambio <= 0) return 0;

  return valor / cambio;
};

export default function usePagosOT({ pedido, actualizarPedido }) {
  const [formPago, setFormPago] = useState({
    moneda: 'NIO',
    monto: '',
    tipoCambio: '36.80',
    fecha: new Date().toISOString().slice(0, 10),
    forma: 'Transferencia',
    banco: '',
    referencia: '',
    observaciones: '',
  });

  const historial = useMemo(() => {
    return Array.isArray(pedido?.pagos?.historial) ? pedido.pagos.historial : [];
  }, [pedido]);

  const resumenPagos = useMemo(() => {
    return {
      total: getTotalOT(pedido),
      pagado: getPagadoOT(pedido),
      saldo: getSaldoOT(pedido),
      historial,
    };
  }, [pedido, historial]);

  const actualizarCampoPago = (campo, valor) => {
    setFormPago((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limpiarPago = () => {
    setFormPago((prev) => ({
      ...prev,
      monto: '',
      banco: '',
      referencia: '',
      observaciones: '',
      fecha: new Date().toISOString().slice(0, 10),
    }));
  };

  const registrarPago = () => {
    if (!pedido) return { ok: false, mensaje: 'No hay pedido seleccionado.' };

    const montoOriginal = n(formPago.monto);
    if (montoOriginal <= 0) {
      return { ok: false, mensaje: 'Indicá un monto válido.' };
    }

    const montoUSD = convertirPagoAUSD(formPago);
    if (montoUSD <= 0) {
      return { ok: false, mensaje: 'El tipo de cambio no es válido.' };
    }

    const pago = {
      id: crearId(),
      fecha: formPago.fecha,
      moneda: formPago.moneda,
      monto: montoOriginal,
      montoUSD,
      tipoCambio: formPago.moneda === 'USD' ? 1 : n(formPago.tipoCambio),
      forma: formPago.forma,
      banco: formPago.banco,
      referencia: formPago.referencia,
      observaciones: formPago.observaciones,
      registradoEn: new Date().toISOString(),
    };

    const historialActualizado = [...historial, pago];
    const pagadoActualizado = historialActualizado.reduce(
      (total, item) => total + n(item.montoUSD || item.monto || 0),
      0
    );

    const total = getTotalOT(pedido);
    const saldo = Math.max(total - pagadoActualizado, 0);

    actualizarPedido?.(pedido.id, {
      pagos: {
        ...(pedido.pagos || {}),
        historial: historialActualizado,
        pagadoUSD: pagadoActualizado,
        saldoUSD: saldo,
        actualizadoEn: new Date().toISOString(),
      },
    });

    limpiarPago();

    return { ok: true, mensaje: 'Pago registrado correctamente.' };
  };

  return {
    formPago,
    historial,
    resumenPagos,
    actualizarCampoPago,
    registrarPago,
  };
}
