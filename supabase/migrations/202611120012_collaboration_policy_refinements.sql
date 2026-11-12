-- Collaboration security refinements.
-- Show only non-sensitive profile fields for users who share an active workspace.
drop policy if exists "Workspace teammates can view profile basics" on public.jec_profiles;
create policy "Workspace teammates can view profile basics"
on public.jec_profiles for select to authenticated
using (
  exists (
    select 1
    from public.jec_workspace_members mine
    join public.jec_workspace_members teammate
      on teammate.workspace_id=mine.workspace_id
    where mine.user_id=(select auth.uid())
      and mine.membership_status='active'
      and teammate.user_id=jec_profiles.user_id
      and teammate.membership_status='active'
  )
);

-- A workspace manager may not promote themselves/others to owner or demote an existing owner.
drop policy if exists "Workspace managers update roster" on public.jec_workspace_members;
create policy "Workspace managers update roster"
on public.jec_workspace_members for update to authenticated
using (
  private.is_jec_admin()
  or (
    private.can_manage_jec_workspace(workspace_id)
    and workspace_role <> 'owner'
  )
)
with check (
  (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
  and private.is_jec_verified_or_admin(user_id)
  and (workspace_role <> 'owner' or private.is_jec_admin())
);

-- Creators may edit/delete their collaboration content only while they remain in the workspace.
drop policy if exists "Authors and managers delete posts" on public.jec_workspace_posts;
create policy "Authors and managers delete posts"
on public.jec_workspace_posts for delete to authenticated
using (
  (author_id=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);

drop policy if exists "Task creator and managers delete tasks" on public.jec_workspace_tasks;
create policy "Task creator and managers delete tasks"
on public.jec_workspace_tasks for delete to authenticated
using (
  (created_by=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);

drop policy if exists "Document owners and managers delete documents" on public.jec_documents;
create policy "Document owners and managers delete documents"
on public.jec_documents for delete to authenticated
using (
  (uploaded_by=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);

drop policy if exists "Meeting creators and managers update meetings" on public.jec_meetings;
create policy "Meeting creators and managers update meetings"
on public.jec_meetings for update to authenticated
using (
  (created_by=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
)
with check (
  (created_by=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);
