-- JEC-conNEcT Collaboration: least-privilege grants and controlled conversation creation.
-- All collaboration content is private and workspace-scoped. No public/anon access.

revoke all on table
  public.jec_workspaces,
  public.jec_workspace_members,
  public.jec_workspace_posts,
  public.jec_projects,
  public.jec_workspace_tasks,
  public.jec_meetings,
  public.jec_meeting_participants,
  public.jec_documents,
  public.jec_conversations,
  public.jec_conversation_members,
  public.jec_messages
from anon;

grant select, insert, update, delete on table
  public.jec_workspaces,
  public.jec_workspace_members,
  public.jec_workspace_posts,
  public.jec_projects,
  public.jec_workspace_tasks,
  public.jec_meetings,
  public.jec_meeting_participants,
  public.jec_documents,
  public.jec_conversations,
  public.jec_conversation_members,
  public.jec_messages
to authenticated;

-- Conversation creation is performed atomically by a private privileged helper.
-- Each invited account must be verified or an explicitly designated admin.
create or replace function private.jec_create_conversation(
  target_type text,
  target_title text,
  target_workspace_id uuid,
  target_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_conversation_id uuid;
  member_id uuid;
  distinct_members uuid[];
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not private.is_jec_verified_or_admin(current_user_id) then
    raise exception 'Verified JEC membership required' using errcode = '42501';
  end if;

  if target_type not in ('direct','group','workspace') then
    raise exception 'Invalid conversation type' using errcode = '22023';
  end if;

  if target_type = 'workspace' then
    if target_workspace_id is null
      or not private.is_jec_workspace_member(target_workspace_id,current_user_id) then
      raise exception 'Active workspace membership required' using errcode = '42501';
    end if;
  elsif target_workspace_id is not null then
    raise exception 'Only workspace conversations may reference a workspace' using errcode = '22023';
  end if;

  select array_agg(distinct candidate order by candidate)
  into distinct_members
  from unnest(coalesce(target_member_ids,array[]::uuid[]) || array[current_user_id]) as x(candidate);

  if coalesce(array_length(distinct_members,1),0) < 2 then
    raise exception 'A conversation requires at least two participants' using errcode = '22023';
  end if;

  if array_length(distinct_members,1) > 20 then
    raise exception 'A conversation cannot exceed 20 participants' using errcode = '22023';
  end if;

  if target_type = 'direct' and array_length(distinct_members,1) <> 2 then
    raise exception 'A direct conversation must have exactly two participants' using errcode = '22023';
  end if;

  foreach member_id in array distinct_members loop
    if not private.is_jec_verified_or_admin(member_id) then
      raise exception 'Every participant must be a verified JEC member or administrator' using errcode = '42501';
    end if;
    if target_type = 'workspace'
      and not private.is_jec_workspace_member(target_workspace_id,member_id) then
      raise exception 'Every participant must belong to the selected workspace' using errcode = '42501';
    end if;
  end loop;

  insert into public.jec_conversations(
    conversation_type,title,workspace_id,created_by
  )
  values (
    target_type,
    nullif(trim(coalesce(target_title,'')),''),
    target_workspace_id,
    current_user_id
  )
  returning id into new_conversation_id;

  insert into public.jec_conversation_members(
    conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at
  )
  select
    new_conversation_id,
    member_id,
    case when member_id=current_user_id then 'owner' else 'member' end,
    case when member_id=current_user_id then 'active' else 'invited' end,
    current_user_id,
    case when member_id=current_user_id then now() else null end
  from unnest(distinct_members) as x(member_id);

  return new_conversation_id;
end;
$$;

revoke all on function private.jec_create_conversation(text,text,uuid,uuid[]) from public,anon;
grant execute on function private.jec_create_conversation(text,text,uuid,uuid[]) to authenticated;

create or replace function public.jec_create_conversation(
  target_type text,
  target_title text,
  target_workspace_id uuid,
  target_member_ids uuid[]
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.jec_create_conversation(
    target_type,target_title,target_workspace_id,target_member_ids
  );
$$;
revoke all on function public.jec_create_conversation(text,text,uuid,uuid[]) from public,anon;
grant execute on function public.jec_create_conversation(text,text,uuid,uuid[]) to authenticated;

create or replace function private.jec_accept_conversation_invitation(
  target_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.jec_conversation_members
  set membership_status='active',joined_at=now()
  where conversation_id=target_conversation_id
    and user_id=(select auth.uid())
    and membership_status='invited';

  if not found then
    raise exception 'No pending conversation invitation found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function private.jec_accept_conversation_invitation(uuid) from public,anon;
grant execute on function private.jec_accept_conversation_invitation(uuid) to authenticated;

create or replace function public.jec_accept_conversation_invitation(
  target_conversation_id uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.jec_accept_conversation_invitation(target_conversation_id);
$$;
revoke all on function public.jec_accept_conversation_invitation(uuid) from public,anon;
grant execute on function public.jec_accept_conversation_invitation(uuid) to authenticated;

create index if not exists idx_jec_workspace_members_user_status
  on public.jec_workspace_members(user_id,membership_status);

create index if not exists idx_jec_messages_conversation_created
  on public.jec_messages(conversation_id,created_at);

create index if not exists idx_jec_meetings_workspace_start
  on public.jec_meetings(workspace_id,starts_at);

create index if not exists idx_jec_documents_workspace_created
  on public.jec_documents(workspace_id,created_at desc);

comment on function public.jec_create_conversation(text,text,uuid,uuid[]) is
  'Creates a private direct, group or workspace conversation and its owner/invitation roster after validating all participants.';
comment on function public.jec_accept_conversation_invitation(uuid) is
  'Allows an invited user to accept their own private conversation invitation.';
