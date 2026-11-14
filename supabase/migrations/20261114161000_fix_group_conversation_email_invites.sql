-- Fix ambiguous email_value reference in the group invitation helper.
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

  select coalesce(array_agg(distinct lower(trim(x.email))),array[]::text[])
  into normalized_emails
  from unnest(coalesce(target_member_emails,array[]::text[])) as x(email)
  where nullif(trim(x.email),'') is not null;

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
