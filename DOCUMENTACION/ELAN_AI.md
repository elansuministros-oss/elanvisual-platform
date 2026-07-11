# ELAN AI - Contexto oficial del proyecto

## Fuente oficial

Este documento fija el contexto operativo oficial de ELAN AI para las fases posteriores a la Auditoria Maestra.

Commit auditado:

```txt
e2574bc460721a3d809cf6b4c07e4ed769d70a4c
```

Resultado de la Auditoria Maestra:

* 117 pruebas ejecutadas.
* 117 pruebas aprobadas.
* 0 fallos.
* Runtime validado.
* `npm test` OK.
* `npm start` OK.
* Git limpio: Working Tree Clean.

La Auditoria Maestra y el commit indicado son la base oficial del proyecto. Todo trabajo posterior debe partir de esa base y actualizarla, no volver a analizar ni reconstruir la arquitectura desde cero.

---

## Estado actual

La arquitectura base ya fue construida y auditada. No debe redisenarse ni reimplementarse como parte de la siguiente fase.

Componentes implementados:

* Runtime.
* Identity Engine.
* Conversation Engine.
* Memory Engine.
* State Engine.
* Knowledge Engine.
* Planner.
* Prompt Builder.
* LLM Orchestrator.
* Sales Brain.
* Business Engine.
* Tool Engine.
* Operator Engine.
* OpenAI Provider.
* WAHA Adapter.
* Supabase Foundation.
* Supabase Adapters.
* MVP Service.

---

## Arquitectura oficial

```txt
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

---

## Principios obligatorios

* No modificar ELANVISUAL.
* No modificar ORCHESTRATOR.
* No modificar produccion.
* ELAN AI continua siendo un producto independiente.
* ELANKAV CORE continua siendo el nucleo compartido.
* OpenAI unicamente proporciona razonamiento.
* WAHA unicamente transporta mensajes.
* Supabase unicamente persiste informacion.
* Toda la logica del negocio permanece dentro de ELAN AI.
* Mantener el desacoplamiento mediante Adapters.
* Un movimiento por commit.
* Ejecutar `npm test`, `npm start` y `git diff --check` antes de cada commit.

---

## Objetivo de la siguiente fase

No reconstruir la arquitectura.

No volver a realizar una auditoria general.

La siguiente fase consiste unicamente en conectar la infraestructura existente, en este orden:

1. Configurar variables de entorno.
2. Aplicar migraciones de Supabase.
3. Validar Identity Adapter.
4. Validar Memory Adapter.
5. Validar State Adapter.
6. Validar Knowledge Adapter.
7. Conectar OpenAI real.
8. Conectar WAHA real.
9. Implementar webhook de entrada.
10. Ejecutar pruebas end-to-end fuera de produccion.
11. Activar produccion de forma gradual.

---

## Criterio de trabajo

Cualquier cambio posterior debe ser incremental, acotado y alineado con la secuencia anterior.

No se deben modificar componentes fuera del alcance del paso activo. Las integraciones externas deben quedar encapsuladas en sus adapters correspondientes y no deben mover reglas de negocio hacia OpenAI, WAHA ni Supabase.
