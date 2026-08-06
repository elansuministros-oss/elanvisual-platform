# CONNECT-ALL-01 - Auditoria de Integracion ELANKAV

Fecha: 2026-07-24  
Workspace auditado: `D:\ELAN\ELANVISUAL_DESDE_ELANPET`  
Rama: `feature/ECON-CONNECT-ELANVISUAL-01`

## Alcance y reglas aplicadas

- No se modifico Supabase.
- No se crearon tablas, buckets, RPC ni servicios nuevos.
- No se hizo merge ni despliegue.
- Esta auditoria se basa en el codigo, SQL y documentacion presentes en el workspace.
- No se imprimieron valores secretos de `.env`.
- Auditoria live de Supabase queda pendiente si se entrega una conexion de solo lectura o service role en entorno controlado.

## 1. Inventario completo del ecosistema

Plataformas detectadas por codigo/documentacion:

- ELANVISUAL: aplicacion React/Vite actual, con VQS, CRM, cotizador, pedidos, produccion, proveedores, AI Studio, biblioteca tecnica y EMC.
- ELANPET: esquema base legacy en `supabase/schema.sql` y contexto historico/documentacion.
- ELANHOME: mencionado como unidad/plataforma objetivo, sin modulo separado visible en este workspace.
- ELANKAV PLATFORM: documentado en `DOCUMENTACION/ARQUITECTURA`.
- ELANKAV CONNECT: cliente parcial existente en `src/modules/connect/services/commercialConnectClient.js`.
- ELANKAV ORCHESTRATOR: cliente VQS existente en `src/modules/vqs/services/projectCoreClient.js` y servicios de quotation viewer.
- WAHA: flujo documentado/esperado; integracion indirecta via Orchestrator para envio WhatsApp.
- ELAN AI: endpoint local `api/elan-ai.js`, AI Studio y servicios de archivos.

## 2. Inventario de Supabase

Tablas declaradas en SQL local:

- Base ELANPET: `veterinarias`, `productos`, `clientes`, `pedidos`, `pedido_items`, `pedido_historial`, `cuentas_bancarias`, `qr_visitas`, `banners`, `trabajos_entregados`, `usuarios`.
- Catalogo maestro intermedio: `catalogo_maestro_items`, `catalogo_maestro_proveedores`, `catalogo_maestro_proveedor_items`, `catalogo_maestro_compatibilidades`, `catalogo_maestro_plantillas_producto`, `catalogo_maestro_plantilla_requisitos`.
- ELANKAV Master Catalog: `elankav_catalogo_categorias`, `elankav_catalogo_subcategorias`, `elankav_catalogo_tipos_item`, `elankav_catalogo_unidades`, `elankav_catalogo_marcas`, `elankav_catalogo_items`, `elankav_catalogo_item_plataformas`, `elankav_catalogo_listas_precio`, `elankav_catalogo_proveedor_items`, `elankav_catalogo_equivalencias`, `elankav_catalogo_atributos`, `elankav_catalogo_item_atributos`, `elankav_catalogo_precios_historial`, `elankav_catalogo_multimedia`.
- AI/archivos: `archivos_ai`.
- Obsoleto/no ejecutar: `elankav_materiales_master`, `elankav_materiales_proveedor`, `elankav_materiales_precios_historial`.

Tablas usadas por codigo pero no declaradas en SQL auditado:

- `elanvisual_app_state`
- `cotizaciones_inteligentes`
- `proyectos_ai`
- `mensajes_ai`
- `biblioteca_tecnica`
- `biblioteca_componentes`
- `materiales_master`
- `combinaciones_master`
- `combinaciones_detalle`
- `tecnologias_impresion`
- `solicitudes_costos`
- `tintas_master`
- `proveedores`
- `vendedores`
- `design_requests`
- `onboarding_vendedores`
- `pedidos_elanvisual`
- `rpi_fuentes_conocimiento`
- `rpi_catalogo_tecnico`
- `rpi_proveedores`
- `rpi_documentos_proveedor`
- `rpi_precios_proveedor`
- `rpi_solicitudes_precio`
- `elankav_supplier_empresas`
- `elankav_supplier_contactos_unidad`
- `elankav_supplier_capacidades`
- `elankav_supplier_productos_servicios`

Vistas declaradas en SQL local:

- No detectadas.

Relaciones:

