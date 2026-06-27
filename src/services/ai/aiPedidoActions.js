const normalizar = (valor = '') =>
  String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const n = (valor) => Number(valor || 0);

export function buscarPedidoOT({ texto = '', pedidos = [] }) {
  const q = normalizar(texto);
  const palabras = q.split(/[^a-z0-9]+/).filter((p) => p.length >= 3);

  const resultados = pedidos
    .map((pedido) => {
      const bloque = normalizar([
        pedido.id,
        pedido.numero,
        pedido.codigoSeguimiento,
        pedido.numeroOT,
        pedido.ordenTrabajo?.codigoOT,
        pedido.cliente?.nombre,
        pedido.cliente?.empresa,
        pedido.items?.map((i) => `${i.nombre} ${i.descripcion}`).join(' '),
        pedido.ordenTrabajo?.producto,
        pedido.ordenTrabajo?.observaciones,
      ].filter(Boolean).join(' '));

      const puntos = palabras.reduce((total, palabra) => total + (bloque.includes(palabra) ? 1 : 0), 0);
      return { pedido, puntos };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);

  return {
    ok: resultados.length > 0,
    requiereConfirmacion: resultados.length > 1 && resultados[0].puntos === resultados[1].puntos,
    pedido: resultados[0]?.pedido || null,
    resultados: resultados.map((x) => x.pedido).slice(0, 5),
  };
}

export function buscarProveedor({ texto = '', proveedores = [] }) {
  const q = normalizar(texto);
  const palabras = q.split(/[^a-z0-9]+/).filter((p) => p.length >= 3);

  const resultados = proveedores
    .map((proveedor) => {
      const bloque = normalizar([
        proveedor.id,
        proveedor.nombre,
        proveedor.razonSocial,
        proveedor.categoria,
        proveedor.subcategorias,
        proveedor.contacto,
      ].filter(Boolean).join(' '));

      const puntos = palabras.reduce((total, palabra) => total + (bloque.includes(palabra) ? 1 : 0), 0);
      return { proveedor, puntos };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);

  return {
    ok: resultados.length > 0,
    proveedor: resultados[0]?.proveedor || null,
    resultados: resultados.map((x) => x.proveedor).slice(0, 5),
  };
}

export function registrarCostoOT({
  pedido,
  proveedor = null,
  costos = {},
  actualizarPedido,
  calcularCostoReal,
  calcularUtilidadReal,
  usuario = null,
  nota = '',
}) {
  if (!pedido?.id) return { ok: false, error: 'PEDIDO_NO_VALIDO' };
  if (typeof actualizarPedido !== 'function') return { ok: false, error: 'ACTUALIZAR_PEDIDO_NO_DISPONIBLE' };

  const prev = pedido.costos || {};
  const actualizados = {
    ...prev,
    costoInventario: n(prev.costoInventario) + n(costos.costoInventario),
    costoProveedor: n(prev.costoProveedor || prev.realProveedor) + n(costos.costoProveedor),
    costoImpresion: n(prev.costoImpresion) + n(costos.costoImpresion),
    costoEstructura: n(prev.costoEstructura) + n(costos.costoEstructura),
    costoTransporte: n(prev.costoTransporte) + n(costos.costoTransporte),
    costoInstalacion: n(prev.costoInstalacion) + n(costos.costoInstalacion),
    costoAdministracion: n(prev.costoAdministracion) + n(costos.costoAdministracion),
  };

  const costoTotalReal =
    n(actualizados.costoInventario) +
    n(actualizados.costoProveedor) +
    n(actualizados.costoImpresion) +
    n(actualizados.costoEstructura) +
    n(actualizados.costoTransporte) +
    n(actualizados.costoInstalacion) +
    n(actualizados.costoAdministracion);

  actualizados.costoTotalReal = costoTotalReal;
  actualizados.actualizadoEn = new Date().toISOString();

  const ventaCliente = n(pedido.resumen?.total || pedido.total || pedido.totalUSDReferencia);
  const utilidadReal = ventaCliente - costoTotalReal;
  const porcentajeUtilidad = ventaCliente > 0 ? (utilidadReal / ventaCliente) * 100 : 0;
  const otId = pedido.ordenTrabajo?.codigoOT || pedido.numeroOT || pedido.codigoSeguimiento || pedido.id;

  const costoRegistro = typeof calcularCostoReal === 'function'
    ? calcularCostoReal({ otId, ...actualizados })
    : null;

  const utilidadRegistro = typeof calcularUtilidadReal === 'function'
    ? calcularUtilidadReal({ otId, ventaCliente, costoReal: costoTotalReal })
    : null;

  const historial = {
    estado: 'ai_registro_costo_ot',
    fecha: new Date().toISOString(),
    usuarioId: usuario?.id || null,
    usuarioNombre: usuario?.nombre || usuario?.usuario || usuario?.email || 'ELAN AI',
    proveedorId: proveedor?.id || null,
    proveedorNombre: proveedor?.nombre || '',
    costosRegistrados: costos,
    costoTotalReal,
    utilidadReal,
    nota: nota || 'Costo registrado por ELAN AI.',
  };

  const actualizado = {
    ...pedido,
    costos: actualizados,
    utilidad: {
      ...(pedido.utilidad || {}),
      ventaCliente,
      costoReal: costoTotalReal,
      utilidadReal,
      porcentajeUtilidad,
      costoRegistroId: costoRegistro?.id,
      utilidadRegistroId: utilidadRegistro?.id,
    },
    costeoReal: {
      ...(pedido.costeoReal || {}),
      proveedorId: proveedor?.id || pedido.costeoReal?.proveedorId || '',
      proveedorNombre: proveedor?.nombre || pedido.costeoReal?.proveedorNombre || '',
      actualizadoEn: new Date().toISOString(),
      actualizadoPor: 'ELAN AI',
    },
    historial: [...(pedido.historial || []), historial],
  };

  actualizarPedido(actualizado);

  return {
    ok: true,
    pedido: actualizado,
    costoTotalReal,
    utilidadReal,
    historial,
  };
}
