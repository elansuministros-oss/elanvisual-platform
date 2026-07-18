# HOTFIX VQS - Edicion real de cotizaciones

Fecha: 2026-07-18

## Resultado

Implementacion detenida.

No existe en este repositorio un endpoint Orchestrator confirmado para actualizar una cotizacion VQS oficial por `quotationId` o numero `COT-*`. Por restriccion de la tarea, no se implementa parche local, no se usa `localStorage` como fuente oficial, no se modifica Supabase directamente y no se modifica el cotizador ni el renderer PDF.

## Rama auditada

- Rama activa: `job/job-1784394777085-f967edcc`
- Rama base solicitada: `elanvisual-desde-elanpet`
- Accion: no se cambio de rama porque la consigna tambien indica no cambiar de rama.

## Caso urgente

- Numero: `COT-20260718-00012`
- Requisito: editar la misma cotizacion oficial, conservando `quotationId` y numero.

## Mapa del flujo auditado

### Rutas frontend

- `/cotizaciones`: no esta registrada en `src/App.jsx`.
- `/cotizaciones-inteligentes`: carga `src/pages/CotizacionesInteligentes.jsx`.
- `/cotizador`: carga `src/pages/CotizadorDirectoAI.jsx`.
- `/cotizador-ai`: carga `src/pages/CotizadorDirectoAI.jsx`.
- `/ece`: carga `src/domains/ece/pages/ECEPage.jsx`.

### Centro/listado VQS actual

Archivo: `src/pages/CotizacionesInteligentes.jsx`

- Lista cotizaciones desde Supabase directo:
  - tabla: `cotizaciones_inteligentes`
  - metodo: `.select('*').order('creado_en', { ascending: false })`
- El listado muestra boton `Ver`, `Aprobar`, `Rechazar`, `Pedido`.
- El detalle ya contiene una accion `Editar en Cotizador`, que navega a:
  - `/cotizador?id=${cotizacion.id}`
- Las actualizaciones de estado usan Supabase directo:
  - `.from('cotizaciones_inteligentes').update(payload).eq('id', cotizacion.id)`

### Visor VQS actual

Archivo: `src/pages/CotizacionesInteligentes.jsx`

- El visor muestra cliente, celular, ubicacion, estado, total, anticipo, saldo, pedido y OT.
- No hay carga por `quotationId` oficial desde Orchestrator.
- No hay endpoint frontend para consultar `COT-20260718-00012`.

### Formulario/cotizador actual

Archivo: `src/pages/CotizadorDirectoAI.jsx`

- Tiene modo edicion por query param `?id=...`.
- Carga la cotizacion desde Supabase directo:
  - `.from('cotizaciones_inteligentes').select('*').eq('id', cotizacionIdEdicion).maybeSingle()`
- El guardado actual no actualiza la cotizacion oficial VQS:
  - guarda copia local en `elanvision_cotizaciones_directas`
  - inserta un registro en tabla `pedidos`
- No conserva ni actualiza un `quotationId` oficial en backend Orchestrator.

### Servicios VQS/frontend

- `src/services/cotizacionesService.js` solo contiene `obtenerCotizaciones()` y devuelve `[]`.
- `src/domains/commercial/services/quoteRepository.js` persiste en `localStorage` con key `elanvisual_v2_quotes`.
- `src/domains/ece/services/quoteRepository.js` persiste en `localStorage` con key `ece_quotes`.
- `src/domains/ece/services/commercialEngineService.js` crea y lee quotes via repositorio local; genera PDF desde datos locales.

## Endpoints Orchestrator encontrados

No se encontro endpoint Orchestrator para cotizaciones VQS.

Endpoints HTTP detectados:

- `POST /api/elan-ai`
  - Archivos: `api/elan-ai.js`, `src/ai/AIAssistantPanel.jsx`, `src/pages/AIStudio.jsx`, `src/pages/CotizadorDirectoAI.jsx`, `src/services/emc/emcService.js`, `src/services/emc/emcImportService.js`.
  - Proposito: IA/asistente, no CRUD de cotizaciones VQS.
- `POST /api/emc-import`
  - Archivo: `src/services/emc/emcImportAi22Service.js`.
  - Proposito: importacion EMC, no CRUD de cotizaciones VQS.

No se encontro uso de `PUT` ni `PATCH` HTTP hacia Orchestrator para cotizaciones. Las escrituras existentes son Supabase directo o `localStorage`.

## Endpoint faltante en Orchestrator

Falta un endpoint oficial de actualizacion de cotizacion VQS, por ejemplo:

- `PATCH /api/vqs/quotations/{quotationId}`

Debe aceptar y persistir sobre la misma cotizacion oficial:

- `quotationId`
- numero `COT-*`
- cliente
- proyecto
- productos/items
- descripcion
- imagenes/archivos
- medidas
- cantidades
- precios
- descuento
- IVA
- forma de pago
- moneda
- tipo de cambio

Debe devolver la cotizacion actualizada y disparar/regenerar el documento oficial con el flujo backend existente, sin crear duplicados.

Tambien falta confirmar endpoint de lectura oficial por `quotationId` o numero, por ejemplo:

- `GET /api/vqs/quotations/{quotationId}`
- `GET /api/vqs/quotations?number=COT-20260718-00012`

## Archivos de aplicacion no modificados

No se modificaron:

- `src/pages/CotizacionesInteligentes.jsx`
- `src/pages/CotizadorDirectoAI.jsx`
- `src/pages/CotizadorDirecto.jsx`
- servicios VQS/frontend
- renderer PDF

## Pruebas/build

No se ejecuto implementacion ni build de validacion funcional porque el bloqueo es contractual: falta backend de actualizacion. El repositorio tampoco define scripts de pruebas VQS en `package.json`.
