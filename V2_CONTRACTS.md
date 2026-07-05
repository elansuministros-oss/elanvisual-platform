# ELANVISUAL V2 — OFFICIAL CONTRACTS / ESM-19

Estado: especificacion tecnica.

Alcance: contratos publicos para implementar dominios V2 sin acoplarse a codigo interno V1.

Restriccion: este documento no define codigo, clases, funciones ni interfaces TypeScript. Define reglas, obligaciones, entradas, salidas, eventos, permisos y limites arquitectonicos.

## 1. Domain Contract

Un Domain Contract describe un dominio oficial de ELANVISUAL V2 y sus limites publicos.

Debe declarar:

- Nombre del dominio.
- Responsabilidad unica.
- Servicios publicos expuestos.
- Eventos publicados.
- Eventos escuchados.
- Dependencias permitidas.
- Dependencias prohibidas.
- Permisos requeridos para operaciones criticas.
- Estado del dominio: activo, experimental, legacy o deshabilitado.

Reglas:

- Un dominio no importa paginas internas de otro dominio.
- Un dominio no importa componentes internos de otro dominio.
- Un dominio solo consume capacidades externas mediante contratos publicos, Service Registry o Event Bus.
- El dominio propietario decide su modelo interno.
- Los consumidores no deben depender de tablas, rutas de archivo ni estructuras privadas del dominio.

Ejemplo de alcance por dominio:

- commercial: cotizaciones, cliente comercial, aprobacion y conversion a pedido.
- catalog: materiales, tintas, combinaciones, tecnologias y biblioteca tecnica.
- emc: importacion y normalizacion de catalogos proveedor.
- ai: memoria operativa, borradores, acciones IA y contexto.
- orders: pedidos, historial y seguimiento.
- production: OT, procesos, materiales requeridos y estados productivos.
- finance: pagos, anticipos, saldos, recibos y rentabilidad.
- pdf: generacion documental desde datos aprobados.

## 2. Service Contract

Un Service Contract describe una capacidad publica consumible por otros dominios.

Debe declarar:

- Nombre publico.
- Dominio propietario.
- Proposito.
- Entradas requeridas.
- Entradas opcionales.
- Salidas esperadas.
- Errores esperados.
- Permisos requeridos.
- Eventos que puede publicar.
- Dependencias externas que puede usar.

Reglas:

- Un service puede consultar y persistir datos si el dominio lo autoriza.
- Un service puede usar infrastructure autorizada.
- Un service no renderiza UI.
- Un service no debe exponer detalles internos innecesarios.
- Un service debe devolver errores normalizados segun Error Contract.

Entradas:

- Deben ser datos de negocio o identificadores estables.
- No deben ser eventos DOM.
- No deben ser componentes UI.

Salidas:

- Deben ser datos serializables.
- Deben incluir estado de exito o error cuando aplique.
- Deben preservar trazabilidad del origen cuando el resultado sea costo, material, proveedor o documento.

## 3. Event Contract

Un Event Contract describe comunicacion asincrona o desacoplada entre dominios.

Debe declarar:

- Nombre del evento.
- Dominio emisor.
- Consumidores esperados.
- Payload minimo.
- Payload prohibido.
- Reglas de emision.
- Reglas de consumo.
- Criticidad: informativo, operacional, financiero o auditoria.

Reglas:

- Un evento informa que algo ocurrio; no reemplaza consulta al service propietario.
- El payload debe ser minimo y estable.
- Datos pesados se referencian por identificador.
- Eventos financieros y de pedido deben ser auditables.
- Un consumidor no debe asumir que es el unico receptor.
- Un evento no debe transportar componentes UI, instancias de cliente externo ni objetos DOM.

Eventos base:

- commercial.quote.created
- commercial.quote.approved
- commercial.quote.convertedToOrder
- catalog.material.updated
- catalog.cost.validated
- emc.import.saved
- ai.quoteDraft.generated
- orders.order.created
- orders.order.sentToProduction
- production.status.changed
- finance.payment.registered
- inventory.purchase.required
- purchasing.received
- pdf.document.generated

## 4. Resolver Contract

Un Resolver Contract describe una decision de seleccion, prioridad o composicion entre fuentes.

Debe declarar:

- Responsabilidad.
- Dominio propietario.
- Entrada.
- Salida.
- Fuentes permitidas.
- Services permitidos.
- Adapters permitidos.
- Errores posibles.

Reglas:

- Un resolver decide que fuente usar.
- Un resolver no renderiza UI.
- Un resolver no persiste cambios finales salvo que delegue en service propietario.
- Un resolver no debe acceder directamente a Supabase, Storage o CORE.
- Un resolver puede usar services publicos y adapters.

