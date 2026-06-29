-- AI-13D — EMC MULTIMEDIA

create table if not exists public.elankav_catalogo_multimedia (
    id uuid primary key default gen_random_uuid(),

    item_id uuid not null
        references public.elankav_catalogo_items(id)
        on delete cascade,

    proveedor_id uuid
        references public.elankav_supplier_empresas(id),

    tipo text not null,

    titulo text,

    descripcion text,

    storage_path text,

    public_url text,

    principal boolean not null default false,

    orden integer not null default 1,

    origen text not null default 'PROVEEDOR',

    ancho integer,

    alto integer,

    formato text,

    tamano_bytes bigint,

    hash_archivo text,

    activo boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    check (
        tipo in (
            'FOTO',
            'PDF',
            'FICHA_TECNICA',
            'VIDEO',
            'COLOR',
            'LOGO',
            'RENDER',
            'OTRO'
        )
    ),

    check (
        origen in (
            'PROVEEDOR',
            'FABRICANTE',
            'ELANKAV',
            'CLIENTE',
            'IA'
        )
    )
);

create index if not exists idx_emc_multimedia_item
on public.elankav_catalogo_multimedia(item_id);

create index if not exists idx_emc_multimedia_proveedor
on public.elankav_catalogo_multimedia(proveedor_id);

create index if not exists idx_emc_multimedia_tipo
on public.elankav_catalogo_multimedia(tipo);

create index if not exists idx_emc_multimedia_principal
on public.elankav_catalogo_multimedia(principal);
