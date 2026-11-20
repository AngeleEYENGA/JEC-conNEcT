-- JEC-conNEcT: digital heritage archive
-- Submitted material remains private and pending until an administrator approves it.
-- Public file access is granted only for approved public records; rights are checked before publication.

create table if not exists public.jec_archive_items (
  id uuid primary key default gen_random_uuid(),
  collection_key text not null check (collection_key in (
    'history','events','publications','photos','audio','video','testimonies','posters','meeting_records','other'
  )),
  item_type text not null check (item_type in (
    'document','photograph','audio_recording','video_recording','poster','newsletter','booklet','testimony','meeting_record','web_resource','other'
  )),
  title text not null check (char_length(trim(title)) between 3 and 220),
  subtitle text,
  description text,
  event_name text,
  event_date_start date,
  event_date_end date,
  record_date date,
  publisher_name text,
  structure_name text,
  country text,
  region text,
  language text not null default 'fr' check (language in ('fr','en','multi','und')),
  tags text[] not null default '{}'::text[],
  source_label text,
  source_reference text,
  source_url text,
  rights_status text not null default 'not_checked' check (rights_status in (
    'not_checked','permission_granted','public_domain','restricted','refused','unknown'
  )),
  rights_holder text,
  rights_notes text,
  visibility_scope text not null default 'members' check (visibility_scope in ('public','members','workspace')),
  workspace_id uuid references public.jec_workspaces(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','review','approved','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_archive_workspace_scope_check
    check ((visibility_scope = 'workspace' and workspace_id is not null) or (visibility_scope <> 'workspace' and workspace_id is null)),
  constraint jec_archive_publication_rights_check
    check (status <> 'approved' or visibility_scope <> 'public' or rights_status in ('permission_granted','public_domain')),
  constraint jec_archive_event_dates_check
    check (event_date_end is null or event_date_start is null or event_date_end >= event_date_start),
  constraint jec_archive_approval_metadata_check
    check ((status = 'approved' and approved_at is not null and approved_by is not null) or status <> 'approved')
);

create table if not exists public.jec_archive_files (
  id uuid primary key default gen_random_uuid(),
  archive_item_id uuid not null references public.jec_archive_items(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text,
  file_size bigint check (file_size is null or file_size between 1 and 52428800),
  description text,
  sort_order integer not null default 100,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_jec_archive_items_status_scope
  on public.jec_archive_items (status, visibility_scope, collection_key, event_date_start desc);
create index if not exists idx_jec_archive_items_workspace
  on public.jec_archive_items (workspace_id) where workspace_id is not null;
create index if not exists idx_jec_archive_items_tags
  on public.jec_archive_items using gin (tags);
create index if not exists idx_jec_archive_items_created_by
  on public.jec_archive_items (created_by, created_at desc);
create index if not exists idx_jec_archive_items_approved_by
  on public.jec_archive_items (approved_by) where approved_by is not null;
create index if not exists idx_jec_archive_files_item
  on public.jec_archive_files (archive_item_id, sort_order, created_at);

alter table public.jec_archive_items enable row level security;
alter table public.jec_archive_files enable row level security;

drop policy if exists "JEC archive items readable by approved access scope" on public.jec_archive_items;
create policy "JEC archive items readable by approved access scope"
on public.jec_archive_items for select to anon, authenticated
using (
  (
    status = 'approved'
    and (
      visibility_scope = 'public'
      or (visibility_scope = 'members' and private.is_jec_verified_or_admin((select auth.uid())))
      or (visibility_scope = 'workspace' and workspace_id is not null and private.is_jec_workspace_member(workspace_id))
    )
  )
  or ((select auth.uid()) is not null and created_by = (select auth.uid()) and status in ('draft','review'))
  or ((select auth.uid()) is not null and private.is_jec_admin())
);

drop policy if exists "Verified JEC members submit archive drafts" on public.jec_archive_items;
create policy "Verified JEC members submit archive drafts"
on public.jec_archive_items for insert to authenticated
with check (
  created_by = (select auth.uid())
  and status in ('draft','review')
  and approved_by is null
  and approved_at is null
  and private.is_jec_verified_or_admin((select auth.uid()))
  and (
    visibility_scope <> 'workspace'
    or (workspace_id is not null and private.is_jec_workspace_member(workspace_id))
  )
);

drop policy if exists "Archive contributors edit their pending submissions" on public.jec_archive_items;
create policy "Archive contributors edit their pending submissions"
on public.jec_archive_items for update to authenticated
using (
  created_by = (select auth.uid())
  and status in ('draft','review')
  and private.is_jec_verified_or_admin((select auth.uid()))
)
with check (
  created_by = (select auth.uid())
  and status in ('draft','review')
  and approved_by is null
  and approved_at is null
  and private.is_jec_verified_or_admin((select auth.uid()))
  and (
    visibility_scope <> 'workspace'
    or (workspace_id is not null and private.is_jec_workspace_member(workspace_id))
  )
);

drop policy if exists "Archive contributors withdraw their pending submissions" on public.jec_archive_items;
create policy "Archive contributors withdraw their pending submissions"
on public.jec_archive_items for delete to authenticated
using (
  created_by = (select auth.uid())
  and status in ('draft','review')
  and private.is_jec_verified_or_admin((select auth.uid()))
);

drop policy if exists "JEC administrators manage archive records" on public.jec_archive_items;
create policy "JEC administrators manage archive records"
on public.jec_archive_items for all to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

drop policy if exists "Archive files follow parent record visibility" on public.jec_archive_files;
create policy "Archive files follow parent record visibility"
on public.jec_archive_files for select to anon, authenticated
using (
  exists (
    select 1 from public.jec_archive_items item
    where item.id = archive_item_id
  )
);

drop policy if exists "Contributors attach files to pending archive records" on public.jec_archive_files;
create policy "Contributors attach files to pending archive records"
on public.jec_archive_files for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.jec_archive_items item
    where item.id = archive_item_id
      and item.created_by = (select auth.uid())
      and item.status in ('draft','review')
  )
);

drop policy if exists "Contributors remove files from pending archive records" on public.jec_archive_files;
create policy "Contributors remove files from pending archive records"
on public.jec_archive_files for delete to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.jec_archive_items item
    where item.id = archive_item_id
      and item.created_by = (select auth.uid())
      and item.status in ('draft','review')
  )
);

