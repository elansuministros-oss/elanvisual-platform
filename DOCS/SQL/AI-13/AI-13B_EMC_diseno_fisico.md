# AI-13B — ELANKAV Master Catalog EMC
# Diseño físico aprobado antes de Supabase

Proyecto: ELANKAV / ELANVISUAL
Ruta: D:\ELAN\ELANVISUAL_DESDE_ELANPET
Producción: https://visual.elankav.com

## Decisión oficial

Se abandona el concepto limitado de "materiales_master_v3".
Se adopta el modelo corporativo:

ELANKAV MASTER CATALOG (EMC)

El EMC será compartible por:
- ELANVISUAL
- ELANPET
- ELANCENTER
- ELANHOME
- ELAN AI
- CORE
- Compras
- Inventario
- Producción

## Reglas aprobadas

1. Un item existe una sola vez.
2. El item no guarda precio.
3. El item no guarda proveedor.
4. El precio pertenece a una lista de precios del proveedor.
5. Las listas de precios tienen versión.
6. No se borra historial de precios.
7. Para presupuestar se usa el precio más alto activo disponible.
8. Para compra real se elige el proveedor conveniente.
9. No se inventan proveedores.
10. La carga inicial será solo Centro de Pinturas Vargas.

## Tablas principales

1. elankav_catalogo_items
2. elankav_catalogo_categorias
3. elankav_catalogo_subcategorias
4. elankav_catalogo_tipos_item
5. elankav_catalogo_unidades
6. elankav_catalogo_marcas
7. elankav_catalogo_listas_precio
8. elankav_catalogo_lista_items
9. elankav_catalogo_equivalencias
10. elankav_catalogo_item_plataformas
11. elankav_catalogo_precios_historial

## Tabla: elankav_catalogo_items

Identidad maestra del item.

Campos:
- id uuid primary key
- codigo text unique not null
- nombre text not null
- categoria_id uuid not null
- subcategoria_id uuid
- tipo_item_id uuid not null
- unidad_base_id uuid not null
- descripcion text
- espesor numeric
- ancho numeric
- largo numeric
- alto numeric
- medida_texto text
- color text
- uso text default 'COMPRA'
- es_compartido boolean default true
- activo boolean default true
- created_at timestamptz default now()
- updated_at timestamptz default now()

## Tabla: elankav_catalogo_listas_precio

Versión de lista por proveedor.

Campos:
- id uuid primary key
- proveedor_id uuid not null
- nombre text not null
- version text not null
- fecha_lista date not null
- moneda text default 'C$'
- incluye_iva_default boolean default false
- iva_porcentaje_default numeric default 15
- estado text default 'BORRADOR'
- fuente text
- observaciones text
- activa boolean default false
- created_at timestamptz default now()
- updated_at timestamptz default now()

Estados:
- BORRADOR
- ACTIVA
- HISTORICA
- ARCHIVADA

## Tabla: elankav_catalogo_lista_items

Precio de un item dentro de una lista específica.

Campos:
- id uuid primary key
- lista_precio_id uuid not null
- item_id uuid not null
- marca_id uuid
- unidad_compra_id uuid not null
- codigo_catalogo text
- nombre_catalogo text not null
- presentacion text
- precio_lista numeric not null
- incluye_iva boolean default false
- iva_porcentaje numeric default 15
- precio_final numeric generated
- usar_presupuesto boolean default true
- prioridad_compra smallint default 1
- activo boolean default true
- observaciones text
- created_at timestamptz default now()
- updated_at timestamptz default now()

## Tabla: elankav_catalogo_equivalencias

Nombres comerciales por proveedor/lista que apuntan al mismo item maestro.

Campos:
- id uuid primary key
- item_id uuid not null
- proveedor_id uuid not null
- nombre_equivalente text not null
- codigo_equivalente text
- marca_id uuid
- observaciones text
- activo boolean default true
- created_at timestamptz default now()

## Regla fiscal Vargas Centro

Los precios de la lista se manejarán como sin IVA cuando la fuente indique:
PRECIO + IVA

IVA:
15%

## Estado

Pendiente:
- confirmar tabla real de proveedores Supabase.
- crear SQL definitivo EMC.
- ejecutar en Supabase después de aprobación.
- importar lista Vargas Centro Junio 2026.
