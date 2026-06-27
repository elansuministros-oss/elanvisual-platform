export function calcularResumenCaja(movimientos = []) {
  const lista = Array.isArray(movimientos) ? movimientos : [];

  const ingresosCordobas = lista
    .filter((m) => m.tipo === 'Ingreso' && m.estado !== 'Anulado')
    .reduce((total, m) => total + Number(m.montoCordobas || m.monto || 0), 0);

  const egresosCordobas = lista
    .filter((m) => m.tipo === 'Egreso' && m.estado !== 'Anulado')
    .reduce((total, m) => total + Number(m.montoCordobas || m.monto || 0), 0);

  const ingresosUSD = lista
    .filter((m) => m.tipo === 'Ingreso' && m.estado !== 'Anulado')
    .reduce((total, m) => total + Number(m.montoUSD || 0), 0);

  const egresosUSD = lista
    .filter((m) => m.tipo === 'Egreso' && m.estado !== 'Anulado')
    .reduce((total, m) => total + Number(m.montoUSD || 0), 0);

  return {
    ingresosCordobas,
    egresosCordobas,
    saldoCordobas: ingresosCordobas - egresosCordobas,
    ingresosUSD,
    egresosUSD,
    saldoUSD: ingresosUSD - egresosUSD,
    movimientos: lista.length,
  };
}
