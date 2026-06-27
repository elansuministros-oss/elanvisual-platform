# ELANVISUAL ERP
# 00_ULTIMO.md

ESTE ES EL PRIMER ARCHIVO QUE DEBE LEERSE AL INICIAR CUALQUIER NUEVO CHAT.

ÚLTIMO PUNTO SEGURO

AI-13C_2026-06-26.md

ESTADO

AI-13C cerrado oficialmente.

Build OK.
Push OK.

Se eliminó la lógica financiera heredada que convertía anticipo solicitado en pago real.

REGLA OFICIAL

- El anticipo solicitado es solo referencia comercial.
- El pago real solo existe si está registrado en pagos.historial.
- Pagado = suma de pagos.historial.
- Saldo = total - pagado.
- OT, Producción, Seguimiento y Dashboard no deben inventar pagos.
- Supabase sigue siendo la fuente persistente.

PRÓXIMA FASE

AI-13D:
Validación producción y limpieza final de nombres legacy si aparecen en UI.
