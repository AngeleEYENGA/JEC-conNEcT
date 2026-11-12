-- JEC-conNEcT: user profiles, membership governance, institutional directory and public audio publishing.
-- Existing NaVigue project is not touched. Applies only to the dedicated JEC-conNEcT Supabase project.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.jec_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_profiles_first_name_length check (first_name is null or char_length(first_name) <= 100),
  constraint jec_profiles_last_name_length check (last_name is null or char_length(last_name) <= 100),
  constraint jec_profiles_display_name_length check (display_name is null or char_length(display_name) <= 160)
);

create table if not exists public.jec_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  membership_status text not null default 'pending'
    check (membership_status in ('pending','verified','rejected')),
  structure_name text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.jec_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  reason text
);
revoke all on private.jec_admins from public, anon, authenticated;

create or replace function private.is_jec_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.jec_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_jec_admin() from public, anon;
grant execute on function private.is_jec_admin() to authenticated;

create or replace function private.is_verified_jec_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_jec_admin()
    or exists (
      select 1
      from public.jec_memberships m
      where m.user_id = (select auth.uid())
        and m.membership_status = 'verified'
    );
$$;
revoke all on function private.is_verified_jec_member() from public, anon;
grant execute on function private.is_verified_jec_member() to authenticated;

-- Narrow, self-only capability check used by the client to show administrator actions.
create or replace function public.is_jec_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_jec_admin();
$$;
revoke all on function public.is_jec_admin() from public, anon;
grant execute on function public.is_jec_admin() to authenticated;

create or replace function private.handle_new_jec_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.jec_profiles (
    user_id, first_name, last_name, display_name, avatar_url
  )
  values (
    new.id,
    nullif(meta ->> 'given_name', ''),
    nullif(meta ->> 'family_name', ''),
    coalesce(nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', '')),
    nullif(meta ->> 'avatar_url', '')
  )
  on conflict (user_id) do nothing;

  insert into public.jec_memberships (user_id, membership_status)
  values (new.id, 'pending')
  on conflict (user_id) do nothing;

  return new;
end;
$$;
revoke all on function private.handle_new_jec_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_jec_connect on auth.users;
create trigger on_auth_user_created_jec_connect
after insert on auth.users
for each row execute procedure private.handle_new_jec_user();

-- Backfill accounts created before this migration, without granting membership or admin rights.
insert into public.jec_profiles (user_id, first_name, last_name, display_name, avatar_url)
select
  u.id,
  nullif(u.raw_user_meta_data ->> 'given_name', ''),
  nullif(u.raw_user_meta_data ->> 'family_name', ''),
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), nullif(u.raw_user_meta_data ->> 'name', '')),
  nullif(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
on conflict (user_id) do nothing;

insert into public.jec_memberships (user_id, membership_status)
select u.id, 'pending'
from auth.users u
on conflict (user_id) do nothing;

alter table public.jec_profiles enable row level security;
alter table public.jec_memberships enable row level security;

drop policy if exists "Users read their own JEC profile" on public.jec_profiles;
create policy "Users read their own JEC profile"
on public.jec_profiles for select to authenticated
using (user_id = (select auth.uid()) or private.is_jec_admin());

drop policy if exists "Users update their own JEC profile" on public.jec_profiles;
create policy "Users update their own JEC profile"
on public.jec_profiles for update to authenticated
using (user_id = (select auth.uid()) or private.is_jec_admin())
with check (user_id = (select auth.uid()) or private.is_jec_admin());

drop policy if exists "Users read their own membership status" on public.jec_memberships;
create policy "Users read their own membership status"
on public.jec_memberships for select to authenticated
using (user_id = (select auth.uid()) or private.is_jec_admin());

drop policy if exists "JEC administrators manage membership validation" on public.jec_memberships;
create policy "JEC administrators manage membership validation"
on public.jec_memberships for all to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

grant usage on schema public to anon, authenticated;
grant select on public.jec_profiles to authenticated;
grant update (first_name, last_name, display_name, avatar_url) on public.jec_profiles to authenticated;
grant select, insert, update, delete on public.jec_memberships to authenticated;

create table if not exists public.jec_directory_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('bureau_national','equipe_nationale','federation','equipe_locale','commission','service')),
  full_name text not null,
  role_title text not null,
  structure_name text,
  description text,
  functional_email text,
  visibility text not null default 'members'
    check (visibility in ('public','members')),
  sort_order integer not null default 100,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_directory_full_name_length check (char_length(full_name) between 2 and 160),
  constraint jec_directory_role_length check (char_length(role_title) between 2 and 160)
);

alter table public.jec_directory_entries enable row level security;

drop policy if exists "Public institutional directory entries are visible" on public.jec_directory_entries;
create policy "Public institutional directory entries are visible"
on public.jec_directory_entries for select to anon, authenticated
using (is_published = true and visibility = 'public');

