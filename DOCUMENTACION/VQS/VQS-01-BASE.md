# VQS-01 — ELANKAV Visual Quotation System

## Estado

Base funcional aislada. No sustituye el cotizador productivo.

## Objetivo

Crear un contrato universal de cotización y una presentación visual reutilizable por ELANVISUAL y futuras plataformas, con identidad variable administrable desde Orchestrator.

## Componentes creados

- `src/modules/vqs/contracts/quotationDocument.js`
  - `createQuotationDocument`
  - `validateQuotationDocument`
  - validación de pagos personalizados al 100%
- `src/modules/vqs/config/elanvisualBrand.js`
  - identidad inicial ELANVISUAL
  - cuentas bancarias configurables y ordenables
- `src/modules/vqs/demo/sampleQuotation.js`
  - contrato de demostración
- `src/pages/VQSQuotationPreview.jsx`
  - vista digital responsive
  - imágenes por ítem
  - totales, pagos, bancos y enlaces clicables
- `src/styles/vqs-quotation.css`
  - diseño desktop, móvil e impresión

## Reglas aplicadas

- Digital first.
- Una imagen principal por ítem, preparada para múltiples imágenes.
- Bloques vacíos no reservan espacio.
- Cuentas bancarias se guardan como snapshot documental.
- Logo y sitio de plataforma son clicables.
- El enlace final dirige a `https://www.elankav.com/`.
- Información interna no forma parte del contrato público.
- USD es moneda principal de la demostración ELANVISUAL.

## Seguridad de producción

Esta fase no elimina, reemplaza ni modifica:

- `CotizadorDirecto.jsx`
- `CotizadorDirectoAI.jsx`
- `CotizacionesInteligentes.jsx`
- generación PDF productiva
- tablas Supabase

## Próximo movimiento

Integrar la vista experimental bajo una ruta administrativa aislada y crear el adapter que normalice una cotización real de ELANVISUAL hacia `QuotationDocument`.
