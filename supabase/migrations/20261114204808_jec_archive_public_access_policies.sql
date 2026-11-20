-- Separate visitor reads from authenticated member reads.
-- The anon role intentionally has no execute permission on internal private-schema helpers.

drop policy if exists "JEC archive items readable by approved access scope" on public.jec_archive_items;

drop policy if exists "Anonymous visitors read approved public archive records" on public.jec_archive_items;
create policy "Anonymous visitors read approved public archive records"
on public.jec_archive_items for select to anon
using (status = 'approved' and visibility_scope = 'public');

drop policy if exists "Authenticated users read archive records in their scope" on public.jec_archive_items;
create policy "Authenticated users read archive records in their scope"
on public.jec_archive_items for select to authenticated
using (
  (
    status = 'approved'
    and (
      visibility_scope = 'public'
      or (visibility_scope = 'members' and private.is_jec_verified_or_admin((select auth.uid())))
      or (visibility_scope = 'workspace' and workspace_id is not null and private.is_jec_workspace_member(workspace_id))
    )
  )
  or (created_by = (select auth.uid()) and status in ('draft','review'))
  or private.is_jec_admin()
);

drop policy if exists "Archive files follow parent record visibility" on public.jec_archive_files;

drop policy if exists "Anonymous visitors read files attached to public archive records" on public.jec_archive_files;
create policy "Anonymous visitors read files attached to public archive records"
on public.jec_archive_files for select to anon
using (
  exists (
    select 1 from public.jec_archive_items item
    where item.id = archive_item_id
      and item.status = 'approved'
      and item.visibility_scope = 'public'
  )
);

drop policy if exists "Authenticated users read files in their archive scope" on public.jec_archive_files;
create policy "Authenticated users read files in their archive scope"
on public.jec_archive_files for select to authenticated
using (
  exists (
    select 1 from public.jec_archive_items item
    where item.id = archive_item_id
  )
);

drop policy if exists "JEC archive files readable through public record permissions" on storage.objects;
create policy "JEC archive files readable through public record permissions"
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

drop policy if exists "Authenticated users read archive files in their scope" on storage.objects;
create policy "Authenticated users read archive files in their scope"
on storage.objects for select to authenticated
using (
  bucket_id = 'jec-archives'
  and exists (
    select 1 from public.jec_archive_items item
    where item.id::text = (storage.foldername(name))[1]
  )
);

create index if not exists idx_jec_archive_items_approved_by
  on public.jec_archive_items (approved_by) where approved_by is not null;
