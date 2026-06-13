import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';
import { uid } from '../../utils/formatters.js';

import AppCard from '../../components/AppCard.jsx';
import AppButton from '../../components/AppButton.jsx';
import AppInput from '../../components/AppInput.jsx';

export default function Carrito() {
  const { state, updateModule, addItem } = useElan();

  const carrito = Array.isArray(state.carrito) ? state.carrito : [];

  const [cliente, setCliente] = useState({
    nombre: '',
    telefono: '',
    ubicacion: '',
    nota: '',
  });

  const total = useMemo(() => {
    return carrito.reduce((sum, item) => {
      return sum + Number(item.precio || 0) * Number(item.cantidad || 1);
    }, 0);
  }, [carrito]);

  const cambiarCantidad = (id, cantidad) => {
    const nuevaCantidad = Math.max(1, Number(cantidad || 1));

    updateModule(
      'carrito',
      carrito.map((item) =>
        item.id === id
          ? {
              ...item,
              cantidad: nuevaCantidad,
            }
          : item
      )
    );
  };

  const eliminar = (id) => {
    updateModule(
      'carrito',
      carrito.filter((item) => item.id !== id)
    );
  };

  const limpiarCarrito = () => {
    updateModule('carrito', []);
  };

  const enviarPedido = () => {
    if (!cliente.nombre.trim() || !cliente.telefono.trim()) {
      alert('Nombre y teléfono son obligatorios.');
      return;
    }

    if (!carrito.length) {
      alert('No hay productos en el carrito.');
      return;
    }

    const pedido = {
      id: uid('pedido'),
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
        ubicacion: cliente.ubicacion.trim(),
        nota: cliente.nota.trim(),
      },
      items: carrito,
      total,
      estado: 'nuevo',
      creado: new Date().toISOString(),
    };

    addItem('pedidos', pedido);
    updateModule('carrito', []);

    setCliente({
      nombre: '',
      telefono: '',
      ubicacion: '',
      nota: '',
    });

    alert('Solicitud enviada. El pedido quedó registrado en Admin.');
  };

  return (
    <main className="page-shell public-page">
      <div className="page-title">
        <p className="eyebrow">Carrito</p>
        <h1>Solicitud de cotización</h1>
        <p className="muted">
          Revisá los productos seleccionados y enviá la solicitud.
        </p>
      </div>

      {carrito.length === 0 ? (
        <section className="empty-state">
          <h2>No hay productos seleccionados</h2>
          <p>Agregá productos desde el catálogo para crear una solicitud.</p>
          <Link className="cart-link" to="/catalogo">
            Volver al catálogo
          </Link>
        </section>
      ) : (
        <>
          <section className="cart-list">
            {carrito.map((item) => (
              <article key={item.id} className="cart-item">
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} />
                ) : null}

                <div>
                  <h2>{item.nombre}</h2>
                  <p>{item.descripcion}</p>
                  <strong>C$ {item.precio}</strong>

                  <label className="app-field">
                    <span>Cantidad</span>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad || 1}
                      onChange={(e) => cambiarCantidad(item.id, e.target.value)}
                    />
                  </label>
                </div>

                <AppButton variant="danger" onClick={() => eliminar(item.id)}>
                  Eliminar
                </AppButton>
              </article>
            ))}
          </section>

          <AppCard>
            <h2>Total estimado: C$ {total}</h2>
            <p className="muted">
              El total es una referencia. La cotización final puede variar según medidas,
              instalación, transporte y materiales.
            </p>
          </AppCard>

          <AppCard>
            <div className="form-grid">
              <AppInput
                label="Nombre del cliente"
                value={cliente.nombre}
                onChange={(e) =>
                  setCliente({ ...cliente, nombre: e.target.value })
                }
              />

              <AppInput
                label="Teléfono / WhatsApp"
                value={cliente.telefono}
                onChange={(e) =>
                  setCliente({ ...cliente, telefono: e.target.value })
                }
              />

              <AppInput
                label="Ubicación"
                value={cliente.ubicacion}
                onChange={(e) =>
                  setCliente({ ...cliente, ubicacion: e.target.value })
                }
              />

              <label className="app-field">
                <span>Nota del cliente</span>
                <textarea
                  value={cliente.nota}
                  onChange={(e) =>
                    setCliente({ ...cliente, nota: e.target.value })
                  }
                />
              </label>

              <div className="form-actions">
                <AppButton onClick={enviarPedido}>
                  Enviar solicitud
                </AppButton>

                <AppButton variant="secondary" onClick={limpiarCarrito}>
                  Vaciar carrito
                </AppButton>
              </div>
            </div>
          </AppCard>
        </>
      )}
    </main>
  );
}