-- JEC-conNEcT private messaging creation.
-- Supports direct, group and whole-workspace conversations from verified JEC accounts.
-- Email lookup is restricted to a private SECURITY DEFINER helper.

create or replace function private.jec_create_conversation(
  target_type text,
  target_title text,
  target_workspace_id uuid,
  target_member_emails text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_conversation_id uuid;
  normalized_emails text[];
  email_value text;
  target_user_id uuid;
  invited_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if not private.is_jec_verified_or_admin(current_user_id) then
    raise exception 'Verified JEC membership required' using errcode='42501';
  end if;
  if target_type not in ('direct','group','workspace') then
    raise exception 'Invalid conversation type' using errcode='22023';
  end if;

  select coalesce(array_agg(distinct lower(trim(e))),array[]::text[])
  into normalized_emails
  from unnest(coalesce(target_member_emails,array[]::text[])) as x(e)
  where nullif(trim(e),'') is not null;

  if target_type='workspace' then
    if target_workspace_id is null then
      raise exception 'Workspace is required' using errcode='22023';
    end if;
    if cardinality(normalized_emails)>0 then
      raise exception 'Do not provide emails for a workspace conversation' using errcode='22023';
    end if;
    if not (private.is_jec_admin() or private.is_jec_workspace_member(target_workspace_id)) then
      raise exception 'Active workspace membership required' using errcode='42501';
    end if;

    insert into public.jec_conversations(conversation_type,title,workspace_id,created_by)
    values(
      'workspace',
      coalesce(nullif(trim(coalesce(target_title,'')),''),(select w.name from public.jec_workspaces w where w.id=target_workspace_id)),
      target_workspace_id,
      current_user_id
    )
    returning id into new_conversation_id;

    insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at)
    values(new_conversation_id,current_user_id,'owner','active',current_user_id,now());

    insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at)
    select new_conversation_id,wm.user_id,'member','active',current_user_id,now()
    from public.jec_workspace_members wm
    where wm.workspace_id=target_workspace_id
      and wm.membership_status='active'
      and wm.user_id<>current_user_id
    on conflict(conversation_id,user_id) do nothing;

    return new_conversation_id;
  end if;

  if target_workspace_id is not null then
    raise exception 'Direct and group conversations cannot reference a workspace' using errcode='22023';
  end if;
  if target_type='direct' and cardinality(normalized_emails)<>1 then
    raise exception 'A direct conversation requires exactly one other participant' using errcode='22023';
  end if;
  if target_type='group' and (cardinality(normalized_emails)<1 or cardinality(normalized_emails)>19) then
    raise exception 'A group conversation requires between one and nineteen other participants' using errcode='22023';
  end if;

  insert into public.jec_conversations(conversation_type,title,workspace_id,created_by)
  values(target_type,nullif(trim(coalesce(target_title,'')),''),null,current_user_id)
  returning id into new_conversation_id;

  insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at)
  values(new_conversation_id,current_user_id,'owner','active',current_user_id,now());

  foreach email_value in array normalized_emails loop
    if email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Invalid participant email address: %',email_value using errcode='22023';
    end if;

    select u.id into target_user_id
    from auth.users u
    where lower(u.email)=email_value
    limit 1;

    if target_user_id is null then
      raise exception 'No JEC-conNEcT account found for %',email_value using errcode='P0002';
    end if;
    if target_user_id=current_user_id then
      raise exception 'You cannot invite yourself' using errcode='22023';
    end if;
    if not private.is_jec_verified_or_admin(target_user_id) then
      raise exception 'Participant % is not a verified JEC member',email_value using errcode='42501';
    end if;

    insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,invited_by)
    values(new_conversation_id,target_user_id,'member','invited',current_user_id)
    on conflict(conversation_id,user_id) do nothing;
    invited_count:=invited_count+1;
  end loop;

  if invited_count=0 then
    raise exception 'No participants were added' using errcode='22023';
  end if;

  return new_conversation_id;
end;
$$;

revoke all on function private.jec_create_conversation(text,text,uuid,text[]) from public,anon;
grant execute on function private.jec_create_conversation(text,text,uuid,text[]) to authenticated;

-- Keep the existing defaults intact; the client calls this with named args.
create or replace function public.jec_create_conversation(
  target_type text,
  target_title text default null,
  target_workspace_id uuid default null,
  target_member_emails text[] default '{}'::text[]
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.jec_create_conversation(
    target_type,target_title,target_workspace_id,target_member_emails
  );
$$;

revoke all on function public.jec_create_conversation(text,text,uuid,text[]) from public,anon;
grant execute on function public.jec_create_conversation(text,text,uuid,text[]) to authenticated;

comment on function public.jec_create_conversation(text,text,uuid,text[]) is
  'Creates direct, group or workspace conversations. Direct/group invitations resolve email addresses privately and accept verified JEC accounts only.';