Ejemplos:

- MaterialResolver: decide material cotizable desde catalog, EMC o biblioteca.
- PriceResolver: decide costo valido y origen.
- SupplierResolver: decide proveedor asociado.
- QuoteResolver: decide si una entrada puede convertirse a cotizacion.
- PDFResolver: decide plantilla documental aplicable.

## 5. Engine Contract

Un Engine Contract describe calculo o transformacion de reglas de negocio.

Debe declarar:

- Responsabilidad.
- Datos de entrada.
- Datos de salida.
- Reglas aplicadas.
- Invariantes.
- Errores de validacion.

Prohibiciones explicitas:

- No puede acceder a UI.
- No puede acceder a Supabase.
- No puede acceder a Storage.
- No puede acceder a CORE externo.
- No puede acceder al DOM.
- No puede emitir alertas ni manipular navegacion.
- No puede depender de componentes React.

Reglas:

- Un engine opera con datos puros.
- Un engine no persiste.
- Un engine no consulta infraestructura.
- Un engine debe ser determinista frente a las mismas entradas, salvo reglas que reciban fecha/tipo de cambio como dato explicito.

Ejemplos:

- QuoteEngine: calcula totales desde lineas aprobadas.
- ProductionEngine: deriva plan preliminar desde pedido.
- FinanceEngine: calcula anticipo, saldo y estado de pago.
- PDFEngine: prepara modelo documental, no recalcula negocio.

## 6. Adapter Contract

Un Adapter Contract traduce datos entre modelos, fuentes o generaciones.

Debe declarar:

- Nombre.
- Dominio propietario.
- Formato de origen.
- Formato de destino.
- Campos requeridos.
- Campos derivados.
- Campos descartados.
- Reglas de compatibilidad.
- Nivel de confianza del dato.

Reglas:

- Un adapter no decide negocio.
- Un adapter no consulta infraestructura.
- Un adapter no renderiza UI.
- Un adapter no debe ocultar perdida de informacion.
- Si adapta costos, debe conservar origen, moneda y proveedor cuando existan.

Usos oficiales:

- V1 pedido a V2 order.
- EMC item a Material Master candidate.
- Cotizacion comercial a PDF payload.
- Pedido a snapshot financiero.
- AI draft a quote draft.

## 7. Repository Contract

Un Repository Contract describe acceso persistente a una fuente de datos.

Debe declarar:

- Nombre publico.
- Dominio propietario.
- Fuente persistente.
- Operaciones permitidas.
- Filtros permitidos.
- Ordenamientos permitidos.
- Errores esperados.
- Politica de permisos.

Reglas:

- Repository pertenece al dominio propietario de los datos.
- Repository puede usar Supabase si se inyecta desde infrastructure.
- Repository no contiene reglas complejas de negocio.
- Repository no renderiza UI.
- Repository no debe ser consumido por UI directamente.
- Otros dominios consumen services, no repositories internos.

## 8. PDF Contract

El PDF Contract gobierna documentos generados.

Debe declarar:

- Tipo documental.
- Dominio solicitante.
- Datos requeridos.
- Plantilla autorizada.
- Permisos requeridos.
- Salida esperada.
- Eventos publicados.
- Errores esperados.

Reglas:

- PDF no calcula precios.
- PDF no decide descuentos.
- PDF no modifica cotizaciones, pedidos ni pagos.
- PDF representa datos aprobados.
- PDF debe conservar identificador del documento generado.
- PDF debe indicar origen de datos: commercial, orders, finance o production.

Eventos:

- pdf.document.requested
- pdf.document.generated
- pdf.document.failed

## 9. AI Contract

El AI Contract gobierna uso de IA operativa.

Debe declarar:

- Tipo de accion IA.
- Dominio solicitante.
- Fuentes permitidas.
- Contexto requerido.
- Salida esperada.
- Nivel de confianza.
- Bloqueos.
- Reglas anti-invencion.
- Permisos requeridos.

Reglas:

- AI no inventa materiales, precios, proveedores ni tecnologias.
- AI debe marcar pendiente si falta informacion.
- AI puede preparar borradores, no aprobar operaciones finales.
- AI no escribe Material Master directamente.
- AI no convierte cotizacion a pedido sin validacion commercial.
- AI puede publicar eventos de draft o faltantes.

Eventos:

- ai.memory.loaded
- ai.quoteDraft.generated
- ai.costMissing.detected
- ai.sentToCommercial

## 10. EMC Contract

