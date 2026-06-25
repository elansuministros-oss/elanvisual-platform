const n = (v) => Number(v || 0);

export const crearIdPago = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pago-${Date.now()}`;
};

export const convertirPagoAUSD = ({ moneda, monto, tipoCambio }) => {
  const valor = n(monto);

  if (moneda === 'USD') return valor;

  const cambio = n(tipoCambio);
  if (cambio <= 0) return 0;

  return valor / cambio;
};

export const construirPagoOT = (formPago) => {
  const montoOriginal = n(formPago.monto);
  const montoUSD = convertirPagoAUSD(formPago);

  return {
    id: crearIdPago(),
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
};

export const calcularPagadoDesdeHistorial = (historial) => {
  const lista = Array.isArray(historial) ? historial : [];

  return lista.reduce((total, item) => total + n(item.montoUSD || item.monto || 0), 0);
};
