const CORE_URL =
  import.meta.env.VITE_ELANKAV_CORE_URL || "https://elankav-core.vercel.app";

export async function analizarImportacionEMC({
  proveedor,
  tipoProveedor,
  modo,
  catalogoTexto = "",
  listaPrecioTexto = "",
  fileName = "importacion-emc.txt",
  fileMime = "text/plain",
}) {
  const texto = [
    `MODO_IMPORTACION: ${modo}`,
    `TIPO_PROVEEDOR: ${tipoProveedor || ""}`,
    `PROVEEDOR_ID: ${proveedor?.id || ""}`,
    `PROVEEDOR: ${proveedor?.nombre || ""}`,
    `RAZON_SOCIAL: ${proveedor?.razonSocial || ""}`,
    "",
    "=== CATALOGO ===",
    catalogoTexto || "",
    "",
    "=== LISTA_PRECIOS ===",
    listaPrecioTexto || "",
  ].join("\n");

  const res = await fetch(`${CORE_URL}/api/elan-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "importar-emc",
      unidad: "ELANVISUAL",
      proveedor,
      tipo_proveedor: tipoProveedor,
      modo_importacion: modo,
      texto_extraido: texto,
      file_name: fileName,
      file_mime: fileMime,
    }),
  });

  const json = await res.json();

  if (!res.ok || json.ok === false) {
    throw new Error(json.mensaje || json.error || "No se pudo analizar la importación EMC");
  }

  return json;
}
