export const TIPOS_TEMPORALES_AI = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'application/pdf',
];

export function validarArchivoTemporalAI(file) {
  if (!file) return { ok: false, error: 'Archivo no recibido.' };

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'svg', 'pdf'];

  if (!extensionesPermitidas.includes(extension)) {
    return { ok: false, error: 'Formato no permitido. Usar JPG, PNG, SVG o PDF.' };
  }

  const maxMb = 12;
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, error: `Archivo muy pesado. Máximo ${maxMb} MB.` };
  }

  return { ok: true };
}

export function leerArchivoComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        nombre: file.name,
        tipo: file.type,
        tamano: file.size,
        extension: file.name.split('.').pop()?.toLowerCase() || '',
        dataUrl: reader.result,
      });
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo temporal.'));
    reader.readAsDataURL(file);
  });
}

export async function prepararArchivosTemporalesAI(files = []) {
  const lista = Array.from(files || []);
  const resultado = [];

  for (const file of lista) {
    const validacion = validarArchivoTemporalAI(file);
    if (!validacion.ok) {
      resultado.push({
        ok: false,
        nombre: file.name,
        error: validacion.error,
      });
      continue;
    }

    const leido = await leerArchivoComoDataUrl(file);

    resultado.push({
      ok: true,
      ...leido,
      metadata: {
        nombre_original: file.name,
        mime_type: file.type,
        tamano_bytes: file.size,
        temporal: true,
        guardar_permanente: false,
      },
    });
  }

  return resultado;
}

export function construirResumenArchivosTemporales(archivos = []) {
  if (!archivos.length) return '';

  return archivos
    .map((a, index) => {
      if (!a.ok) {
        return `Archivo ${index + 1}: ${a.nombre} — ERROR: ${a.error}`;
      }

      return [
        `Archivo ${index + 1}: ${a.nombre}`,
        `Tipo: ${a.tipo || 'sin mime'}`,
        `Extensión: ${a.extension}`,
        `Tamaño: ${a.tamano} bytes`,
        `Modo: análisis temporal, no guardar en Storage`,
      ].join('\n');
    })
    .join('\n\n');
}