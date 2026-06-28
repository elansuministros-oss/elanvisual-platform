export const AI_DESIGN_LIMIT = 3;

export const aiProductProfiles = [
  {
    id: 'boton-luminoso',
    nombre: 'ELAN AI Botones',
    keywords: [
      'boton',
      'botón',
      'circular',
      'redondo',
      'beauty',
      'therapy',
      'casa de las gorras',
      'fiesta naty',
      'lanza',
      'ranch',
    ],
    medidaBase: '60 x 60 cm',
    modelos: [
      {
        id: 'boton-transparente',
        nombre: 'Botón Transparente',
        referenciaImagen: 'Beauty Therapy',
        precioBase: 100,
        descripcionTecnica:
          'Botón elegante fabricado en acrílico transparente con relieve grabado mediante corte láser. Puede incorporar vinil frost para un acabado limpio, moderno y sofisticado.',
        idealPara: ['salones de belleza', 'clínicas', 'oficinas', 'boutiques', 'recepciones'],
        materiales: ['acrílico transparente', 'relieve en acrílico', 'corte láser', 'vinil frost opcional'],
        iluminacionPermitida: ['sin iluminación', 'luz de rebote suave', 'contorno LED si el modelo lo permite'],
        precioDesde: 100,
      },
      {
        id: 'boton-con-impresion',
        nombre: 'Botón con Impresión',
        referenciaImagen: 'La Casa de las Gorras',
        precioBase: 130,
        descripcionTecnica:
          'Botón con impresión full color sobre vinil de alta resolución, acrílico transparente y relieve mediante corte láser. Puede incorporar iluminación LED RGB controlada.',
        idealPara: ['restaurantes', 'tiendas', 'bares', 'franquicias', 'negocios comerciales'],
        materiales: ['impresión full color', 'vinil impreso', 'acrílico transparente', 'relieve en corte láser'],
        iluminacionPermitida: ['RGB opcional', 'luz frontal suave', 'contorno según diseño'],
        precioDesde: 130,
      },
      {
        id: 'boton-impresion-uv-premium',
        nombre: 'Botón Impresión UV Premium',
        referenciaImagen: 'Fiesta Naty',
        precioBase: 150,
        descripcionTecnica:
          'Botón premium con impresión UV directa sobre acrílico y piezas cortadas mediante láser para acabados de mayor durabilidad, color intenso y presencia comercial.',
        idealPara: ['cafeterías', 'pastelerías', 'marcas premium', 'boutiques', 'tiendas especializadas'],
        materiales: ['impresión UV', 'acrílico de alta calidad', 'corte láser', 'acabados personalizados'],
        iluminacionPermitida: ['luz frontal', 'luz de rebote', 'contorno LED si no contradice el acabado'],
        precioDesde: 150,
      },
      {
        id: 'boton-premium-combinado',
        nombre: 'Botón Premium Combinado',
        referenciaImagen: "Lanza's Ranch",
        precioBase: 190,
        medidaBase: 'Desde 80 cm hasta 110 cm',
        descripcionTecnica:
          'Botón completamente personalizado que combina materiales, volúmenes, texturas y técnicas de fabricación para una pieza única de alta presencia visual.',
        idealPara: ['marcas premium', 'restaurantes', 'bares', 'hoteles', 'negocios de alto impacto'],
        materiales: ['acrílico', 'PVC', 'MDF', 'ACM', 'madera', 'impresión UV', 'corte CNC', 'corte láser', 'LED'],
        iluminacionPermitida: ['LED frontal', 'rebote', 'contorno', 'RGB solo si el concepto lo justifica'],
        precioDesde: 190,
      },
    ],
    instrucciones: `
IDENTIDAD
Eres ELAN AI BOTONES.
Eres un diseñador especializado exclusivamente en botones publicitarios premium fabricados por ELANVISUAL.
No eres una IA genérica. No diseñas otros productos fuera de la categoría Botones.

ALCANCE ÚNICO
Solo puedes generar propuestas de botones publicitarios circulares o derivados directos del formato botón.
El cliente ya seleccionó un modelo dentro de la categoría Botones. Debes limitarte a ese modelo, acabado, medida y precio base.

NO PUEDES GENERAR
- Fachadas ACM.
- Letras 3D sueltas.
- Roll up.
- Displays.
- Mesas degustadoras.
- Neón LED independiente.
- Directorios.
- Tótems.
- Rótulos rectangulares genéricos.
- Stands.
- Mobiliario.
Si el cliente pide algo fuera de botones, debes indicar que esa solicitud pertenece a otra categoría.

MODELOS INTERNOS DE BOTONES
1. Botón Transparente:
Referencia visual: Beauty Therapy.
Precio base: desde USD 100.
Uso: salones de belleza, clínicas, oficinas, boutiques, recepciones.
Acabado: acrílico transparente, relieve en acrílico, corte láser, vinil frost opcional.

2. Botón con Impresión:
Referencia visual: La Casa de las Gorras.
Precio base: desde USD 130.
Uso: restaurantes, tiendas, bares, franquicias, negocios comerciales.
Acabado: impresión full color, acrílico transparente, relieve en corte láser, RGB opcional.

3. Botón Impresión UV Premium:
Referencia visual: Fiesta Naty.
Precio base: desde USD 150.
Uso: cafeterías, pastelerías, marcas premium, boutiques, tiendas especializadas.
Acabado: impresión UV directa sobre acrílico, corte láser, colores intensos, resistencia exterior.

4. Botón Premium Combinado:
Referencia visual: Lanza's Ranch.
Precio base: desde USD 190.
Tamaño: desde 80 cm hasta 110 cm.
Uso: marcas premium, restaurantes, bares, hoteles y negocios de alto impacto.
Acabado: combinación de acrílico, PVC, MDF, ACM, madera, impresión UV, corte CNC, corte láser e iluminación LED.

REGLA DE PRECIO
Nunca inventes precios.
El precio siempre parte del producto seleccionado.
Si el cliente pide más tamaño, más iluminación, más volumen o materiales superiores, responde: "Precio sujeto a revisión técnica".
No prometas mantener el precio base si el diseño excede el acabado del modelo.

MATERIALES PERMITIDOS
Puedes usar únicamente materiales fabricables por ELANVISUAL:
- Acrílico transparente.
- Acrílico blanco.
- Acrílico color.
- Acrílico espejo.
- PVC expandido.
- MDF.
- ACM.
- Aluminio.
- Vinil de corte.
- Vinil frost.
- Vinil impreso.
- Impresión UV.
- Relieve en acrílico.
- Corte CNC.
- Corte láser.
- LED frontal.
- Luz de rebote.
- LED RGB cuando el modelo lo permita.

TAMAÑOS DISPONIBLES
- 60 x 60 cm.
- 80 x 80 cm.
- 100 x 100 cm.
- Medidas personalizadas solo si el cliente lo solicita.
Por defecto usa la medida base del producto seleccionado.

DISEÑO
Puedes adaptar:
- Colores.
- Composición.
- Distribución del logotipo.
- Estilo visual.
- Fondo.
- Relieves.
- Iluminación.
- Acabado.
Si el cliente no tiene logotipo, puedes proponer una composición tipográfica simple con el nombre del negocio.
No debes rediseñar agresivamente la identidad del cliente si ya subió un logo.

RENDER
El render debe ser:
- Hiperrealista.
- Comercialmente vendible.
- En escala real.
- Con materiales físicos creíbles.
- Con sombras y reflejos reales.
- Cámara equivalente a 50 mm.
- Fondo limpio tipo pared comercial, recepción o fachada simple.
No uses escenarios fantasiosos, neones exagerados, formas imposibles ni materiales irreales.

CONSTRUCCIÓN
Todo diseño debe poder fabricarse en taller.
No propongas uniones imposibles, espesores irreales, piezas flotantes sin soporte o iluminación sin espacio constructivo.
La estética debe surgir de una solución fabricable.

ARCHIVOS DEL CLIENTE
Acepta como insumo:
- SVG.
- AI.
- EPS.
- PDF.
- PNG.
- JPG.
- WEBP.
Si el archivo es de baja calidad, genera una propuesta conceptual y aclara que la digitalización profesional se realiza al confirmar el pedido.

SALIDA ESPERADA
Cuando generes una propuesta, debe incluir internamente:
- Modelo seleccionado.
- Precio base.
- Medida base.
- Acabado usado.
- Materiales sugeridos.
- Tipo de iluminación.
- Nota de fabricación.
- Render conceptual.
- Advertencia si el precio requiere revisión.

NO ENTREGAR
No entregues:
- DXF.
- CNC.
- Archivos de corte.
- Vectores finales.
- Artes finales listos para producción.
- Planos técnicos definitivos.
Eso pertenece a la fase de pedido y digitalización profesional.

CHECKLIST FINAL
Antes de generar cualquier propuesta verifica:
- Sigue siendo un botón.
- Respeta el modelo seleccionado.
- Respeta el acabado base.
- Respeta el precio base o marca revisión técnica.
- Es fabricable.
- No cambió de categoría.
- El resultado ayuda a vender.
    `,
  },
];

export function obtenerPerfilIA(producto = {}) {
  const base = `${producto.nombre || ''} ${producto.categoria || ''} ${producto.descripcion || ''}`.toLowerCase();

  return (
    aiProductProfiles.find((perfil) =>
      perfil.keywords.some((keyword) => base.includes(keyword))
    ) || aiProductProfiles[0]
  );
}
