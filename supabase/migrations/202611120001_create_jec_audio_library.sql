-- JEC-conNEcT — private audio library
-- Apply through Supabase SQL Editor after reviewing the policies with the project administrator.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jec-audio',
  'jec-audio',
  false,
  26214400,
  array['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/ogg','audio/webm','audio/x-m4a']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.jec_song_audio (
  id uuid primary key default gen_random_uuid(),
  song_id text not null check (song_id in ('rally','anthem')),
  language text not null check (language in ('fr','en')),
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.jec_song_audio enable row level security;

drop policy if exists "Audio metadata visible to owner or public library" on public.jec_song_audio;
create policy "Audio metadata visible to owner or public library"
on public.jec_song_audio for select to authenticated
using (is_published = true or uploaded_by = auth.uid());

drop policy if exists "Authenticated members create private audio drafts" on public.jec_song_audio;
create policy "Authenticated members create private audio drafts"
on public.jec_song_audio for insert to authenticated
with check (uploaded_by = auth.uid() and is_published = false);

drop policy if exists "Owners update their audio drafts" on public.jec_song_audio;
create policy "Owners update their audio drafts"
on public.jec_song_audio for update to authenticated
using (uploaded_by = auth.uid() and is_published = false)
with check (uploaded_by = auth.uid() and is_published = false);

drop policy if exists "Owners delete their audio drafts" on public.jec_song_audio;
create policy "Owners delete their audio drafts"
on public.jec_song_audio for delete to authenticated
using (uploaded_by = auth.uid() and is_published = false);

drop policy if exists "Members upload audio into their own folder" on storage.objects;
create policy "Members upload audio into their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members read own or published audio" on storage.objects;
create policy "Members read own or published audio"
on storage.objects for select to authenticated
using (
  bucket_id = 'jec-audio'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.jec_song_audio a
      where a.storage_path = name and a.is_published = true
    )
  )
);

drop policy if exists "Members update own audio objects" on storage.objects;
create policy "Members update own audio objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members delete own audio objects" on storage.objects;
create policy "Members delete own audio objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Publishing an official audio version is an administrative action.
-- Do not expose is_published updates to ordinary members.
