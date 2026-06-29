# AI-13.1 — Modelo definitivo Catálogo Maestro de Materiales ELANKAV

Proyecto: ELANVISUAL
Ruta: D:\ELAN\ELANVISUAL_DESDE_ELANPET
Producción: https://visual.elankav.com

## Decisión oficial

No modificar tablas actuales del ERP.
No tocar Pedidos, Producción, Compras ni Tesorería.

Se construirá un nuevo Catálogo Maestro de Materiales preparado para múltiples proveedores, pero la carga inicial será únicamente con Centro de Pinturas Vargas.

## Regla comercial

Para presupuestar al cliente:
- usar el precio más alto activo disponible entre proveedores.

Para compra real:
- elegir proveedor conveniente al momento de compra.

En esta fase inicial:
- no inventar proveedores.
- no inventar precios.
- no cargar existencia.
- no asumir disponibilidad.

## Tablas propuestas

### 1. elankav_materiales

Catálogo maestro. Un material existe una sola vez.

Campos:
- id
- codigo
- nombre
- categoria_id
- subcategoria_id
- marca_id
- tipo_consumo_id
- unidad_base_id
- descripcion
- espesor
- ancho
- largo
- alto
- medida_texto
- color
- activo
- created_at
- updated_at

### 2. elankav_materiales_proveedor

Relación comercial entre material y proveedor.

Campos:
- id
- material_id
- proveedor_id
- codigo_proveedor
- nombre_catalogo
- marca_id
- unidad_compra_id
- precio_lista
- incluye_iva
- iva_porcentaje
- precio_final
- moneda
- fecha_lista
- usar_presupuesto
- prioridad_compra
- fuente
- observaciones
- activo
- created_at
- updated_at

### 3. elankav_materiales_categoria

Catálogo normalizado de categorías.

Ejemplos:
- PVC
- Acrílicos
- Viniles
- Lonas
- Adhesivos
- Herramientas
- Iluminación
- Metales
- Accesorios publicitarios

### 4. elankav_materiales_subcategoria

Subcategorías asociadas a categoría.

Ejemplos:
- Lámina
- Rollo
- Cinta
- Pegamento
- Estructura
- Caja de luz
- Herramienta

### 5. elankav_marcas

Catálogo normalizado de marcas.

Ejemplos:
- 3M
- VargasFlex Plus
- Promoplus
- Genérico

### 6. elankav_unidades

Catálogo normalizado de unidades.

Ejemplos:
- Lámina
- Rollo
- Litro
- Galón
- Metro
- Metro cuadrado
- Unidad
- Yarda
- Caja

### 7. elankav_tipo_consumo

Tipo operativo del material.

Ejemplos:
- Materia Prima
- Consumible
- Herramienta
- Equipo
- Accesorio
- Repuesto

## Regla fiscal Vargas Centro

Los precios de lista se manejarán como precios sin IVA cuando la lista indique PRECIO + IVA.

IVA estándar:
- 15%

precio_final = precio_lista + IVA

## Carga inicial

Proveedor inicial:
- Centro de Pinturas Vargas / Vargas Centro

Fuente:
- Lista de precios actual junio 2026
- Catálogo de insumos publicitarios Vargas Centro 2026

## Estado

Pendiente:
- auditar tablas existentes de proveedores para confirmar nombre real de tabla y llave primaria.
- crear SQL definitivo.
- ejecutar en Supabase solo después de aprobación.
