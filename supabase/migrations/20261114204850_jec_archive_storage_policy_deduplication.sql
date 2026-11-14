drop policy if exists "JEC archive files readable through archive record permissions" on storage.objects;
drop policy if exists "JEC archive files readable through public record permissions" on storage.objects;

drop policy if exists "Anonymous visitors read public archive file objects" on storage.objects;
create policy "Anonymous visitors read public archive file objects"
on storage.objects for select to anon
using (
  bucket_id = 'jec-archives'
  and exists (
    select 1 from public.jec_archive_items item
    where item.id::text = (storage.foldername(name))[1]
      and item.status = 'approved'
      and item.visibility_scope = 'public'
  )
);
