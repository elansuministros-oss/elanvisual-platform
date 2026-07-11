# ELAN AI — Contexto Oficial

## Fuente Oficial

Este proyecto ya fue construido y auditado. La arquitectura base no debe rediseñarse ni volver a auditarse desde cero.

- Commit auditado: `e2574bc460721a3d809cf6b4c07e4ed769d70a4c`
- Auditoría Maestra: 117 pruebas ejecutadas, 117 aprobadas, 0 fallos.
- Runtime validado: `npm test` OK, `npm start` OK, working tree limpio en el punto auditado.

Todo trabajo posterior debe partir de esa base y actualizarla de forma incremental.

## Arquitectura Oficial

```text
Canal
↓
Dispatcher
↓
Identity
↓
Conversation
↓
Memory
↓
Knowledge
↓
State
↓
Planner
↓
Operator
↓
Tool
↓
Business Engine
↓
Prompt Builder
↓
Reasoning (OpenAI)
↓
Respuesta
↓
Memory
```

## Estado Implementado

- Runtime
- Identity Engine
- Conversation Engine
- Memory Engine
- State Engine
- Knowledge Engine
- Planner
- Prompt Builder
- LLM Orchestrator
- Sales Brain
- Business Engine
- Tool Engine
- Operator Engine
- OpenAI Provider
- WAHA Adapter
- Supabase Foundation
- Supabase Adapters
- MVP Service

## Principios Obligatorios

- No modificar ELANVISUAL.
- No modificar ORCHESTRATOR.
- No modificar producción.
- ELAN AI continúa siendo un producto independiente.
- ELANKAV CORE continúa siendo el núcleo compartido.
- OpenAI únicamente proporciona razonamiento.
- WAHA únicamente transporta mensajes.
- Supabase únicamente persiste información.
- Toda la lógica del negocio permanece dentro de ELAN AI.
- Mantener el desacoplamiento mediante adapters.
- Un movimiento por commit.
- Ejecutar `npm test`, `npm start` y `git diff --check` antes de cada commit.

## Siguiente Fase

No reconstruir la arquitectura. No repetir auditoría general. Conectar únicamente la infraestructura existente en este orden:

1. Configurar variables de entorno.
2. Aplicar migraciones de Supabase.
3. Validar Identity Adapter.
4. Validar Memory Adapter.
5. Validar State Adapter.
6. Validar Knowledge Adapter.
7. Conectar OpenAI real.
8. Conectar WAHA real.
9. Implementar webhook de entrada.
10. Ejecutar pruebas end-to-end fuera de producción.
11. Activar producción de forma gradual.

## Fase 1 — Variables de Entorno

La configuración debe declararse con placeholders en `.env.example`. Los valores reales deben vivir fuera del repositorio.

Variables esperadas:

- Supabase público: URL y anon key para clientes Vite.
- Supabase servidor: URL y service role solo para adapters/backend.
- OpenAI: API key y modelo de razonamiento.
- WAHA: URL, API key, sesión y webhook secret.
- ELANKAV CORE: endpoint base o endpoint específico de ELAN AI.
- Runtime: entorno y flags de producción gradual.

No se debe usar un endpoint productivo hardcodeado como fallback. Si una integración real no está configurada, el adapter debe quedar en estado pendiente o fallar de forma controlada.
