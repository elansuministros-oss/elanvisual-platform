-- AI-04A — RECEPCIÓN COMPLETA DE ARCHIVOS ELANVISUAL

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-archivos',
  'ai-archivos',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'application/dwg',
    'application/x-dwg',
    'application/dxf',
    'application/x-dxf',
    'image/vnd.dwg',
    'image/vnd.dxf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.archivos_ai (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid null references public.proyectos_ai(id) on delete cascade,
  mensaje_id uuid null references public.mensajes_ai(id) on delete set null,
  usuario_id uuid null,
  nombre_original text not null,
  nombre_storage text not null,
  bucket text not null default 'ai-archivos',
  ruta_storage text not null,
  url_publica text null,
  mime_type text null,
  extension text null,
  tamano_bytes bigint null,
  tipo_archivo text not null default 'referencias',
  estado_procesamiento text not null default 'subido',
  contenido_extraido text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archivos_ai_estado_chk check (
    estado_procesamiento in (
      'subido',
      'procesando',
      'procesado',
      'error',
      'no_soportado_directo'
    )
  ),
  constraint archivos_ai_tipo_chk check (
    tipo_archivo in (
      'imagenes',
      'pdf',
      'documentos',
      'excel',
      'planos',
      'referencias'
    )
  )
);

create index if not exists idx_archivos_ai_proyecto_id on public.archivos_ai(proyecto_id);
create index if not exists idx_archivos_ai_mensaje_id on public.archivos_ai(mensaje_id);
create index if not exists idx_archivos_ai_usuario_id on public.archivos_ai(usuario_id);
create index if not exists idx_archivos_ai_tipo_archivo on public.archivos_ai(tipo_archivo);
create index if not exists idx_archivos_ai_estado on public.archivos_ai(estado_procesamiento);
create index if not exists idx_archivos_ai_created_at on public.archivos_ai(created_at desc);

create or replace function public.set_updated_at_archivos_ai()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_archivos_ai_updated_at on public.archivos_ai;

create trigger trg_archivos_ai_updated_at
before update on public.archivos_ai
for each row
execute function public.set_updated_at_archivos_ai();

alter table public.archivos_ai enable row level security;

drop policy if exists "archivos_ai_select_authenticated" on public.archivos_ai;
drop policy if exists "archivos_ai_insert_authenticated" on public.archivos_ai;
drop policy if exists "archivos_ai_update_authenticated" on public.archivos_ai;
drop policy if exists "archivos_ai_delete_authenticated" on public.archivos_ai;

create policy "archivos_ai_select_authenticated"
on public.archivos_ai
for select
to authenticated
using (true);

create policy "archivos_ai_insert_authenticated"
on public.archivos_ai
for insert
to authenticated
with check (true);

create policy "archivos_ai_update_authenticated"
on public.archivos_ai
for update
to authenticated
using (true)
with check (true);

create policy "archivos_ai_delete_authenticated"
on public.archivos_ai
for delete
to authenticated
using (true);

drop policy if exists "ai_archivos_storage_select_authenticated" on storage.objects;
drop policy if exists "ai_archivos_storage_insert_authenticated" on storage.objects;
drop policy if exists "ai_archivos_storage_update_authenticated" on storage.objects;
drop policy if exists "ai_archivos_storage_delete_authenticated" on storage.objects;

create policy "ai_archivos_storage_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'ai-archivos');

create policy "ai_archivos_storage_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ai-archivos');

create policy "ai_archivos_storage_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'ai-archivos')
with check (bucket_id = 'ai-archivos');

create policy "ai_archivos_storage_delete_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ai-archivos');