- Detectables en SQL por referencias del catalogo maestro/EMC y pedidos; requieren auditoria live para confirmar constraints reales en produccion.

## 3. Inventario de Storage

Buckets declarados en SQL local:

- `ai-archivos`, definido en `sql/AI-04A_archivos_ai_storage.sql`.

Buckets usados por codigo:

- `elanvisual`, default en `src/components/ImageUploader.jsx` mediante `VITE_SUPABASE_BUCKET`.
- `ai-archivos`, usado por `src/services/aiArchivosService.js`.
- `emc-importaciones`, default en servicios EMC mediante `VITE_EMC_STORAGE_BUCKET`.
- Buckets dinamicos recibidos desde registros `design_requests` en `src/pages/SolicitudesDisenoAI.jsx`.

Riesgo: `elanvisual` y `emc-importaciones` se usan en codigo, pero no aparecen creados en SQL local auditado.

## 4. Inventario de RPC

- No se detectaron llamadas `.rpc(` en `src`, `api` o `scripts`.
- No se detectaron funciones RPC de negocio en SQL local.
- Funcion tecnica detectada: `set_updated_at_archivos_ai()`.

## 5. Inventario de APIs

APIs/servicios externos detectados:

- Orchestrator: `https://orchestrator.elankav.com`
  - `/api/vqs/projects`
  - `/api/vqs/projects/:id`
  - `/api/vqs/projects/:id/status`
  - `/api/vqs/projects/:id/send-whatsapp`
  - `/api/vqs/projects/:id/work-orders`
  - `/api/vqs/projects/:id/purchase-orders`
  - `/api/vqs/projects/:id/payments`
  - `/api/vqs/customers/search`
  - `/api/vqs/context/search`
  - `/api/vqs/public/quotations/:id`
  - `/api/vqs/assets`
- CONNECT: configurable por `VITE_ELANKAV_CONNECT_URL`
  - `/api/v1/leads`
  - `/api/v1/opportunities`
- ELANKAV CORE AI: `VITE_ELANKAV_CORE_URL` o `https://elankav-core.vercel.app`
  - `/api/elan-ai`
  - `/api/emc-import`
- EMC gateway: `VITE_ELANKAV_EMC_URL`
  - `/materials/search`
  - `/materials/:id/cost`
  - `/materials/:id/inventory`
  - `/materials/:id/suppliers`

## 6. Inventario de modulos

Modulos frontend principales:

- `src/modules/vqs`: cotizacion visual, contratos, Project Core, busqueda de contexto, assets.
- `src/modules/connect`: cliente parcial CONNECT para lead/opportunity.
- `src/modules/quotation-viewer`: listado/detalle de cotizaciones, documentos oficiales, pagos, OT y OC.
- `src/services/emc`: catalogo maestro EMC, importacion y jobs.
- `src/services/suppliers`: Supplier Hub V2.
- `src/services/pedidos`: repositorio, comandos, queries y mappers de pedidos.
- `src/services/ai*`: memoria, archivos, acciones y busquedas para ELAN AI.
- `src/context/AppContext.jsx`: estado operativo ELANVISUAL con mezcla localStorage/Supabase.
- `src/core/context/CoreContext.jsx`: core CRM/ERP local con persistencia localStorage.
- `src/crm`: pantallas CRM/ERP.
- `api/elan-ai.js`: endpoint AI serverless.

## 7. Mapa completo de dependencias

Estado actual observado:

```text
ELANVISUAL VQS
  -> Orchestrator /api/vqs/projects
  -> CONNECT /api/v1/leads, /api/v1/opportunities

Quotation Viewer
  -> Orchestrator /api/vqs/*
  -> Supabase auth solo para token de pagos

AI Studio / AI Services
  -> Supabase directo: proyectos_ai, mensajes_ai, cotizaciones_inteligentes, archivos_ai
  -> ELANKAV CORE /api/elan-ai
  -> Storage: ai-archivos

EMC / Catalogo
  -> Supabase directo: elankav_catalogo_*
  -> Storage directo: emc-importaciones
  -> ELANKAV CORE /api/elan-ai, /api/emc-import

CRM / AppContext / Captura
  -> Supabase directo: usuarios, clientes, proveedores, vendedores, pedidos_elanvisual, app_state
  -> localStorage para estados y catalogos temporales

Supplier Hub
  -> Supabase directo: elankav_supplier_*

Design Portal
  -> ELANKAV CORE /api/elan-ai
  -> Orchestrator/Core /api/vqs/assets
```

