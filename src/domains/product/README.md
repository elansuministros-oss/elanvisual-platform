# Dominio PRODUCT

## Responsabilidad

Product V2 define el modelo empresarial de producto: que se vende, como se presenta comercialmente, que plantilla o recipe lo respalda, que variaciones permite y que configuracion concreta puede tomar para una cotizacion futura.

## Puede hacer

- Definir contratos publicos del dominio Product.
- Exponer `ProductCore` como fachada oficial.
- Documentar modelos conceptuales de producto, plantilla, variacion y configuracion.
- Preparar servicios, engines, resolvers y adapters como stubs para implementacion futura.

## No puede hacer

- No consulta Supabase.
- No consulta EMC.
- No consulta AI.
- No consulta Produccion.
- No consulta Inventario.
- No consulta Compras.
- No genera PDF.
- No cotiza.
- No modifica Catalog.
- No modifica V1.

## Dominio conceptual

Product solo conoce el modelo empresarial. No conoce fuentes tecnicas ni infraestructura.

## Estructura

- `core/`: fachada publica oficial (`ProductCore`).
- `contracts/`: contratos publicos del dominio.
- `models/`: modelos conceptuales.
- `services/`: servicios vacios.
- `engines/`: engines vacios.
- `resolvers/`: resolvers vacios.
- `adapters/`: adapters vacios.
- `types/`: documentacion de tipos.
- `pages/`: reservado para UI futura.
- `components/`: reservado para componentes futuros.
