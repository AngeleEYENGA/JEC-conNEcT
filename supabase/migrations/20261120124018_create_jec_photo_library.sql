create table if not exists public.jec_photo_assets (
  id uuid primary key default gen_random_uuid(),
  title_fr text not null check (char_length(btrim(title_fr)) between 3 and 180),
  title_en text,
  caption_fr text,
  caption_en text,
  alt_text_fr text not null check (char_length(btrim(alt_text_fr)) between 5 and 250),
  alt_text_en text,
  event_name text,
  event_date date,
  country text,
  image_url text not null check (image_url ~* '^https://'),
  source_name text not null check (char_length(btrim(source_name)) between 2 and 160),
  source_url text not null check (source_url ~* '^https://'),
  photographer text not null check (char_length(btrim(photographer)) between 2 and 160),
  license_name text not null check (char_length(btrim(license_name)) between 2 and 160),
  license_url text check (license_url is null or license_url ~* '^https://'),
  rights_evidence text,
  rights_status text not null default 'pending' check (rights_status in ('pending','approved','rejected')),
  rights_confirmed boolean not null default false,
  subject_consent_status text not null default 'pending' check (subject_consent_status in ('pending','confirmed','not_applicable')),
  rights_notes text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_photo_publication_rights_check check (
    not is_published or (
      rights_status = 'approved'
      and rights_confirmed = true
      and subject_consent_status in ('confirmed','not_applicable')
    )
  )
);

create index if not exists jec_photo_assets_public_gallery_idx
  on public.jec_photo_assets (is_published, is_featured desc, sort_order, created_at desc);
create index if not exists jec_photo_assets_event_idx
  on public.jec_photo_assets (event_date desc, event_name);

alter table public.jec_photo_assets enable row level security;
grant select on public.jec_photo_assets to anon, authenticated;
grant insert, update, delete on public.jec_photo_assets to authenticated;

drop policy if exists "Public reads published rights-cleared JEC photos" on public.jec_photo_assets;
create policy "Public reads published rights-cleared JEC photos"
  on public.jec_photo_assets for select to anon, authenticated
  using (
    is_published = true
    and rights_status = 'approved'
    and rights_confirmed = true
    and subject_consent_status in ('confirmed','not_applicable')
  );

drop policy if exists "JEC administrators read all photo assets" on public.jec_photo_assets;
create policy "JEC administrators read all photo assets"
  on public.jec_photo_assets for select to authenticated
  using (private.is_jec_admin());

drop policy if exists "JEC administrators insert photo assets" on public.jec_photo_assets;
create policy "JEC administrators insert photo assets"
  on public.jec_photo_assets for insert to authenticated
  with check (private.is_jec_admin());

drop policy if exists "JEC administrators update photo assets" on public.jec_photo_assets;
create policy "JEC administrators update photo assets"
  on public.jec_photo_assets for update to authenticated
  using (private.is_jec_admin())
  with check (private.is_jec_admin());

drop policy if exists "JEC administrators delete photo assets" on public.jec_photo_assets;
create policy "JEC administrators delete photo assets"
  on public.jec_photo_assets for delete to authenticated
  using (private.is_jec_admin());

comment on table public.jec_photo_assets is
  'Curated JEC photo library. Public visibility requires administrator rights clearance and subject consent clearance. Image bytes remain hosted by the credited source; image_url must be HTTPS.';
comment on column public.jec_photo_assets.rights_evidence is
  'Internal reference to written permission, license record, or rights-holder confirmation. Do not store sensitive personal information here.';