drop policy if exists "Verified JEC members can view member directory entries" on public.jec_directory_entries;
create policy "Verified JEC members can view member directory entries"
on public.jec_directory_entries for select to authenticated
using (is_published = true and visibility = 'members' and private.is_verified_jec_member());

drop policy if exists "JEC administrators manage directory entries" on public.jec_directory_entries;
create policy "JEC administrators manage directory entries"
on public.jec_directory_entries for all to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

grant select on public.jec_directory_entries to anon, authenticated;
grant insert, update, delete on public.jec_directory_entries to authenticated;

-- Audio is stored privately by default. Published/official versions are copied to a separate public bucket.
alter table public.jec_song_audio
  add column if not exists bucket_id text not null default 'jec-audio',
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references auth.users(id) on delete set null;

alter table public.jec_song_audio
  drop constraint if exists jec_song_audio_bucket_id_check;
alter table public.jec_song_audio
  add constraint jec_song_audio_bucket_id_check
  check (bucket_id in ('jec-audio','jec-audio-public'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jec-audio-public',
  'jec-audio-public',
  true,
  26214400,
  array['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/ogg','audio/webm','audio/x-m4a']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Audio metadata visible to owner or public library" on public.jec_song_audio;
drop policy if exists "Authenticated members create private audio drafts" on public.jec_song_audio;
drop policy if exists "Owners update their audio drafts" on public.jec_song_audio;
drop policy if exists "Owners delete their audio drafts" on public.jec_song_audio;

create policy "Published JEC audio is publicly discoverable"
on public.jec_song_audio for select to anon, authenticated
using (is_published = true and bucket_id = 'jec-audio-public');

create policy "Owners and administrators read private JEC audio drafts"
on public.jec_song_audio for select to authenticated
using (
  (bucket_id = 'jec-audio' and is_published = false and uploaded_by = (select auth.uid()))
  or private.is_jec_admin()
);

create policy "Members upload only their own private audio drafts"
on public.jec_song_audio for insert to authenticated
with check (
  bucket_id = 'jec-audio'
  and uploaded_by = (select auth.uid())
  and is_published = false
);

create policy "Owners update only their own private audio drafts"
on public.jec_song_audio for update to authenticated
using (
  bucket_id = 'jec-audio'
  and uploaded_by = (select auth.uid())
  and is_published = false
)
with check (
  bucket_id = 'jec-audio'
  and uploaded_by = (select auth.uid())
  and is_published = false
);

create policy "JEC administrators can update audio publication records"
on public.jec_song_audio for update to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

create policy "Owners delete only their own private audio drafts"
on public.jec_song_audio for delete to authenticated
using (
  bucket_id = 'jec-audio'
  and uploaded_by = (select auth.uid())
  and is_published = false
);

create policy "JEC administrators can delete audio records"
on public.jec_song_audio for delete to authenticated
using (private.is_jec_admin());

grant select on public.jec_song_audio to anon, authenticated;
grant insert, update, delete on public.jec_song_audio to authenticated;

-- Replace the earlier object policies with explicit private-owner and public-publisher rules.
drop policy if exists "Members upload audio into their own folder" on storage.objects;
drop policy if exists "Members read own or published audio" on storage.objects;
drop policy if exists "Members update own audio objects" on storage.objects;
drop policy if exists "Members delete own audio objects" on storage.objects;

create policy "Members upload audio into their own private folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Members and administrators read private audio"
on storage.objects for select to authenticated
using (
  bucket_id = 'jec-audio'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_jec_admin()
  )
);

create policy "Members update only their own private audio"
on storage.objects for update to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Members delete only their own private audio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "JEC administrators publish audio files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'jec-audio-public'
  and private.is_jec_admin()
);

create policy "JEC administrators replace published audio files"
on storage.objects for update to authenticated
using (
  bucket_id = 'jec-audio-public'
  and private.is_jec_admin()
)
with check (
  bucket_id = 'jec-audio-public'
  and private.is_jec_admin()
);

create policy "JEC administrators remove published audio files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'jec-audio-public'
  and private.is_jec_admin()
);

create index if not exists idx_jec_directory_published_scope_sort
  on public.jec_directory_entries (is_published, visibility, sort_order);

create index if not exists idx_jec_memberships_status
  on public.jec_memberships (membership_status);

create index if not exists idx_jec_song_audio_public_lookup
  on public.jec_song_audio (song_id, language, published_at desc)
  where is_published = true and bucket_id = 'jec-audio-public';

comment on table public.jec_profiles is
  'Private account profile fields. User-editable names only; membership and administration are stored separately.';
comment on table public.jec_memberships is
  'JEC membership validation state. New accounts start pending and cannot self-verify.';
comment on table public.jec_directory_entries is
  'Validated institutional directory and organization chart. No member names are seeded automatically.';
comment on table private.jec_admins is
  'Protected allow-list of JEC-conNEcT administrators. Bootstrap the first administrator manually after validating their Auth email.';
