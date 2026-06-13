import React, { useEffect, useMemo, useState } from 'react';

const KEY = 'elanvisual_lista_costos_v1';

export const costosBaseElanvisual = [
  {
    id: 1,
    categoria: 'Material',
    concepto: 'PVC 10 mm',
    unidad: 'Lámina',
    costo: 34,
    estado: 'Activo',
  },
  {
    id: 2,
    categoria: 'Material',
    concepto: 'Acrílico 3 mm',
    unidad: 'Lámina',
    costo: 65,
    estado: 'Activo',
  },
  {
    id: 3,
    categoria: 'Material',
    concepto: 'LED 110V',
    unidad: 'Unidad',
    costo: 1.73,
    estado: 'Activo',
  },
  {
    id: 4,
    categoria: 'Producción',
    concepto: 'Corte CNC',
    unidad: 'm²',
    costo: 14,
    estado: 'Activo',
  },
  {
    id: 5,
    categoria: 'Producción',
    concepto: 'Mano de obra taller',
    unidad: 'Hora',
    costo: 5,
    estado: 'Activo',
  },
  {
    id: 6,
    categoria: 'Instalación',
    concepto: 'Técnico instalación',
    unidad: 'Hora',
    costo: 5,
    estado: 'Activo',
  },
  {
    id: 7,
    categoria: 'Instalación',
    concepto: 'Ayudante instalación',
    unidad: 'Hora',
    costo: 3,
    estado: 'Activo',
  },
  {
    id: 8,
    categoria: 'Transporte',
    concepto: 'Kilómetro recorrido',
    unidad: 'Km',
    costo: 1,
    estado: 'Activo',
  },
];

const inicial = {
  categoria: 'Material',
  concepto: '',
  unidad: '',
  costo: '',
  estado: 'Activo',
};

export function leerListaCostos() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');

    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    localStorage.setItem(KEY, JSON.stringify(costosBaseElanvisual));
    return costosBaseElanvisual;
  } catch {
    return costosBaseElanvisual;
  }
}

export function guardarListaCostos(costos) {
  localStorage.setItem(KEY, JSON.stringify(costos || []));
}

export default function ListaCostos() {
  const [costos, setCostos] = useState(() => leerListaCostos());
  const [form, setForm] = useState(inicial);

  useEffect(() => {
    guardarListaCostos(costos);
  }, [costos]);

  const total = useMemo(() => {
    return costos.reduce((acc, item) => acc + Number(item.costo || 0), 0);
  }, [costos]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.concepto.trim()) {
      alert('Ingrese el concepto');
      return;
    }

    setCostos((prev) => [
      {
        id: Date.now(),
        ...form,
        costo: Number(form.costo || 0),
      },
      ...prev,
    ]);

    setForm(inicial);
  };

  const eliminar = (id) => {
    setCostos((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main>
      <h1>Lista Maestra de Costos</h1>

      <section className="card">
        <p>
          Base de costos utilizada por el cotizador interno, producción,
          instalación, transporte e inventario.
        </p>
      </section>

      <section className="card form">
        <form onSubmit={guardar}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5,minmax(0,1fr))',
              gap: 10,
            }}
          >
            <select
              name="categoria"
              value={form.categoria}
              onChange={cambiar}
            >
              <option>Material</option>
              <option>Producción</option>
              <option>Instalación</option>
              <option>Transporte</option>
              <option>Administrativo</option>
              <option>Proveedor</option>
            </select>

            <input
              name="concepto"
              placeholder="Concepto"
              value={form.concepto}
              onChange={cambiar}
            />

            <input
              name="unidad"
              placeholder="Unidad"
              value={form.unidad}
              onChange={cambiar}
            />

            <input
              name="costo"
              type="number"
              step="0.01"
              placeholder="Costo US$"
              value={form.costo}
              onChange={cambiar}
            />

            <select
              name="estado"
              value={form.estado}
              onChange={cambiar}
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="submit">Guardar costo</button>
          </div>
        </form>
      </section>

      <section className="card">
        <strong>Total referencias: {costos.length}</strong>
        <br />
        <small>Suma referencial: US$ {total.toFixed(2)}</small>
      </section>

      <section className="card">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Concepto</th>
              <th>Unidad</th>
              <th>Costo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {costos.map((item) => (
              <tr key={item.id}>
                <td>{item.categoria}</td>
                <td>{item.concepto}</td>
                <td>{item.unidad}</td>
                <td>US$ {Number(item.costo || 0).toFixed(2)}</td>
                <td>{item.estado}</td>
                <td>
                  <button type="button" onClick={() => eliminar(item.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {costos.length === 0 && (
              <tr>
                <td colSpan="6">No hay costos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}