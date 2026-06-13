import { useElan } from '../../core/context/ElanContext.jsx';
import AppCard from '../../components/AppCard.jsx';

export default function Pedidos() {
  const { state } = useElan();

  const pedidos = Array.isArray(state.pedidos)
    ? [...state.pedidos].reverse()
    : [];

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Pedidos</h1>

        <p className="muted">
          Solicitudes recibidas desde el catálogo.
        </p>
      </div>

      {pedidos.length === 0 ? (
        <section className="empty-state">
          <h2>No existen pedidos registrados</h2>
        </section>
      ) : (
        <section className="dashboard-panels">
          {pedidos.map((pedido) => (
            <AppCard key={pedido.id}>
              <h3>{pedido.cliente?.nombre}</h3>

              <p>
                <strong>Teléfono:</strong>{' '}
                {pedido.cliente?.telefono}
              </p>

              <p>
                <strong>Ubicación:</strong>{' '}
                {pedido.cliente?.ubicacion || '-'}
              </p>

              <p>
                <strong>Estado:</strong>{' '}
                {pedido.estado}
              </p>

              <p>
                <strong>Total:</strong>{' '}
                C$ {pedido.total}
              </p>

              <p>
                <strong>Productos:</strong>{' '}
                {pedido.items?.length || 0}
              </p>

              {pedido.cliente?.nota ? (
                <p>
                  <strong>Nota:</strong>{' '}
                  {pedido.cliente.nota}
                </p>
              ) : null}

              <hr />

              <ul className="dashboard-list">
                {(pedido.items || []).map((item) => (
                  <li key={item.id}>
                    <strong>{item.nombre}</strong>
                    <span>
                      Cantidad: {item.cantidad || 1}
                    </span>
                  </li>
                ))}
              </ul>
            </AppCard>
          ))}
        </section>
      )}
    </main>
  );
}