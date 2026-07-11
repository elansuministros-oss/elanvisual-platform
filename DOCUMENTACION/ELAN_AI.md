# ELAN AI

## Contexto oficial

La base oficial del proyecto parte de la Auditoria Maestra ejecutada sobre el
commit `e2574bc460721a3d809cf6b4c07e4ed769d70a4c`, con 117 pruebas aprobadas,
runtime validado, `npm test` OK, `npm start` OK y working tree limpio en esa
revision.

Este trabajo posterior no redisenia la arquitectura ni reaudita el sistema. La
siguiente fase solo conecta infraestructura existente en este orden:

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

## Contrato de entorno

Los valores reales se configuran en `.env` local o en el gestor de secretos de
la plataforma de despliegue. No se deben commitear secretos. `.env.example`
documenta los nombres requeridos con placeholders.

Variables publicas del frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_BUCKET`
- `VITE_EMC_STORAGE_BUCKET`
- `VITE_ELANKAV_CORE_URL`
- `VITE_ELANKAV_CORE_ENDPOINT`
- `VITE_AI_STUDIO_ENDPOINT`
- `VITE_WHATSAPP_ELAN`

Variables server-only:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WAHA_BASE_URL`
- `WAHA_API_KEY`
- `WAHA_SESSION`
- `WAHA_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Estado del paso 1

- `.env.example` contiene el contrato de configuracion sin valores reales.
- `api/elan-ai.js` valida `OPENAI_API_KEY` al momento de usar OpenAI y responde
  con error controlado `503` si falta la variable.
- `OPENAI_MODEL` permite cambiar el modelo desde entorno sin modificar codigo.

## Limites

- OpenAI solo proporciona razonamiento.
- WAHA solo transporta mensajes.
- Supabase solo persiste informacion.
- La logica de negocio permanece dentro de ELAN AI.
- El desacoplamiento debe mantenerse mediante adapters.
