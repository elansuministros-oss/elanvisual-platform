-- AI-13C — EMC CATALOGOS BASE
-- Ejecutar después de AI-13C_EMC_SQL_DEFINITIVO.sql

insert into public.elankav_catalogo_tipos_item (codigo, nombre, descripcion)
values
('MATERIA_PRIMA','Materia Prima','Material base utilizado en producción'),
('INSUMO','Insumo','Consumible usado durante fabricación o instalación'),
('HERRAMIENTA','Herramienta','Herramienta reutilizable de taller o instalación'),
('EQUIPO','Equipo','Equipo operativo o técnico'),
('PRODUCTO_COMERCIAL','Producto Comercial','Producto comprado para reventa o integración'),
('SERVICIO','Servicio','Servicio contratado o vendido'),
('REPUESTO','Repuesto','Parte de reemplazo'),
('ACTIVO','Activo','Activo fijo o bien interno')
on conflict (codigo) do nothing;

insert into public.elankav_catalogo_unidades (codigo, nombre, simbolo, tipo)
values
('LAMINA','Lámina','lámina','pieza'),
('ROLLO','Rollo','rollo','pieza'),
('UNIDAD','Unidad','und','pieza'),
('METRO','Metro','m','longitud'),
('METRO_LINEAL','Metro lineal','ml','longitud'),
('METRO_CUADRADO','Metro cuadrado','m²','area'),
('LITRO','Litro','L','volumen'),
('GALON','Galón','gal','volumen'),
('YARDA','Yarda','yd','longitud'),
('CAJA','Caja','caja','empaque'),
('PAQUETE','Paquete','paq','empaque')
on conflict (codigo) do nothing;

insert into public.elankav_catalogo_categorias (codigo, nombre, descripcion, orden)
values
('PVC','PVC','Láminas, perfiles y derivados de PVC',10),
('ACRILICO','Acrílicos','Láminas y productos acrílicos',20),
('VINIL','Viniles','Viniles de impresión, corte, reflectivos y especiales',30),
('LONA','Lonas','Lonas para impresión y rotulación',40),
('LAMINADO','Laminados','Laminantes UV, protección y acabados',50),
('ADHESIVOS_CINTAS','Adhesivos y cintas','Cintas, VHB, primers y pegamentos',60),
('HERRAMIENTAS','Herramientas','Herramientas de aplicación, instalación y taller',70),
('ESTRUCTURAS_PUBLICITARIAS','Estructuras publicitarias','Roller up, plumas, mesas degustadoras y soportes',80),
('CAJAS_LUZ','Cajas de luz','Cajas luminosas y sistemas edge-lit',90),
('POLARIZADOS_REFLECTIVOS','Polarizados y reflectivos','Polarizados, reflectivos y señalización',100),
('SUBLIMACION','Sublimación','Papeles e insumos para sublimación',110),
('SERVICIOS','Servicios','Servicios técnicos o comerciales',900)
on conflict (codigo) do nothing;

insert into public.elankav_catalogo_marcas (nombre, descripcion)
values
('3M','Marca 3M'),
('VargasFlex Plus','Marca o línea VargasFlex Plus'),
('Promoplus','Marca o línea Promoplus'),
('Genérico','Sin marca específica')
on conflict (nombre) do nothing;


