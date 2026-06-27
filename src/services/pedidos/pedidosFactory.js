export function normalizarWhatsAppNicaragua(numero) {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (!limpio) return '';
  if (limpio.length === 8) return `505${limpio}`;
  if (limpio.startsWith('505') && limpio.length === 11) return limpio;
  return limpio;
}

export function whatsappValidoNicaragua(numero) {
  const limpio = normalizarWhatsAppNicaragua(numero);
  return limpio.startsWith('505') && limpio.length === 11;
}

export function codigoVendedorElanvisual(usuario = {}) {
  if (usuario.codigoVendedor) return usuario.codigoVendedor;
  if (usuario.codigoQR) return usuario.codigoQR;
  if (usuario.usuario === 'admin') return 'ERICK-001';

  if (usuario.rol === 'ventas') {
    return `VEN-${String(usuario.usuario || usuario.id || '001')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')}`;
  }

  return String(usuario.id || 'USR-001').toUpperCase();
}

export function obtenerReferenciaVendedorElanvisual({
  usuarios = [],
  usuarioActivo = null,
  referenciaVendedor = '',
}) {
  const ref = String(referenciaVendedor || '').trim();

  const buscar = (valor) => {
    const normal = String(valor || '').toLowerCase().trim();
    if (!normal) return null;

    return usuarios.find((u) => {
      const codigo = codigoVendedorElanvisual(u).toLowerCase();
      return (
        codigo === normal ||
        String(u.usuario || '').toLowerCase() === normal ||
        String(u.email || '').toLowerCase() === normal ||
        String(u.id || '').toLowerCase() === normal
      );
    });
  };

  const desdeRef = buscar(ref);

  if (desdeRef) {
    return {
      id: desdeRef.id,
      nombre: desdeRef.nombre || desdeRef.usuario || desdeRef.email,
      usuario: desdeRef.usuario,
      email: desdeRef.email,
      codigo: codigoVendedorElanvisual(desdeRef),
      rol: desdeRef.rol,
    };
  }

  if (usuarioActivo?.rol === 'ventas' || usuarioActivo?.usuario === 'admin') {
    return {
      id: usuarioActivo.id,
      nombre: usuarioActivo.nombre || usuarioActivo.usuario || usuarioActivo.email,
      usuario: usuarioActivo.usuario,
      email: usuarioActivo.email,
      codigo: codigoVendedorElanvisual(usuarioActivo),
      rol: usuarioActivo.rol,
    };
  }

  return null;
}

export function crearComisionInicialElanvisual({ total = 0, costoProduccion = 0, vendedor = null }) {
  const venta = Number(total || 0);
  const costo = Number(costoProduccion || 0);
  const utilidadRealEstimada = Math.max(venta - costo, 0);
  const fondoComunitario = utilidadRealEstimada * 0.05;
  const direccionGeneral = utilidadRealEstimada * 0.05;
  const baseDistribuible = Math.max(utilidadRealEstimada - fondoComunitario - direccionGeneral, 0);
  const comisionVendedor = vendedor ? baseDistribuible * 0.4 : 0;
  const elanvisual = baseDistribuible - comisionVendedor;
  const fondoIncentivoVendedor = vendedor ? elanvisual * 0.05 : 0;

  return {
    estado: 'en_proceso',
    vendedorId: vendedor?.id || '',
    vendedorCodigo: vendedor?.codigo || '',
    vendedorNombre: vendedor?.nombre || '',
    utilidadRealEstimada,
    fondoComunitario,
    direccionGeneral,
    baseDistribuible,
    comisionVendedor,
    fondoIncentivoVendedor,
    utilidadElanvisual: Math.max(elanvisual - fondoIncentivoVendedor, 0),
    pagada: false,
    pagoSolicitado: false,
    historial: [
      {
        estado: 'en_proceso',
        fecha: new Date().toISOString(),
        nota: 'Comisión creada en proceso. Se valida hasta trabajo finalizado y pago cancelado.',
      },
    ],
  };
}
