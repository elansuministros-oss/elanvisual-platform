import { useMemo, useState } from 'react';
import { getSaldoOT, getTotalOT } from '../../services/ot/ordenTrabajoService';
import {
  calcularPagadoDesdeHistorial,
  construirPagoOT,
  convertirPagoAUSD,
} from '../../services/ot/pagosService';

const n = (v) => Number(v || 0);

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
      pagado: calcularPagadoDesdeHistorial(historial),
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

    const pago = construirPagoOT(formPago);
    const historialActualizado = [...historial, pago];
    const pagadoActualizado = calcularPagadoDesdeHistorial(historialActualizado);

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
      anticipoRecibido: pagadoActualizado,
      saldoPendiente: saldo,
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

