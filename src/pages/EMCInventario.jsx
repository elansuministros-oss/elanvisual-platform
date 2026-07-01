import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ProveedorCatalogoAI22 from "../components/emc/ProveedorCatalogoAI22";

export default function EMCInventario() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [cargando, setCargando] = useState(false);
  const proveedor = proveedores.find((p) => String(p.id) === String(proveedorId));

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data, error } = await supabase
        .from("elankav_supplier_empresas")
        .select("*")
        .order("nombre", { ascending: true });

      if (!error) {
        setProveedores(data || []);
        if ((data || []).length) setProveedorId(data[0].id);
      }
      setCargando(false);
    }

    cargar();
  }, []);

  return (
    <main style={{ padding: 24, background: "#f4f6fb", minHeight: "100vh" }}>
      <section style={{ background: "#fff", borderRadius: 24, padding: 24, marginBottom: 18 }}>
        <small style={{ fontWeight: 900, color: "#2563eb" }}>CATÁLOGO MAESTRO EMC</small>
        <h1 style={{ margin: "8px 0", fontSize: 36 }}>Inventario EMC</h1>
        <p style={{ margin: 0, color: "#64748b", fontWeight: 800 }}>
          Productos guardados desde el Catálogo Maestro EMC por proveedor.
        </p>
      </section>

      <section style={{ background: "#fff", borderRadius: 24, padding: 18, marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>
          Proveedor
        </label>
        <select
          value={proveedorId}
          onChange={(e) => setProveedorId(e.target.value)}
          style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #cbd5e1", fontWeight: 900 }}
        >
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre || p.razon_social || "Proveedor"}
            </option>
          ))}
        </select>
        {cargando && <p>Cargando proveedores...</p>}
      </section>

      {proveedor ? (
        <ProveedorCatalogoAI22 proveedor={proveedor} />
      ) : (
        <section style={{ background: "#fff", borderRadius: 24, padding: 24, color: "#64748b", fontWeight: 900 }}>
          No hay proveedor seleccionado.
        </section>
      )}
    </main>
  );
}
