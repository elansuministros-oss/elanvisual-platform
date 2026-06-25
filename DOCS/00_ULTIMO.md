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
   - Pruebas
   - Commit
   - Push
   - Actualizar este archivo.
   - Crear un nuevo Punto Seguro.

ÚLTIMO PUNTO SEGURO

AI-09.5_2026-06-25.md

ESTADO

Producción activa.

AI-09.5 cerrado:
- Pedidos ya no carga desde localStorage.
- Pedidos ya no persiste en localStorage.
- Fuente oficial de pedidos: Supabase / pedidos_elanvisual.
- Anticipo corregido: solo se calcula desde historial real de pagos.
- Tarjetas de pedidos muestran Pagado y Saldo.
- Commits publicados:
  - 3769590
  - 00facc6
  - 78123d8

DECISIÓN OFICIAL

A partir de AI-09.6, ELANVISUAL ERP será mobile-first real.

La versión móvil será la referencia principal de operación.
La PC no tendrá funciones exclusivas; solo distribuirá mejor la información por espacio.

Próxima fase:

AI-09.6
PedidosProduccion mobile-first completo:
- Mismo contenido en móvil y PC.
- Menú hamburguesa o navegación por secciones.
- Sin scroll excesivo.
- Historial de pagos visible.
- Recibos PDF accesibles.
- Pagos, producción, logística, proveedores, costos, rentabilidad y acciones disponibles en móvil.
