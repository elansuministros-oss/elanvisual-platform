import usePagosOT from '../../hooks/ot/usePagosOT';

const n = (v) => Number(v || 0);

const moneyUSD = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n(v));

const moneyCordobas = (v) =>
  'C$ ' +
  n(v).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
          <h2>Pagos reales, anticipo requerido y saldo</h2>
          <p>El pagado real sale del historial guardado en Supabase.</p>
        </div>
      </div>

      <div className="ot-kpi-grid">
        <article>
          <span>Total venta C$</span>
          <strong>{moneyCordobas(resumenPagos.totalCordobas)}</strong>
          <small>Ref. {moneyUSD(resumenPagos.totalUSDReferencia)}</small>
        </article>

        <article>
          <span>Anticipo requerido C$</span>
          <strong>{moneyCordobas(resumenPagos.anticipoRequeridoCordobas)}</strong>
          <small>Ref. {moneyUSD(resumenPagos.anticipoRequeridoUSDReferencia)}</small>
        </article>

        <article>
          <span>Pagado real C$</span>
          <strong>{moneyCordobas(resumenPagos.pagadoCordobas)}</strong>
          <small>Ref. {moneyUSD(resumenPagos.pagadoUSD)}</small>
        </article>

        <article>
          <span>Saldo real C$</span>
          <strong>{moneyCordobas(resumenPagos.saldoCordobas)}</strong>
          <small>Ref. {moneyUSD(resumenPagos.saldoUSD)}</small>
        </article>
      </div>

      <div className="ot-form-grid">
        <label>
          Moneda recibida
          <select
            value={formPago.monedaOriginal}
            onChange={(e) => actualizarCampoPago('monedaOriginal', e.target.value)}
          >
            <option value="C$">Córdobas C$</option>
            <option value="USD">Dólares USD</option>
          </select>
        </label>

        <label>
          Monto recibido
          <input
            value={formPago.montoOriginal}
            onChange={(e) => actualizarCampoPago('montoOriginal', e.target.value)}
            placeholder="0.00"
          />
        </label>

        <label>
          Tipo de cambio
          <input
            value={formPago.tipoCambio}
            onChange={(e) => actualizarCampoPago('tipoCambio', e.target.value)}
          />
        </label>

        <label>
          Fecha depósito / recepción
          <input
            type="date"
            value={formPago.fechaDeposito}
            onChange={(e) => actualizarCampoPago('fechaDeposito', e.target.value)}
          />
        </label>

        <label>
          Forma de pago
          <select
            value={formPago.formaPago}
            onChange={(e) => actualizarCampoPago('formaPago', e.target.value)}
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
              <th>Recibo</th>
              <th>Moneda</th>
              <th>Monto recibido</th>
              <th>TC</th>
              <th>Equiv. C$</th>
              <th>Equiv. USD</th>
              <th>Forma</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((pago) => (
              <tr key={pago.id || `${pago.fechaDeposito}-${pago.montoOriginal}`}>
                <td>{pago.fechaDeposito || '-'}</td>
                <td>{pago.recibo || '-'}</td>
                <td>{pago.monedaOriginal || 'C$'}</td>
                <td>
                  {pago.monedaOriginal === 'USD'
                    ? moneyUSD(pago.montoOriginal)
                    : moneyCordobas(pago.montoOriginal)}
                </td>
                <td>{n(pago.tipoCambio).toFixed(2)}</td>
                <td>{moneyCordobas(pago.montoCordobas)}</td>
                <td>{moneyUSD(pago.montoUSD)}</td>
                <td>{pago.formaPago || '-'}</td>
                <td>{pago.referencia || '-'}</td>
              </tr>
            ))}

            {historial.length === 0 && (
              <tr>
                <td colSpan="9">No hay pagos reales registrados para esta OT.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

