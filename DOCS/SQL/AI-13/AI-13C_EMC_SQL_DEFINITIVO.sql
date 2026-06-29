-- AI-13C — ELANKAV MASTER CATALOG (EMC)
-- Supabase: ELANVISION / ELANVISUAL
-- Integra con Hub de Proveedores: public.elankav_supplier_empresas
-- No modifica tablas actuales del ERP.

create table if not exists public.elankav_catalogo_categorias (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  orden int default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.elankav_catalogo_subcategorias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.elankav_catalogo_categorias(id),
  codigo text not null,
  nombre text not null,
  descripcion text,
  orden int default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(categoria_id, codigo)
);

create table if not exists public.elankav_catalogo_tipos_item (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.elankav_catalogo_unidades (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  simbolo text,
  tipo text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.elankav_catalogo_marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.elankav_catalogo_items (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  categoria_id uuid not null references public.elankav_catalogo_categorias(id),
  subcategoria_id uuid references public.elankav_catalogo_subcategorias(id),
  tipo_item_id uuid not null references public.elankav_catalogo_tipos_item(id),
  unidad_base_id uuid not null references public.elankav_catalogo_unidades(id),
  descripcion text,
  medida_texto text,
  espesor numeric,
  ancho numeric,
  largo numeric,
  alto numeric,
  color text,
  unidad_calculo text not null default 'UNIDAD',
  uso text not null default 'COMPRA',
  es_compartido boolean not null default true,
  estado text not null default 'ACTIVO',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (unidad_calculo in ('M2','ML','UNIDAD','LAMINA','ROLLO','LITRO','GALON')),
  check (uso in ('COMPRA','VENTA','AMBOS','INTERNO')),
  check (estado in ('ACTIVO','DESCONTINUADO','BLOQUEADO','EN_REVISION','OBSOLETO','PENDIENTE_APROBACION'))
);

create table if not exists public.elankav_catalogo_item_plataformas (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.elankav_catalogo_items(id) on delete cascade,
  plataforma text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique(item_id, plataforma),
  check (plataforma in ('ELANVISUAL','ELANPET','ELANCENTER','ELANHOME','ELANAI','CORE','CORPORATIVO'))
);

create table if not exists public.elankav_catalogo_listas_precio (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.elankav_supplier_empresas(id),
  nombre text not null,
  version text not null,
  fecha_lista date not null,
  fecha_inicio date,
  fecha_fin date,
  moneda text not null default 'C$',
  incluye_iva_default boolean not null default false,
  iva_porcentaje_default numeric not null default 15,
  estado text not null default 'BORRADOR',
  fuente text,
  observaciones text,
  activa boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(proveedor_id, version),
  check (estado in ('BORRADOR','ACTIVA','HISTORICA','ARCHIVADA'))
);

create table if not exists public.elankav_catalogo_proveedor_items (
  id uuid primary key default gen_random_uuid(),
  lista_precio_id uuid references public.elankav_catalogo_listas_precio(id) on delete set null,
  proveedor_id uuid not null references public.elankav_supplier_empresas(id),
  item_id uuid not null references public.elankav_catalogo_items(id),
  marca_id uuid references public.elankav_catalogo_marcas(id),
  unidad_compra_id uuid references public.elankav_catalogo_unidades(id),
  codigo_catalogo text,
  nombre_catalogo text not null,
  presentacion text,
  precio_lista numeric,
  incluye_iva boolean not null default false,
  iva_porcentaje numeric not null default 15,
  precio_final numeric generated always as (
    case
      when precio_lista is null then null
      when incluye_iva = true then round(precio_lista::numeric, 2)
      else round((precio_lista * (1 + (iva_porcentaje / 100.0)))::numeric, 2)
    end
  ) stored,
  precio_confirmado boolean not null default false,
  estado_informacion text not null default 'SIN_PRECIO',
  usar_presupuesto boolean not null default true,
  prioridad_compra smallint not null default 1,
  rendimiento_m2 numeric,
  rendimiento_ml numeric,
  unidades_por_presentacion numeric,
  costo_m2 numeric,
  costo_ml numeric,
  costo_unitario numeric,
  ultima_verificacion date,
  activo boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (estado_informacion in ('COMPLETO','SIN_PRECIO','SIN_CATALOGO','PENDIENTE','EN_REVISION','PARCIAL'))
);

create table if not exists public.elankav_catalogo_equivalencias (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.elankav_catalogo_items(id) on delete cascade,
  proveedor_id uuid not null references public.elankav_supplier_empresas(id),
  marca_id uuid references public.elankav_catalogo_marcas(id),
  nombre_equivalente text not null,
  codigo_equivalente text,
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.elankav_catalogo_atributos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  tipo_dato text not null default 'TEXTO',
  unidad_id uuid references public.elankav_catalogo_unidades(id),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  check (tipo_dato in ('TEXTO','NUMERO','BOOLEAN','FECHA','LISTA'))
);

create table if not exists public.elankav_catalogo_item_atributos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.elankav_catalogo_items(id) on delete cascade,
  atributo_id uuid not null references public.elankav_catalogo_atributos(id),
  valor_texto text,
  valor_numero numeric,
  valor_boolean boolean,
  valor_fecha date,
  created_at timestamptz not null default now(),
  unique(item_id, atributo_id)
);

create table if not exists public.elankav_catalogo_precios_historial (
  id uuid primary key default gen_random_uuid(),
  proveedor_item_id uuid not null references public.elankav_catalogo_proveedor_items(id) on delete cascade,
  precio_anterior numeric,
  precio_nuevo numeric,
  incluye_iva boolean,
  iva_porcentaje numeric,
  moneda text,
  fecha_cambio timestamptz not null default now(),
  fuente text,
  observaciones text,
  created_at timestamptz not null default now()
);

create index if not exists idx_emc_items_nombre on public.elankav_catalogo_items(nombre);
create index if not exists idx_emc_items_categoria on public.elankav_catalogo_items(categoria_id);
create index if not exists idx_emc_items_unidad_calculo on public.elankav_catalogo_items(unidad_calculo);
create index if not exists idx_emc_listas_proveedor on public.elankav_catalogo_listas_precio(proveedor_id);
create index if not exists idx_emc_listas_estado on public.elankav_catalogo_listas_precio(estado, activa);
create index if not exists idx_emc_proveedor_items_item on public.elankav_catalogo_proveedor_items(item_id);
create index if not exists idx_emc_proveedor_items_proveedor on public.elankav_catalogo_proveedor_items(proveedor_id);
create index if not exists idx_emc_proveedor_items_presupuesto on public.elankav_catalogo_proveedor_items(usar_presupuesto, activo);
create index if not exists idx_emc_equivalencias_item on public.elankav_catalogo_equivalencias(item_id);
create index if not exists idx_emc_equivalencias_proveedor on public.elankav_catalogo_equivalencias(proveedor_id);

