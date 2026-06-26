import { getClienteOT, getCodigoOT, getNumeroPedido, getProyectoOT, money } from './ordenTrabajoService';

const n = (v) => Number(v || 0);

export const estadosOC = [
  'Borrador',
  'Solicitada',
  'Enviada',
  'Aceptada',
  'En proceso',
  'Recibida',
  'Facturada',
  'Pagada',
  'Cerrada',
  'Cancelada',
];

export const crearIdOC = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
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

export const normalizarProveedorOC = ({ proveedorId, proveedorManual, proveedores }) => {
  const lista = Array.isArray(proveedores) ? proveedores : [];
  const proveedor = lista.find((item) => String(item.id) === String(proveedorId));

  return {
    proveedorId: proveedor?.id || '',
    proveedor: proveedor?.nombre || proveedorManual?.trim() || '',
    proveedorContacto: proveedor?.contacto || proveedor?.whatsapp || proveedor?.telefonoAlterno || '',
    proveedorWhatsapp: proveedor?.whatsapp || '',
    proveedorCorreo: proveedor?.correo || '',
    proveedorDireccion: proveedor?.direccion || proveedor?.ubicacion || '',
    proveedorEspecialidad: proveedor?.especialidad || proveedor?.categoria || proveedor?.subcategorias || '',
  };
};

export const construirOC = ({ pedido, formOC, cantidadActual, proveedores }) => {
  const proveedorOT = normalizarProveedorOC({
    proveedorId: formOC.proveedorId,
    proveedorManual: formOC.proveedor,
    proveedores,
  });

  return {
    id: crearIdOC(),
    codigo: crearCodigoOC(pedido, cantidadActual),
    ot: getCodigoOT(pedido),
    pedidoId: pedido.id,
    numeroPedido: getNumeroPedido(pedido),
    cliente: getClienteOT(pedido),
    proyecto: getProyectoOT(pedido),
    concepto: formOC.concepto.trim(),
    categoria: formOC.categoria,
    descripcion: formOC.notas?.trim() || formOC.concepto.trim(),
    ...proveedorOT,
    monto: n(formOC.monto),
    moneda: 'USD',
    fechaSolicitud: formOC.fechaSolicitud,
    fechaEntrega: formOC.fechaEntrega,
    estado: formOC.estado || 'Borrador',
    notas: formOC.notas.trim(),
    recepcion: { estado: 'Pendiente', fecha: '', nota: '' },
    factura: { numero: '', fecha: '', monto: 0, estado: 'Pendiente' },
    pago: { estado: 'Pendiente', fecha: '', monto: 0, referencia: '' },
    creadoEn: new Date().toISOString(),
  };
};

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

export const generarHTMLOrdenCompra = ({ oc, pedido }) => {
  const codigoOT = oc.ot || getCodigoOT(pedido);
  const cliente = oc.cliente || getClienteOT(pedido);
  const proyecto = oc.proyecto || getProyectoOT(pedido);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${oc.codigo}</title>
<style>
  body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:32px;background:#f8fafc}
  .doc{max-width:820px;margin:0 auto;background:#fff;border-radius:18px;padding:28px;border:1px solid #e5e7eb}
  .head{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #111827;padding-bottom:18px}
  h1{margin:0;font-size:30px}
  h2{margin:4px 0 0;font-size:18px;color:#6b7280}
  .badge{background:#111827;color:white;border-radius:999px;padding:8px 12px;font-weight:800}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
  .box{background:#f9fafb;border-radius:14px;padding:14px}
  .box span{display:block;color:#6b7280;font-size:12px;font-weight:800;text-transform:uppercase}
  .box strong{font-size:16px}
  table{width:100%;border-collapse:collapse;margin-top:22px}
  th,td{border-bottom:1px solid #e5e7eb;padding:12px;text-align:left}
  th{background:#f9fafb}
  .total{text-align:right;font-size:22px;font-weight:900;margin-top:18px}
  .note{margin-top:24px;color:#374151;background:#f9fafb;border-left:4px solid #C9A227;padding:14px;border-radius:12px}
  @media print{body{background:#fff;padding:0}.doc{border:0;border-radius:0;max-width:none}}
</style>
</head>
<body>
  <main class="doc">
    <section class="head">
      <div>
        <h1>ELANVISUAL</h1>
        <h2>Orden de Compra</h2>
      </div>
      <div>
        <div class="badge">${oc.codigo}</div>
      </div>
    </section>

    <section class="grid">
      <div class="box"><span>Orden de Trabajo</span><strong>${codigoOT}</strong></div>
      <div class="box"><span>Pedido</span><strong>${oc.numeroPedido || getNumeroPedido(pedido)}</strong></div>
      <div class="box"><span>Cliente</span><strong>${cliente}</strong></div>
      <div class="box"><span>Proyecto</span><strong>${proyecto}</strong></div>
      <div class="box"><span>Proveedor</span><strong>${oc.proveedor || 'Proveedor pendiente'}</strong></div>
      <div class="box"><span>Contacto</span><strong>${oc.proveedorContacto || oc.proveedorWhatsapp || '-'}</strong></div>
      <div class="box"><span>Fecha solicitud</span><strong>${oc.fechaSolicitud || '-'}</strong></div>
      <div class="box"><span>Fecha entrega</span><strong>${oc.fechaEntrega || '-'}</strong></div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Servicio</th>
          <th>Categoría</th>
          <th>Descripción</th>
          <th>Monto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${oc.concepto}</td>
          <td>${oc.categoria}</td>
          <td>${oc.descripcion || oc.notas || '-'}</td>
          <td>${money(oc.monto)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total">Total OC: ${money(oc.monto)}</div>

    <div class="note">
      Esta Orden de Compra pertenece a ${codigoOT}. La recepción, factura y pago deberán registrarse dentro del módulo de Compras de ELANVISUAL ERP.
    </div>
  </main>
</body>
</html>`;
};
