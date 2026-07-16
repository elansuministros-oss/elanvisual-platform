# VQS-01 — Implementación inicial

## Rama

`VQS-01-UNIVERSAL-QUOTATION`

## Alcance implementado

1. Contrato universal `QuotationDocument`.
2. Validación estructural y pagos personalizados al 100%.
3. Configuración inicial de marca ELANVISUAL.
4. Registro inicial de cuentas bancarias configurable.
5. Adapter inicial para normalizar cotizaciones existentes.
6. Vista responsive de cotización visual.
7. Imagen principal por ítem, preparada para galería futura.
8. Enlaces digitales clicables a plataforma y ecosistema.
9. Diseño móvil, escritorio e impresión.
10. Prueba automatizada del contrato.

## Comandos de validación

```powershell
npm run test:vqs
npm run build
```

## Restricciones de esta fase

- No reemplaza el PDF productivo.
- No elimina módulos existentes.
- No conecta todavía a Orchestrator.
- No modifica Supabase.
- No realiza despliegue.

## Siguiente integración

- Exponer la vista experimental mediante una ruta administrativa aislada.
- Conectar el adapter con una cotización real de `cotizaciones_inteligentes`.
- Crear configuración de marca remota desde Orchestrator.
- Comparar el documento actual contra VQS antes de sustituir producción.
