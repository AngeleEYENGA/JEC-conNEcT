-- Create direct/group/workspace conversations from verified JEC account email addresses.
-- Email resolution happens in the private schema; no public client can query auth.users.
create or replace function private.jec_create_conversation_by_emails(
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
  normalized_emails text[];
  resolved_ids uuid[] := array[]::uuid[];
  email_value text;
  resolved_user_id uuid;
  active_workspace_member_ids uuid[];
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

  if target_type = 'workspace' then
    if target_workspace_id is null then
      raise exception 'Workspace is required for a workspace conversation' using errcode='22023';
    end if;
    if cardinality(normalized_emails) > 0 then
      raise exception 'Do not provide email addresses for a workspace conversation' using errcode='22023';
    end if;
    if not private.is_jec_workspace_member(target_workspace_id,current_user_id) then
      raise exception 'Active workspace membership required' using errcode='42501';
    end if;

    select coalesce(array_agg(m.user_id),array[]::uuid[])
    into active_workspace_member_ids
    from public.jec_workspace_members m
    where m.workspace_id=target_workspace_id
      and m.membership_status='active'
      and m.user_id<>current_user_id;

    return private.jec_create_conversation(
      target_type,
      coalesce(nullif(trim(coalesce(target_title,'')),''),(select w.name from public.jec_workspaces w where w.id=target_workspace_id)),
      target_workspace_id,
      active_workspace_member_ids
    );
  end if;

  if target_workspace_id is not null then
    raise exception 'Direct and group conversations cannot reference a workspace' using errcode='22023';
  end if;

  if target_type='direct' and cardinality(normalized_emails)<>1 then
    raise exception 'A direct conversation requires exactly one other participant email' using errcode='22023';
  end if;

  if target_type='group' and (cardinality(normalized_emails)<1 or cardinality(normalized_emails)>19) then
    raise exception 'A group conversation requires between one and nineteen other participant emails' using errcode='22023';
  end if;

  foreach email_value in array normalized_emails loop
    if email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Invalid participant email address: %',email_value using errcode='22023';
    end if;

    select u.id into resolved_user_id
    from auth.users u
    where lower(u.email)=email_value
    limit 1;

    if resolved_user_id is null then
      raise exception 'No JEC-conNEcT account was found for %',email_value using errcode='P0002';
    end if;

    if resolved_user_id=current_user_id then
      raise exception 'You are already included in the conversation' using errcode='22023';
    end if;

    if not private.is_jec_verified_or_admin(resolved_user_id) then
      raise exception 'Participant % is not a verified JEC member',email_value using errcode='42501';
    end if;

    resolved_ids:=array_append(resolved_ids,resolved_user_id);
  end loop;

  return private.jec_create_conversation(
    target_type,
    target_title,
    null,
    resolved_ids
  );
end;
$$;

revoke all on function private.jec_create_conversation_by_emails(text,text,uuid,text[]) from public,anon;
grant execute on function private.jec_create_conversation_by_emails(text,text,uuid,text[]) to authenticated;

create or replace function public.jec_create_conversation(
  target_type text,
  target_title text,
  target_workspace_id uuid,
  target_member_emails text[]
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.jec_create_conversation_by_emails(
    target_type,target_title,target_workspace_id,target_member_emails
  );
$$;

revoke all on function public.jec_create_conversation(text,text,uuid,text[]) from public,anon;
grant execute on function public.jec_create_conversation(text,text,uuid,text[]) to authenticated;

comment on function public.jec_create_conversation(text,text,uuid,text[]) is
  'Creates a direct, group or workspace conversation from verified JEC account email addresses; account lookup is kept private.';
