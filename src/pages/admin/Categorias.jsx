import { useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';
import { uid } from '../../utils/formatters.js';

import AppCard from '../../components/AppCard.jsx';
import AppButton from '../../components/AppButton.jsx';
import AppInput from '../../components/AppInput.jsx';

export default function Categorias() {
  const { state, addItem, removeItem } = useElan();

  const [nombre, setNombre] = useState('');

  const guardar = () => {
    if (!nombre.trim()) return;

    addItem('categorias', {
      id: uid('categoria'),
      nombre: nombre.trim(),
    });

    setNombre('');
  };

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Categorías</h1>
      </div>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Nombre categoría"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <AppButton onClick={guardar}>
            Guardar categoría
          </AppButton>
        </div>
      </AppCard>

      <section className="products-admin-grid">
        {(state.categorias || []).map((item) => (
          <article key={item.id} className="product-admin-card">
            <h3>{item.nombre}</h3>

            <AppButton
              variant="danger"
              onClick={() =>
                removeItem('categorias', item.id)
              }
            >
              Eliminar
            </AppButton>
          </article>
        ))}
      </section>
    </main>
  );
}