-- ESM-17 PAQUETE 04
-- NORMALIZADOR DEL CATÁLOGO EMC
-- No crea tablas. No elimina registros. No modifica IDs.
-- Limpia nombres, normaliza palabras y marca basura como INACTIVO.

update elankav_catalogo_items
set nombre = trim(regexp_replace(nombre, '\s+', ' ', 'g'))
where nombre is not null;

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\|\s*Unidad:\s*[^|]+', '', 'gi')
where nombre ~* '\|\s*Unidad:';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\|\s*Precio\s*Usd:\s*[^|]*', '', 'gi')
where nombre ~* '\|\s*Precio\s*Usd:';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bVINYL\b', 'VINIL', 'gi')
where nombre ~* '\bVINYL\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bVYNIL\b', 'VINIL', 'gi')
where nombre ~* '\bVYNIL\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bACRILICO\b', 'ACRÍLICO', 'gi')
where nombre ~* '\bACRILICO\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bMICRO\s*PERFORADO\b', 'MICROPERFORADO', 'gi')
where nombre ~* '\bMICRO\s*PERFORADO\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bLIGHTBOX\b', 'LIGHT BOX', 'gi')
where nombre ~* '\bLIGHTBOX\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bROLLER\s*UP\b', 'ROLL UP', 'gi')
where nombre ~* '\bROLLER\s*UP\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bESTRUTURA\b', 'ESTRUCTURA', 'gi')
where nombre ~* '\bESTRUTURA\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bDOBE\b', 'DOBLE', 'gi')
where nombre ~* '\bDOBE\b';

update elankav_catalogo_items
set nombre = regexp_replace(nombre, '\bDESGUSTADORA\b', 'DEGUSTADORA', 'gi')
where nombre ~* '\bDESGUSTADORA\b';

update elankav_catalogo_items
set
  estado = 'INACTIVO',
  activo = false,
  uso = 'REGISTRO_BASURA_IMPORTACION',
  updated_at = now()
where trim(upper(nombre)) in (
  '| PRECIO USD:',
  'DE PRECIOS',
  'PRECIO USD',
  'OZXM',
  'XM'
);

update elankav_catalogo_items
set updated_at = now();

-- Reporte de control
select
  estado,
  activo,
  count(*) as total
from elankav_catalogo_items
group by estado, activo
order by estado, activo;

select
  id,
  nombre,
  estado,
  activo,
  uso
from elankav_catalogo_items
where uso = 'REGISTRO_BASURA_IMPORTACION'
order by nombre;
