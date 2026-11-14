-- Keep workspace conversations in sync with their workspace roster and
-- provide an owner-controlled way to add people to existing group chats.

create or replace function private.jec_add_conversation_members(
  target_conversation_id uuid,
  target_member_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_type text;
  target_workspace_id uuid;
  distinct_members uuid[];
  pending_members uuid[];
  member_id uuid;
  inserted_count integer := 0;
  row_count integer := 0;
  current_count integer := 0;
  target_status text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  if not private.can_manage_jec_conversation(target_conversation_id) then
    raise exception 'Only the conversation owner can add participants' using errcode='42501';
  end if;

  select c.conversation_type,c.workspace_id
  into target_type,target_workspace_id
  from public.jec_conversations c
  where c.id=target_conversation_id;

  if not found then
    raise exception 'Conversation not found' using errcode='P0002';
  end if;

  if target_type='direct' then
    raise exception 'A direct conversation is limited to two participants' using errcode='22023';
  end if;

  select coalesce(array_agg(distinct candidate order by candidate),array[]::uuid[])
  into distinct_members
  from unnest(coalesce(target_member_ids,array[]::uuid[])) as x(candidate)
  where candidate is not null;

  if cardinality(distinct_members)=0 then
    raise exception 'Select at least one participant' using errcode='22023';
  end if;

  if current_user_id=any(distinct_members) then
    raise exception 'You are already a participant in this conversation' using errcode='22023';
  end if;

  foreach member_id in array distinct_members loop
    if not private.is_jec_verified_or_admin(member_id) then
      raise exception 'Every participant must be a verified JEC member or administrator' using errcode='42501';
    end if;

    if target_type='workspace'
       and not private.is_jec_workspace_member(target_workspace_id,member_id) then
      raise exception 'Every participant in a workspace conversation must be an active member of that workspace' using errcode='42501';
    end if;
  end loop;

  select coalesce(array_agg(candidate),array[]::uuid[])
  into pending_members
  from unnest(distinct_members) as x(candidate)
  where not exists (
    select 1
    from public.jec_conversation_members cm
    where cm.conversation_id=target_conversation_id
      and cm.user_id=candidate
      and cm.membership_status in ('active','invited')
  );

  select count(*) into current_count
  from public.jec_conversation_members cm
  where cm.conversation_id=target_conversation_id
    and cm.membership_status in ('active','invited');

  if current_count + cardinality(pending_members) > 30 then
    raise exception 'A conversation cannot exceed 30 participants' using errcode='22023';
  end if;

  target_status := case when target_type='workspace' then 'active' else 'invited' end;

  foreach member_id in array distinct_members loop
    insert into public.jec_conversation_members(
      conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at
    )
    values(
      target_conversation_id,
      member_id,
      'member',
      target_status,
      current_user_id,
      case when target_status='active' then now() else null end
    )
    on conflict(conversation_id,user_id) do update
      set conversation_role='member',
          membership_status=excluded.membership_status,
          invited_by=current_user_id,
          joined_at=excluded.joined_at
      where public.jec_conversation_members.membership_status='left';

    get diagnostics row_count = row_count + row_count;
  end loop;

  -- Recount after the inserts. Existing active/invited members are left unchanged.
  select count(*)::integer into inserted_count
  from public.jec_conversation_members cm
  where cm.conversation_id=target_conversation_id
    and cm.user_id=any(distinct_members)
    and cm.membership_status=target_status
    and cm.invited_by=current_user_id;

  if cardinality(pending_members)=0 then
    raise exception 'All selected people are already participants' using errcode='22023';
  end if;

  update public.jec_conversations
  set updated_at=now()
  where id=target_conversation_id;

  return cardinality(pending_members);
end;
$$;
revoke all on function private.jec_add_conversation_members(uuid,uuid[]) from public,anon,authenticated;
grant execute on function private.jec_add_conversation_members(uuid,uuid[]) to authenticated;

create or replace function public.jec_add_conversation_members(
  target_conversation_id uuid,
  target_member_ids uuid[]
)
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.jec_add_conversation_members(target_conversation_id,target_member_ids);
$$;
revoke all on function public.jec_add_conversation_members(uuid,uuid[]) from public,anon;
grant execute on function public.jec_add_conversation_members(uuid,uuid[]) to authenticated;

create or replace function private.jec_add_conversation_members_by_email(
  target_conversation_id uuid,
  target_member_emails text[]
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  target_type text;
  normalized_emails text[];
  email_value text;
  target_user_id uuid;
  member_ids uuid[] := array[]::uuid[];
begin
  select c.conversation_type into target_type
  from public.jec_conversations c
  where c.id=target_conversation_id;

  if not found then
    raise exception 'Conversation not found' using errcode='P0002';
  end if;
  if target_type<>'group' then
    raise exception 'Email invitations are only available for group conversations' using errcode='22023';
  end if;
  if not private.can_manage_jec_conversation(target_conversation_id) then
    raise exception 'Only the conversation owner can add participants' using errcode='42501';
  end if;

  select coalesce(array_agg(distinct lower(trim(email_value))),array[]::text[])
  into normalized_emails
  from unnest(coalesce(target_member_emails,array[]::text[])) as x(email_value)
  where nullif(trim(email_value),'') is not null;

  if cardinality(normalized_emails)=0 or cardinality(normalized_emails)>20 then
    raise exception 'Enter between 1 and 20 email addresses' using errcode='22023';
  end if;

  foreach email_value in array normalized_emails loop
    if email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Invalid email address: %',email_value using errcode='22023';
    end if;

    select u.id into target_user_id
    from auth.users u
    where lower(u.email)=email_value
    limit 1;

    if target_user_id is null then
      raise exception 'No JEC-conNEcT account found for %',email_value using errcode='P0002';
    end if;

    member_ids:=array_append(member_ids,target_user_id);
  end loop;

  return private.jec_add_conversation_members(target_conversation_id,member_ids);
end;
$$;
revoke all on function private.jec_add_conversation_members_by_email(uuid,text[]) from public,anon,authenticated;
grant execute on function private.jec_add_conversation_members_by_email(uuid,text[]) to authenticated;

create or replace function public.jec_add_conversation_members_by_email(
  target_conversation_id uuid,
  target_member_emails text[]
)
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.jec_add_conversation_members_by_email(target_conversation_id,target_member_emails);
$$;
revoke all on function public.jec_add_conversation_members_by_email(uuid,text[]) from public,anon;
grant execute on function public.jec_add_conversation_members_by_email(uuid,text[]) to authenticated;

create or replace function private.sync_jec_workspace_conversation_membership()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
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
      c.id,
      new.user_id,
      'member',
      'active',
      c.created_by,
      now()
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
after insert or update of membership_status,workspace_id,user_id
on public.jec_workspace_members
for each row
execute function private.sync_jec_workspace_conversation_membership();

-- Backfill current active workspace members into workspace-wide conversations.
insert into public.jec_conversation_members(
  conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at
)
select
  c.id,
  wm.user_id,
  case when wm.user_id=c.created_by then 'owner' else 'member' end,
  'active',
  c.created_by,
  now()
from public.jec_conversations c
join public.jec_workspace_members wm
  on wm.workspace_id=c.workspace_id
 and wm.membership_status='active'
where c.conversation_type='workspace'
on conflict(conversation_id,user_id) do nothing;

comment on function public.jec_add_conversation_members(uuid,uuid[])
is 'Allows a conversation owner to add verified JEC members to a group or active workspace members to a workspace conversation. Workspace members are added active; group members receive invitations.';
comment on function public.jec_add_conversation_members_by_email(uuid,text[])
is 'Allows a group conversation owner to invite verified JEC members by account email.';
comment on function private.sync_jec_workspace_conversation_membership()
is 'Synchronizes workspace-wide conversation membership with active workspace roster entries.';