drop policy if exists "JEC administrators manage archive file metadata" on public.jec_archive_files;
create policy "JEC administrators manage archive file metadata"
on public.jec_archive_files for all to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

grant select on public.jec_archive_items, public.jec_archive_files to anon, authenticated;
grant insert, update, delete on public.jec_archive_items, public.jec_archive_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jec-archives',
  'jec-archives',
  false,
  52428800,
  array[
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','image/jpeg','image/png','image/webp','image/gif',
    'audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/ogg',
    'video/mp4','video/webm'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "JEC archive files readable through archive record permissions" on storage.objects;
create policy "JEC archive files readable through archive record permissions"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'jec-archives'
  and exists (
    select 1 from public.jec_archive_items item
    where item.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Contributors upload files to their pending archive records" on storage.objects;
create policy "Contributors upload files to their pending archive records"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'jec-archives'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.jec_archive_items item
    where item.id::text = (storage.foldername(name))[1]
      and item.created_by = (select auth.uid())
      and item.status in ('draft','review')
  )
);

drop policy if exists "Contributors delete files from their pending archive records" on storage.objects;
create policy "Contributors delete files from their pending archive records"
on storage.objects for delete to authenticated
using (
  bucket_id = 'jec-archives'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.jec_archive_items item
    where item.id::text = (storage.foldername(name))[1]
      and item.created_by = (select auth.uid())
      and item.status in ('draft','review')
  )
);

drop policy if exists "JEC administrators manage archive storage" on storage.objects;
create policy "JEC administrators manage archive storage"
on storage.objects for all to authenticated
using (bucket_id = 'jec-archives' and private.is_jec_admin())
with check (bucket_id = 'jec-archives' and private.is_jec_admin());

comment on table public.jec_archive_items is
  'JEC-conNEcT digital heritage catalogue. Publication is controlled by JEC administrators; provenance and reuse rights are recorded explicitly.';
comment on table public.jec_archive_files is
  'Private Supabase Storage file metadata for digital archive records. File access follows the parent archive item RLS policy.';
