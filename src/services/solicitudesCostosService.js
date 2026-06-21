import { supabase } from '../lib/supabase';

function codigoSolicitudCosto() {
  return `SC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now().toString().slice(-5)}`;
}

export async function crearSolicitudesCostosFaltantes({
  faltantes = [],
  mensajeOriginal = '',
  proyectoActivo = null,
  usuario = null,
  firma = {},
} = {}) {
  if (!supabase || !Array.isArray(faltantes) || faltantes.length === 0) {
    return [];
  }

  const payloads = faltantes.map((faltante) => ({
    codigo: codigoSolicitudCosto(),
    estado: 'pendiente',
    prioridad: faltante.prioridad || 'media',
    origen: 'AI Studio',
    tipo: faltante.tipo || 'material',
    descripcion_solicitada: faltante.descripcion || faltante.motivo || 'Costo faltante solicitado por IA',
    mensaje_original: mensajeOriginal,
    proyecto_ai_id: proyectoActivo?.id || null,
    proyecto_nombre: proyectoActivo?.nombre || '',
    vendedor_id: firma?.vendedor_id || null,
    codigo_vendedor: firma?.codigo_vendedor || '',
    usuario_nombre: usuario?.nombre || usuario?.usuario || usuario?.email || '',
  }));

  const { data, error } = await supabase
    .from('solicitudes_costos')
    .insert(payloads)
    .select('*');

  if (error) {
    console.error('Error creando solicitudes de costos:', error);
    return [];
  }

  return data || [];
}
