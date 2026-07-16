import { createQuotationDocument } from '../contracts/quotationDocument';
import { elanvisualBrand, getActivePaymentAccounts } from '../config/elanvisualBrand';

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function adaptElanvisualQuote(source = {}) {
  const sourceItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.productos)
      ? source.productos
      : [];

  const items = sourceItems.map((item, index) => {
    const quantity = number(item.quantity ?? item.cantidad, 1);
    const unitPrice = number(item.unitPrice ?? item.precioUnitario ?? item.precio, 0);
    const subtotal = number(item.subtotal, quantity * unitPrice);
    const images = Array.isArray(item.images)
      ? item.images
      : item.imagen
        ? [{ role: 'primary', url: item.imagen, alt: item.nombre || item.title || `Ítem ${index + 1}` }]
        : [];

    return {
      id: item.id || `item-${index + 1}`,
      title: item.title || item.nombre || item.producto || `Ítem ${index + 1}`,
      commercialDescription: item.commercialDescription || item.descripcionComercial || item.descripcion || '',
      quantity,
      unit: item.unit || item.unidad || 'unidad',
      unitPrice,
      subtotal,
      discount: number(item.discount ?? item.descuento, 0),
      tax: number(item.tax ?? item.iva, 0),
      dimensions: item.dimensions || item.medidas || null,
      features: item.features || item.caracteristicas || [],
      images,
      publicNotes: item.publicNotes || item.notasPublicas || []
    };
  });

  const totalsSource = source.totals || source.total || {};
  const subtotal = number(totalsSource.subtotal ?? source.subtotal, items.reduce((sum, item) => sum + item.subtotal, 0));
  const discount = number(totalsSource.discount ?? totalsSource.descuento ?? source.descuento, 0);
  const tax = number(totalsSource.tax ?? totalsSource.iva ?? source.iva, 0);
  const total = number(totalsSource.total ?? source.totalCliente ?? source.precio_b, subtotal - discount + tax);

  return createQuotationDocument({
    platformId: 'ELANVISUAL',
    quotationNumber: source.quotationNumber || source.codigo || source.numero || 'COT-PENDIENTE',
    status: source.status || source.estado || 'draft',
    currency: source.currency || source.moneda || 'USD',
    issuedAt: source.issuedAt || source.fecha || source.created_at?.slice?.(0, 10),
    validUntil: source.validUntil || source.vigenciaHasta || '',
    customer: {
      id: source.customer?.id || source.clienteId || '',
      name: source.customer?.name || source.cliente_nombre || source.cliente?.nombre || 'Cliente',
      companyName: source.customer?.companyName || source.empresa || source.cliente?.empresa || '',
      taxId: source.customer?.taxId || source.rucCliente || '',
      phone: source.customer?.phone || source.celular || source.telefono || '',
      email: source.customer?.email || source.correo || '',
      address: source.customer?.address || source.ubicacion || source.direccion || ''
    },
    advisor: {
      name: source.advisor?.name || source.asesorNombre || '',
      phone: source.advisor?.phone || source.asesorTelefono || ''
    },
    project: {
      title: source.project?.title || source.proyecto || source.biblioteca_nombre || 'Proyecto visual',
      summary: source.project?.summary || source.descripcion || '',
      category: source.project?.category || source.categoria || '',
      location: source.project?.location || source.ubicacion || '',
      estimatedDelivery: source.project?.estimatedDelivery || source.tiempoEntrega || '',
      warranty: source.project?.warranty || source.garantia || '',
      heroImage: source.project?.heroImage || source.imagenPrincipal || null
    },
    items,
    totals: {
      subtotalGross: number(totalsSource.subtotalGross ?? totalsSource.subtotalBruto, subtotal),
      discount,
      subtotal,
      taxRate: number(totalsSource.taxRate ?? totalsSource.porcentajeIva, 0),
      tax,
      total,
      currency: source.currency || source.moneda || 'USD',
      exchangeRate: number(totalsSource.exchangeRate ?? source.tipoCambio, 0),
      convertedTotal: number(totalsSource.convertedTotal ?? source.totalNio, 0)
    },
    paymentTerms: source.paymentTerms || source.formaPago || { type: '60_40', installments: [] },
    paymentAccountsSnapshot: source.paymentAccountsSnapshot || getActivePaymentAccounts(elanvisualBrand),
    publicNotes: source.publicNotes || source.notas || [],
    digitalLinks: {
      platformUrl: elanvisualBrand.website,
      ecosystemUrl: elanvisualBrand.ecosystemUrl
    },
    template: source.template
  });
}
