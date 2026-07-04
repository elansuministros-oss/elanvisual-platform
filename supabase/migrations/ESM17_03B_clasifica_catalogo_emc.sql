-- ESM-17 PAQUETE 03B
-- CLASIFICADOR DEL CATÁLOGO EMC
-- Aplica clasificación inicial sobre elankav_catalogo_items.
-- No crea tablas. No elimina registros. No modifica IDs.

update elankav_catalogo_items
set
  tipo_principal = case
    when nombre ~* '(estructura|estrutura|perfil|channel|fuente|driver|led|modulo led|módulo led)' then 'COMPONENTE'
    when nombre ~* '(roll[er]*[[:space:]]*up|x[[:space:]-]*banner|caja[[:space:]]+de[[:space:]]+luz|light[[:space:]]*box|edgelit)' then 'PRODUCTO'
    when nombre ~* '(instalaci[oó]n|transporte|levantamiento|mantenimiento)' then 'SERVICIO'
    when nombre ~* '(impresi[oó]n|uv|ecosolvente|sublimaci[oó]n)' then 'PROCESO'
    when nombre ~* '(cinta|vhb|primer|pegamento|cloruro|tape)' then 'ACABADO'
    when nombre ~* '(espatula|espátula|mascarilla|respirador|desgustadora|degustadora|mesa)' then 'EQUIPO'
    when nombre ~* '(lona|banner|backlit|mesh|microperforado|vinil|vinyl|vynil|adhesivo|frost|reflectivo|polarizado|pvc|acrilico|acrílico|flauta|lamina|lámina|laminacion|laminación)' then 'MATERIAL'
    else null
  end,

  configurable = case
    when nombre ~* '(roll[er]*[[:space:]]*up|x[[:space:]-]*banner|caja[[:space:]]+de[[:space:]]+luz|light[[:space:]]*box|edgelit)' then true
    else false
  end,

  nivel_producto = case
    when nombre ~* '(roll[er]*[[:space:]]*up|x[[:space:]-]*banner|caja[[:space:]]+de[[:space:]]+luz|light[[:space:]]*box|edgelit)' then 'CONFIGURABLE'
    when nombre ~* '(estructura|estrutura|perfil|channel|fuente|driver|led|modulo led|módulo led|cinta|vhb|primer|pegamento|cloruro|tape|lona|banner|backlit|mesh|microperforado|vinil|vinyl|vynil|adhesivo|frost|reflectivo|polarizado|pvc|acrilico|acrílico|flauta|lamina|lámina|laminacion|laminación)' then 'BASE'
    else null
  end,

  uso = case
    when nombre ~* '(estructura|estrutura|perfil|channel)' then 'Componente estructural'
    when nombre ~* '(fuente|driver|led|modulo led|módulo led)' then 'Componente de iluminación'
    when nombre ~* '(roll[er]*[[:space:]]*up|x[[:space:]-]*banner)' then 'Producto comercial configurable de exhibición'
    when nombre ~* '(caja[[:space:]]+de[[:space:]]+luz|light[[:space:]]*box|edgelit)' then 'Producto comercial configurable luminoso'
    when nombre ~* '(cinta|vhb|primer|pegamento|cloruro|tape)' then 'Consumible o acabado de producción'
    when nombre ~* '(lona|banner|backlit|mesh|microperforado)' then 'Material gráfico flexible'
    when nombre ~* '(vinil|vinyl|vynil|adhesivo|frost|reflectivo|polarizado)' then 'Material adhesivo'
    when nombre ~* '(pvc|acrilico|acrílico|flauta|lamina|lámina)' then 'Material rígido'
    when nombre ~* '(laminacion|laminación)' then 'Material de protección gráfica'
    when nombre ~* '(espatula|espátula|mascarilla|respirador|desgustadora|degustadora|mesa)' then 'Equipo o herramienta'
    else 'PENDIENTE_REVISION'
  end,

  updated_at = now();

-- Reporte PAQUETE 03B
select
  tipo_principal,
  count(*) as total
from elankav_catalogo_items
group by tipo_principal
order by tipo_principal;

select
  count(*) as pendientes_revision
from elankav_catalogo_items
where tipo_principal is null
or uso = 'PENDIENTE_REVISION';

select
  id,
  nombre,
  tipo_principal,
  configurable,
  nivel_producto,
  uso
from elankav_catalogo_items
order by tipo_principal nulls last, nombre
limit 40;
