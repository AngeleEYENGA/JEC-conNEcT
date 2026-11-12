-- Admin-only RPC: expose pending signup email addresses only to the explicit JEC admin allow-list.
create or replace function public.jec_admin_pending_memberships()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  structure_name text,
  display_name text,
  first_name text,
  last_name text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_jec_admin() then
    raise exception 'Administrator access required'
      using errcode = '42501';
  end if;

  return query
  select
    m.user_id,
    u.email::text,
    m.created_at,
    m.structure_name,
    p.display_name,
    p.first_name,
    p.last_name
  from public.jec_memberships as m
  join auth.users as u on u.id = m.user_id
  left join public.jec_profiles as p on p.user_id = m.user_id
  where m.membership_status = 'pending'
  order by m.created_at asc;
end;
$$;

revoke all on function public.jec_admin_pending_memberships() from public, anon;
grant execute on function public.jec_admin_pending_memberships() to authenticated;