Mapa objetivo:

```text
WhatsApp -> WAHA -> Orchestrator -> CONNECT -> Supabase
                              \-> ELAN AI operador

ELANVISUAL -> CONNECT para CRM, catalogo, multimedia, inventario, costos, pedidos, OT, compras
ELANHOME   -> CONNECT para catalogo, inventario, precios, multimedia, disponibilidad
ELANPET    -> CONNECT para clientes, mascotas, servicios, productos, compras, inventario, multimedia
ELAN AI    -> CONNECT para leer/crear/editar/eliminar/indexar segun permisos
```

## 8. Conexiones realizadas

Ya existe integracion parcial:

- VQS crea/actualiza proyectos via Orchestrator.
- VQS sincroniza cotizacion comercial a CONNECT creando lead y opportunity.
- Quotation Viewer consume Orchestrator para cotizaciones, OT, OC y pagos.
- Busqueda de contexto VQS consulta Orchestrator.
- Public quotation consulta Orchestrator.
- AI Studio consulta ELANKAV CORE para analisis/render.
- EMC importacion consulta ELANKAV CORE para AI/import jobs.

## 9. Conexiones pendientes

Pendiente de pasar por CONNECT:

- CRM: clientes, contactos, empresas, vendedores, usuarios/permisos.
- Catalogo maestro EMC: categorias, subcategorias, marcas, unidades, items, listas de precio, proveedores, multimedia.
- Supplier Hub: empresas, contactos, capacidades, productos/servicios.
- AI Studio: proyectos, mensajes, archivos, cotizaciones.
- Pedidos/ordenes: `pedidos_elanvisual`, `pedidos`, OT y produccion que aun dependan de contexto local.
- Biblioteca tecnica: materiales, combinaciones, tecnologias, documentos.
- Storage: `elanvisual`, `ai-archivos`, `emc-importaciones`, recursos de diseno.
- Auditoria: registrar usuario, plataforma, accion, antes/despues e historial por CONNECT.
- WAHA: garantizar ruta obligatoria WAHA -> Orchestrator -> CONNECT -> ELAN AI.
- ELANHOME y ELANPET: no hay clientes CONNECT visibles para sus dominios completos dentro de este workspace.

## 10. Funciones duplicadas

Duplicaciones probables:

- Clientes:
  - `src/services/aiService.js`
  - `src/services/archivosService.js`
  - `src/pages/CapturaInteligente.jsx`
  - `src/context/AppContext.jsx`
- Cotizaciones:
  - `src/pages/CotizacionesInteligentes.jsx`
  - `src/pages/CotizacionesInteligentes.CI17.BACKUP.jsx`
  - `src/modules/quotation-viewer/services/quotationViewerService.js`
  - `src/services/cotizacionesService.js`
- Archivos AI:
  - `src/services/aiArchivosService.js`
  - `scripts/ai04a-instalar.cjs`
  - `src/pages/AIStudio.jsx`
- EMC importacion:
  - `src/services/emc/emcService.js`
  - `src/services/emc/emcImportService.js`
  - `src/services/emc/emcImportAi22Service.js`
- Proveedores:
  - `src/services/suppliers/*`
  - `src/services/rpi*`
  - `src/pages/CapturaInteligente.jsx`
  - `src/context/AppContext.jsx`
- Pedidos:
  - `src/services/pedidos/*`
  - `src/services/pedidosService.js`
  - estado interno de `AppContext`.

## 11. Catalogos duplicados

Catalogos o fuentes maestras en conflicto:

- `productos` legacy vs `elankav_catalogo_items` vs `catalogo_maestro_items` vs `src/data/productos.js`.
- `proveedores` legacy vs `elankav_supplier_empresas` vs `catalogo_maestro_proveedores` vs `rpi_proveedores`.
- `materiales_master`/`combinaciones_master`/`tintas_master` vs `elankav_catalogo_*`.
- Categorias home en `elanvisual_app_state`/localStorage vs `elankav_catalogo_categorias`.
- Clientes en `clientes`, `AppContext`, `CotizadorVisual` localStorage y busqueda Orchestrator.

## 12. Riesgos detectados

