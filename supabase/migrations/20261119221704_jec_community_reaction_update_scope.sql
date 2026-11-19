-- Keep reaction updates limited to the reaction_type column.
-- The client uses INSERT for a first reaction and UPDATE(reaction_type) to change it.
drop policy if exists "Members update their own community reaction" on public.jec_community_reactions;
create policy "Members update their own community reaction"
on public.jec_community_reactions
for update to authenticated
using (
  user_id=(select auth.uid())
  and (private.is_verified_jec_member() or private.is_jec_admin())
  and exists (
    select 1
    from public.jec_community_posts p
    where p.id=post_id and p.status='published'
  )
)
with check (
  user_id=(select auth.uid())
  and (private.is_verified_jec_member() or private.is_jec_admin())
  and exists (
    select 1
    from public.jec_community_posts p
    where p.id=post_id and p.status='published'
  )
);
