-- ESM-17 PAQUETE 02
-- EVOLUCIÓN DE elankav_catalogo_items
-- No crea catálogo paralelo. Evoluciona el catálogo EMC oficial.

alter table elankav_catalogo_items
add column if not exists tipo_principal text;

alter table elankav_catalogo_items
add column if not exists configurable boolean not null default false;

alter table elankav_catalogo_items
add column if not exists nivel_producto text;

alter table elankav_catalogo_items
add column if not exists plantilla_id uuid;

alter table elankav_catalogo_items
add constraint if not exists elankav_catalogo_items_tipo_principal_check
check (
  tipo_principal is null
  or tipo_principal in (
    'PRODUCTO',
    'MATERIAL',
    'COMPONENTE',
    'PROCESO',
    'MANO_OBRA',
    'ACABADO',
    'SERVICIO',
    'EQUIPO'
  )
);

alter table elankav_catalogo_items
add constraint if not exists elankav_catalogo_items_nivel_producto_check
check (
  nivel_producto is null
  or nivel_producto in (
    'BASE',
    'CONFIGURABLE',
    'VARIANTE',
    'SISTEMA',
    'TERMINADO'
  )
);

create index if not exists idx_elankav_catalogo_items_tipo_principal
on elankav_catalogo_items(tipo_principal);

create index if not exists idx_elankav_catalogo_items_configurable
on elankav_catalogo_items(configurable);

create index if not exists idx_elankav_catalogo_items_nivel_producto
on elankav_catalogo_items(nivel_producto);
