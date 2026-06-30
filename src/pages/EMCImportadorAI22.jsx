import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Image,
  PackageSearch,
  RefreshCcw,
  UploadCloud,
} from "lucide-react";
import { listSuppliersV2 as obtenerProveedores } from "../services/suppliers";
import { importarEMCAI22 } from "../services/emc/emcImportAi22Service";

const extensionesPermitidas = ".pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp";

const card = {
  background: "#fff",
  border: "1px solid rgba(15,23,42,.10)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 18px 45px rgba(15,23,42,.08)",
};

const input = {
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: 12,
  fontWeight: 800,
  background: "#fff",
  width: "100%",
};

function formatoBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconoArchivo(file = {}) {
  const nombre = String(file.name || file.nombre || "").toLowerCase();
  const tipo = String(file.type || file.mime || "").toLowerCase();

  if (tipo.includes("image") || /\.(png|jpg|jpeg|webp)$/i.test(nombre)) return <Image size={20} />;
  if (tipo.includes("spreadsheet") || /\.(xlsx|xls|csv)$/i.test(nombre)) return <FileSpreadsheet size={20} />;
  if (tipo.includes("pdf") || nombre.endsWith(".pdf")) return <FileText size={20} />;
  return <FileArchive size={20} />;
}

function obtenerPaginas(resultado) {
  return (resultado?.resultados || []).flatMap((archivo) =>
    (archivo.paginas || []).map((pagina) => ({
      archivo: archivo.name || archivo.nombre || "Archivo",
      tipo: archivo.type || "",
      ...pagina,
    }))
  );
}

export default function EMCImportadorAI22() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [guardarAutomatico, setGuardarAutomatico] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const proveedor = useMemo(
    () => proveedores.find((p) => String(p.id) === String(proveedorId)) || null,
    [proveedores, proveedorId]
  );

  const paginas = useMemo(() => obtenerPaginas(resultado), [resultado]);

  useEffect(() => {
    cargarProveedores();
  }, []);

  async function cargarProveedores() {
    try {
      setError("");
      const data = await obtenerProveedores();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar proveedores.");
    }
  }

  function seleccionarArchivos(evento) {
    const lista = Array.from(evento.target.files || []);
    setArchivos(lista);
    setResultado(null);
    setMensaje("");
    setError("");
  }

  async function procesar() {
    if (!proveedor?.id) {
      setError("Seleccioná un proveedor.");
      return;
    }

    if (!archivos.length) {
      setError("Seleccioná al menos un archivo.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      setMensaje("Subiendo archivos y procesando en CORE AI-22...");
      setResultado(null);

      const data = await importarEMCAI22({
        proveedor,
        archivos,
        guardarAutomatico,
      });

      setResultado(data);
      setMensaje("Importación procesada por AI-22.");
    } catch (err) {
      setError(err.message || "No se pudo procesar la importación AI-22.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <small style={{ color: "#64748b", fontWeight: 900 }}>AI-22.1 NUEVO</small>
              <h1 style={{ margin: "6px 0", fontSize: 34, color: "#0f172a" }}>
                Importador EMC AI-22
              </h1>
              <p style={{ margin: 0, color: "#475569", fontWeight: 700 }}>
                Proveedor → Storage → CORE /api/emc-import → resultado por archivo y página.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarProveedores}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: "12px 16px",
                background: "#fff",
                fontWeight: 900,
                cursor: "pointer",
                height: 48,
              }}
            >
              <RefreshCcw size={16} /> Recargar
            </button>
          </div>
        </section>

        {error && (
          <div style={{ ...card, borderColor: "#fecaca", color: "#991b1b", fontWeight: 900 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {mensaje && (
          <div style={{ ...card, borderColor: "#bbf7d0", color: "#166534", fontWeight: 900 }}>
            <CheckCircle2 size={18} /> {mensaje}
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>1. Proveedor</h2>
            <select style={input} value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre || p.razonSocial || p.name || p.id}
                </option>
              ))}
            </select>

            {proveedor && (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 18, background: "#f1f5f9" }}>
                <b>{proveedor.nombre || proveedor.razonSocial || "Proveedor"}</b>
                <div style={{ color: "#64748b", fontWeight: 700 }}>
                  {proveedor.ruc || "Sin RUC"} · {proveedor.whatsapp || "Sin WhatsApp"}
                </div>
              </div>
            )}
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>2. Archivos</h2>

            <label
              style={{
                border: "2px dashed #94a3b8",
                borderRadius: 22,
                padding: 24,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                cursor: "pointer",
                background: "#f8fafc",
              }}
            >
              <UploadCloud size={38} />
              <b>Seleccionar PDF, Excel, imagen, CSV o TXT</b>
              <small style={{ color: "#64748b", fontWeight: 800 }}>{extensionesPermitidas}</small>
              <input
                type="file"
                multiple
                accept={extensionesPermitidas}
                onChange={seleccionarArchivos}
                style={{ display: "none" }}
              />
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, fontWeight: 900 }}>
              <input
                type="checkbox"
                checked={guardarAutomatico}
                onChange={(e) => setGuardarAutomatico(e.target.checked)}
              />
              Guardar automático en EMC
            </label>
          </div>
        </section>

        {archivos.length > 0 && (
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Archivos seleccionados</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {archivos.map((archivo, index) => (
                <div
                  key={`${archivo.name}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontWeight: 800,
                  }}
                >
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {iconoArchivo(archivo)}
                    {archivo.name}
                  </span>
                  <span>{formatoBytes(archivo.size)}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={cargando}
              onClick={procesar}
              style={{
                marginTop: 16,
                border: 0,
                borderRadius: 18,
                padding: "14px 18px",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 1000,
                cursor: cargando ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              <PackageSearch size={18} /> {cargando ? "Procesando..." : "Procesar con AI-22"}
            </button>
          </section>
        )}

        {resultado && (
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Resultado CORE AI-22</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div style={card}>Archivos<br /><b>{resultado.resumen?.archivos || 0}</b></div>
              <div style={card}>Páginas<br /><b>{resultado.resumen?.paginas || 0}</b></div>
              <div style={card}>Detectados<br /><b>{resultado.resumen?.items_detectados || 0}</b></div>
              <div style={card}>Guardados<br /><b>{resultado.resumen?.items_guardados || 0}</b></div>
            </div>

            <h3>Páginas procesadas</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {paginas.map((pagina, index) => (
                <div
                  key={index}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: pagina.ok === false ? "#fef2f2" : "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <b>{pagina.archivo}</b> · Página {pagina.pagina}
                  <div style={{ color: "#64748b", fontWeight: 800 }}>
                    Detectados: {pagina.items_detectados || 0} · Guardados: {pagina.items_guardados || 0}
                  </div>
                  {pagina.error && <div style={{ color: "#991b1b", fontWeight: 900 }}>{pagina.error}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}