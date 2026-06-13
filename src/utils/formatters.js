export function currency(value = 0) {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function number(value = 0) {
  return new Intl.NumberFormat('es-NI').format(Number(value || 0));
}

export function shortDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-NI');
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}