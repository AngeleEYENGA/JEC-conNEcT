-- Messaging privacy: platform administrators are not automatically participants
-- in users' direct and group conversations. Only active conversation members can read.
create or replace function private.can_manage_jec_conversation(
  target_conversation_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.jec_conversation_members cm
    where cm.conversation_id=target_conversation_id
      and cm.user_id=coalesce(target_user_id,(select auth.uid()))
      and cm.membership_status='active'
      and cm.conversation_role='owner'
  );
$$;
revoke all on function private.can_manage_jec_conversation(uuid,uuid) from public,anon;
grant execute on function private.can_manage_jec_conversation(uuid,uuid) to authenticated;

drop policy if exists "Participants read their conversations" on public.jec_conversations;
create policy "Participants read their conversations"
on public.jec_conversations for select to authenticated
using (
  exists (
    select 1 from public.jec_conversation_members cm
    where cm.conversation_id=id
      and cm.user_id=(select auth.uid())
      and cm.membership_status in ('active','invited')
  )
);

drop policy if exists "Participants read conversation roster" on public.jec_conversation_members;
create policy "Participants read conversation roster"
on public.jec_conversation_members for select to authenticated
using (
  user_id=(select auth.uid())
  or private.is_jec_conversation_member(conversation_id)
);

drop policy if exists "Participants read messages" on public.jec_messages;
create policy "Participants read messages"
on public.jec_messages for select to authenticated
using (private.is_jec_conversation_member(conversation_id));

drop policy if exists "Active participants send messages" on public.jec_messages;
create policy "Active participants send messages"
on public.jec_messages for insert to authenticated
with check (
  sender_id=(select auth.uid())
  and private.is_jec_conversation_member(conversation_id)
);

drop policy if exists "Authors and conversation owners delete messages" on public.jec_messages;
create policy "Authors and conversation owners delete messages"
on public.jec_messages for delete to authenticated
using (
  (sender_id=(select auth.uid()) and private.is_jec_conversation_member(conversation_id))
  or private.can_manage_jec_conversation(conversation_id)
);
