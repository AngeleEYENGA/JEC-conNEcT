-- Remove workspace-wide conversation access when a workspace roster entry is deleted.
create or replace function private.sync_jec_workspace_conversation_membership()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='DELETE' then
    update public.jec_conversation_members cm
    set membership_status='left'
    from public.jec_conversations c
    where c.id=cm.conversation_id
      and c.conversation_type='workspace'
      and c.workspace_id=old.workspace_id
      and cm.user_id=old.user_id
      and cm.membership_status in ('active','invited');
    return old;
  end if;

  if tg_op='UPDATE'
     and (old.workspace_id is distinct from new.workspace_id
       or old.user_id is distinct from new.user_id
       or new.membership_status<>'active') then
    update public.jec_conversation_members cm
    set membership_status='left'
    from public.jec_conversations c
    where c.id=cm.conversation_id
      and c.conversation_type='workspace'
      and c.workspace_id=old.workspace_id
      and cm.user_id=old.user_id
      and cm.membership_status in ('active','invited');
  end if;

  if new.membership_status='active' then
    insert into public.jec_conversation_members(
      conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at
    )
    select
      c.id,new.user_id,'member','active',c.created_by,now()
    from public.jec_conversations c
    where c.conversation_type='workspace'
      and c.workspace_id=new.workspace_id
    on conflict(conversation_id,user_id) do update
      set membership_status='active',
          invited_by=excluded.invited_by,
          joined_at=coalesce(public.jec_conversation_members.joined_at,now())
      where public.jec_conversation_members.membership_status<>'active';
  else
    update public.jec_conversation_members cm
    set membership_status='left'
    from public.jec_conversations c
    where c.id=cm.conversation_id
      and c.conversation_type='workspace'
      and c.workspace_id=new.workspace_id
      and cm.user_id=new.user_id
      and cm.membership_status in ('active','invited');
  end if;

  return new;
end;
$$;
revoke all on function private.sync_jec_workspace_conversation_membership() from public,anon,authenticated;

drop trigger if exists jec_sync_workspace_conversation_membership on public.jec_workspace_members;
create trigger jec_sync_workspace_conversation_membership
after insert or update of membership_status,workspace_id,user_id or delete
on public.jec_workspace_members
for each row
execute function private.sync_jec_workspace_conversation_membership();
