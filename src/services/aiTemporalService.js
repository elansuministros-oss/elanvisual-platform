@'
export const TIPOS_TEMPORALES_AI = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'application/pdf',
];

const MAX_MB_ARCHIVO = 12;
const MAX_MB_ENVIO = 1.8;
const MAX_LADO_IMAGEN = 1200;
const CALIDAD_JPG = 0.72;

export function validarArchivoTemporalAI(file) {
  if (!file) return { ok: false, error: 'Archivo no recibido.' };

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'svg', 'pdf'];

  if (!extensionesPermitidas.includes(extension)) {
    return { ok: false, error: 'Formato no permitido. Usar JPG, PNG, SVG o PDF.' };
  }

  if (file.size > MAX_MB_ARCHIVO * 1024 * 1024) {
    return { ok: false, error: `Archivo muy pesado. Máximo ${MAX_MB_ARCHIVO} MB.` };
  }

  return { ok: true };
}

function leerComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo temporal.'));
    reader.readAsDataURL(file);
  });
}

function cargarImagen(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión.'));
    img.src = dataUrl;
  });
}

async function comprimirImagenTemporal(file) {
  const originalDataUrl = await leerComoDataUrl(file);
  const img = await cargarImagen(originalDataUrl);

  const escala = Math.min(1, MAX_LADO_IMAGEN / Math.max(img.width, img.height));
  const width = Math.round(img.width * escala);
  const height = Math.round(img.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', CALIDAD_JPG);

  return {
    nombre: file.name,
    tipo: 'image/jpeg',
    tamano: file.size,
    extension: 'jpg',
    dataUrl,
    comprimido: true,
    dimensiones: { width, height, width_original: img.width, height_original: img.height },
  };
}

export async function leerArchivoComoDataUrl(file) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png'].includes(extension)) {
    return comprimirImagenTemporal(file);
  }

  if (extension === 'pdf') {
    return {
      nombre: file.name,
      tipo: file.type || 'application/pdf',
      tamano: file.size,
      extension,
      dataUrl: null,
      contenido_temporal: null,
      aviso: 'PDF recibido temporalmente. Para evitar payload pesado, se envía metadata; extracción PDF avanzada queda para AI-04C/AI-05.',
    };
  }

  const dataUrl = await leerComoDataUrl(file);

  return {
    nombre: file.name,
    tipo: file.type,
    tamano: file.size,
    extension,
    dataUrl,
  };
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

    const dataUrlBytes = leido.dataUrl ? Math.round((leido.dataUrl.length * 3) / 4) : 0;

    if (dataUrlBytes > MAX_MB_ENVIO * 1024 * 1024) {
      resultado.push({
        ok: false,
        nombre: file.name,
        error: `Archivo temporal demasiado grande para enviar al CORE después de compresión. Máximo ${MAX_MB_ENVIO} MB.`,
      });
      continue;
    }

    resultado.push({
      ok: true,
      ...leido,
      metadata: {
        nombre_original: file.name,
        mime_type: file.type,
        tamano_bytes: file.size,
        tamano_envio_bytes: dataUrlBytes,
        comprimido: Boolean(leido.comprimido),
        dimensiones: leido.dimensiones || null,
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
        `Tamaño original: ${a.tamano} bytes`,
        a.metadata?.tamano_envio_bytes ? `Tamaño envío: ${a.metadata.tamano_envio_bytes} bytes` : null,
        a.comprimido ? 'Imagen comprimida para análisis temporal' : null,
        a.aviso || null,
        `Modo: análisis temporal, no guardar en Storage`,
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');
}
'@ | Set-Content src\services\aiTemporalService.js -Encoding UTF8