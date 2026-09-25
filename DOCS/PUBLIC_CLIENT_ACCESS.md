# ELANVISUAL — MODELO DE ACCESO PÚBLICO TEMPORAL

## Objetivo
Mantener acceso público por cliente bajo `visual.elankav.com` mientras ERPNext CENTRAL no está disponible, sin duplicar la lógica del administrador.

## Regla principal
El administrador/Owner sigue siendo la autoridad. Solo el Owner crea, modifica, aprueba precios y publica cotizaciones. Las vistas públicas son de solo lectura salvo la selección/cantidad permitida en un catálogo corporativo.

## 1. Cliente corporativo con precios fijos
Ejemplo: Walmart.

- Catálogo corporativo: `/corporativo/walmart/`
- Panel de cotizaciones: `/clientes/walmart/`
- Puede autocotizar desde catálogo con precios aprobados por Owner.
- Puede consultar cotizaciones ya publicadas en su panel.

## 2. Cliente frecuente sin precios fijos
Ejemplos iniciales: Grupo Mega y Comtex.

- `/clientes/grupo-mega/`
- `/clientes/comtex/`
- No tienen catálogo de precios fijos.
- Solo ven las cotizaciones que ELANVISUAL les publica.

## 3. Cliente ocasional
No tiene panel.
Recibe un enlace individual por cotización:

`/cotizacion/<PUBLIC_ID>/`

El PUBLIC_ID debe ser suficientemente difícil de adivinar cuando se use en modo temporal sin autenticación.

## Modo temporal sin servidor
- Datos de panel por cliente: `public/client-data/<slug>.json`
- Datos de cotización individual: `public/quote-data/<PUBLIC_ID>.json`
- Precios Walmart continúan en el catálogo corporativo actual.
- No publicar costos internos, proveedores, márgenes ni información operativa interna.
- Las rutas usan `noindex,nofollow` y no existe un índice público de clientes.

## Conexión futura a ERPNext CENTRAL
Cuando vuelva el servidor:
1. Mantener las mismas URLs públicas.
2. Sustituir los JSON manuales por lectura desde el administrador/ERPNext.
3. Añadir autenticación real al panel de clientes frecuentes/corporativos.
4. El Owner continúa siendo el único que crea/modifica/publica cotizaciones y precios.
5. Las cotizaciones emitidas conservan el precio con el que fueron publicadas.

## No mezclar
- Catálogo corporativo != panel de cliente.
- Panel de cliente != cotización individual.
- Cliente frecuente != cliente corporativo con precios fijos.
- Cliente ocasional no recibe panel.