El EMC Contract gobierna importacion y catalogo maestro proveedor.

Debe declarar:

- Proveedor.
- Archivos o fuente.
- Tipo de importacion.
- Resultado preview.
- Resultado guardado.
- Items normalizados.
- Errores de importacion.
- Permisos requeridos.

Reglas:

- EMC puede subir archivos a Storage mediante service autorizado.
- EMC puede invocar CORE externo mediante infrastructure autorizada.
- EMC no modifica cotizaciones.
- EMC no decide precios de venta finales.
- EMC alimenta catalog y Material Master mediante contratos.
- Catalog consume EMC; no ejecuta AI-22.

Eventos:

- emc.import.started
- emc.import.previewGenerated
- emc.import.saved
- emc.catalog.itemNormalized

## 11. Inventory Contract

El Inventory Contract gobierna existencias, reservas y consumo.

Debe declarar:

- Item de inventario.
- Cantidad disponible.
- Unidad.
- Origen.
- Reserva.
- Consumo.
- Reposicion requerida.
- Pedido/OT asociado.
- Permisos requeridos.

Reglas:

- Inventory no crea ordenes de compra finales.
- Inventory puede solicitar compra mediante evento.
- Inventory no modifica precios comerciales.
- Inventory no modifica pagos.
- Production debe reservar/consumir mediante contratos inventory.

Eventos:

- inventory.stock.reserved
- inventory.stock.consumed
- inventory.purchase.required

## 12. Purchasing Contract

El Purchasing Contract gobierna abastecimiento y compras.

Debe declarar:

- Solicitud de compra.
- Proveedor.
- Items solicitados.
- Pedido/OT asociado.
- Estado de compra.
- Recepcion.
- Impacto en inventario.
- Impacto financiero.
- Permisos requeridos.

Reglas:

- Purchasing no consume inventario directamente.
- Purchasing informa recepcion a inventory.
- Purchasing no registra pagos finales sin finance.
- Purchasing no modifica cotizaciones.

Eventos:

- purchasing.request.created
- purchasing.order.created
- purchasing.received

## 13. Production Contract

El Production Contract gobierna ejecucion productiva.

Debe declarar:

- Pedido fuente.
- OT.
- Plan de produccion.
- Materiales requeridos.
- Procesos.
- Estado productivo.
- Bloqueos.
- Permisos requeridos.

Reglas:

- Production no modifica totales comerciales.
- Production no registra pagos.
- Production consume orders, catalog e inventory mediante contratos.
- Production puede solicitar materiales faltantes.
- Production publica cambios de estado.

Eventos:

- production.ot.created
- production.materials.required
- production.status.changed

## 14. Finance Contract

El Finance Contract gobierna dinero, pagos y saldo.

Debe declarar:

- Pedido relacionado.
- Total base.
- Moneda.
- Tipo de cambio.
- Anticipo requerido.
- Pago registrado.
- Saldo.
- Estado financiero.
- Recibo requerido.
- Permisos requeridos.

Reglas:

- Finance no modifica items comerciales.
- Finance no modifica materiales.
- Finance no genera PDF directamente; solicita PDF.
- Orders refleja estado de pago desde finance.
- Todo pago debe ser auditable.

Eventos:

- finance.payment.registered
- finance.balance.updated
- finance.receipt.requested

## 15. Permission Contract

El Permission Contract gobierna autorizacion.

Debe declarar:

- Nombre del permiso.
- Dominio propietario.
- Accion protegida.
- Roles permitidos.
- Contexto requerido.
- Resultado esperado.
- Error si no autorizado.

Reglas:

- UI puede ocultar acciones.
- Services deben validar operaciones criticas.
- Engines no validan permisos.
- Permisos pueden depender de usuario, rol, unidad, vendedor, estado del documento y feature flag.

Permisos base:

- commercial.quote.create
- commercial.quote.approve
- catalog.material.write
- emc.import.run
- ai.studio.use
- orders.update
- production.updateStatus
- finance.payment.register
- inventory.reserve
- purchasing.order.manage
- pdf.generate
- admin.users.manage

## 16. Navigation Contract

El Navigation Contract gobierna rutas y entradas de navegacion.

Debe declarar:

- Ruta publica o interna.
- Dominio propietario.
- Pagina asociada.
- Permiso requerido.
- Rol visible.
- Feature flag.
- Estado: activo, experimental, legacy o deshabilitado.
- Titulo y agrupacion.

Reglas:

- Un dominio registra sus propias rutas.
- La navegacion consulta permisos antes de mostrar accesos.
- Rutas legacy deben marcarse como legacy.
- Navigation no debe contener logica de negocio.
- Navigation no debe importar servicios de datos operativos.

