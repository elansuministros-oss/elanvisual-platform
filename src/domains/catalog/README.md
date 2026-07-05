# Dominio CATALOG

## Responsabilidad

Catalog V2 es propietario de Material Master, tintas, combinaciones, tecnologias de impresion, biblioteca tecnica y solicitudes de costos faltantes.

## Puede hacer

- Exponer servicios publicos para materiales, tintas, combinaciones, tecnologias, biblioteca tecnica y solicitudes de costos.
- Publicar eventos de actualizacion o validacion de catalogo.
- Consumir contratos publicos de `emc`, `suppliers` y `knowledge`.
- Preparar adapters para recibir datos EMC o V1 sin acoplarse a la implementacion actual.
- Preparar resolvers para decidir materiales, tintas y fuentes de costo.

## No puede hacer

- No cotiza.
- No genera PDF.
- No ejecuta IA.
- No importa catalogos EMC.
- No consulta Supabase desde UI.
- No modifica rutas globales.
- No reemplaza Material Master V1 durante esta etapa.

## Dominios que puede consumir

- `emc`
- `suppliers`
- `knowledge`

## Dominios que nunca debe importar directamente

- Paginas internas de otros dominios.
- Componentes internos de otros dominios.
- `src/pages`
- `src/components`
- `src/services`
- `App.jsx`
- Internals de AI, EMC, Commercial, PDF o Production.

## Estructura

- `core/`: fachada publica oficial del dominio (`CatalogCore`).
- `contracts/`: contratos publicos, eventos y servicios del dominio.
- `types/`: documentacion de tipos JSDoc.
- `models/`: constantes y modelos nominales del dominio.
- `services/`: servicios publicos vacios, listos para implementacion.
- `resolvers/`: resolvers vacios para seleccion de fuentes.
- `engines/`: engines vacios para validacion/calculo puro futuro.
- `adapters/`: adapters vacios para EMC y catalogo V1.
- `pages/`: reservado para paginas V2 propias.
- `components/`: reservado para componentes V2 propios.

## Estado ESM-19

El dominio queda preparado para implementacion posterior. `CatalogCore` es la unica fachada publica oficial del dominio y define las operaciones `obtenerMaterial`, `obtenerTinta`, `obtenerTecnologia`, `obtenerCombinacion`, `obtenerBibliotecaTecnica`, `obtenerProveedor` y `obtenerCosto`.

No contiene consultas Supabase, logica EMC, AI, Cotizador, PDF ni Produccion.
