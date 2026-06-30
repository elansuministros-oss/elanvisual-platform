import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  Building2,
  CheckCircle2,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FileUp,
  Image,
  Layers3,
  PackageSearch,
  RefreshCcw,
  Ruler,
  Save,
  Search,
  Tags,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  obtenerResumenEMC,
  guardarImportacionEMC,
  listarItemsEMC,
} from "../services/emc/emcService";
import { analizarImportacionEMC } from "../services/emc/emcImportService";
import { listSuppliersV2 as obtenerProveedores } from "../services/suppliers";

const modosImportacion = [
  { key: "catalogo_con_precios", titulo: "Catálogo con precios", desc: "Un solo archivo trae productos, descripciones y precios." },
  { key: "catalogo_mas_lista", titulo: "Catálogo + lista de precios", desc: "Catálogo por separado y precios en otro archivo." },
  { key: "solo_lista_precios", titulo: "Solo lista de precios", desc: "Actualiza precios o crea productos básicos." },
];

const tiposProveedor = [
  { key: "materiales", label: "Materiales" },
  { key: "produccion", label: "Producción" },
  { key: "mixto", label: "Mixto" },
];

const extensionesPermitidas = ".pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp";

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: 12,
  fontWeight: 800,
  background: "#fff",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid rgba(15,23,42,.08)",
  borderRadius: 24,
  padding: 16,
  boxShadow: "0 18px 45px rgba(15,23,42,.08)",
};

function formatoBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconoArchivo(file = {}) {
  const nombre = String(file.name || "").toLowerCase();
  const tipo = String(file.type || "").toLowerCase();

  if (tipo.includes("image") || /\.(png|jpg|jpeg|webp)$/i.test(nombre)) return <Image size={20} />;
  if (tipo.includes("spreadsheet") || /\.(xlsx|xls|csv)$/i.test(nombre)) return <FileSpreadsheet size={20} />;
  if (tipo.includes("pdf") || nombre.endsWith(".pdf")) return <FileText size={20} />;
  return <FileArchive size={20} />;
}

function normalizarItems(resultado) {
  const items = resultado?.propuesta?.items || resultado?.items || [];
  return Array.isArray(items) ? items : [];
}

