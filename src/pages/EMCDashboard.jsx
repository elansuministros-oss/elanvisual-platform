import React, { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Building2,
  CheckCircle2,
  FileText,
  FileUp,
  Image,
  Layers3,
  PackageSearch,
  RefreshCcw,
  Ruler,
  Tags,
} from "lucide-react";
import { obtenerResumenEMC } from "../services/emc/emcService";
import { analizarImportacionEMC } from "../services/emc/emcImportService";

const proveedorInicial = {
  nombre: "",
};

const modosImportacion = [
  {
    key: "catalogo_con_precios",
    titulo: "Catálogo con precios",
    desc: "Un solo archivo trae productos, descripciones y precios.",
  },
  {
    key: "catalogo_mas_lista",
    titulo: "Catálogo + lista de precios",
    desc: "Catálogo por separado y precios en otro archivo.",
  },
  {
    key: "solo_lista_precios",
    titulo: "Solo lista de precios",
    desc: "Actualiza precios o crea productos básicos.",
  },
];

export default function EMCDashboard() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const [proveedor, setProveedor] = useState(proveedorInicial);
  const [modo, setModo] = useState("catalogo_mas_lista");
  const [catalogoTexto, setCatalogoTexto] = useState("");
  const [listaPrecioTexto, setListaPrecioTexto] = useState("");

  const modoActual = useMemo(
    () => modosImportacion.find((m) => m.key === modo),
    [modo]
  );

  async function cargarResumen() {
    try {
      setCargando(true);
      setError("");
      const data = await obtenerResumenEMC();
      setResumen(data);
    } catch (err) {
      setError(err.message || "No se pudo cargar EMC");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarResumen();
  }, []);

  async function analizar() {
    try {
      setAnalizando(true);
      setError("");
      setResultado(null);

      if (!proveedor.nombre.trim()) {
        throw new Error("Escribí o seleccioná primero el proveedor.");
      }

      if (modo === "catalogo_con_precios" && !catalogoTexto.trim()) {
        throw new Error("Pegá el contenido del catálogo con precios.");
      }

      if (modo === "catalogo_mas_lista" && !catalogoTexto.trim() && !listaPrecioTexto.trim()) {
        throw new Error("Pegá el contenido del catálogo y/o la lista de precios.");
      }

      if (modo === "solo_lista_precios" && !listaPrecioTexto.trim()) {
        throw new Error("Pegá el contenido de la lista de precios.");
      }

      const data = await analizarImportacionEMC({
        proveedor,
        modo,
        catalogoTexto,
        listaPrecioTexto,
        fileName: `${proveedor.nombre || "proveedor"}-${modo}.txt`,
        fileMime: "text/plain",
      });

      setResultado(data);
    } catch (err) {
      setError(err.message || "Error analizando importación EMC");
    } finally {
      setAnalizando(false);
    }
  }

  const cards = [
    ["Categorías", resumen?.categorias || 0, <Layers3 size={22} />],
    ["Subcategorías", resumen?.subcategorias || 0, <Tags size={22} />],
    ["Marcas", resumen?.marcas || 0, <Building2 size={22} />],
    ["Unidades", resumen?.unidades || 0, <Ruler size={22} />],
    ["Ítems", resumen?.items || 0, <PackageSearch size={22} />],
    ["Multimedia", resumen?.multimedia || 0, <Image size={22} />],
    ["Listas precio", resumen?.listasPrecio || 0, <Boxes size={22} />],
  ];

  const items = resultado?.propuesta?.items || [];

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: 14 }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{
          borderRadius: 28,
          padding: 20,
          background: "linear-gradient(135deg,#0f172a,#334155)",
          color: "#fff",
          boxShadow: "0 24px 60px rgba(15,23,42,.20)",
        }}>
          <span style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,.12)",
            fontSize: 12,
            fontWeight: 900,
          }}>
            <Boxes size={17} />
            ELANKAV MASTER CATALOG
          </span>

          <h1 style={{ margin: "14px 0 6px", fontSize: "clamp(30px,7vw,50px)", lineHeight: 1 }}>
            Catálogo Maestro EMC
          </h1>

          <p style={{ margin: 0, color: "rgba(255,255,255,.78)", fontWeight: 650, maxWidth: 760 }}>
            Importación inteligente de catálogos, listas de precios, materiales, proveedores e información técnica para IA.
          </p>
        </div>

        {error && (
          <div style={{
            marginTop: 12,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: 18,
            padding: 14,
            fontWeight: 800,
          }}>
            {error}
          </div>
        )}

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
          gap: 10,
          marginTop: 14,
        }}>
          {cards.map(([label, value, icon]) => (
            <article key={label} style={{
              background: "#fff",
              border: "1px solid rgba(15,23,42,.08)",
              borderRadius: 22,
              padding: 15,
              boxShadow: "0 14px 32px rgba(15,23,42,.07)",
            }}>
              <div style={{ color: "#1E5AA8" }}>{icon}</div>
              <b style={{ display: "block", fontSize: 28, marginTop: 8 }}>
                {cargando ? "…" : value}
              </b>
              <small style={{ color: "#64748b", fontWeight: 800 }}>{label}</small>
            </article>
          ))}
        </section>

        <section style={{
          marginTop: 14,
          background: "#fff",
          border: "1px solid rgba(15,23,42,.08)",
          borderRadius: 24,
          padding: 16,
          boxShadow: "0 18px 45px rgba(15,23,42,.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <small style={{ color: "#64748b", fontWeight: 900 }}>IMPORTADOR INTELIGENTE</small>
              <h2 style={{ margin: "3px 0 0", color: "#0f172a" }}>
                {proveedor.nombre || "Proveedor no seleccionado"}
              </h2>
            </div>

            <button type="button" onClick={cargarResumen} style={{
              border: 0,
              borderRadius: 999,
              padding: "10px 13px",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}>
              <RefreshCcw size={16} /> Actualizar
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
            marginTop: 16,
          }}>
            <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
              Proveedor
              <input
                value={proveedor.nombre}
                onChange={(e) => setProveedor({ nombre: e.target.value })}
                placeholder="Ej: Centro de Pinturas Vargas"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: 12,
                  fontWeight: 800,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
              Modo de importación
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: 12,
                  fontWeight: 800,
                  background: "#fff",
                }}
              >
                {modosImportacion.map((m) => (
                  <option key={m.key} value={m.key}>{m.titulo}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{
            marginTop: 12,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            borderRadius: 18,
            padding: 12,
            color: "#475569",
            fontWeight: 750,
          }}>
            <CheckCircle2 size={17} /> {modoActual?.desc}
          </div>

          {modo !== "solo_lista_precios" && (
            <div style={{ marginTop: 14 }}>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>
                <FileText size={18} /> Catálogo de productos
              </h3>
              <textarea
                value={catalogoTexto}
                onChange={(e) => setCatalogoTexto(e.target.value)}
                placeholder="Pegá aquí el texto extraído del catálogo: productos, descripciones, códigos, medidas, colores, usos, precios si vienen incluidos..."
                style={{
                  width: "100%",
                  minHeight: 150,
                  border: "1px solid #cbd5e1",
                  borderRadius: 18,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 650,
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {modo !== "catalogo_con_precios" && (
            <div style={{ marginTop: 14 }}>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>
                <FileUp size={18} /> Lista de precios
              </h3>
              <textarea
                value={listaPrecioTexto}
                onChange={(e) => setListaPrecioTexto(e.target.value)}
                placeholder="Pegá aquí la lista de precios: códigos, productos, moneda, precio, IVA, presentación, unidad..."
                style={{
                  width: "100%",
                  minHeight: 150,
                  border: "1px solid #cbd5e1",
                  borderRadius: 18,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 650,
                  resize: "vertical",
                }}
              />
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={analizar} disabled={analizando} style={{
              border: 0,
              borderRadius: 999,
              padding: "13px 18px",
              background: "#1E5AA8",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}>
              <FileUp size={18} /> {analizando ? "Analizando..." : "Analizar con CORE"}
            </button>

            <button
              type="button"
              onClick={() => {
                setCatalogoTexto("");
                setListaPrecioTexto("");
                setResultado(null);
                setError("");
              }}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 999,
                padding: "13px 18px",
                background: "#fff",
                color: "#0f172a",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Limpiar
            </button>
          </div>
        </section>

        {resultado && (
          <section style={{
            marginTop: 14,
            background: "#fff",
            border: "1px solid rgba(15,23,42,.08)",
            borderRadius: 24,
            padding: 16,
            boxShadow: "0 18px 45px rgba(15,23,42,.08)",
          }}>
            <small style={{ color: "#64748b", fontWeight: 900 }}>VISTA PREVIA EMC</small>
            <h2 style={{ margin: "3px 0 12px", color: "#0f172a" }}>
              {items.length} ítems detectados
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: 10 }}>Producto</th>
                    <th style={{ padding: 10 }}>Categoría</th>
                    <th style={{ padding: 10 }}>Unidad</th>
                    <th style={{ padding: 10 }}>Precio</th>
                    <th style={{ padding: 10 }}>IVA</th>
                    <th style={{ padding: 10 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={`${item.nombre}-${i}`} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{item.nombre}</td>
                      <td style={{ padding: 10 }}>{item.categoria_sugerida} / {item.subcategoria_sugerida}</td>
                      <td style={{ padding: 10 }}>{item.unidad_sugerida}</td>
                      <td style={{ padding: 10 }}>{item.precio_detectado || "Revisar"} {item.moneda_sugerida}</td>
                      <td style={{ padding: 10 }}>{item.iva_detectado?.detectado ? "Detectado" : "Revisar"}</td>
                      <td style={{ padding: 10 }}>{item.requiere_revision ? "Revisión" : "Listo"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}