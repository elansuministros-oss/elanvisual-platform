import { supabase } from '../lib/supabase';
import { generarProduccionAutomatica } from './motorProduccion';

const limpiar = (arr = [], limite = 20) =>
  Array.isArray(arr) ? arr.slice(0, limite) : [];

function normalizarAI06(valor = '') {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function palabrasClaveAI06(texto = '') {
  const base = normalizarAI06(texto);
  return base
    .split(/[^a-z0-9]+/i)
    .filter((p) => p.length >= 3)
    .slice(0, 30);
}

function puntuarItemAI06(item = {}, claves = []) {
  const textoItem = normalizarAI06(JSON.stringify(item));
  return claves.reduce((total, clave) => total + (textoItem.includes(clave) ? 1 : 0), 0);
}

function filtrarRelevantesAI06(lista = [], mensaje = '', limite = 12) {
  const claves = palabrasClaveAI06(mensaje);
  if (!Array.isArray(lista) || !lista.length || !claves.length) return [];

  return lista
    .map((item) => ({ item, puntos: puntuarItemAI06(item, claves) }))
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, limite)
    .map((x) => x.item);
}

function detectarIntencionTecnicaAI06(mensaje = '') {
  const t = normalizarAI06(mensaje);

  const tipo =
    t.includes('acm') || t.includes('fachada') ? 'Fachada ACM' :
    t.includes('lona') || t.includes('fascia') ? 'Fascia / lona' :
    t.includes('letra') || t.includes('3d') ? 'Letras 3D' :
    t.includes('boton') || t.includes('luminos') || t.includes('led') ? 'Rotulo luminoso' :
    t.includes('pvc') || t.includes('acrilico') ? 'PVC / Acrilico' :
    t.includes('vinil') || t.includes('impresion') ? 'Impresion digital' :
    'Consulta tecnica general';

  const medidas = [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:x|por|\*)\s*(\d+(?:[.,]\d+)?)/g)]
    .map((m) => ({
      ancho: Number(String(m[1]).replace(',', '.')),
      alto: Number(String(m[2]).replace(',', '.')),
      area: Number(String((Number(String(m[1]).replace(',', '.')) * Number(String(m[2]).replace(',', '.'))).toFixed(2))),
    }));

  return {
    tipo,
    requiere_materiales: true,
    requiere_tecnologia: true,
    requiere_proveedor: true,
    requiere_despiece: true,
    medidas_detectadas: medidas,
  };
}


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
    ai06_consulta_tecnica: {
      intencion: detectarIntencionTecnicaAI06(mensaje),
      relevantes: {
        materiales_master: filtrarRelevantesAI06(materiales.data, mensaje, 15),
        tintas_master: filtrarRelevantesAI06(tintas.data, mensaje, 10),
        biblioteca_tecnica: filtrarRelevantesAI06(biblioteca.data, mensaje, 12),
        biblioteca_componentes: filtrarRelevantesAI06(componentes.data, mensaje, 15),
        tecnologias_impresion: filtrarRelevantesAI06(tecnologias.data, mensaje, 10),
        proveedores: filtrarRelevantesAI06(proveedores.data, mensaje, 10),
        cotizaciones_inteligentes: filtrarRelevantesAI06(cotizaciones.data, mensaje, 5),
        pedidos: filtrarRelevantesAI06(pedidos.data, mensaje, 5),
      },
    },
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

