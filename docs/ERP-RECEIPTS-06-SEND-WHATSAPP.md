# ERP-RECEIPTS-06 — Envío de recibo por WhatsApp

## Objetivo

Agregar en el historial de pagos un botón **Enviar al cliente** siguiendo el mismo patrón de apertura de WhatsApp utilizado por la cotización.

## Alcance

- Usa el teléfono persistido en `customer_snapshot` o en la cotización.
- Normaliza números de Nicaragua.
- Abre WhatsApp App y utiliza WhatsApp Web como fallback.
- Prepara un mensaje con número oficial de recibo, monto recibido y saldo o estado pagado.
- Mantiene la impresión existente.

## Límite actual

El botón prepara el chat y el mensaje. El PDF todavía debe adjuntarse manualmente porque el recibo no cuenta con una URL pública ni con un flujo de almacenamiento/entrega en el backend.

## Restricciones

- Sin cambios en Supabase.
- Sin cambios en lógica financiera.
- Sin despliegue a producción.
- Validar primero en Preview.
