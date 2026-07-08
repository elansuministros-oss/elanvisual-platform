import React, { useMemo, useState } from "react";

const STORAGE_KEY = "elanvisual_biblioteca_trabajos";

const leer = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const guardar = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const nuevoForm = {
  nombre: "",
  categoria: "Rotulación Vehicular",
  descripcionComercial: "",
  descripcionTecnica: "",
  precioBaseUsd: "",
  materiales: "",
  etiquetasIA: "",
  activo: true,
};

export default function BibliotecaComercial() {
  const [trabajos, setTrabajos] = useState(leer);
  const [form, setForm] = useState(nuevoForm);
  const [busqueda, setBusqueda] = useState("");

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return trabajos;
    return trabajos.filter((t) =>
      `${t.nombre} ${t.categoria} ${t.descripcionComercial} ${t.etiquetasIA}`
        .toLowerCase()
        .includes(q)
    );
  }, [trabajos, busqueda]);

  const actualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const crearTrabajo = () => {
    if (!form.nombre.trim()) return alert("Escribí el nombre del trabajo.");
    if (!Number(form.precioBaseUsd)) return alert("Ingresá precio base USD.");

    const item = {
      id: crypto.randomUUID(),
      codigo: `BT-${Date.now()}`,
      ...form,
      precioBaseUsd: Number(form.precioBaseUsd),
      moneda: "USD",
      creadoEn: new Date().toISOString(),
    };

    const nuevo = [item, ...trabajos];
    setTrabajos(nuevo);
    guardar(nuevo);
    setForm(nuevoForm);
  };

  const eliminar = (id) => {
    const nuevo = trabajos.filter((t) => t.id !== id);
    setTrabajos(nuevo);
    guardar(nuevo);
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">ELANVISUAL</p>
          <h1>Biblioteca Comercial</h1>
          <p>Trabajos, combinaciones y servicios reutilizables para cotizaciones comerciales.</p>
        </div>
      </section>

      <section className="admin-grid">
        <article className="admin-card">
          <h2>Crear trabajo</h2>

          <label>Nombre</label>
          <input value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} placeholder="Rotulación Microbús 3M + UV" />

          <label>Categoría</label>
          <select value={form.categoria} onChange={(e) => actualizar("categoria", e.target.value)}>
            <option>Rotulación Vehicular</option>
            <option>Viniles</option>
            <option>Lonas</option>
            <option>PVC</option>
            <option>Acrílico</option>
            <option>Señalización</option>
            <option>Instalación</option>
            <option>Otro</option>
          </select>

          <label>Descripción comercial</label>
          <textarea value={form.descripcionComercial} onChange={(e) => actualizar("descripcionComercial", e.target.value)} />

          <label>Descripción técnica</label>
          <textarea value={form.descripcionTecnica} onChange={(e) => actualizar("descripcionTecnica", e.target.value)} />

          <label>Precio base USD</label>
          <input type="number" value={form.precioBaseUsd} onChange={(e) => actualizar("precioBaseUsd", e.target.value)} />

          <label>Materiales asociados</label>
          <textarea value={form.materiales} onChange={(e) => actualizar("materiales", e.target.value)} placeholder="Vinil 3M, sobrelaminado UV, instalación" />

          <label>Etiquetas IA</label>
          <textarea value={form.etiquetasIA} onChange={(e) => actualizar("etiquetasIA", e.target.value)} placeholder="microbus, vehiculo, 3m, uv" />

          <button className="primary" onClick={crearTrabajo}>Guardar trabajo</button>
        </article>

        <article className="admin-card">
          <h2>Trabajos guardados</h2>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar trabajo..." />

          <div className="stack">
            {lista.map((t) => (
              <div key={t.id} className="admin-card soft">
                <strong>{t.nombre}</strong>
                <p>{t.categoria}</p>
                <p>{t.descripcionComercial}</p>
                <b>USD {t.precioBaseUsd.toFixed(2)}</b>
                <button onClick={() => eliminar(t.id)}>Eliminar</button>
              </div>
            ))}

            {!lista.length && <p>No hay trabajos guardados.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}

