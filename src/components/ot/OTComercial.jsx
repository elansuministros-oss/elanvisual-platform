import usePagosOT from '../../hooks/ot/usePagosOT';
import { money } from '../../hooks/ot/useOrdenTrabajo';

export default function OTComercial({ pedido, actualizarPedido }) {
  const {
    formPago,
    historial,
    resumenPagos,
    actualizarCampoPago,
    registrarPago,
  } = usePagosOT({ pedido, actualizarPedido });

  const guardarPago = () => {
    const resultado = registrarPago();
    alert(resultado.mensaje);
  };

  if (!pedido) {
    return (
      <section className="ot-card">
        <h2>Comercial</h2>
        <p>Seleccioná una Orden de Trabajo.</p>
      </section>
    );
  }

  return (
    <section className="ot-card">
      <div className="ot-section-header">
        <div>
          <p className="eyebrow">Control comercial</p>
          <h2>Pagos, anticipo y saldo</h2>
          <p>Registro financiero operativo de la Orden de Trabajo.</p>
        </div>
      </div>

      <div className="ot-kpi-grid">
        <article>
          <span>Total</span>
          <strong>{money(resumenPagos.total)}</strong>
        </article>

        <article>
          <span>Pagado</span>
          <strong>{money(resumenPagos.pagado)}</strong>
        </article>

        <article>
          <span>Saldo</span>
          <strong>{money(resumenPagos.saldo)}</strong>
        </article>

        <article>
          <span>Pagos</span>
          <strong>{historial.length}</strong>
        </article>
      </div>

      <div className="ot-form-grid">
        <label>
          Moneda
          <select
            value={formPago.moneda}
            onChange={(e) => actualizarCampoPago('moneda', e.target.value)}
          >
            <option value="NIO">Córdobas</option>
            <option value="USD">Dólares</option>
          </select>
        </label>

        <label>
          Monto
          <input
            value={formPago.monto}
            onChange={(e) => actualizarCampoPago('monto', e.target.value)}
            placeholder="0.00"
          />
        </label>

        <label>
          Tipo de cambio
          <input
            value={formPago.tipoCambio}
            onChange={(e) => actualizarCampoPago('tipoCambio', e.target.value)}
            disabled={formPago.moneda === 'USD'}
          />
        </label>

        <label>
          Fecha
          <input
            type="date"
            value={formPago.fecha}
            onChange={(e) => actualizarCampoPago('fecha', e.target.value)}
          />
        </label>

        <label>
          Forma de pago
          <select
            value={formPago.forma}
            onChange={(e) => actualizarCampoPago('forma', e.target.value)}
          >
            <option>Transferencia</option>
            <option>Efectivo</option>
            <option>Depósito</option>
            <option>Tarjeta</option>
            <option>Otro</option>
          </select>
        </label>

        <label>
          Banco / cuenta
          <input
            value={formPago.banco}
            onChange={(e) => actualizarCampoPago('banco', e.target.value)}
            placeholder="BAC, Lafise, Banpro..."
          />
        </label>

        <label>
          Referencia
          <input
            value={formPago.referencia}
            onChange={(e) => actualizarCampoPago('referencia', e.target.value)}
            placeholder="Número de comprobante"
          />
        </label>

        <label>
          Observaciones
          <input
            value={formPago.observaciones}
            onChange={(e) => actualizarCampoPago('observaciones', e.target.value)}
            placeholder="Notas internas"
          />
        </label>
      </div>

      <div className="ot-actions">
        <button className="primary-btn" type="button" onClick={guardarPago}>
          Registrar pago
        </button>
      </div>

      <div className="ot-table-wrap">
        <table className="ot-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Moneda</th>
              <th>Monto</th>
              <th>USD</th>
              <th>Forma</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((pago) => (
              <tr key={pago.id || `${pago.fecha}-${pago.monto}`}>
                <td>{pago.fecha || '-'}</td>
                <td>{pago.moneda || 'USD'}</td>
                <td>{money(pago.monto || 0)}</td>
                <td>{money(pago.montoUSD || pago.monto || 0)}</td>
                <td>{pago.forma || '-'}</td>
                <td>{pago.referencia || '-'}</td>
              </tr>
            ))}

            {historial.length === 0 && (
              <tr>
                <td colSpan="6">No hay pagos registrados para esta OT.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
