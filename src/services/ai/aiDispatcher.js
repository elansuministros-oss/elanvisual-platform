import {
  buscarPedidoOT,
  buscarProveedor,
  registrarCostoOT,
} from './aiPedidoActions';
import { executeAiActionConnect } from '../../modules/connect/services/aiOperatorConnectClient.js';
import { isConnectUnavailableError } from '../../modules/connect/services/connectCoreClient.js';

export async function ejecutarAccionIA({
  accion,
  contexto = {},
  servicios = {},
}) {
  try {
    return await executeAiActionConnect({
      action: accion,
      contexto,
      actor: {
        usuario: servicios.usuario || null,
        plataforma: 'ELANVISUAL',
      },
      confirmacion: servicios.confirmacion || null,
    });
  } catch (error) {
    if (!isConnectUnavailableError(error)) {
      return {
        ok: false,
        error: error?.code || 'CONNECT_AI_ACTION_FAILED',
        mensaje: error?.message || 'No fue posible ejecutar la accion en CONNECT.',
        detalles: error?.details || [],
      };
    }
  }

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
