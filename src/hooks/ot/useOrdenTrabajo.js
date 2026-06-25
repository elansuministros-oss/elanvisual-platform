import {
  construirResumenOT,
  getClienteOT,
  getCodigoOT,
  getFechaOT,
  getNumeroPedido,
  getPagadoOT,
  getProyectoOT,
  getSaldoOT,
  getTotalOT,
  money,
} from '../../services/ot/ordenTrabajoService';

export {
  construirResumenOT,
  getClienteOT,
  getCodigoOT,
  getFechaOT,
  getNumeroPedido,
  getPagadoOT,
  getProyectoOT,
  getSaldoOT,
  getTotalOT,
  money,
};

export default function useOrdenTrabajo(pedido) {
  return construirResumenOT(pedido);
}
