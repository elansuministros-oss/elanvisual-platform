const CORE_URL =
  import.meta.env.VITE_ELANKAV_CORE_URL || "https://elankav-core.vercel.app";

export async function analizarArchivoEMC({ proveedor, texto, fileName, fileMime }) {
  const res = await fetch(`${CORE_URL}/api/elan-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "importar-emc",
      proveedor,
      texto_extraido: texto,
      file_name: fileName,
      file_mime: fileMime,
      unidad: "ELANVISUAL",
    }),
  });

  const json = await res.json();

  if (!res.ok || json.ok === false) {
    throw new Error(json.mensaje || json.error || "No se pudo analizar el archivo EMC");
  }

  return json;
}
