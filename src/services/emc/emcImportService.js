const CORE_URL =
  import.meta.env.VITE_ELANKAV_CORE_URL || "https://elankav-core.vercel.app";

export async function analizarImportacionEMC({
  proveedor,
  tipoProveedor = "materiales",
  modo = "catalogo_mas_lista",
  archivos = [],
  catalogoArchivo = null,
  listaPrecioArchivo = null,
  imagenes = [],
  notas = "",
}) {
  if (!proveedor?.id) {
    throw new Error("Seleccioná primero un proveedor corporativo del Supplier Hub.");
  }

  const archivosFinales = [
    ...archivos,
    catalogoArchivo,
    listaPrecioArchivo,
    ...imagenes,
  ].filter(Boolean);

  if (!archivosFinales.length) {
    throw new Error("Subí al menos un archivo PDF, Excel, CSV, TXT o imagen.");
  }

  const formData = new FormData();

  formData.append("tipo", "importar-emc");
  formData.append("unidad", "ELANVISUAL");
  formData.append("modo_importacion", modo);
  formData.append("tipo_proveedor", tipoProveedor);
  formData.append("notas", notas || "");

  formData.append(
    "proveedor",
    JSON.stringify({
      id: proveedor.id,
      nombre: proveedor.nombre || "",
      razonSocial: proveedor.razonSocial || "",
      ruc: proveedor.ruc || "",
      categoria: proveedor.categoria || "",
      subcategorias: proveedor.subcategorias || "",
      whatsapp: proveedor.whatsapp || "",
      correo: proveedor.correo || "",
    })
  );

  archivosFinales.forEach((archivo, index) => {
    formData.append("archivos", archivo);
    formData.append(
      `archivo_meta_${index}`,
      JSON.stringify({
        nombre: archivo.name || `archivo-${index + 1}`,
        mime: archivo.type || "",
        size: archivo.size || 0,
      })
    );
  });

  const res = await fetch(`${CORE_URL}/api/elan-ai`, {
    method: "POST",
    body: formData,
  });

  let json = null;

  try {
    json = await res.json();
  } catch {
    throw new Error("CORE respondió sin JSON válido.");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.mensaje ||
        json.error ||
        "No se pudo analizar la importación EMC."
    );
  }

  return json;
}