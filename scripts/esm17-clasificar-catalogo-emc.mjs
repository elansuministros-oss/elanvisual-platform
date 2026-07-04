const REGLAS = [
  {
    tipo_principal: 'PRODUCTO',
    configurable: true,
    nivel_producto: 'CONFIGURABLE',
    uso: 'Producto comercial configurable',
    familia: 'Exhibidores',
    subfamilia: 'Roll Up',
    patrones: [/roll\s*up/i],
  },
  {
    tipo_principal: 'PRODUCTO',
    configurable: true,
    nivel_producto: 'CONFIGURABLE',
    uso: 'Producto comercial configurable',
    familia: 'Exhibidores',
    subfamilia: 'X Banner',
    patrones: [/x[\s-]*banner/i],
  },
  {
    tipo_principal: 'PRODUCTO',
    configurable: true,
    nivel_producto: 'CONFIGURABLE',
    uso: 'Producto comercial configurable',
    familia: 'Señalización luminosa',
    subfamilia: 'Light Box',
    patrones: [/light\s*box/i, /lightbox/i, /caja\s+de\s+luz/i],
  },

  {
    tipo_principal: 'COMPONENTE',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Componente estructural',
    familia: 'Perfiles',
    subfamilia: 'Perfil aluminio',
    patrones: [/perfil/i, /channel/i],
  },
  {
    tipo_principal: 'COMPONENTE',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Componente de iluminación',
    familia: 'Iluminación',
    subfamilia: 'LED',
    patrones: [/\bled\b/i, /modulo\s+led/i, /módulo\s+led/i, /fuente/i, /driver/i],
  },

  {
    tipo_principal: 'MATERIAL',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Material gráfico flexible',
    familia: 'Lonas',
    subfamilia: 'Lona Banner',
    patrones: [/lona/i, /banner/i, /frontlit/i, /backlit/i, /mesh/i],
  },
  {
    tipo_principal: 'MATERIAL',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Material adhesivo',
    familia: 'Viniles',
    subfamilia: 'Vinil',
    patrones: [/vinil/i, /vinyl/i, /adhesivo/i, /frost/i, /reflectivo/i, /micro\s*perforado/i],
  },
  {
    tipo_principal: 'MATERIAL',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Material rígido',
    familia: 'PVC',
    subfamilia: 'PVC',
    patrones: [/\bpvc\b/i],
  },
  {
    tipo_principal: 'MATERIAL',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Material rígido compuesto',
    familia: 'ACM',
    subfamilia: 'ACM',
    patrones: [/\bacm\b/i, /alucobond/i],
  },
  {
    tipo_principal: 'MATERIAL',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Material rígido acrílico',
    familia: 'Acrílicos',
    subfamilia: 'Acrílico',
    patrones: [/acrilico/i, /acrílico/i],
  },

  {
    tipo_principal: 'PROCESO',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Proceso productivo',
    familia: 'Impresión',
    subfamilia: 'Impresión',
    patrones: [/impresi[oó]n/i, /\buv\b/i, /ecosolvente/i, /sublimaci[oó]n/i],
  },
  {
    tipo_principal: 'SERVICIO',
    configurable: false,
    nivel_producto: 'BASE',
    uso: 'Servicio operativo',
    familia: 'Servicios',
    subfamilia: 'Instalación',
    patrones: [/instalaci[oó]n/i, /transporte/i, /levantamiento/i, /mantenimiento/i],
  },
];

function clasificar(nombre = '') {
  const texto = String(nombre).trim();

  for (const regla of REGLAS) {
    if (regla.patrones.some((patron) => patron.test(texto))) {
      return {
        tipo_principal: regla.tipo_principal,
        configurable: regla.configurable,
        nivel_producto: regla.nivel_producto,
        uso: regla.uso,
        familia: regla.familia,
        subfamilia: regla.subfamilia,
      };
    }
  }

  return {
    tipo_principal: null,
    configurable: false,
    nivel_producto: null,
    uso: 'PENDIENTE_REVISION',
    familia: null,
    subfamilia: null,
  };
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replaceAll("'", "''")}'`;
}

const sql = `
-- ESM-17 PAQUETE 03
-- Clasificador del Catálogo EMC existente
-- Ejecutar después de validar reglas.

-- NOTA:
-- Este script genera UPDATEs a partir de nombres actuales.
-- No crea tablas.
-- No modifica IDs.
-- No elimina registros.
`;

console.log(sql);

console.log(`
-- REGLAS USADAS:
-- PRODUCTO: Roll Up, X Banner, Light Box
-- COMPONENTE: Perfil, Channel, LED, fuente, driver
-- MATERIAL: Lona/Banner/Backlit/Mesh, Vinil/Adhesivo/Frost/Reflectivo, PVC, ACM, Acrílico
-- PROCESO: Impresión, UV, Ecosolvente, Sublimación
-- SERVICIO: Instalación, Transporte, Levantamiento, Mantenimiento
`);

console.log(`
-- USO:
-- Este script requiere exportar los items actuales como JSON si se desea generar SQL exacto.
-- Para este paquete se entrega el clasificador reutilizable y verificable.
`);

export { clasificar, REGLAS };
