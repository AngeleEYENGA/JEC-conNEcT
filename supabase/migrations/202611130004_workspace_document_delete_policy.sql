-- Allow workspace document owners/managers to remove private files through Storage API.
-- Keep the bucket private and scope every deletion to the workspace folder.

drop policy if exists "Workspace members and managers delete private collaboration files" on storage.objects;
create policy "Workspace members and managers delete private collaboration files"
on storage.objects for delete
to authenticated
using (
  bucket_id='jec-workspace-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (
    (
      (storage.foldername(name))[2]=(select auth.uid())::text
      and private.is_jec_workspace_member(((storage.foldername(name))[1])::uuid)
    )
    or private.can_manage_jec_workspace(((storage.foldername(name))[1])::uuid)
  )
);
