-- JEC-conNEcT multi-organization foundation.
-- Adds a country / movement / local-group hierarchy without reassigning existing data.
-- Legacy workspaces remain unscoped until an administrator explicitly assigns an organization.

create table if not exists public.jec_organizations (
  id uuid primary key default gen_random_uuid(),
  parent_organization_id uuid references public.jec_organizations(id) on delete restrict,
  organization_type text not null
    check (organization_type in ('international', 'national_movement', 'local_group')),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text,
  region text,
  city text,
  timezone text,
  public_description text,
  public_website_url text,
  public_contact_email text,
  public_contact_enabled boolean not null default false,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  is_public boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_organization_public_contact_consent
    check (public_contact_enabled or public_contact_email is null),
  constraint jec_organization_coordinates_pair
    check ((latitude is null) = (longitude is null)),
  constraint jec_organization_local_has_parent
    check (organization_type <> 'local_group' or parent_organization_id is not null)
);

comment on table public.jec_organizations is
  'Public-safe directory of JEC organizations. Hierarchy: international -> national movement -> local group. National movements may temporarily be roots during phased onboarding.';
comment on column public.jec_organizations.public_contact_enabled is
  'Explicit permission to display the organization contact email publicly. Personal contact details must never be placed here without consent.';
comment on column public.jec_organizations.latitude is
  'Public organization-level map coordinate only; never store a member home address or precise personal location here.';

create index if not exists idx_jec_organizations_parent
  on public.jec_organizations(parent_organization_id);
create index if not exists idx_jec_organizations_public_location
  on public.jec_organizations(country_code, city)
  where is_public = true and status = 'active';
create index if not exists idx_jec_organizations_type_status
  on public.jec_organizations(organization_type, status);

create or replace function private.validate_jec_organization_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_type text;
  parent_country_code text;
  has_cycle boolean := false;
begin
  if new.parent_organization_id is null then
    if new.organization_type not in ('international', 'national_movement') then
      raise exception 'A local group must belong to a national movement' using errcode = '23514';
    end if;
  else
    if new.parent_organization_id = new.id then
      raise exception 'An organization cannot be its own parent' using errcode = '23514';
    end if;

    select o.organization_type, o.country_code
      into parent_type, parent_country_code
    from public.jec_organizations o
    where o.id = new.parent_organization_id;

    if not found then
      raise exception 'Parent organization was not found' using errcode = '23503';
    end if;

    if new.organization_type = 'national_movement' and parent_type <> 'international' then
      raise exception 'A national movement may only be attached to an international organization' using errcode = '23514';
    end if;

    if new.organization_type = 'local_group' and parent_type <> 'national_movement' then
      raise exception 'A local group must be attached directly to a national movement' using errcode = '23514';
    end if;

    if new.organization_type = 'international' then
      raise exception 'An international organization must be a root organization' using errcode = '23514';
    end if;

    if new.organization_type = 'local_group'
       and new.country_code is not null
       and parent_country_code is not null
       and new.country_code <> parent_country_code then
      raise exception 'A local group must use the same country code as its national movement' using errcode = '23514';
    end if;

    with recursive ancestors(id, parent_organization_id) as (
      select o.id, o.parent_organization_id
      from public.jec_organizations o
      where o.id = new.parent_organization_id
      union all
      select parent.id, parent.parent_organization_id
      from public.jec_organizations parent
      join ancestors a on parent.id = a.parent_organization_id
    )
    select exists(select 1 from ancestors where id = new.id)
      into has_cycle;

    if has_cycle then
      raise exception 'Organization hierarchy cannot contain a cycle' using errcode = '23514';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_jec_validate_organization_hierarchy on public.jec_organizations;
create trigger trg_jec_validate_organization_hierarchy
before insert or update of parent_organization_id, organization_type, country_code
on public.jec_organizations
for each row execute function private.validate_jec_organization_hierarchy();

