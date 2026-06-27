import {
  buscarPedidoOT,
  buscarProveedor,
  registrarCostoOT,
} from './aiPedidoActions';

export async function ejecutarAccionIA({
  accion,
  contexto = {},
  servicios = {},
}) {
  switch (accion) {
    case 'buscar_pedido_ot':
      return buscarPedidoOT(contexto);

    case 'buscar_proveedor':
      return buscarProveedor(contexto);

    case 'registrar_costo_ot':
      return registrarCostoOT({
        ...contexto,
        actualizarPedido: servicios.actualizarPedido,
        calcularCostoReal: servicios.calcularCostoReal,
        calcularUtilidadReal: servicios.calcularUtilidadReal,
        usuario: servicios.usuario,
      });

    default:
      return {
        ok: false,
        error: 'ACCION_NO_IMPLEMENTADA',
        accion,
      };
  }
}
