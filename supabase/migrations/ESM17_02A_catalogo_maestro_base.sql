-- ESM-17 PAQUETE 02A
-- CATÁLOGO MAESTRO ELAN
-- ESTRUCTURA BASE SUPABASE

create extension if not exists "pgcrypto";

create table if not exists catalogo_maestro_items (
  id uuid primary key default gen_random_uuid(),

  codigo text unique,
  nombre text not null,
  nombre_normalizado text not null,

  tipo text not null check (
    tipo in (
      'PRODUCTO',
      'MATERIAL',
      'COMPONENTE',
      'PROCESO',
      'MANO_OBRA',
      'ACABADO',
      'SERVICIO',
      'EQUIPO'
    )
  ),

  familia text,
  subfamilia text,
  descripcion text,

  unidad_base text,
  estado text not null default 'ACTIVO' check (
    estado in ('ACTIVO', 'INACTIVO', 'OBSOLETO')
  ),

  origen text not null default 'EMC',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint catalogo_maestro_items_nombre_tipo_unique
    unique (nombre_normalizado, tipo)
);

create table if not exists catalogo_maestro_proveedores (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,
  nombre_normalizado text not null unique,

  ruc text,
  telefono text,
  email text,

  estado text not null default 'ACTIVO' check (
    estado in ('ACTIVO', 'INACTIVO')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalogo_maestro_proveedor_items (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references catalogo_maestro_items(id) on delete cascade,
  proveedor_id uuid not null references catalogo_maestro_proveedores(id) on delete cascade,

  codigo_proveedor text,
  nombre_proveedor_item text,

  precio numeric(14,4),
  moneda text not null default 'USD',

  presentacion text,
  unidad_compra text,
  disponibilidad text,

  lista_precio_id uuid,
  estado text not null default 'ACTIVO' check (
    estado in ('ACTIVO', 'INACTIVO', 'DESCONTINUADO')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint catalogo_maestro_proveedor_item_unique
    unique (item_id, proveedor_id, codigo_proveedor)
);

create table if not exists catalogo_maestro_compatibilidades (
  id uuid primary key default gen_random_uuid(),

  producto_id uuid not null references catalogo_maestro_items(id) on delete cascade,
  item_compatible_id uuid not null references catalogo_maestro_items(id) on delete cascade,

  rol text not null,
  obligatorio boolean not null default false,

  estado text not null default 'ACTIVO' check (
    estado in ('ACTIVO', 'INACTIVO')
  ),

  created_at timestamptz not null default now(),

  constraint catalogo_maestro_compatibilidad_unique
    unique (producto_id, item_compatible_id, rol),

  constraint catalogo_maestro_no_auto_compatibilidad
    check (producto_id <> item_compatible_id)
);

create table if not exists catalogo_maestro_plantillas_producto (
  id uuid primary key default gen_random_uuid(),

  producto_id uuid not null references catalogo_maestro_items(id) on delete cascade,

  nombre text not null,
  descripcion text,

  estado text not null default 'ACTIVA' check (
    estado in ('ACTIVA', 'INACTIVA', 'OBSOLETA')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint catalogo_maestro_plantilla_unique
    unique (producto_id, nombre)
);

create table if not exists catalogo_maestro_plantilla_requisitos (
  id uuid primary key default gen_random_uuid(),

  plantilla_id uuid not null references catalogo_maestro_plantillas_producto(id) on delete cascade,

  rol text not null,
  tipo_requerido text not null check (
    tipo_requerido in (
      'MATERIAL',
      'COMPONENTE',
      'PROCESO',
      'MANO_OBRA',
      'ACABADO',
      'SERVICIO'
    )
  ),

  obligatorio boolean not null default true,
  orden integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists idx_catalogo_maestro_items_tipo
  on catalogo_maestro_items(tipo);

create index if not exists idx_catalogo_maestro_items_familia
  on catalogo_maestro_items(familia);

create index if not exists idx_catalogo_maestro_items_nombre_normalizado
  on catalogo_maestro_items(nombre_normalizado);

create index if not exists idx_catalogo_maestro_proveedor_items_item
  on catalogo_maestro_proveedor_items(item_id);

create index if not exists idx_catalogo_maestro_proveedor_items_proveedor
  on catalogo_maestro_proveedor_items(proveedor_id);

create index if not exists idx_catalogo_maestro_compatibilidades_producto
  on catalogo_maestro_compatibilidades(producto_id);

create index if not exists idx_catalogo_maestro_compatibilidades_item
  on catalogo_maestro_compatibilidades(item_compatible_id);

create index if not exists idx_catalogo_maestro_plantillas_producto
  on catalogo_maestro_plantillas_producto(producto_id);
