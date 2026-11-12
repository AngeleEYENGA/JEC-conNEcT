-- Permit an authenticated uploader to read their own Storage object metadata.
-- Storage upsert requires SELECT + INSERT + UPDATE; public downloads already work through the public bucket.
drop policy if exists "Members read own JEC library objects for replacement" on storage.objects;
create policy "Members read own JEC library objects for replacement"
on storage.objects for select
to authenticated
using (
  bucket_id = 'jec-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
