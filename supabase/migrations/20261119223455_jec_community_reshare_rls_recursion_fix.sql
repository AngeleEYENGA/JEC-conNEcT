-- Avoid recursive RLS evaluation when a member reshares an existing post.
-- The private SECURITY DEFINER helper reads the source post without re-entering
-- the community_posts INSERT policy. It still checks the caller identity and role.
create or replace function private.jec_can_reshare_community_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select
    (select auth.uid()) is not null
    and (private.is_verified_jec_member() or private.is_jec_admin())
    and exists (
      select 1
      from public.jec_community_posts original
      where original.id=target_post_id
        and original.status='published'
        and original.shared_post_id is null
    );
$$;

revoke all on function private.jec_can_reshare_community_post(uuid) from public,anon;
grant execute on function private.jec_can_reshare_community_post(uuid) to authenticated;

drop policy if exists "Verified members create community posts" on public.jec_community_posts;
create policy "Verified members create community posts"
on public.jec_community_posts
for insert to authenticated
with check (
  author_id=(select auth.uid())
  and status='published'
  and (private.is_verified_jec_member() or private.is_jec_admin())
  and (
    shared_post_id is null
    or private.jec_can_reshare_community_post(shared_post_id)
  )
);