create table if not exists public.jec_organization_memberships (
  organization_id uuid not null references public.jec_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_role text not null default 'member'
    check (organization_role in (
      'owner', 'admin', 'manager', 'secretary', 'treasurer',
      'communication', 'audiovisual', 'spirituality', 'member', 'guest'
    )),
  membership_status text not null default 'invited'
    check (membership_status in ('invited', 'active', 'suspended', 'left')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint jec_organization_membership_joined_status
    check (membership_status <> 'active' or joined_at is not null)
);

comment on table public.jec_organization_memberships is
  'A user may belong to several JEC organizations with a different role and status in each one. Access to descendants is inherited from active memberships in ancestor organizations.';

create index if not exists idx_jec_organization_memberships_user_status
  on public.jec_organization_memberships(user_id, membership_status);
create index if not exists idx_jec_organization_memberships_org_status_role
  on public.jec_organization_memberships(organization_id, membership_status, organization_role);

create or replace function private.touch_jec_organization_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_jec_touch_organization_membership on public.jec_organization_memberships;
create trigger trg_jec_touch_organization_membership
before update on public.jec_organization_memberships
for each row execute function private.touch_jec_organization_membership();


create or replace function private.is_jec_organization_member(
  target_organization_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with recursive organization_ancestors(id, parent_organization_id) as (
    select o.id, o.parent_organization_id
    from public.jec_organizations o
    where o.id = target_organization_id
    union all
    select parent.id, parent.parent_organization_id
    from public.jec_organizations parent
    join organization_ancestors a on parent.id = a.parent_organization_id
  )
  select
    exists (
      select 1
      from private.jec_admins a
      where a.user_id = coalesce(target_user_id, (select auth.uid()))
    )
    or exists (
      select 1
      from public.jec_organization_memberships m
      join organization_ancestors a on a.id = m.organization_id
      where m.user_id = coalesce(target_user_id, (select auth.uid()))
        and m.membership_status = 'active'
    );
$$;

create or replace function private.can_manage_jec_organization(
  target_organization_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with recursive organization_ancestors(id, parent_organization_id) as (
    select o.id, o.parent_organization_id
    from public.jec_organizations o
    where o.id = target_organization_id
    union all
    select parent.id, parent.parent_organization_id
    from public.jec_organizations parent
    join organization_ancestors a on parent.id = a.parent_organization_id
  )
  select
    exists (
      select 1
      from private.jec_admins a
      where a.user_id = coalesce(target_user_id, (select auth.uid()))
    )
    or exists (
      select 1
      from public.jec_organization_memberships m
      join organization_ancestors a on a.id = m.organization_id
      where m.user_id = coalesce(target_user_id, (select auth.uid()))
        and m.membership_status = 'active'
        and m.organization_role in ('owner', 'admin', 'manager')
    );
$$;

alter table public.jec_workspaces
  add column if not exists organization_id uuid
    references public.jec_organizations(id) on delete restrict;
create index if not exists idx_jec_workspaces_organization
  on public.jec_workspaces(organization_id)
  where organization_id is not null;

alter table public.jec_directory_entries
  add column if not exists organization_id uuid
    references public.jec_organizations(id) on delete set null;
create index if not exists idx_jec_directory_entries_organization
  on public.jec_directory_entries(organization_id)
  where organization_id is not null;


create or replace function private.jec_workspace_user_matches_organization(
  target_workspace_id uuid,
  target_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  scoped_organization_id uuid;
begin
  select w.organization_id
    into scoped_organization_id
  from public.jec_workspaces w
  where w.id = target_workspace_id;

  if not found then
    return false;
  end if;

  return scoped_organization_id is null
    or private.is_jec_organization_member(scoped_organization_id, target_user_id);
end;
$$;

revoke all on function private.validate_jec_organization_hierarchy() from public, anon, authenticated;
revoke all on function private.touch_jec_organization_membership() from public, anon, authenticated;
revoke all on function private.is_jec_organization_member(uuid, uuid) from public, anon;
revoke all on function private.can_manage_jec_organization(uuid, uuid) from public, anon;
revoke all on function private.jec_workspace_user_matches_organization(uuid, uuid) from public, anon;
grant execute on function private.is_jec_organization_member(uuid, uuid) to authenticated;
grant execute on function private.can_manage_jec_organization(uuid, uuid) to authenticated;
grant execute on function private.jec_workspace_user_matches_organization(uuid, uuid) to authenticated;

alter table public.jec_organizations enable row level security;
alter table public.jec_organization_memberships enable row level security;

revoke all on table public.jec_organizations from anon;
grant select on table public.jec_organizations to anon, authenticated;
grant insert, update on table public.jec_organizations to authenticated;

revoke all on table public.jec_organization_memberships from anon;
grant select, insert, update, delete on table public.jec_organization_memberships to authenticated;

drop policy if exists "Public active JEC organizations are visible" on public.jec_organizations;
create policy "Public active JEC organizations are visible"
on public.jec_organizations for select
to anon, authenticated
using (is_public = true and status = 'active');

drop policy if exists "Organization members can view their organizations" on public.jec_organizations;
create policy "Organization members can view their organizations"
on public.jec_organizations for select
to authenticated
using (private.is_jec_organization_member(id));

drop policy if exists "Organization managers create child organizations" on public.jec_organizations;
create policy "Organization managers create child organizations"
on public.jec_organizations for insert
to authenticated
with check (
  (parent_organization_id is null and private.is_jec_admin())
  or (
    parent_organization_id is not null
    and private.can_manage_jec_organization(parent_organization_id)
  )
);

drop policy if exists "Organization managers update organizations" on public.jec_organizations;
create policy "Organization managers update organizations"
on public.jec_organizations for update
to authenticated
using (private.can_manage_jec_organization(id))
with check (
  private.can_manage_jec_organization(id)
  and (
    (parent_organization_id is null and private.is_jec_admin())
    or (
      parent_organization_id is not null
      and private.can_manage_jec_organization(parent_organization_id)
    )
  )
);

drop policy if exists "Users and organization managers read memberships" on public.jec_organization_memberships;
create policy "Users and organization managers read memberships"
on public.jec_organization_memberships for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.can_manage_jec_organization(organization_id)
);

drop policy if exists "Organization managers invite members" on public.jec_organization_memberships;
create policy "Organization managers invite members"
on public.jec_organization_memberships for insert
to authenticated
with check (
  invited_by = (select auth.uid())
  and private.can_manage_jec_organization(organization_id)
  and (
    membership_status <> 'active'
    or private.is_jec_verified_or_admin(user_id)
  )
  and (
    organization_role not in ('owner', 'admin')
    or private.is_jec_admin()
  )
);

drop policy if exists "Organization managers update memberships" on public.jec_organization_memberships;
create policy "Organization managers update memberships"
on public.jec_organization_memberships for update
to authenticated
using (private.can_manage_jec_organization(organization_id))
with check (
  private.can_manage_jec_organization(organization_id)
  and (
    membership_status <> 'active'
    or private.is_jec_verified_or_admin(user_id)
  )
  and (
    organization_role not in ('owner', 'admin')
    or private.is_jec_admin()
  )
);

drop policy if exists "Organization managers remove memberships" on public.jec_organization_memberships;
create policy "Organization managers remove memberships"
on public.jec_organization_memberships for delete
to authenticated
using (private.can_manage_jec_organization(organization_id));

create or replace function private.is_jec_workspace_member(
  target_workspace_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.jec_workspace_members m
    join public.jec_workspaces w on w.id = m.workspace_id
    where m.workspace_id = target_workspace_id
      and m.user_id = coalesce(target_user_id, (select auth.uid()))
      and m.membership_status = 'active'
      and (
        w.organization_id is null
        or private.is_jec_organization_member(w.organization_id, m.user_id)
      )
  );
$function$;

create or replace function private.can_manage_jec_workspace(
  target_workspace_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    (target_user_id is null and private.is_jec_admin())
    or (
      target_user_id is not null
      and exists (
        select 1 from private.jec_admins a
        where a.user_id = target_user_id
      )
    )
    or exists (
      select 1
      from public.jec_workspace_members m
      join public.jec_workspaces w on w.id = m.workspace_id
      where m.workspace_id = target_workspace_id
        and m.user_id = coalesce(target_user_id, (select auth.uid()))
        and m.membership_status = 'active'
        and m.workspace_role in ('owner', 'manager')
        and (
          w.organization_id is null
          or private.is_jec_organization_member(w.organization_id, m.user_id)
        )
    );
$function$;

create or replace function private.jec_workspace_accept_invitation(
  target_workspace_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not private.jec_workspace_user_matches_organization(
    target_workspace_id, (select auth.uid())
  ) then
    raise exception 'Active organization membership required for this workspace' using errcode = '42501';
  end if;

  update public.jec_workspace_members
  set membership_status = 'active', joined_at = now(), updated_at = now()
  where workspace_id = target_workspace_id
    and user_id = (select auth.uid())
    and membership_status = 'invited';

  if not found then
    raise exception 'No pending invitation was found for this workspace' using errcode = 'P0002';
  end if;
end;
$function$;

drop policy if exists "Workspace managers invite verified members" on public.jec_workspace_members;
create policy "Workspace managers invite verified members"
on public.jec_workspace_members for insert
to authenticated
with check (
  (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
  and private.is_jec_verified_or_admin(user_id)
  and private.jec_workspace_user_matches_organization(workspace_id, user_id)
  and (
    membership_status = 'invited'
    or (
      membership_status = 'active'
      and (private.is_jec_admin() or workspace_role = 'owner')
    )
  )
);

drop policy if exists "Workspace managers update roster" on public.jec_workspace_members;
create policy "Workspace managers update roster"
on public.jec_workspace_members for update
to authenticated
using (
  private.is_jec_admin()
  or (
    private.can_manage_jec_workspace(workspace_id)
    and workspace_role <> 'owner'
  )
)
with check (
  (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
  and private.is_jec_verified_or_admin(user_id)
  and private.jec_workspace_user_matches_organization(workspace_id, user_id)
  and (
    workspace_role <> 'owner'
    or private.is_jec_admin()
  )
);

revoke all on function private.jec_workspace_user_matches_organization(uuid, uuid) from public, anon;
grant execute on function private.jec_workspace_user_matches_organization(uuid, uuid) to authenticated;

comment on column public.jec_workspaces.organization_id is
  'Optional tenant scope. Null preserves legacy unscoped pilot workspaces; scoped workspaces require active membership in the organization or one of its ancestors.';
comment on column public.jec_directory_entries.organization_id is
  'Optional link from an institutional directory entry to the canonical JEC organization record.';

