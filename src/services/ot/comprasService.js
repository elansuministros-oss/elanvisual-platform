import { getCodigoOT } from './ordenTrabajoService';

const n = (v) => Number(v || 0);

export const estadosOC = [
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

export const crearIdOC = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `oc-${Date.now()}`;
};

export const limpiarCodigoBaseOT = (codigoOT) => {
  const limpio = String(codigoOT || 'OT-000000').replace(/^OT-/i, '');
  return limpio || '000000';
};

export const crearCodigoOC = (pedido, cantidadActual) => {
  const base = limpiarCodigoBaseOT(getCodigoOT(pedido));
  const secuencia = String(cantidadActual + 1).padStart(2, '0');
  return `OC-${base}-${secuencia}`;
};

export const construirOC = ({ pedido, formOC, cantidadActual }) => ({
  id: crearIdOC(),
  codigo: crearCodigoOC(pedido, cantidadActual),
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
});

export const calcularResumenCompras = (ordenesCompra) => {
  const lista = Array.isArray(ordenesCompra) ? ordenesCompra : [];

  const total = lista.reduce((sum, oc) => sum + n(oc.monto), 0);
  const pagado = lista
    .filter((oc) => oc.estado === 'Pagada' || oc.pago?.estado === 'Pagado')
    .reduce((sum, oc) => sum + n(oc.monto), 0);

  return {
    total,
    cantidad: lista.length,
    pagado,
    pendiente: Math.max(total - pagado, 0),
  };
};

export const construirRecepcionOC = () => ({
  estado: 'Recibida',
  fecha: new Date().toISOString().slice(0, 10),
  nota: 'Recepción registrada desde OT Compras.',
});

export const construirFacturaOC = (montoFactura) => ({
  numero: '',
  fecha: new Date().toISOString().slice(0, 10),
  monto: n(montoFactura),
  estado: 'Facturada',
});

export const construirPagoOC = (montoPago) => ({
  estado: 'Pagado',
  fecha: new Date().toISOString().slice(0, 10),
  monto: n(montoPago),
  referencia: '',
});
