import React, { useEffect, useMemo, useState } from "react";
import { listarProductosGuardadosAI22 } from "../../services/emc/emcImportAi22Service";

function dinero(valor) {
  const n = Number(valor || 0);
  if (!n) return "Sin precio";
  return `C$ ${n.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`;
}

export default function ProveedorCatalogoAI22({ proveedor }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cargarProductos() {
    if (!proveedor?.id) return;
    setCargando(true);
    setError("");

    try {
      const data = await listarProductosGuardadosAI22({ proveedor, limite: 500 });
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudo cargar el catálogo del proveedor.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProductos();
  }, [proveedor?.id]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;

    return productos.filter((item) =>
      [
        item.codigo_catalogo,
        item.nombre_catalogo,
        item.presentacion,
        item.estado_informacion,
        item.observaciones,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [productos, busqueda]);

  const resumen = useMemo(() => {
    const conPrecio = productos.filter((p) => Number(p.precio_lista || p.precio_final || 0) > 0).length;
    const completos = productos.filter((p) => String(p.estado_informacion || "").toUpperCase() === "COMPLETO").length;

    return {
      total: productos.length,
      conPrecio,
      sinPrecio: productos.length - conPrecio,
      completos,
      activos: productos.filter((p) => p.activo !== false).length,
    };
  }, [productos]);

  return (
    <section className="emc-catalogo-panel">
      <div className="emc-catalogo-header">
        <div>
          <h2>Catálogo del proveedor</h2>
          <p>{proveedor?.nombre || proveedor?.name || "Proveedor seleccionado"}</p>
        </div>
        <button type="button" onClick={cargarProductos} disabled={cargando}>
          {cargando ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="emc-catalogo-resumen">
        <div><strong>{resumen.total}</strong><span>Productos</span></div>
        <div><strong>{resumen.completos}</strong><span>Completos</span></div>
        <div><strong>{resumen.conPrecio}</strong><span>Con precio</span></div>
        <div><strong>{resumen.sinPrecio}</strong><span>Sin precio</span></div>
        <div><strong>{resumen.activos}</strong><span>Activos</span></div>
      </div>

      <input
        className="emc-catalogo-busqueda"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar código, producto, presentación u observación..."
      />

      {error ? <div className="emc-catalogo-error">{error}</div> : null}

      {!cargando && !filtrados.length ? (
        <div className="emc-catalogo-vacio">
          No hay productos cargados para este proveedor.
        </div>
      ) : null}

      <div className="emc-catalogo-grid">
        {filtrados.map((item) => (
          <article key={item.id || item.codigo_catalogo} className="emc-producto-card">
            <div className="emc-producto-codigo">
              {item.codigo_catalogo || "SIN-CODIGO"}
            </div>

            <h3>{item.nombre_catalogo || "Producto sin nombre"}</h3>

            <p>{item.observaciones || ""}</p>

            <div className="emc-producto-meta">
              <span>{item.presentacion || "Sin presentación"}</span>
              <span>{item.estado_informacion || "Sin estado"}</span>
              <span>{item.incluye_iva ? "IVA incluido" : "IVA separado"}</span>
            </div>

            <div className="emc-producto-footer">
              <strong>{dinero(item.precio_final || item.precio_lista || item.costo_unitario)}</strong>
              <span>{item.activo === false ? "Inactivo" : "Activo"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}