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
      setError(err.message || "No se pudo cargar el catálogo.");
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
    const conPrecio = productos.filter((p) => Number(p.precio_final || p.precio_lista || 0) > 0).length;
    const completos = productos.filter((p) => String(p.estado_informacion || "").toUpperCase() === "COMPLETO").length;

    return {
      total: productos.length,
      completos,
      conPrecio,
      sinPrecio: productos.length - conPrecio,
    };
  }, [productos]);

  return (
    <section style={panel}>
      <div style={header}>
        <div>
          <small style={crumb}>Catálogo de Productos</small>
          <h2 style={title}>{proveedor?.nombre || proveedor?.name || "Proveedor"}</h2>
        </div>

        <button type="button" onClick={cargarProductos} disabled={cargando} style={btn}>
          {cargando ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div style={stats}>
        <Stat label="Productos" value={resumen.total} />
        <Stat label="Completos" value={resumen.completos} />
        <Stat label="Con precio" value={resumen.conPrecio} />
        <Stat label="Sin precio" value={resumen.sinPrecio} />
      </div>

      <div style={toolbar}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, producto o presentación..."
          style={search}
        />
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}

      <div style={scrollArea}>
        {!cargando && !filtrados.length ? (
          <div style={empty}>No hay productos cargados para este proveedor.</div>
        ) : null}

        <div style={grid}>
          {filtrados.map((item) => (
            <article key={item.id || item.codigo_catalogo} style={card}>
              <div style={codeBadge}>{item.codigo_catalogo || "SIN-CODIGO"}</div>

              <div style={imageBox}>
                <span style={imageText}>
                  {(item.nombre_catalogo || "EMC").slice(0, 2)}
                </span>
              </div>

              <div style={body}>
                <h3 style={name}>{item.nombre_catalogo || "Producto sin nombre"}</h3>

                <p style={presentation}>
                  {item.presentacion || "Sin presentación"}
                </p>

                <div style={tags}>
                  <span style={tag}>{item.estado_informacion || "Sin estado"}</span>
                  <span style={tag}>{item.incluye_iva ? "IVA incluido" : "+ IVA"}</span>
                </div>

                <div style={footer}>
                  <strong style={price}>
                    {dinero(item.precio_final || item.precio_lista || item.costo_unitario)}
                  </strong>
                  <span style={item.activo === false ? inactive : active}>
                    {item.activo === false ? "Inactivo" : "Activo"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statCard}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const panel = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 18px 45px rgba(15,23,42,.08)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 16,
};

const crumb = {
  color: "#2563eb",
  fontWeight: 900,
};

const title = {
  margin: "4px 0 0",
  fontSize: 26,
  color: "#0f172a",
};

const btn = {
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  background: "#fff",
  padding: "11px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const stats = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 12,
  marginBottom: 14,
};

const statCard = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 14,
  background: "#f8fafc",
  display: "grid",
  gap: 4,
};

const toolbar = {
  display: "flex",
  gap: 12,
  marginBottom: 14,
};

const search = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: 13,
  fontWeight: 800,
};

const scrollArea = {
  maxHeight: "720px",
  overflowY: "auto",
  paddingRight: 6,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 14,
};

const card = {
  position: "relative",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  overflow: "hidden",
  background: "#fff",
};

const codeBadge = {
  position: "absolute",
  top: 10,
  left: 10,
  zIndex: 2,
  background: "#0b5bd3",
  color: "#fff",
  borderRadius: 8,
  padding: "5px 8px",
  fontSize: 11,
  fontWeight: 1000,
  maxWidth: "85%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const imageBox = {
  height: 120,
  background: "linear-gradient(135deg, #e2e8f0, #f8fafc)",
  display: "grid",
  placeItems: "center",
};

const imageText = {
  fontSize: 34,
  fontWeight: 1000,
  color: "#94a3b8",
};

const body = {
  padding: 12,
};

const name = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.25,
  color: "#0f172a",
  minHeight: 40,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const presentation = {
  margin: "6px 0",
  color: "#475569",
  fontSize: 13,
  fontWeight: 800,
};

const tags = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginBottom: 10,
};

const tag = {
  background: "#dbeafe",
  color: "#1d4ed8",
  borderRadius: 8,
  padding: "4px 7px",
  fontSize: 11,
  fontWeight: 900,
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const price = {
  fontSize: 17,
  color: "#0f172a",
};

const active = {
  color: "#16a34a",
  fontSize: 12,
  fontWeight: 900,
};

const inactive = {
  color: "#991b1b",
  fontSize: 12,
  fontWeight: 900,
};

const empty = {
  padding: 24,
  textAlign: "center",
  color: "#64748b",
  fontWeight: 900,
};

const errorBox = {
  padding: 14,
  borderRadius: 14,
  background: "#fef2f2",
  color: "#991b1b",
  fontWeight: 900,
  marginBottom: 12,
};