-- AI-13.1 HUB PROVEEDORES / CATALOGO MAESTRO DE MATERIALES V3
-- No modifica tablas actuales.
-- No toca pedidos, producción, compras ni tesorería.

create table if not exists public.elankav_materiales_master (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nombre text not null,
  categoria text not null,
  subcategoria text,
  descripcion text,
  unidad_base text not null,
  espesor text,
  ancho numeric,
  largo numeric,
  medida_texto text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.elankav_materiales_proveedor (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.elankav_materiales_master(id) on delete cascade,
  proveedor_id uuid,
  proveedor_nombre text not null,
  nombre_catalogo text not null,
  codigo_catalogo text,
  marca text,
  unidad_compra text not null,
  precio_lista numeric not null default 0,
  incluye_iva boolean not null default false,
  iva_porcentaje numeric not null default 15,
  precio_final numeric generated always as (
    case
      when incluye_iva = true then precio_lista
      else round((precio_lista * (1 + (iva_porcentaje / 100.0)))::numeric, 2)
    end
  ) stored,
  moneda text not null default 'C$',
  fecha_lista date,
  usar_para_presupuesto boolean not null default true,
  prioridad_compra text default 'Principal',
  fuente text,
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.elankav_materiales_precios_historial (
  id uuid primary key default gen_random_uuid(),
  material_proveedor_id uuid not null references public.elankav_materiales_proveedor(id) on delete cascade,
  precio_anterior numeric,
  precio_nuevo numeric not null,
  incluye_iva boolean not null default false,
  iva_porcentaje numeric not null default 15,
  moneda text not null default 'C$',
  fecha_cambio timestamptz not null default now(),
  fuente text,
  observaciones text,
  created_at timestamptz not null default now()
);

create index if not exists idx_elankav_materiales_master_categoria
on public.elankav_materiales_master(categoria);

create index if not exists idx_elankav_materiales_master_nombre
on public.elankav_materiales_master(nombre);

create index if not exists idx_elankav_materiales_proveedor_material
on public.elankav_materiales_proveedor(material_id);

create index if not exists idx_elankav_materiales_proveedor_nombre
on public.elankav_materiales_proveedor(proveedor_nombre);

create index if not exists idx_elankav_materiales_proveedor_presupuesto
on public.elankav_materiales_proveedor(usar_para_presupuesto, activo);

