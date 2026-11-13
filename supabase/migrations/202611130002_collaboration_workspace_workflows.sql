-- Collaboration RPC entry points exposed to authenticated clients.
-- Privileged implementation remains in the non-exposed private schema.

create or replace function private.jec_create_workspace(
  target_name text,
  target_slug text,
  target_type text,
  target_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_workspace_id uuid;
begin
  if current_user_id is null or not private.is_jec_admin() then
    raise exception 'JEC administrator access required' using errcode='42501';
  end if;

  if target_type not in ('national_team','federation','local_team','commission','service','project','temporary_group') then
    raise exception 'Invalid workspace type' using errcode='22023';
  end if;

  insert into public.jec_workspaces(name,slug,workspace_type,description,visibility,is_active,created_by)
  values(trim(target_name),lower(trim(target_slug)),target_type,nullif(trim(coalesce(target_description,'')),''),'private',true,current_user_id)
  returning id into new_workspace_id;

  insert into public.jec_workspace_members(workspace_id,user_id,workspace_role,membership_status,invited_by,joined_at)
  values(new_workspace_id,current_user_id,'owner','active',current_user_id,now());

  return new_workspace_id;
end;
$$;
revoke all on function private.jec_create_workspace(text,text,text,text) from public,anon;
grant execute on function private.jec_create_workspace(text,text,text,text) to authenticated;

create or replace function public.jec_create_workspace(
  target_name text,
  target_slug text,
  target_type text,
  target_description text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.jec_create_workspace(target_name,target_slug,target_type,target_description);
$$;
revoke all on function public.jec_create_workspace(text,text,text,text) from public,anon;
grant execute on function public.jec_create_workspace(text,text,text,text) to authenticated;

create or replace function public.jec_workspace_invite_by_email(
  target_workspace_id uuid,
  target_email text,
  target_role text default 'member'
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.jec_workspace_invite_by_email(target_workspace_id,target_email,target_role);
$$;
revoke all on function public.jec_workspace_invite_by_email(uuid,text,text) from public,anon;
grant execute on function public.jec_workspace_invite_by_email(uuid,text,text) to authenticated;

create or replace function public.jec_workspace_accept_invitation(
  target_workspace_id uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.jec_workspace_accept_invitation(target_workspace_id);
$$;
revoke all on function public.jec_workspace_accept_invitation(uuid) from public,anon;
grant execute on function public.jec_workspace_accept_invitation(uuid) to authenticated;