## 17. Plugin Contract

El Plugin Contract gobierna extensiones.

Debe declarar:

- Nombre del plugin.
- Tipo de plugin.
- Dominio extendido.
- Capacidades aportadas.
- Servicios expuestos.
- Eventos publicados.
- Eventos escuchados.
- Permisos requeridos.
- Configuracion requerida.
- Dependencias externas.

Tipos permitidos:

- domain-extension
- ui-extension
- integration
- document-template
- ai-tool
- import-adapter
- reporting

Reglas:

- Plugin no modifica Kernel directamente.
- Plugin no importa internals de dominios.
- Plugin no salta Permission Registry.
- Plugin no accede a infrastructure sin declararla.
- Plugin debe poder deshabilitarse sin romper dominios base.

## 18. Configuration Contract

El Configuration Contract gobierna configuracion operacional.

Debe declarar:

- Nombre de configuracion.
- Dominio propietario.
- Valor esperado.
- Fuente.
- Fallback.
- Visibilidad: publica, interna o sensible.
- Feature flag asociado.
- Reglas de cambio.

Reglas:

- Configuracion no debe duplicarse en paginas.
- Dominios leen configuracion mediante registry.
- Valores sensibles no deben exponerse a UI.
- Toda configuracion critica debe tener fallback explicito.

Configuraciones base:

- CORE URL.
- Supabase Storage buckets.
- Moneda base.
- Tipo de cambio operativo.
- Unidad de negocio.
- Limites EMC.
- Limites de memoria IA.
- Plantillas PDF activas.
- Reglas de anticipo.
- Modos legacy.

## 19. Integration Contract

El Integration Contract gobierna sistemas externos.

Debe declarar:

- Nombre de integracion.
- Sistema externo.
- Dominio propietario.
- Proposito.
- Metodo de autenticacion.
- Datos enviados.
- Datos recibidos.
- Errores esperados.
- Reintentos.
- Auditoria.
- Permisos requeridos.

Reglas:

- Integraciones viven en infrastructure o services autorizados.
- UI no llama integraciones directamente.
- Engines no llaman integraciones.
- Datos enviados deben ser los minimos necesarios.
- Errores externos deben normalizarse segun Error Contract.

Integraciones base:

- Supabase database.
- Supabase Storage.
- CORE ELANKAV IA.
- CORE EMC import.
- OpenAI si se usa desde backend autorizado.

## 20. Error Contract

El Error Contract normaliza fallos entre dominios.

Debe declarar:

- Codigo.
- Dominio origen.
- Mensaje tecnico.
- Mensaje usuario.
- Severidad.
- Recuperable: si/no.
- Accion recomendada.
- Datos de trazabilidad.
- Evento asociado si aplica.

Severidades:

- info
- warning
- error
- critical

Categorias:

- validation_error
- permission_denied
- not_found
- conflict
- external_service_error
- persistence_error
- integration_timeout
- missing_cost
- missing_catalog_source
- document_generation_error
- unknown_error

Reglas:

- Errores tecnicos no deben exponerse crudos al usuario final si contienen detalles sensibles.
- Errores de permisos deben ser bloqueantes.
- Errores de costo faltante deben crear flujo de validacion, no inventar dato.
- Errores de integracion deben indicar fuente externa.
- Errores financieros deben ser auditables.

## Reglas Globales de Implementacion

- Ningun dominio debe implementarse leyendo archivos internos de otro dominio.
- Todo cruce de dominios debe pasar por contrato publico, Service Registry o Event Bus.
- UI no accede a Supabase, Storage ni CORE directamente.
- Engines no acceden a UI, Supabase, Storage, CORE ni DOM.
- PDF no recalcula negocio.
- AI no aprueba operaciones finales.
- EMC no modifica cotizaciones.
- Finance no modifica items.
- Production no modifica pagos.
- Inventory no crea ordenes de compra finales.
- Purchasing no consume inventario sin contrato.
- Configuration y Permission son obligatorios para operaciones criticas.

## Criterio de Aceptacion

Un desarrollador puede implementar un dominio V2 si:

- Declara su Domain Contract.
- Expone services documentados.
- Publica y consume eventos documentados.
- Usa resolvers para decisiones entre fuentes.
- Usa engines solo para calculo puro.
- Usa adapters para compatibilidad.
- Usa repositories solo dentro del dominio propietario.
- Respeta permisos, configuracion y errores normalizados.
- No importa UI ni internals de otros dominios.
