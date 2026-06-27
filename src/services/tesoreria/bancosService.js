const n = (valor) => Number(valor || 0);

export function normalizarCuentaBancaria(cuenta = {}) {
  return {
    id: cuenta.id || `cuenta-${Date.now()}`,
    banco: cuenta.banco || '',
    numero: cuenta.numero || cuenta.cuenta || '',
    titular: cuenta.titular || '',
    moneda: cuenta.moneda || 'C$',
    saldoInicial: n(cuenta.saldoInicial),
    activo: cuenta.activo !== false,
  };
}

export function aplicarMovimientoACuenta(cuenta = {}, movimiento = {}) {
  const cuentaNormalizada = normalizarCuentaBancaria(cuenta);
  const monto =
    cuentaNormalizada.moneda === 'USD'
      ? n(movimiento.montoUSD)
      : n(movimiento.montoCordobas || movimiento.monto);

  const signo = movimiento.tipo === 'Egreso' ? -1 : 1;

  return {
    ...cuentaNormalizada,
    saldoCalculado: n(cuentaNormalizada.saldoCalculado ?? cuentaNormalizada.saldoInicial) + signo * monto,
    actualizadoEn: new Date().toISOString(),
  };
}