- Muchos accesos directos desde frontend a Supabase; esto contradice la regla "consumir CONNECT cuando exista servicio equivalente".
- Buckets usados por codigo no comprobados en SQL local.
- RLS solo visible para `archivos_ai`; falta confirmar RLS real del resto de tablas.
- No hay RPC de negocio; si CONNECT requiere transacciones/auditoria, debe encapsular mutaciones en API o RPC controlada.
- `api/elan-ai.js` opera como chatbot/render puntual, no como operador completo con permisos, auditoria y acciones CRUD conectadas a CONNECT.
- Existen backups y scripts instaladores con logica duplicada que pueden inducir regresiones si se ejecutan sin control.
- Varias pantallas escriben directamente `insert/update/delete` contra Supabase.
- El estado local (`localStorage`) todavia puede actuar como fuente de verdad para CRM/cotizador/documentos.
- No se encontro auditoria transversal de cambios antes/despues por plataforma.

## 13. Recomendaciones

- Definir CONNECT como unica puerta de datos para dominios: CRM, catalogo, proveedores, multimedia, inventario, pedidos, compras, produccion, knowledge base y auditoria.
- Mantener Orchestrator solo como coordinador de procesos/jobs, sin almacenar informacion comercial.
- Crear clientes CONNECT por dominio en frontend y migrar por adaptadores, no reescribir pantallas completas.
- Mantener Supabase directo temporalmente solo para auth/token o donde no exista endpoint CONNECT, marcado como deuda tecnica.
- Centralizar permisos/auditoria en CONNECT antes de habilitar acciones destructivas de ELAN AI.
- Convertir `localStorage` a cache/borrador local, nunca fuente maestra.
- Consolidar catalogo en `elankav_catalogo_*` o el modelo CONNECT equivalente; dejar tablas legacy como lectura/migracion.
- Exigir endpoint CONNECT para Storage con subida, descarga, move, rename, indexing job y politicas.

## 14. Plan minimo para completar la integracion

1. Auditoria live segura de Supabase:
   - Consultar `information_schema`, `pg_catalog`, `pg_policies`, `pg_indexes`, `pg_trigger`, `pg_proc`, `storage.buckets`, `storage.objects`.
   - Comparar resultado live contra este inventario local.

2. Contrato CONNECT por dominio:
   - `/crm/*`: clientes, contactos, empresas, leads, opportunities.
   - `/catalog/*`: productos, servicios, categorias, marcas, variantes, proveedores, precios, multimedia.
   - `/operations/*`: quotes, orders, OT, compras, produccion.
   - `/files/*`: upload, download, move, rename, index.
   - `/ai/actions/*`: operaciones autorizadas para ELAN AI.

3. Migracion por adaptadores:
   - Sustituir imports directos de `src/lib/supabase.js` por clientes CONNECT en grupos pequenos.
   - Prioridad: clientes/proveedores/catalogo/archivos AI.

4. Auditoria y permisos:
   - Cada mutacion debe pasar usuario, plataforma, accion, antes/despues y correlacion de job.
   - ELAN AI solo ejecuta acciones registradas con permisos y confirmaciones.

5. Unificacion de catalogos:
   - Congelar escritura a tablas/localStorage duplicados.
   - Mapear legacy -> master.
   - Redirigir lectura desde CONNECT.

6. Storage centralizado:
   - Validar buckets reales.
   - CONNECT administra metadata y rutas.
   - Orchestrator dispara indexacion/OCR/transcripcion.

7. WAHA:
   - Forzar flujo WAHA -> Orchestrator -> CONNECT -> ELAN AI.
   - Registrar conversaciones, decisiones y acciones.

8. Verificacion:
   - Tests de contrato para cada cliente CONNECT.
   - Build frontend.
   - Pruebas de no regresion: cotizar, crear lead, buscar cliente, subir archivo, crear OT/OC, consultar AI.

## Criterio de exito medible

- Cero imports nuevos de `src/lib/supabase.js` en pantallas de negocio.
- Lista de excepciones Supabase directo reducida a auth o adaptadores internos CONNECT.
- Cero escrituras maestras a `localStorage`.
- Todas las mutaciones de negocio pasan por CONNECT y generan auditoria.
- ELAN AI ejecuta acciones CRUD mediante registro de acciones con permisos y confirmacion.
- Storage e indexacion pasan por CONNECT/Orchestrator.
- ELANVISUAL, ELANHOME, ELANPET y futuras plataformas consumen los mismos dominios CONNECT.
