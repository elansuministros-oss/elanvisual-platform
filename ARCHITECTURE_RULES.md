# ARCHITECTURE_RULES — ELANVISUAL V2 / ESM-19

## Estado
Arquitectura preparada para ELANVISUAL V2 sobre el repositorio congelado en la rama ESM-19-REBUILD-ELANVISUAL-CLEAN.

## Reglas base
- ELANVISUAL V2 es una reorganizacion modular de la plataforma existente, no una reescritura conceptual.
- No se debe inventar arquitectura fuera de los flujos existentes: Supabase, EMC, Material Master, Cotizador AI, AI Studio, pedidos, produccion, finanzas, PDF y Supplier Hub.
- Supabase es fuente oficial operativa.
- LocalStorage queda solo como compatibilidad temporal o fallback explicito donde ya exista.
- CORE ELANKAV se usa para IA/EMC; el frontend no debe duplicar IA pesada.
- Ningun motor debe inventar materiales, precios, proveedores o tecnologias.
- Todo dato de costo debe tener origen trazable: EMC, Material Master, tinta, combinacion, biblioteca tecnica o validacion manual.

## Dependencias permitidas
- UI puede consumir servicios, resolvers, adapters y tipos de su dominio.
- UI no debe contener reglas extensas de negocio.
- Services consultan y persisten datos.
- Engines calculan y transforman reglas de negocio sin persistir.
- Resolvers deciden fuente, seleccion y prioridad de datos.
- Adapters traducen formatos entre V1, Supabase, EMC, Material Master y contratos V2.
- Infrastructure encapsula clientes externos como Supabase, Storage y CORE.
- PDF representa datos aprobados; no recalcula precios.

## Dependencias prohibidas
- Un dominio no debe importar paginas o componentes UI de otro dominio.
- Services no deben importar paginas.
- Engines no deben acceder a DOM, Supabase, Storage ni CORE directamente.
- Components no deben acceder directamente a Supabase, Storage ni CORE.
- App.jsx no debe modificarse durante preparacion de esqueleto.
- AI-23, EMC y Cotizador no deben modificarse durante la creacion del esqueleto.
- No se debe mover, eliminar ni reemplazar codigo V1 durante esta etapa.

## Direccion arquitectonica
UI -> services/resolvers -> engines/adapters -> infrastructure.

## Dominios V2 oficiales
- public
- commercial
- crm
- catalog
- knowledge
- suppliers
- emc
- ai
- inventory
- purchasing
- production
- orders
- finance
- pdf
- admin

## Migracion V1 a V2
- Crear estructura fisica sin mover codigo.
- Documentar responsabilidades antes de implementar.
- Extraer primero servicios por dominio.
- Luego extraer engines y resolvers.
- Adelgazar paginas solo despues de validar equivalencia funcional.
- Mantener codigo heredado hasta que exista reemplazo probado.
- Eliminar duplicados solo con validacion de flujo y autorizacion explicita.

## Reglas por flujo
- EMC importa archivos, normaliza catalogos y alimenta Material Master.
- Catalog provee materiales, tintas, combinaciones, tecnologias y biblioteca tecnica.
- AI usa memoria operativa y fuentes aprobadas; si falta informacion, debe marcar pendiente.
- AI-23 entrega preview estructurado; no guarda automaticamente sin validacion.
- Commercial convierte necesidad en cotizacion y pedido aprobado.
- Orders/Production operan pedido y OT desde datos guardados.
- Finance calcula anticipos, saldos, pagos reales y recibos desde pedido aprobado.
- PDF genera documentos desde datos finales validados.
