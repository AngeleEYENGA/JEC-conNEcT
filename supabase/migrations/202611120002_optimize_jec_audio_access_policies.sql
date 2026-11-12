-- JEC-conNEcT — optimize private audio access policies.
-- Keep metadata and objects private to the uploader until an administrator publishes the audio.

create index if not exists idx_jec_song_audio_uploaded_by on public.jec_song_audio (uploaded_by);

drop policy if exists "Audio metadata visible to owner or public library" on public.jec_song_audio;
create policy "Audio metadata visible to owner or public library" on public.jec_song_audio for select to authenticated
using (is_published = true or uploaded_by = (select auth.uid()));

drop policy if exists "Authenticated members create private audio drafts" on public.jec_song_audio;
create policy "Authenticated members create private audio drafts" on public.jec_song_audio for insert to authenticated
with check (uploaded_by = (select auth.uid()) and is_published = false);

drop policy if exists "Owners update their audio drafts" on public.jec_song_audio;
create policy "Owners update their audio drafts" on public.jec_song_audio for update to authenticated
using (uploaded_by = (select auth.uid()) and is_published = false)
with check (uploaded_by = (select auth.uid()) and is_published = false);

drop policy if exists "Owners delete their audio drafts" on public.jec_song_audio;
create policy "Owners delete their audio drafts" on public.jec_song_audio for delete to authenticated
using (uploaded_by = (select auth.uid()) and is_published = false);

drop policy if exists "Members upload audio into their own folder" on storage.objects;
create policy "Members upload audio into their own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'jec-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Members read own or published audio" on storage.objects;
create policy "Members read own or published audio" on storage.objects for select to authenticated
using (bucket_id = 'jec-audio' and ((storage.foldername(name))[1] = (select auth.uid())::text or exists (
  select 1 from public.jec_song_audio a where a.storage_path = name and a.is_published = true
)));

drop policy if exists "Members update own audio objects" on storage.objects;
create policy "Members update own audio objects" on storage.objects for update to authenticated
using (bucket_id = 'jec-audio' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'jec-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Members delete own audio objects" on storage.objects;
create policy "Members delete own audio objects" on storage.objects for delete to authenticated
using (bucket_id = 'jec-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);