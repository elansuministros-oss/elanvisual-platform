# ELANVISUAL ERP
# 00_ULTIMO.md

ESTE ES EL PRIMER ARCHIVO QUE DEBE LEERSE AL INICIAR CUALQUIER NUEVO CHAT.

PROCEDIMIENTO OBLIGATORIO

1. Leer este archivo completo.
2. Leer el último documento dentro de DOCS\PUNTOS_SEGUROS.
3. Auditar el módulo solicitado.
4. No modificar código antes de terminar la auditoría.
5. Trabajar únicamente sobre un módulo a la vez.
6. Al finalizar:
   - Build
   - Commit
   - Push
   - Actualizar este archivo.
   - Crear un nuevo Punto Seguro.

ÚLTIMO PUNTO SEGURO

AI-11B_2026-06-26.md

ESTADO

AI-11B cerrado oficialmente.

Build OK.
Git limpio.
Push OK.

RESUMEN AI-11B

Se creó y conectó el motor financiero centralizado:

- src/services/finanzas/finanzasPedidoService.js
- src/services/finanzas/finanzasPedidoAdapter.js
- src/services/finanzas/index.js

OT Comercial usa el motor financiero.
AppContext normaliza pagos, anticipos, saldos y data_original usando el motor financiero.

REGLA OFICIAL

Supabase es la única fuente persistente para pedidos y pagos.
No usar localStorage para pagos, anticipos, saldos ni historial financiero.

PRÓXIMA FASE

AI-11C:
Caja, Tesorería, Recibos reales, bancos y control de pagos.
