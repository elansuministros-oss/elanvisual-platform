import { supabase } from '../lib/supabase';
import { generarProduccionAutomatica } from './motorProduccion';

const limpiar = (arr = [], limite = 20) =>
  Array.isArray(arr) ? arr.slice(0, limite) : [];

async function leerTabla(tabla, orden = 'created_at', limite = 30) {
  if (!supabase) return { ok: false, tabla, data: [], error: 'Supabase no disponible' };

  try {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .order(orden, { ascending: false })
      .limit(limite);

    if (error) throw error;
    return { ok: true, tabla, data: data || [] };
  } catch (error) {
    return { ok: false, tabla, data: [], error: error.message };
  }
}

export async function cargarMemoriaOperativaElan({
  mensaje = '',
  proyectoActivo = null,
  usuario = null,
  firma = {},
} = {}) {
  const [
    materiales,
    tintas,
    biblioteca,
    componentes,
    tecnologias,
    proveedores,
    cotizaciones,
    pedidos,
  ] = await Promise.all([
    leerTabla('materiales_master', 'created_at', 80),
    leerTabla('tintas_master', 'created_at', 40),
    leerTabla('biblioteca_tecnica', 'created_at', 40),
    leerTabla('biblioteca_componentes', 'created_at', 80),
    leerTabla('tecnologias_impresion', 'created_at', 40),
    leerTabla('proveedores', 'created_at', 40),
    leerTabla('cotizaciones_inteligentes', 'created_at', 20),
    leerTabla('pedidos', 'created_at', 20),
  ]);

  const produccionPreliminar = generarProduccionAutomatica({
    pedido: {
      descripcion: mensaje,
      proyecto: proyectoActivo,
      cotizacion: {},
    },
    cotizacion: {},
    proveedores: proveedores.data || [],
  });

  return {
    version: 'AI-05',
    unidad: 'ELANVISUAL',
    generado_en: new Date().toISOString(),
    usuario: {
      id: usuario?.id || null,
      nombre: usuario?.nombre || usuario?.usuario || usuario?.email || '',
      rol: usuario?.rol || '',
      vendedor_id: firma?.vendedor_id || null,
      codigo_vendedor: firma?.codigo_vendedor || '',
    },
    proyecto: proyectoActivo,
    entrada_usuario: mensaje,
    fuentes: {
      materiales_master: limpiar(materiales.data, 80),
      tintas_master: limpiar(tintas.data, 40),
      biblioteca_tecnica: limpiar(biblioteca.data, 40),
      biblioteca_componentes: limpiar(componentes.data, 80),
      tecnologias_impresion: limpiar(tecnologias.data, 40),
      proveedores: limpiar(proveedores.data, 40),
      cotizaciones_inteligentes: limpiar(cotizaciones.data, 20),
      pedidos: limpiar(pedidos.data, 20),
    },
    produccion_preliminar: produccionPreliminar,
    reglas: [
      'No inventar materiales, precios, proveedores ni tecnologías.',
      'Si un dato no existe en memoria operativa, indicar pendiente de validación.',
      'Usar materiales_master, tintas_master, biblioteca_tecnica, tecnologias_impresion y proveedores como fuente prioritaria.',
      'El despiece generado es preliminar hasta validación técnica.',
      'No guardar archivos temporales automáticamente.',
    ],
    estado_fuentes: {
      materiales_master: materiales.ok,
      tintas_master: tintas.ok,
      biblioteca_tecnica: biblioteca.ok,
      biblioteca_componentes: componentes.ok,
      tecnologias_impresion: tecnologias.ok,
      proveedores: proveedores.ok,
      cotizaciones_inteligentes: cotizaciones.ok,
      pedidos: pedidos.ok,
    },
  };
}
