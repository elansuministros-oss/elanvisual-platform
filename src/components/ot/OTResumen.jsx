import useOrdenTrabajo, { money } from '../../hooks/ot/useOrdenTrabajo';

export default function OTResumen({ pedido }) {
  const resumen = useOrdenTrabajo(pedido);

  if (!pedido) {
    return (
      <section className="ot-card">
        <h2>Resumen OT</h2>
        <p>Seleccioná una Orden de Trabajo.</p>
      </section>
    );
  }

  return (
    <section className="ot-card">
      <div className="ot-section-header">
        <div>
          <p className="eyebrow">Orden de Trabajo</p>
          <h2>{resumen.codigoOT}</h2>
          <p>{resumen.cliente}</p>
        </div>
        <span className="status-pill">{resumen.estado}</span>
      </div>

      <div className="ot-kpi-grid">
        <article>
          <span>Pedido</span>
          <strong>{resumen.numeroPedido}</strong>
        </article>

        <article>
          <span>Total</span>
          <strong>{money(resumen.total)}</strong>
        </article>

        <article>
          <span>Pagado</span>
          <strong>{money(resumen.pagado)}</strong>
        </article>

        <article>
          <span>Saldo</span>
          <strong>{money(resumen.saldo)}</strong>
        </article>
      </div>

      <div className="ot-progress">
        <div>
          <span>Avance financiero</span>
          <strong>{resumen.porcentajePagado.toFixed(0)}%</strong>
        </div>
        <div className="ot-progress-bar">
          <span style={{ width: `${resumen.porcentajePagado}%` }} />
        </div>
      </div>

      <div className="ot-detail-grid">
        <p>
          <span>Proyecto</span>
          <strong>{resumen.proyecto}</strong>
        </p>

        <p>
          <span>Fecha</span>
          <strong>{resumen.fecha || 'Sin fecha registrada'}</strong>
        </p>
      </div>
    </section>
  );
}
