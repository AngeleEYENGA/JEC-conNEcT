-- JEC music library: a saved recording is a public, downloadable library item.
-- The requester explicitly asked that anyone can access the saved anthem/rally audio.
-- Keep uploads authenticated and scoped to the uploader's own Storage folder.

update storage.buckets
set public = true
where id = 'jec-audio';

-- Existing audio files already uploaded by the designated project administrator
-- become public library items without moving or deleting the underlying objects.
update public.jec_song_audio
set is_published = true,
    bucket_id = 'jec-audio',
    published_at = coalesce(published_at, now()),
    published_by = coalesce(published_by, uploaded_by)
where bucket_id = 'jec-audio'
  and is_published = false;

-- Public metadata discovery: the anon role can retrieve only explicitly published items
-- from the JEC library bucket.
drop policy if exists "Published JEC audio is publicly discoverable" on public.jec_song_audio;
drop policy if exists "Owners and administrators read private JEC audio drafts" on public.jec_song_audio;
create policy "Anyone can discover published JEC music"
on public.jec_song_audio for select
to anon, authenticated
using (bucket_id = 'jec-audio' and is_published = true);

-- New recordings are published as soon as an authenticated user saves them.
drop policy if exists "Members upload only their own private audio drafts" on public.jec_song_audio;
drop policy if exists "Authenticated members publish audio to shared JEC library" on public.jec_song_audio;
create policy "Authenticated members publish audio to shared JEC library"
on public.jec_song_audio for insert
to authenticated
with check (
  bucket_id = 'jec-audio'
  and is_published = true
  and uploaded_by = (select auth.uid())
  and published_by = (select auth.uid())
  and published_at is not null
);

-- Owners may replace metadata for their own public recording, e.g. when uploading a new take.
drop policy if exists "Owners update only their own private audio drafts" on public.jec_song_audio;
drop policy if exists "Owners update their own published JEC recordings" on public.jec_song_audio;
create policy "Owners update their own published JEC recordings"
on public.jec_song_audio for update
to authenticated
using (
  bucket_id = 'jec-audio'
  and is_published = true
  and uploaded_by = (select auth.uid())
)
with check (
  bucket_id = 'jec-audio'
  and is_published = true
  and uploaded_by = (select auth.uid())
  and published_by = (select auth.uid())
  and published_at is not null
);

-- Owners may remove their own public recordings; administrators retain oversight.
drop policy if exists "Owners delete only their own private audio drafts" on public.jec_song_audio;
drop policy if exists "Owners delete their own published JEC recordings" on public.jec_song_audio;
create policy "Owners delete their own published JEC recordings"
on public.jec_song_audio for delete
to authenticated
using (
  bucket_id = 'jec-audio'
  and is_published = true
  and uploaded_by = (select auth.uid())
);

-- The public bucket bypasses object SELECT policies for reads/downloads.
-- Upload, replacement and deletion remain authenticated and scoped by the user's folder.
drop policy if exists "Members upload audio into their own private folder" on storage.objects;
drop policy if exists "Members upload audio into their own JEC library folder" on storage.objects;
create policy "Members upload audio into their own JEC library folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Members and administrators read private audio" on storage.objects;

drop policy if exists "Members update only their own private audio" on storage.objects;
drop policy if exists "Members update their own JEC library recordings" on storage.objects;
create policy "Members update their own JEC library recordings"
on storage.objects for update
to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Members delete only their own private audio" on storage.objects;
drop policy if exists "Members delete their own JEC library recordings" on storage.objects;
create policy "Members delete their own JEC library recordings"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

comment on table public.jec_song_audio is
  'JEC-conNEcT shared music library. A saved audio record is publicly playable/downloadable; publishing rights and source authorization must be confirmed before upload.';
