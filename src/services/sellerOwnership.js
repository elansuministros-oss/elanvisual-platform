export function sellerIdentityValues(usuario = {}) {
  return [
    usuario.vendedorId,
    usuario.vendedor_id,
    usuario.id,
    usuario.codigoVendedor,
    usuario.codigo_vendedor,
    usuario.codigoQR,
    usuario.usuario,
    usuario.email,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

function recordSellerValues(record = {}) {
  return [
    record.vendedorId,
    record.vendedor_id,
    record.sellerId,
    record.seller_id,
    record.executiveId,
    record.executive_id,
    record.vendedorCodigo,
    record.codigoVendedor,
    record.codigo_vendedor,
    record.vendedor?.id,
    record.vendedor?.vendedorId,
    record.vendedor?.codigo,
    record.vendedor?.codigoVendedor,
    record.comision?.vendedorId,
    record.comision?.vendedorCodigo,
    record.comisiones?.vendedorId,
    record.quotation?.executiveId,
    record.cotizacion?.executiveId,
    record.cotizacion?.vendedorId,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

export function belongsToSeller(record, usuario) {
  if (!record || !usuario || usuario.rol !== 'ventas') return false;
  const sellerValues = new Set(sellerIdentityValues(usuario));
  if (!sellerValues.size) return false;
  return recordSellerValues(record).some((value) => sellerValues.has(value));
}

export function filterForSeller(records, usuario) {
  const list = Array.isArray(records) ? records : [];
  if (usuario?.rol !== 'ventas') return list;
  return list.filter((record) => belongsToSeller(record, usuario));
}
