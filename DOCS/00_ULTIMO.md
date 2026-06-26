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

AI-10_2026-06-25.md

ESTADO

AI-10 cerrado oficialmente.

Producción activa.
Build OK.
Git limpio.

RESUMEN AI-10

Se creó nueva arquitectura modular de Orden de Trabajo:

- src/pages/OrdenTrabajo.jsx
- src/components/ot/
- src/hooks/ot/
- src/services/ot/

Se abandona la estrategia de ampliar PedidosProduccion.jsx.

Compras ahora funciona bajo el flujo:

OT → Compras → Orden de Compra → Proveedor → Recepción → Factura → Pago.

Red de Proveedores conectada a Supabase mediante Supplier Hub.

Proveedores estratégicos cargados en Supabase:

1. IMPRESIONES VIDA
ID: be240911-47b6-474c-a179-a976e87a6b81

2. PLAY MARKETING
ID: bd2e5ae3-2224-4900-b8c7-3bb98dc6097c

REGLA OFICIAL

La IA NO consulta proveedores durante la venta.

Las cotizaciones comerciales usan:
- Catálogo Maestro
- Materiales Master
- Biblioteca Técnica
- Costos internos
- Recetas técnicas
- Márgenes internos

Los proveedores participan solo cuando existe una Orden de Trabajo aprobada.

PRÓXIMA FASE

AI-11:
Completar ciclo operativo de Compras:
- Solicitud de cotización
- Respuesta proveedor
- Recepción
- Factura
- Pago
- Costo real
- Rentabilidad
