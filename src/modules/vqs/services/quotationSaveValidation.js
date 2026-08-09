function text(value) {
  return String(value ?? '').trim();
}

export function getQuotationSaveIssues({
  customerName,
  projectTitle,
  exchangeRate,
  items = [],
  paymentPercentTotal
} = {}) {
  const issues = [];

  if (!text(customerName)) issues.push('nombre del cliente');
  if (!text(projectTitle)) issues.push('nombre del proyecto');
  if (!(Number(exchangeRate) > 0)) issues.push('tipo de cambio válido');

  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const label = `ítem ${index + 1}`;
    if (!text(item?.title)) issues.push(`producto del ${label}`);
    if (!(Number(item?.quantity) > 0)) issues.push(`cantidad del ${label}`);
    if (!(Number(item?.unitPriceUsd) >= 0)) issues.push(`precio del ${label}`);
  });

  if (!Array.isArray(items) || items.length === 0) issues.push('al menos un producto');
  if (Math.abs(Number(paymentPercentTotal) - 100) >= 0.001) {
    issues.push('cuotas de pago que sumen 100%');
  }

  return [...new Set(issues)];
}
