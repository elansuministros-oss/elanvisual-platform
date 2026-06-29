-- AI-13E — Mejora Multimedia EMC para ELAN AI

alter table public.elankav_catalogo_multimedia
add column if not exists uso_ia text not null default 'REFERENCIA';

alter table public.elankav_catalogo_multimedia
add column if not exists es_textura boolean not null default false;

alter table public.elankav_catalogo_multimedia
add column if not exists es_renderizable boolean not null default true;

alter table public.elankav_catalogo_multimedia
add column if not exists es_principal_ia boolean not null default false;

alter table public.elankav_catalogo_multimedia
add constraint chk_emc_multimedia_uso_ia
check (
    uso_ia in (
        'RENDER',
        'TEXTURA',
        'COLOR',
        'PRODUCTO',
        'REFERENCIA',
        'FICHA',
        'LOGO',
        'EMPAQUE',
        'ETIQUETA'
    )
);
