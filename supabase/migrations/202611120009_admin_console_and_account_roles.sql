-- Admin console APIs: list accounts, validate membership and manage administrator assignments.
-- Sensitive auth.users/private.jec_admins access is kept inside private SECURITY DEFINER helpers.
-- Public RPC wrappers run as invoker and rely on explicit execution grants.

create or replace function private.jec_admin_list_accounts()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  display_name text,
  first_name text,
  last_name text,
  membership_status text,
  structure_name text,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_jec_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    p.display_name,
    p.first_name,
    p.last_name,
    coalesce(m.membership_status, 'pending'),
    m.structure_name,
    exists (select 1 from private.jec_admins a where a.user_id = u.id)
  from auth.users u
  left join public.jec_profiles p on p.user_id = u.id
  left join public.jec_memberships m on m.user_id = u.id
  order by u.created_at desc;
end;
$$;
revoke all on function private.jec_admin_list_accounts() from public, anon;
grant execute on function private.jec_admin_list_accounts() to authenticated;

create or replace function public.jec_admin_list_accounts()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  display_name text,
  first_name text,
  last_name text,
  membership_status text,
  structure_name text,
  is_admin boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.jec_admin_list_accounts();
$$;
revoke all on function public.jec_admin_list_accounts() from public, anon;
grant execute on function public.jec_admin_list_accounts() to authenticated;

create or replace function private.jec_admin_set_membership(
  target_user_id uuid,
  new_status text,
  new_structure_name text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_jec_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if new_status not in ('pending','verified','rejected') then
    raise exception 'Invalid membership status' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users u where u.id = target_user_id) then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;
  insert into public.jec_memberships (user_id,membership_status,structure_name,verified_at,verified_by,updated_at)
  values (
    target_user_id,
    new_status,
    nullif(trim(coalesce(new_structure_name,'')),''),
    case when new_status='verified' then now() else null end,
    case when new_status='verified' then (select auth.uid()) else null end,
    now()
  )
  on conflict (user_id) do update set
    membership_status=excluded.membership_status,
    structure_name=coalesce(excluded.structure_name,public.jec_memberships.structure_name),
    verified_at=excluded.verified_at,
    verified_by=excluded.verified_by,
    updated_at=now();
end;
$$;
revoke all on function private.jec_admin_set_membership(uuid,text,text) from public, anon;
grant execute on function private.jec_admin_set_membership(uuid,text,text) to authenticated;

create or replace function public.jec_admin_set_membership(
  target_user_id uuid,
  new_status text,
  new_structure_name text default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.jec_admin_set_membership(target_user_id,new_status,new_structure_name);
$$;
revoke all on function public.jec_admin_set_membership(uuid,text,text) from public, anon;
grant execute on function public.jec_admin_set_membership(uuid,text,text) to authenticated;

create or replace function private.jec_admin_set_role(
  target_user_id uuid,
  make_admin boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_count integer;
begin
  if not private.is_jec_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = target_user_id) then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;

  if make_admin then
    insert into private.jec_admins (user_id,granted_by,reason)
    values (target_user_id,(select auth.uid()),'Désignation via le tableau de bord administrateur JEC-conNEcT')
    on conflict (user_id) do nothing;
  else
    select count(*) into admin_count from private.jec_admins;
    if admin_count <= 1 and exists (select 1 from private.jec_admins where user_id=target_user_id) then
      raise exception 'At least one administrator must remain active' using errcode = '23514';
    end if;
    delete from private.jec_admins where user_id=target_user_id;
  end if;
end;
$$;
revoke all on function private.jec_admin_set_role(uuid,boolean) from public, anon;
grant execute on function private.jec_admin_set_role(uuid,boolean) to authenticated;

create or replace function public.jec_admin_set_role(
  target_user_id uuid,
  make_admin boolean
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.jec_admin_set_role(target_user_id,make_admin);
$$;
revoke all on function public.jec_admin_set_role(uuid,boolean) from public, anon;
grant execute on function public.jec_admin_set_role(uuid,boolean) to authenticated;

-- Allow only a verified JEC administrator to remove a file from the shared music library.
drop policy if exists "JEC administrators delete shared music files" on storage.objects;
create policy "JEC administrators delete shared music files"
on storage.objects for delete to authenticated
using (bucket_id='jec-audio' and private.is_jec_admin());

comment on function public.jec_admin_list_accounts() is 'Admin-only account directory with membership and administrator status.';
comment on function public.jec_admin_set_membership(uuid,text,text) is 'Admin-only membership approval/rejection operation.';
comment on function public.jec_admin_set_role(uuid,boolean) is 'Admin-only administrator grant/revoke operation; protects the final administrator.';
