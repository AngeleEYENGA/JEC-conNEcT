-- JEC-conNEcT Collaboration foundation
-- Private workspaces, projects, tasks, meetings and documents.
-- All private content is scoped to active workspace memberships; no public collaboration data.



create table if not exists public.jec_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  workspace_type text not null
    check (workspace_type in ('national_team','federation','local_team','commission','service','project','temporary_group')),
  description text,
  visibility text not null default 'private' check (visibility in ('private','restricted')),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_workspaces_name_length check (char_length(name) between 2 and 120),
  constraint jec_workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.jec_workspace_members (
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_role text not null default 'member' check (workspace_role in ('owner','manager','member')),
  membership_status text not null default 'invited' check (membership_status in ('invited','active','suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table if not exists public.jec_workspace_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_workspace_posts_body_length check (char_length(trim(body)) between 1 and 12000)
);

create table if not exists public.jec_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  title text not null,
  objective text,
  description text,
  project_status text not null default 'draft'
    check (project_status in ('draft','active','on_hold','completed','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  start_date date,
  due_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_projects_title_length check (char_length(title) between 2 and 180),
  constraint jec_projects_dates check (due_date is null or start_date is null or due_date >= start_date)
);

create table if not exists public.jec_workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  project_id uuid references public.jec_projects(id) on delete set null,
  title text not null,
  description text,
  task_status text not null default 'todo' check (task_status in ('todo','in_progress','blocked','done','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_workspace_tasks_title_length check (char_length(title) between 2 and 180)
);

create table if not exists public.jec_meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  project_id uuid references public.jec_projects(id) on delete set null,
  title text not null,
  agenda text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  meeting_url text,
  meeting_status text not null default 'scheduled' check (meeting_status in ('scheduled','completed','cancelled')),
  minutes_document_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_meetings_title_length check (char_length(title) between 2 and 180),
  constraint jec_meetings_time_order check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.jec_meeting_participants (
  meeting_id uuid not null references public.jec_meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attendance_status text not null default 'invited' check (attendance_status in ('invited','accepted','declined','attended','absent')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (meeting_id,user_id)
);

create table if not exists public.jec_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  project_id uuid references public.jec_projects(id) on delete set null,
  meeting_id uuid references public.jec_meetings(id) on delete set null,
  document_category text not null default 'general'
    check (document_category in ('general','meeting_minutes','agenda','project','report','template','administrative','other')),
  title text not null,
  description text,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_documents_title_length check (char_length(title) between 2 and 180),
  constraint jec_documents_file_size check (file_size is null or file_size between 1 and 52428800)
);

alter table public.jec_meetings
  drop constraint if exists jec_meetings_minutes_document_id_fkey;
alter table public.jec_meetings
  add constraint jec_meetings_minutes_document_id_fkey
  foreign key (minutes_document_id) references public.jec_documents(id) on delete set null;

create index if not exists idx_jec_workspace_members_user_status
  on public.jec_workspace_members(user_id,membership_status);
create index if not exists idx_jec_workspace_posts_workspace_created
  on public.jec_workspace_posts(workspace_id,created_at desc);
create index if not exists idx_jec_projects_workspace_status
  on public.jec_projects(workspace_id,project_status);
create index if not exists idx_jec_tasks_workspace_status_due
  on public.jec_workspace_tasks(workspace_id,task_status,due_at);
create index if not exists idx_jec_tasks_assigned_to
  on public.jec_workspace_tasks(assigned_to,task_status);
create index if not exists idx_jec_meetings_workspace_start
  on public.jec_meetings(workspace_id,starts_at);
create index if not exists idx_jec_meeting_participants_user
  on public.jec_meeting_participants(user_id,attendance_status);
create index if not exists idx_jec_documents_workspace_category
  on public.jec_documents(workspace_id,document_category,created_at desc);



create or replace function private.is_jec_workspace_member(
  target_workspace_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jec_workspace_members m
    where m.workspace_id = target_workspace_id
      and m.user_id = coalesce(target_user_id, (select auth.uid()))
      and m.membership_status = 'active'
  );
$$;
revoke all on function private.is_jec_workspace_member(uuid,uuid) from public, anon;
grant execute on function private.is_jec_workspace_member(uuid,uuid) to authenticated;

create or replace function private.can_manage_jec_workspace(
  target_workspace_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (target_user_id is null and private.is_jec_admin())
    or (
      target_user_id is not null
      and exists (select 1 from private.jec_admins a where a.user_id=target_user_id)
    )
    or exists (
      select 1
      from public.jec_workspace_members m
      where m.workspace_id=target_workspace_id
        and m.user_id=coalesce(target_user_id,(select auth.uid()))
        and m.membership_status='active'
        and m.workspace_role in ('owner','manager')
    );
$$;
revoke all on function private.can_manage_jec_workspace(uuid,uuid) from public, anon;
grant execute on function private.can_manage_jec_workspace(uuid,uuid) to authenticated;

create or replace function private.is_jec_verified_or_admin(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.jec_memberships m
      where m.user_id=target_user_id and m.membership_status='verified'
    )
    or exists (select 1 from private.jec_admins a where a.user_id=target_user_id);
$$;
revoke all on function private.is_jec_verified_or_admin(uuid) from public, anon;
grant execute on function private.is_jec_verified_or_admin(uuid) to authenticated;





create or replace function private.jec_workspace_invite_by_email(
  target_workspace_id uuid,
  target_email text,
  target_role text default 'member'
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare invited_user_id uuid;
begin
  if not (private.is_jec_admin() or private.can_manage_jec_workspace(target_workspace_id)) then
    raise exception 'Workspace manager access required' using errcode = '42501';
  end if;
  if target_role not in ('manager','member') then
    raise exception 'Only member or manager invitations are permitted' using errcode = '22023';
  end if;
  select u.id into invited_user_id from auth.users u
  where lower(u.email)=lower(trim(target_email)) limit 1;
  if invited_user_id is null then
    raise exception 'No JEC-conNEcT account was found for this email' using errcode = 'P0002';
  end if;
  if not private.is_jec_verified_or_admin(invited_user_id) then
    raise exception 'Only verified JEC members can be invited to a workspace' using errcode = '42501';
  end if;
  insert into public.jec_workspace_members(workspace_id,user_id,workspace_role,membership_status,invited_by)
  values(target_workspace_id,invited_user_id,target_role,'invited',(select auth.uid()))
  on conflict(workspace_id,user_id) do update set
    workspace_role=excluded.workspace_role,membership_status='invited',
    invited_by=(select auth.uid()),joined_at=null,updated_at=now();
  return invited_user_id;
end;
$$;
revoke all on function private.jec_workspace_invite_by_email(uuid,text,text) from public, anon;
grant execute on function private.jec_workspace_invite_by_email(uuid,text,text) to authenticated;

create or replace function public.jec_workspace_invite_by_email(
  target_workspace_id uuid,target_email text,target_role text default 'member'
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.jec_workspace_invite_by_email(target_workspace_id,target_email,target_role); $$;
revoke all on function public.jec_workspace_invite_by_email(uuid,text,text) from public, anon;
grant execute on function public.jec_workspace_invite_by_email(uuid,text,text) to authenticated;

create or replace function private.jec_workspace_accept_invitation(target_workspace_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  update public.jec_workspace_members set membership_status='active',joined_at=now(),updated_at=now()
  where workspace_id=target_workspace_id and user_id=(select auth.uid()) and membership_status='invited';
  if not found then
    raise exception 'No pending invitation was found for this workspace' using errcode='P0002';
  end if;
end;
$$;
revoke all on function private.jec_workspace_accept_invitation(uuid) from public, anon;
grant execute on function private.jec_workspace_accept_invitation(uuid) to authenticated;

create or replace function public.jec_workspace_accept_invitation(target_workspace_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.jec_workspace_accept_invitation(target_workspace_id); $$;
revoke all on function public.jec_workspace_accept_invitation(uuid) from public, anon;
grant execute on function public.jec_workspace_accept_invitation(uuid) to authenticated;


alter table public.jec_workspaces enable row level security;
alter table public.jec_workspace_members enable row level security;
alter table public.jec_workspace_posts enable row level security;
alter table public.jec_projects enable row level security;
alter table public.jec_workspace_tasks enable row level security;
alter table public.jec_meetings enable row level security;
alter table public.jec_meeting_participants enable row level security;
alter table public.jec_documents enable row level security;

-- Workspaces: only members can discover private spaces. Global admins can manage their setup.
drop policy if exists "Workspace members read their spaces" on public.jec_workspaces;
create policy "Workspace members read their spaces"
on public.jec_workspaces for select to authenticated
using (
  private.is_jec_admin()
  or private.is_jec_workspace_member(id)
  or exists (
    select 1 from public.jec_workspace_members pending
    where pending.workspace_id=id
      and pending.user_id=(select auth.uid())
      and pending.membership_status='invited'
  )
);

drop policy if exists "JEC admins create workspaces" on public.jec_workspaces;
create policy "JEC admins create workspaces"
on public.jec_workspaces for insert to authenticated
with check (private.is_jec_admin() and created_by=(select auth.uid()));

drop policy if exists "Workspace managers update workspaces" on public.jec_workspaces;
create policy "Workspace managers update workspaces"
on public.jec_workspaces for update to authenticated
using (private.is_jec_admin() or private.can_manage_jec_workspace(id))
with check (private.is_jec_admin() or private.can_manage_jec_workspace(id));

drop policy if exists "JEC admins delete workspaces" on public.jec_workspaces;
create policy "JEC admins delete workspaces"
on public.jec_workspaces for delete to authenticated
using (private.is_jec_admin());

-- Workspace roster: members can see teammates in the same active space.
drop policy if exists "Workspace members read their roster" on public.jec_workspace_members;
create policy "Workspace members read their roster"
on public.jec_workspace_members for select to authenticated
using (
  user_id=(select auth.uid())
  or private.is_jec_admin()
  or private.is_jec_workspace_member(workspace_id)
);

drop policy if exists "Workspace managers invite verified members" on public.jec_workspace_members;
create policy "Workspace managers invite verified members"
on public.jec_workspace_members for insert to authenticated
with check (
  (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
  and private.is_jec_verified_or_admin(user_id)
  and (
    membership_status='invited'
    or (membership_status='active' and (private.is_jec_admin() or workspace_role='owner'))
  )
);

drop policy if exists "Workspace managers update roster" on public.jec_workspace_members;
create policy "Workspace managers update roster"
on public.jec_workspace_members for update to authenticated
using (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
with check (
  (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
  and private.is_jec_verified_or_admin(user_id)
);

drop policy if exists "Workspace managers remove roster entries" on public.jec_workspace_members;
create policy "Workspace managers remove roster entries"
on public.jec_workspace_members for delete to authenticated
using (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id));

-- Posts: a workspace feed visible only to active members.
drop policy if exists "Workspace members read posts" on public.jec_workspace_posts;
create policy "Workspace members read posts"
on public.jec_workspace_posts for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace members create posts" on public.jec_workspace_posts;
create policy "Workspace members create posts"
on public.jec_workspace_posts for insert to authenticated
with check (author_id=(select auth.uid()) and private.is_jec_workspace_member(workspace_id));

drop policy if exists "Authors and managers update posts" on public.jec_workspace_posts;
create policy "Authors and managers update posts"
on public.jec_workspace_posts for update to authenticated
using (
  (author_id=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
)
with check (
  (author_id=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);

drop policy if exists "Authors and managers delete posts" on public.jec_workspace_posts;
create policy "Authors and managers delete posts"
on public.jec_workspace_posts for delete to authenticated
using (author_id=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id));

-- Projects: managers create; owner or manager maintains.
drop policy if exists "Workspace members read projects" on public.jec_projects;
create policy "Workspace members read projects"
on public.jec_projects for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace managers create projects" on public.jec_projects;
create policy "Workspace managers create projects"
on public.jec_projects for insert to authenticated
with check (
  created_by=(select auth.uid())
  and owner_id=(select auth.uid())
  and (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
);

drop policy if exists "Project owners and workspace managers update projects" on public.jec_projects;
create policy "Project owners and workspace managers update projects"
on public.jec_projects for update to authenticated
using (
  (owner_id=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
)
with check (
  (owner_id=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);

drop policy if exists "Workspace managers delete projects" on public.jec_projects;
create policy "Workspace managers delete projects"
on public.jec_projects for delete to authenticated
using (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id));

-- Tasks: any active member can propose; creator, assignee or manager can update.
drop policy if exists "Workspace members read tasks" on public.jec_workspace_tasks;
create policy "Workspace members read tasks"
on public.jec_workspace_tasks for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace members create tasks" on public.jec_workspace_tasks;
create policy "Workspace members create tasks"
on public.jec_workspace_tasks for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(workspace_id)
  and (assigned_to is null or private.is_jec_workspace_member(workspace_id,assigned_to))
);

drop policy if exists "Task creator assignee or manager updates tasks" on public.jec_workspace_tasks;
create policy "Task creator assignee or manager updates tasks"
on public.jec_workspace_tasks for update to authenticated
using (
  created_by=(select auth.uid())
  or assigned_to=(select auth.uid())
  or private.can_manage_jec_workspace(workspace_id)
)
with check (
  (created_by=(select auth.uid()) or assigned_to=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  and private.is_jec_workspace_member(workspace_id)
  and (assigned_to is null or private.is_jec_workspace_member(workspace_id,assigned_to))
);

drop policy if exists "Task creator and managers delete tasks" on public.jec_workspace_tasks;
create policy "Task creator and managers delete tasks"
on public.jec_workspace_tasks for delete to authenticated
using (created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id));

-- Meetings: members can view, managers create, creators/managers edit.
drop policy if exists "Workspace members read meetings" on public.jec_meetings;
create policy "Workspace members read meetings"
on public.jec_meetings for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace managers create meetings" on public.jec_meetings;
create policy "Workspace managers create meetings"
on public.jec_meetings for insert to authenticated
with check (
  created_by=(select auth.uid())
  and (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id))
);

drop policy if exists "Meeting creators and managers update meetings" on public.jec_meetings;
create policy "Meeting creators and managers update meetings"
on public.jec_meetings for update to authenticated
using (created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
with check (created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id));

drop policy if exists "Meeting managers delete meetings" on public.jec_meetings;
create policy "Meeting managers delete meetings"
on public.jec_meetings for delete to authenticated
using (private.is_jec_admin() or private.can_manage_jec_workspace(workspace_id));

drop policy if exists "Workspace members read meeting participants" on public.jec_meeting_participants;
create policy "Workspace members read meeting participants"
on public.jec_meeting_participants for select to authenticated
using (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and private.is_jec_workspace_member(mt.workspace_id)
  )
  or user_id=(select auth.uid())
  or private.is_jec_admin()
);

drop policy if exists "Workspace managers manage meeting participants" on public.jec_meeting_participants;
create policy "Workspace managers manage meeting participants"
on public.jec_meeting_participants for all to authenticated
using (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and private.can_manage_jec_workspace(mt.workspace_id)
  )
  or private.is_jec_admin()
)
with check (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and private.can_manage_jec_workspace(mt.workspace_id)
  )
  or private.is_jec_admin()
);

drop policy if exists "Participants respond to own invitations" on public.jec_meeting_participants;
create policy "Participants respond to own invitations"
on public.jec_meeting_participants for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

-- Documents: private metadata and private bucket, scoped to workspace membership.
drop policy if exists "Workspace members read documents" on public.jec_documents;
create policy "Workspace members read documents"
on public.jec_documents for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace members upload documents" on public.jec_documents;
create policy "Workspace members upload documents"
on public.jec_documents for insert to authenticated
with check (
  uploaded_by=(select auth.uid())
  and private.is_jec_workspace_member(workspace_id)
);

drop policy if exists "Document owners and managers update metadata" on public.jec_documents;
create policy "Document owners and managers update metadata"
on public.jec_documents for update to authenticated
using (
  (uploaded_by=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
)
with check (
  (uploaded_by=(select auth.uid()) and private.is_jec_workspace_member(workspace_id))
  or private.can_manage_jec_workspace(workspace_id)
);

drop policy if exists "Document owners and managers delete documents" on public.jec_documents;
create policy "Document owners and managers delete documents"
on public.jec_documents for delete to authenticated
using (uploaded_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id));

grant usage on schema public to authenticated;
grant select,insert,update,delete on public.jec_workspaces to authenticated;
grant select,insert,update,delete on public.jec_workspace_members to authenticated;
grant select,insert,update,delete on public.jec_workspace_posts to authenticated;
grant select,insert,update,delete on public.jec_projects to authenticated;
grant select,insert,update,delete on public.jec_workspace_tasks to authenticated;
grant select,insert,update,delete on public.jec_meetings to authenticated;
grant select,insert,update,delete on public.jec_meeting_participants to authenticated;
grant select,insert,update,delete on public.jec_documents to authenticated;

-- Private documents bucket; no public access and no anonymous Storage policies.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'jec-workspace-documents',
  'jec-workspace-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ]::text[]
)
on conflict (id) do update
set public=false,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Workspace members read private collaboration files" on storage.objects;
create policy "Workspace members read private collaboration files"
on storage.objects for select to authenticated
using (
  bucket_id='jec-workspace-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and private.is_jec_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Workspace members upload private collaboration files" on storage.objects;
create policy "Workspace members upload private collaboration files"
on storage.objects for insert to authenticated
with check (
  bucket_id='jec-workspace-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[2]=(select auth.uid())::text
  and private.is_jec_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "File owners and managers update collaboration files" on storage.objects;
create policy "File owners and managers update collaboration files"
on storage.objects for update to authenticated
using (
  bucket_id='jec-workspace-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (
    (storage.foldername(name))[2]=(select auth.uid())::text
    or private.can_manage_jec_workspace(((storage.foldername(name))[1])::uuid)
  )
)
with check (
  bucket_id='jec-workspace-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (
    (storage.foldername(name))[2]=(select auth.uid())::text
    or private.can_manage_jec_workspace(((storage.foldername(name))[1])::uuid)
  )
);

drop policy if exists "File owners and managers delete collaboration files" on storage.objects;
create policy "File owners and managers delete collaboration files"
on storage.objects for delete to authenticated
using (
  bucket_id='jec-workspace-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (
    (storage.foldername(name))[2]=(select auth.uid())::text
    or private.can_manage_jec_workspace(((storage.foldername(name))[1])::uuid)
  )
);

comment on table public.jec_workspaces is 'Private JEC-conNEcT workspaces for national teams, federations, local teams, commissions and services.';
comment on table public.jec_workspace_members is 'Active/invited workspace roster with workspace-scoped owner, manager and member roles.';
comment on table public.jec_workspace_posts is 'Private workspace discussion feed; visible only to active members.';
comment on table public.jec_projects is 'Projects managed within a private JEC workspace.';
comment on table public.jec_workspace_tasks is 'Tasks shared within a workspace or linked project.';
comment on table public.jec_meetings is 'Private workspace meetings, agendas and meeting links.';
comment on table public.jec_documents is 'Private workspace documents and metadata; files live in the private jec-workspace-documents Storage bucket.';
