import useComprasOT from '../../hooks/ot/useComprasOT';
import { money } from '../../hooks/ot/useOrdenTrabajo';

const categoriasOC = [
  'Impresión',
  'Corte CNC',
  'Láser',
  'Estructura',
  'Pintura',
  'Acrílico',
  'PVC',
  'ACM',
  'Instalación',
  'Transporte',
  'Otro',
];

export default function OTCompras({ pedido, actualizarPedido }) {
  const {
    estadosOC,
    formOC,
    ordenesCompra,
    resumenCompras,
    actualizarCampoOC,
    crearOC,
    actualizarOC,
    registrarRecepcion,
    registrarFactura,
    registrarPago,
  } = useComprasOT({ pedido, actualizarPedido });

  const guardarOC = () => {
    const resultado = crearOC();
    alert(resultado.mensaje);
  };

  if (!pedido) {
    return (
      <section className="ot-card">
        <h2>Compras</h2>
        <p>Seleccioná una Orden de Trabajo.</p>
      </section>
    );
  }

  return (
    <section className="ot-card">
      <div className="ot-section-header">
        <div>
          <p className="eyebrow">Compras OT</p>
          <h2>Órdenes de Compra</h2>
          <p>Flujo OT → OC → Proveedor → Recepción → Factura → Pago.</p>
        </div>
      </div>

      <div className="ot-kpi-grid">
        <article>
          <span>OC creadas</span>
          <strong>{resumenCompras.cantidad}</strong>
        </article>

        <article>
          <span>Total compras</span>
          <strong>{money(resumenCompras.total)}</strong>
        </article>

        <article>
          <span>Pagado</span>
          <strong>{money(resumenCompras.pagado)}</strong>
        </article>

        <article>
          <span>Pendiente</span>
          <strong>{money(resumenCompras.pendiente)}</strong>
        </article>
      </div>

      <div className="ot-form-grid">
        <label>
          Concepto
          <input
            value={formOC.concepto}
            onChange={(e) => actualizarCampoOC('concepto', e.target.value)}
            placeholder="Impresión lona, corte CNC, estructura..."
          />
        </label>

        <label>
          Categoría
          <select
            value={formOC.categoria}
            onChange={(e) => actualizarCampoOC('categoria', e.target.value)}
          >
            {categoriasOC.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          Proveedor
          <input
            value={formOC.proveedor}
            onChange={(e) => actualizarCampoOC('proveedor', e.target.value)}
            placeholder="Nombre del proveedor"
          />
        </label>

        <label>
          Monto estimado / real
          <input
            value={formOC.monto}
            onChange={(e) => actualizarCampoOC('monto', e.target.value)}
            placeholder="0.00"
          />
        </label>

        <label>
          Fecha solicitud
          <input
            type="date"
            value={formOC.fechaSolicitud}
            onChange={(e) => actualizarCampoOC('fechaSolicitud', e.target.value)}
          />
        </label>

        <label>
          Fecha entrega
          <input
            type="date"
            value={formOC.fechaEntrega}
            onChange={(e) => actualizarCampoOC('fechaEntrega', e.target.value)}
          />
        </label>

        <label>
          Estado
          <select
            value={formOC.estado}
            onChange={(e) => actualizarCampoOC('estado', e.target.value)}
          >
            {estadosOC.map((estado) => (
              <option key={estado}>{estado}</option>
            ))}
          </select>
        </label>

        <label>
          Notas
          <input
            value={formOC.notas}
            onChange={(e) => actualizarCampoOC('notas', e.target.value)}
            placeholder="Condiciones, alcance, anticipo..."
          />
        </label>
      </div>

      <div className="ot-actions">
        <button className="primary-btn" type="button" onClick={guardarOC}>
          Crear Orden de Compra
        </button>
      </div>

      <div className="ot-oc-grid">
        {ordenesCompra.map((oc) => (
          <article className="ot-oc-card" key={oc.id}>
            <div className="ot-section-header">
              <div>
                <p className="eyebrow">{oc.codigo}</p>
                <h3>{oc.concepto}</h3>
                <p>{oc.proveedor || 'Proveedor pendiente'}</p>
              </div>

              <select
                value={oc.estado}
                onChange={(e) => actualizarOC(oc.id, { estado: e.target.value })}
              >
                {estadosOC.map((estado) => (
                  <option key={estado}>{estado}</option>
                ))}
              </select>
            </div>

            <div className="ot-detail-grid">
              <p>
                <span>Categoría</span>
                <strong>{oc.categoria}</strong>
              </p>

              <p>
                <span>Monto</span>
                <strong>{money(oc.monto)}</strong>
              </p>

              <p>
                <span>Solicitud</span>
                <strong>{oc.fechaSolicitud || '-'}</strong>
              </p>

              <p>
                <span>Entrega</span>
                <strong>{oc.fechaEntrega || '-'}</strong>
              </p>
            </div>

            <div className="ot-flow-grid">
              <span className={oc.estado === 'Recibida' || oc.estado === 'Facturada' || oc.estado === 'Pagada' || oc.estado === 'Cerrada' ? 'done' : ''}>
                Recepción: {oc.recepcion?.estado || 'Pendiente'}
              </span>

              <span className={oc.estado === 'Facturada' || oc.estado === 'Pagada' || oc.estado === 'Cerrada' ? 'done' : ''}>
                Factura: {oc.factura?.estado || 'Pendiente'}
              </span>

              <span className={oc.estado === 'Pagada' || oc.estado === 'Cerrada' ? 'done' : ''}>
                Pago: {oc.pago?.estado || 'Pendiente'}
              </span>
            </div>

            {oc.notas && <p className="ot-note">{oc.notas}</p>}

            <div className="ot-actions">
              <button className="secondary-btn" type="button" onClick={() => registrarRecepcion(oc.id)}>
                Registrar recepción
              </button>

              <button className="secondary-btn" type="button" onClick={() => registrarFactura(oc.id, oc.monto)}>
                Registrar factura
              </button>

              <button className="secondary-btn" type="button" onClick={() => registrarPago(oc.id, oc.monto)}>
                Registrar pago
              </button>
            </div>
          </article>
        ))}

        {ordenesCompra.length === 0 && (
          <div className="ot-empty">
            <h3>No hay Órdenes de Compra creadas.</h3>
            <p>Creá la primera OC cuando la OT requiera compra, servicio externo o proveedor.</p>
          </div>
        )}
      </div>
    </section>
  );
}