export default function EMCDashboard() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const [tab, setTab] = useState("importar");
  const [productosEMC, setProductosEMC] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [busquedaEMC, setBusquedaEMC] = useState("");

  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [tipoProveedor, setTipoProveedor] = useState("materiales");
  const [modo, setModo] = useState("catalogo_mas_lista");
  const [archivos, setArchivos] = useState([]);
  const [notas, setNotas] = useState("");

  const proveedor = useMemo(
    () => proveedores.find((p) => String(p.id) === String(proveedorId)) || null,
    [proveedores, proveedorId]
  );

  const modoActual = useMemo(() => modosImportacion.find((m) => m.key === modo), [modo]);
  const items = useMemo(() => normalizarItems(resultado), [resultado]);

  const cards = [
    ["Categorías", resumen?.categorias || 0, <Layers3 size={22} />],
    ["Subcategorías", resumen?.subcategorias || 0, <Tags size={22} />],
    ["Marcas", resumen?.marcas || 0, <Building2 size={22} />],
    ["Unidades", resumen?.unidades || 0, <Ruler size={22} />],
    ["Productos", resumen?.items || 0, <PackageSearch size={22} />],
    ["Multimedia", resumen?.multimedia || 0, <Image size={22} />],
    ["Listas precio", resumen?.listasPrecio || 0, <Boxes size={22} />],
  ];

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [resumenData, proveedoresData] = await Promise.all([
        obtenerResumenEMC(),
        obtenerProveedores(),
      ]);

      setResumen(resumenData);
      setProveedores((proveedoresData || []).filter((p) => p.activo !== false));
    } catch (err) {
      setError(err.message || "No se pudo cargar EMC.");
    } finally {
      setCargando(false);
    }
  }

  async function cargarProductosEMC() {
    try {
      setCargandoProductos(true);
      setError("");

      const data = await listarItemsEMC({
        busqueda: busquedaEMC,
        proveedorId,
        limite: 300,
      });

      setProductosEMC(data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar productos EMC.");
    } finally {
      setCargandoProductos(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (tab === "productos") cargarProductosEMC();
  }, [tab, proveedorId]);

  function agregarArchivos(lista) {
    const nuevos = Array.from(lista || []);
    if (!nuevos.length) return;

    setArchivos((prev) => {
      const existentes = new Set(prev.map((a) => `${a.name}-${a.size}-${a.lastModified}`));
      const filtrados = nuevos.filter((a) => !existentes.has(`${a.name}-${a.size}-${a.lastModified}`));
      return [...prev, ...filtrados];
    });

    setResultado(null);
    setError("");
  }

  function quitarArchivo(index) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
    setResultado(null);
  }

  async function analizar() {
    try {
      setAnalizando(true);
      setError("");
      setResultado(null);

      const data = await analizarImportacionEMC({
        proveedor,
        tipoProveedor,
        modo,
        archivos,
        notas,
      });

      setResultado(data);
    } catch (err) {
      setError(err.message || "Error analizando importación EMC.");
    } finally {
      setAnalizando(false);
    }
  }

  async function guardarEnEMC() {
    try {
      setGuardando(true);
      setError("");

      await guardarImportacionEMC({
        proveedor,
        items,
        resultado,
        notas,
      });

      setResultado(null);
      setArchivos([]);
      setNotas("");
      await cargarDatos();
      setTab("productos");
      await cargarProductosEMC();
    } catch (err) {
      setError(err.message || "No se pudo guardar en EMC.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: 14 }}>
      <section style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 28,
            padding: 22,
            background: "linear-gradient(135deg,#0f172a,#334155)",
            color: "#fff",
            boxShadow: "0 24px 60px rgba(15,23,42,.20)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,.12)",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            <Boxes size={17} />
            ELANKAV MASTER CATALOG
          </span>

          <h1 style={{ margin: "14px 0 6px", fontSize: "clamp(30px,7vw,52px)", lineHeight: 1 }}>
            Catálogo Maestro EMC
          </h1>

          <p style={{ margin: 0, color: "rgba(255,255,255,.78)", fontWeight: 650, maxWidth: 830 }}>
            Importación, revisión y administración visual del Catálogo Maestro.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#991b1b",
              borderRadius: 18,
              padding: 14,
              fontWeight: 850,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: 10,
            marginTop: 14,
          }}
        >
          {cards.map(([label, value, icon]) => (
            <article key={label} style={{ ...cardStyle, borderRadius: 22, padding: 15 }}>
              <div style={{ color: "#1E5AA8" }}>{icon}</div>
              <b style={{ display: "block", fontSize: 28, marginTop: 8 }}>
                {cargando ? "…" : value}
              </b>
              <small style={{ color: "#64748b", fontWeight: 800 }}>{label}</small>
            </article>
          ))}
        </section>

        <section style={{ ...cardStyle, marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setTab("importar")}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "12px 18px",
              background: tab === "importar" ? "#1E5AA8" : "#e2e8f0",
              color: tab === "importar" ? "#fff" : "#0f172a",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Importar
          </button>

          <button
            type="button"
            onClick={() => setTab("productos")}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "12px 18px",
              background: tab === "productos" ? "#1E5AA8" : "#e2e8f0",
              color: tab === "productos" ? "#fff" : "#0f172a",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Productos EMC
          </button>

          <button
            type="button"
            onClick={() => {
              cargarDatos();
              if (tab === "productos") cargarProductosEMC();
            }}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "12px 18px",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            <RefreshCcw size={16} /> Actualizar
          </button>
        </section>

        {tab === "productos" && (
          <section style={{ ...cardStyle, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <small style={{ color: "#64748b", fontWeight: 900 }}>PRODUCTOS GUARDADOS</small>
                <h2 style={{ margin: "3px 0 4px", color: "#0f172a" }}>
                  {cargandoProductos ? "Cargando..." : `${productosEMC.length} productos EMC`}
                </h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px,1fr) minmax(220px,320px) auto",
                gap: 10,
                marginTop: 14,
              }}
            >
              <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
                Buscar producto
                <input
                  value={busquedaEMC}
                  onChange={(e) => setBusquedaEMC(e.target.value)}
                  placeholder="Nombre o código..."
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
                Proveedor
                <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={inputStyle}>
                  <option value="">Todos</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={cargarProductosEMC}
                style={{
                  alignSelf: "end",
                  border: 0,
                  borderRadius: 16,
                  padding: "13px 18px",
                  background: "#1E5AA8",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <Search size={17} /> Buscar
              </button>
            </div>

            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: 980 }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: 12, textAlign: "left" }}>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Marca</th>
                    <th>Unidad</th>
                    <th>Proveedor</th>
                    <th>Precio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosEMC.map((item) => (
                    <tr key={item.id} style={{ background: "#fff" }}>
                      <td style={{ padding: 12, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }}>
                        <b style={{ display: "block", color: "#0f172a" }}>{item.nombre || "Sin nombre"}</b>
                        <small style={{ color: "#64748b", fontWeight: 800 }}>{item.codigo || "Sin código"}</small>
                      </td>
                      <td style={{ padding: 12 }}>
                        <b>{item.categoria_nombre}</b>
                        <small style={{ display: "block", color: "#64748b" }}>{item.subcategoria_nombre}</small>
                      </td>
                      <td style={{ padding: 12 }}>{item.marca_nombre}</td>
                      <td style={{ padding: 12 }}>{item.unidad_nombre}</td>
                      <td style={{ padding: 12 }}>{item.proveedor_nombre}</td>
                      <td style={{ padding: 12, fontWeight: 900 }}>
                        {item.precio_actual ? `${item.moneda_actual || ""} ${item.precio_actual}` : "Sin precio"}
                      </td>
                      <td style={{ padding: 12, borderTopRightRadius: 14, borderBottomRightRadius: 14 }}>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "6px 10px",
                            background: item.activo === false ? "#fee2e2" : "#dcfce7",
                            color: item.activo === false ? "#991b1b" : "#166534",
                            fontWeight: 900,
                            fontSize: 12,
                          }}
                        >
                          {item.activo === false ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!cargandoProductos && !productosEMC.length && (
                    <tr>
                      <td colSpan={7} style={{ padding: 18, textAlign: "center", color: "#64748b", fontWeight: 800 }}>
                        No hay productos EMC para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "importar" && (
          <>
            <section style={{ ...cardStyle, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <small style={{ color: "#64748b", fontWeight: 900 }}>FLUJO OFICIAL EMC</small>
                  <h2 style={{ margin: "3px 0 0", color: "#0f172a" }}>
                    Proveedor → Archivos → CORE → Vista previa → Guardar
                  </h2>
                  <p style={{ margin: "5px 0 0", color: "#64748b", fontWeight: 700 }}>
                    El catálogo entra por PDF, Excel, CSV, TXT o imágenes.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
                  Proveedor corporativo
                  <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={inputStyle}>
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
                  Tipo de proveedor
                  <select value={tipoProveedor} onChange={(e) => setTipoProveedor(e.target.value)} style={inputStyle}>
                    {tiposProveedor.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a" }}>
                  Tipo de importación
                  <select value={modo} onChange={(e) => setModo(e.target.value)} style={inputStyle}>
                    {modosImportacion.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.titulo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {proveedor && (
                <div
                  style={{
                    marginTop: 12,
                    border: "1px solid #dbeafe",
                    background: "#eff6ff",
                    borderRadius: 18,
                    padding: 12,
                    color: "#1e3a8a",
                    fontWeight: 800,
                  }}
                >
                  <CheckCircle2 size={17} /> {proveedor.nombre} ·{" "}
                  {proveedor.razonSocial || "Sin razón social"} · {proveedor.categoria || "Sin categoría"}
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  borderRadius: 18,
                  padding: 12,
                  color: "#475569",
                  fontWeight: 750,
                }}
              >
                <CheckCircle2 size={17} /> {modoActual?.desc}
              </div>

              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  agregarArchivos(e.dataTransfer.files);
                }}
                style={{
                  marginTop: 14,
                  minHeight: 170,
                  border: "2px dashed #93c5fd",
                  background: "#f8fbff",
                  borderRadius: 24,
                  padding: 18,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="file"
                  accept={extensionesPermitidas}
                  multiple
                  onChange={(e) => agregarArchivos(e.target.files)}
                  style={{ display: "none" }}
                />
                <div>
                  <UploadCloud size={42} color="#1E5AA8" />
                  <h3 style={{ margin: "10px 0 4px", color: "#0f172a" }}>
                    Subir PDF, Excel, CSV, TXT o imágenes
                  </h3>
                  <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
                    Arrastrá archivos aquí o tocá para seleccionarlos.
                  </p>
                </div>
              </label>

              {!!archivos.length && (
                <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                  {archivos.map((archivo, index) => (
                    <div
                      key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 12,
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                        <span style={{ color: "#1E5AA8" }}>{iconoArchivo(archivo)}</span>
                        <div style={{ minWidth: 0 }}>
                          <b style={{ display: "block", color: "#0f172a", wordBreak: "break-word" }}>
                            {archivo.name}
                          </b>
                          <small style={{ color: "#64748b", fontWeight: 800 }}>
                            {archivo.type || "Tipo no declarado"} · {formatoBytes(archivo.size)}
                          </small>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => quitarArchivo(index)}
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fff1f2",
                          color: "#991b1b",
                          borderRadius: 999,
                          padding: 9,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label style={{ display: "grid", gap: 7, fontWeight: 900, color: "#0f172a", marginTop: 14 }}>
                Notas internas para CORE
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ejemplo: lista trae precios + IVA..."
                  style={{
                    width: "100%",
                    minHeight: 90,
                    border: "1px solid #cbd5e1",
                    borderRadius: 18,
                    padding: 14,
                    fontSize: 14,
                    fontWeight: 650,
                    resize: "vertical",
                  }}
                />
              </label>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={analizar}
                  disabled={analizando}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: "13px 18px",
                    background: "#1E5AA8",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: analizando ? "not-allowed" : "pointer",
                    opacity: analizando ? 0.75 : 1,
                  }}
                >
                  <FileUp size={18} /> {analizando ? "Analizando con CORE..." : "Analizar con CORE"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setArchivos([]);
                    setResultado(null);
                    setNotas("");
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
              <section style={{ ...cardStyle, marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <small style={{ color: "#64748b", fontWeight: 900 }}>VISTA PREVIA EMC</small>
                    <h2 style={{ margin: "3px 0 4px", color: "#0f172a" }}>
                      {items.length} productos detectados
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={guardarEnEMC}
                    disabled={guardando || !items.length}
                    style={{
                      border: 0,
                      borderRadius: 999,
                      padding: "13px 18px",
                      background: items.length ? "#16a34a" : "#94a3b8",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: guardando || !items.length ? "not-allowed" : "pointer",
                    }}
                  >
                    <Save size={18} /> {guardando ? "Guardando..." : "Guardar en EMC"}
                  </button>
                </div>

                {!items.length ? (
                  <div
                    style={{
                      marginTop: 14,
                      border: "1px solid #fde68a",
                      background: "#fffbeb",
                      color: "#92400e",
                      borderRadius: 18,
                      padding: 14,
                      fontWeight: 800,
                    }}
                  >
                    CORE respondió, pero todavía no devolvió productos estructurados.
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 16,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                      gap: 12,
                    }}
                  >
                    {items.map((item, i) => {
                      const precio = item.precio_detectado ?? item.precio ?? item.precio_sugerido ?? null;
                      const moneda = item.moneda_sugerida || item.moneda || "USD";

                      return (
                        <article
                          key={`${item.codigo || item.nombre || "item"}-${i}`}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 22,
                            overflow: "hidden",
                            background: "#fff",
                            boxShadow: "0 12px 28px rgba(15,23,42,.06)",
                          }}
                        >
                          <div style={{ padding: 14 }}>
                            <small style={{ color: "#64748b", fontWeight: 900 }}>
                              {item.codigo || item.sku || `EMC-${String(i + 1).padStart(4, "0")}`}
                            </small>

                            <h3 style={{ margin: "5px 0 8px", color: "#0f172a", lineHeight: 1.15 }}>
                              {item.nombre || "Producto sin nombre"}
                            </h3>

                            <p style={{ margin: 0, color: "#475569", fontWeight: 750 }}>
                              Marca: {item.marca_sugerida || item.marca || "Sin marca"}
                            </p>
                            <p style={{ margin: "4px 0 0", color: "#475569", fontWeight: 750 }}>
                              Categoría: {item.categoria_sugerida || item.categoria || "General"}
                            </p>
                            <p style={{ margin: "4px 0 0", color: "#475569", fontWeight: 750 }}>
                              Proveedor: {item.proveedor_sugerido || proveedor?.nombre || "Sin proveedor"}
                            </p>

                            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <b style={{ color: "#0f172a", fontSize: 20 }}>
                                {precio ? `${moneda} ${precio}` : "Revisar precio"}
                              </b>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}