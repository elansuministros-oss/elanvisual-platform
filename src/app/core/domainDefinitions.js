import { DOMAIN_IDS, DOMAIN_STATUS } from '../../shared/constants/domainIds';

const responsibilities = Object.freeze({
  public: 'Experiencia publica, tienda, servicios, carrito, contacto y seguimiento.',
  commercial: 'Cotizacion comercial, clientes, aprobacion y conversion a pedido.',
  crm: 'Operacion CRM, clientes, contactos, vendedores, reportes y actividad corporativa.',
  catalog: 'Material Master, tintas, combinaciones, tecnologias y biblioteca tecnica.',
  knowledge: 'Conocimiento tecnico reutilizable y fuentes validadas.',
  suppliers: 'Supplier Hub, proveedores, contactos, capacidades y productos.',
  emc: 'Catalogo Maestro EMC, importacion AI-22 y normalizacion de catalogos proveedor.',
  ai: 'IA operativa, memoria, acciones, archivos y borradores.',
  inventory: 'Inventario operativo, reservas, consumo, retazos y disponibilidad.',
  purchasing: 'Compras, solicitudes, ordenes y abastecimiento.',
  production: 'Produccion, OT, procesos, materiales requeridos y estados productivos.',
  orders: 'Pedidos, ordenes de trabajo, historial y seguimiento.',
  finance: 'Finanzas, pagos, anticipos, saldos, recibos y rentabilidad.',
  pdf: 'Documentos PDF generados desde datos aprobados.',
  admin: 'Usuarios, permisos, configuracion y gobierno operativo.',
});

const allowedDependencies = Object.freeze({
  public: ['commercial', 'catalog', 'orders'],
  commercial: ['catalog', 'knowledge', 'suppliers', 'emc', 'ai', 'inventory', 'orders', 'finance', 'pdf'],
  crm: ['commercial', 'orders', 'finance', 'suppliers', 'admin'],
  catalog: ['emc', 'suppliers', 'knowledge'],
  knowledge: ['catalog', 'emc', 'suppliers'],
  suppliers: ['emc', 'catalog'],
  emc: ['suppliers', 'catalog'],
  ai: ['catalog', 'knowledge', 'suppliers', 'emc', 'commercial', 'orders', 'production', 'finance'],
  inventory: ['catalog', 'suppliers', 'orders', 'production', 'purchasing'],
  purchasing: ['suppliers', 'inventory', 'orders', 'finance'],
  production: ['orders', 'catalog', 'inventory', 'purchasing', 'pdf'],
  orders: ['commercial', 'production', 'finance', 'pdf', 'inventory'],
  finance: ['orders', 'commercial', 'pdf'],
  pdf: ['commercial', 'orders', 'finance', 'production'],
  admin: ['crm', 'commercial', 'catalog', 'suppliers', 'orders', 'finance'],
});

const forbiddenDependencies = Object.freeze([
  'pages',
  'components',
  'App.jsx',
  'direct-supabase-from-ui',
  'direct-core-from-ui',
  'other-domain-internals',
]);

export const DOMAIN_DEFINITIONS = Object.freeze(
  DOMAIN_IDS.map((id) =>
    Object.freeze({
      id,
      name: id,
      responsibility: responsibilities[id],
      status: DOMAIN_STATUS.ACTIVE,
      allowedDependencies: allowedDependencies[id] || [],
      forbiddenDependencies,
    })
  )
);
