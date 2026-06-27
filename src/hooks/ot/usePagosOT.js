import { useMemo, useState } from 'react';
import {
  construirActualizacionFinancieraPedido,
  construirFinanzasDesdePedido,
} from '../../services/finanzas';
import { construirTesoreriaDesdePagoPedido } from '../../services/tesoreria';

const n = (v) => Number(v || 0);

export default function usePagosOT({ pedido, actualizarPedido }) {
  const tipoCambioBase = n(
    pedido?.tipoCambioCongelado ||
      pedido?.pagos?.tipoCambioCongelado ||
      pedido?.dataOriginal?.tipoCambioCongelado ||
      pedido?.data_original?.tipoCambioCongelado ||
      36.8
  );

  const [formPago, setFormPago] = useState({
    monedaOriginal: 'C$',
    montoOriginal: '',
    tipoCambio: String(tipoCambioBase || 36.8),
    fechaDeposito: new Date().toISOString().slice(0, 10),
    formaPago: 'Transferencia',
    banco: '',
    referencia: '',
    observaciones: '',
  });

  const resumenPagos = useMemo(
    () => construirFinanzasDesdePedido(pedido || {}),
    [pedido]
  );

  const historial = useMemo(
    () => Array.isArray(resumenPagos?.historialPagos) ? resumenPagos.historialPagos : [],
    [resumenPagos]
  );

  const actualizarCampoPago = (campo, valor) =>
    setFormPago((prev) => ({ ...prev, [campo]: valor }));

  const limpiarPago = () =>
    setFormPago((prev) => ({
      ...prev,
      montoOriginal: '',
      banco: '',
      referencia: '',
      observaciones: '',
      fechaDeposito: new Date().toISOString().slice(0, 10),
    }));

  const registrarPago = () => {
    if (!pedido) {
      return { ok: false, mensaje: 'No hay pedido seleccionado.' };
    }

    const montoOriginal = n(formPago.montoOriginal);
    if (montoOriginal <= 0) {
      return { ok: false, mensaje: 'Indicá un monto válido.' };
    }

    const tipoCambio = n(
      formPago.tipoCambio || resumenPagos.tipoCambioCongelado || 36.8
    );

    if (tipoCambio <= 0) {
      return { ok: false, mensaje: 'El tipo de cambio no es válido.' };
    }

    const { nuevoPago, patchPedido } =
      construirActualizacionFinancieraPedido(pedido, {
        ...formPago,
        montoOriginal,
        tipoCambio,
      });

    const tesoreria = construirTesoreriaDesdePagoPedido({
      pedido: { ...pedido, ...patchPedido },
      pago: nuevoPago,
    });

    actualizarPedido?.({
      ...pedido,
      ...patchPedido,
      ...tesoreria.patchPedido,
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
