-- ELANPET.COM V7 - Supabase schema base
-- Incluye QR por veterinaria, carrito, transferencias, anticipo, seguimiento y producción.

create extension if not exists pgcrypto;

create table if not exists veterinarias (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  telefono text,
  direccion text,
  responsable text,
  comision_porcentaje numeric default 10,
  activa boolean default true,
  created_at timestamptz default now()
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  descripcion text,
  medidas text,
  precio numeric not null,
  imagen_url text,
  activo boolean default true,
  destacado boolean default false,
  created_at timestamptz default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  whatsapp text not null,
  correo text,
  veterinaria_id uuid references veterinarias(id),
  created_at timestamptz default now()
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text unique not null,
  codigo_seguimiento text unique,
  cliente_id uuid references clientes(id),
  veterinaria_id uuid references veterinarias(id),
  subtotal numeric not null,
  descuento_porcentaje numeric default 0,
  descuento_monto numeric default 0,
  total numeric not null,
  pago_tipo text default 'anticipo' check (pago_tipo in ('anticipo','total')),
  anticipo_porcentaje numeric default 60,
  anticipo_requerido numeric default 0,
  anticipo_recibido numeric default 0,
  saldo_pendiente numeric default 0,
  monto_solicitado numeric default 0,
  estado text default 'pendiente_pago',
  estado_produccion text default 'pedido_recibido',
  pago_estado text default 'pendiente_transferencia',
  seguimiento_estado text default 'pendiente_pago',
  comision_monto numeric default 0,
  comision_estado text default 'no_generada',
  fecha_estimada date,
  created_at timestamptz default now()
);

create table if not exists pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  cantidad integer not null,
  precio_unitario numeric not null,
  subtotal numeric not null
);

create table if not exists pedido_historial (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  estado text not null,
  nota text,
  imagen_url text,
  created_at timestamptz default now()
);

create table if not exists cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  banco text not null,
  numero text not null,
  titular text not null,
  moneda text default 'Córdobas',
  activa boolean default true,
  created_at timestamptz default now()
);

create table if not exists qr_visitas (
  id uuid primary key default gen_random_uuid(),
  veterinaria_id uuid references veterinarias(id),
  codigo_qr text not null,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  subtitulo text,
  imagen_desktop text,
  imagen_mobile text,
  ubicacion text default 'slider-home',
  link text,
  activo boolean default true,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz default now()
);

create table if not exists trabajos_entregados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text default 'Foto',
  descripcion text,
  archivo_url text,
  activo boolean default true,
  created_at timestamptz default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nombre text,
  rol text not null check (rol in ('admin', 'veterinaria')),
  veterinaria_id uuid references veterinarias(id),
  activo boolean default true,
  created_at timestamptz default now()
);

insert into productos (nombre, categoria, descripcion, medidas, precio) values
('Casa para perro pequeño', 'Casas para perros', 'Casa funcional para razas pequeñas, cómoda, segura y resistente.', '50 × 40 × 55 cm', 3500),
('Casa para perro mediano', 'Casas para perros', 'Casa amplia para perros medianos, con ventilación lateral y base elevada.', '75 × 60 × 70 cm', 5400),
('Casa para perro grande', 'Casas para perros', 'Casa resistente para perros grandes, con espacio amplio y protección.', '90 × 75 × 85 cm', 8000),
('Casa premium para perro con terraza', 'Casas para perros', 'Casa premium con terraza, doble nivel y escalera lateral.', '100 × 75 × 90 cm', 12700),
('Comedero elevado doble plato', 'Comederos', 'Comedero elevado con doble plato de acero inoxidable.', '40 × 20 × 20 cm', 1350),
('Cama elevada premium', 'Camas', 'Cama elevada con estructura firme y tela resistente.', '100 × 70 × 20 cm', 2600),
('Cama Montessori para mascotas', 'Camas', 'Cama tipo Montessori con madera CNC y colchón removible.', '80 × 60 × 20 cm', 4100),
('Escalera para mascotas', 'Escaleras', 'Escalera para ayudar a mascotas a subir a camas o sillones.', '40 × 60 × 50 cm', 3200),
('Organizador para mascotas', 'Organizadores', 'Organizador funcional para correas, collares, snacks y accesorios.', '60 × 25 × 80 cm', 4600),
('Torre para gatos', 'Torres para gatos', 'Torre vertical para gatos con espacios de descanso y juego.', '50 × 50 × 120 cm', 7000)
on conflict do nothing;
