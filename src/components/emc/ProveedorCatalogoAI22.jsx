import React, { useEffect, useMemo, useState } from "react";
import { listarProductosGuardadosAI22 } from "../../services/emc/emcImportAi22Service";

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
      const data = await listarProductosGuardadosAI22({
        proveedor,
        limite: 500,
      });

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

    return productos.filter((item) => {
      const texto = [
        item.codigo,
        item.sku_proveedor,
        item.nombre,
        item.descripcion,
        item.marca,
        item.categoria,
        item.subcategoria,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(q);
    });
  }, [productos, busqueda]);

  const resumen = useMemo(() => {
    const categorias = new Set(productos.map((p) => p.categoria).filter(Boolean));
    const marcas = new Set(productos.map((p) => p.marca).filter(Boolean));
    const conPrecio = productos.filter((p) => Number(p.precio || p.precio_unitario || 0) > 0).length;

    return {
      total: productos.length,
      categorias: categorias.size,
      marcas: marcas.size,
      conPrecio,
      sinPrecio: productos.length - conPrecio,
    };
  }, [productos]);

  if (!proveedor?.id) {
    return (
      <section className="emc-catalogo-panel">
        <p>Seleccioná un proveedor para ver su catálogo cargado.</p>
      </section>
    );
  }

  return (
    <section className="emc-catalogo-panel">
      <div className="emc-catalogo-header">
        <div>
          <h2>Catálogo del proveedor</h2>
          <p>{proveedor.nombre || proveedor.name || "Proveedor seleccionado"}</p>
        </div>

        <button type="button" onClick={cargarProductos} disabled={cargando}>
          {cargando ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="emc-catalogo-resumen">
        <div><strong>{resumen.total}</strong><span>Productos</span></div>
        <div><strong>{resumen.categorias}</strong><span>Categorías</span></div>
        <div><strong>{resumen.marcas}</strong><span>Marcas</span></div>
        <div><strong>{resumen.conPrecio}</strong><span>Con precio</span></div>
        <div><strong>{resumen.sinPrecio}</strong><span>Sin precio</span></div>
      </div>

      <input
        className="emc-catalogo-busqueda"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por código, nombre, marca o categoría..."
      />

      {error ? <div className="emc-catalogo-error">{error}</div> : null}

      {!cargando && !filtrados.length ? (
        <div className="emc-catalogo-vacio">
          No hay productos cargados para este proveedor.
        </div>
      ) : null}

      <div className="emc-catalogo-grid">
        {filtrados.map((item) => {
          const precio = Number(item.precio || item.precio_unitario || 0);

          return (
            <article key={item.id || item.codigo || item.sku_proveedor} className="emc-producto-card">
              <div className="emc-producto-codigo">
                {item.codigo || item.sku_proveedor || "SIN-CODIGO"}
              </div>

              <h3>{item.nombre || item.descripcion || "Producto sin nombre"}</h3>

              <p>{item.descripcion || ""}</p>

              <div className="emc-producto-meta">
                <span>{item.categoria || "Sin categoría"}</span>
                <span>{item.marca || "Sin marca"}</span>
                <span>{item.unidad || item.unidad_medida || "Unidad"}</span>
              </div>

              <div className="emc-producto-footer">
                <strong>
                  {precio > 0 ? `C$ ${precio.toLocaleString("es-NI", { minimumFractionDigits: 2 })}` : "Sin precio"}
                </strong>
                <span>{item.activo === false ? "Inactivo" : "Activo"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
