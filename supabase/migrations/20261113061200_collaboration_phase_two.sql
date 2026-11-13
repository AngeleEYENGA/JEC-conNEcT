-- JEC-conNEcT collaboration phase 2:
-- project milestones / task comments, structured meeting records, transcripts,
-- and private realtime authorization for peer-to-peer calls.

create table if not exists public.jec_project_milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  project_id uuid not null references public.jec_projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text,
  due_date date,
  milestone_status text not null default 'pending'
    check (milestone_status in ('pending','in_progress','at_risk','completed')),
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jec_task_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  task_id uuid not null references public.jec_workspace_tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 1 and 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jec_workspace_tasks
  add column if not exists meeting_id uuid references public.jec_meetings(id) on delete set null;

create table if not exists public.jec_meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  meeting_id uuid not null references public.jec_meetings(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text,
  presenter_id uuid references auth.users(id) on delete set null,
  sort_order integer not null default 100,
  item_status text not null default 'pending'
    check (item_status in ('pending','discussed','deferred')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jec_meeting_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  meeting_id uuid not null references public.jec_meetings(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  detail text,
  decision_status text not null default 'confirmed'
    check (decision_status in ('draft','confirmed','superseded')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jec_meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  meeting_id uuid not null unique references public.jec_meetings(id) on delete cascade,
  content text not null default '',
  minutes_status text not null default 'draft'
    check (minutes_status in ('draft','shared','approved')),
  prepared_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (minutes_status='approved' and approved_by is not null and approved_at is not null)
    or minutes_status<>'approved'
  )
);

create table if not exists public.jec_meeting_transcripts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  meeting_id uuid not null references public.jec_meetings(id) on delete cascade,
  transcript_text text not null check (char_length(trim(transcript_text)) between 1 and 250000),
  language text not null default 'fr-FR',
  source_type text not null default 'manual'
    check (source_type in ('manual','browser_speech_api','uploaded')),
  transcript_status text not null default 'draft'
    check (transcript_status in ('draft','final')),
  consent_confirmed boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or started_at is null or ended_at>=started_at)
);

-- Centralized meeting access predicate, also used by Realtime call-room authorization.
create or replace function private.can_access_jec_meeting(
  target_meeting_id uuid,
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
    from public.jec_meetings mt
    where mt.id=target_meeting_id
      and (
        (target_user_id is null and private.is_jec_admin())
        or (target_user_id is not null and exists (
          select 1 from private.jec_admins a where a.user_id=target_user_id
        ))
        or private.is_jec_workspace_member(
          mt.workspace_id,
          coalesce(target_user_id,(select auth.uid()))
        )
        or exists (
          select 1
          from public.jec_meeting_participants mp
          where mp.meeting_id=mt.id
            and mp.user_id=coalesce(target_user_id,(select auth.uid()))
            and mp.attendance_status in ('accepted','attended')
        )
      )
  );
$$;
revoke all on function private.can_access_jec_meeting(uuid,uuid) from public,anon;
grant execute on function private.can_access_jec_meeting(uuid,uuid) to authenticated;

create or replace function private.can_join_jec_meeting_call(target_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and private.is_jec_verified_or_admin((select auth.uid()))
    and exists (
      select 1
      from public.jec_meetings mt
      join public.jec_meeting_participants mp on mp.meeting_id=mt.id
      where mt.id=target_meeting_id
        and mp.user_id=(select auth.uid())
        and mp.attendance_status in ('accepted','attended')
        and private.is_jec_workspace_member(mt.workspace_id)
    );
$$;
revoke all on function private.can_join_jec_meeting_call(uuid) from public,anon;
grant execute on function private.can_join_jec_meeting_call(uuid) to authenticated;

-- Project milestones
alter table public.jec_project_milestones enable row level security;
revoke all on public.jec_project_milestones from anon;
grant select,insert,update,delete on public.jec_project_milestones to authenticated;

drop policy if exists "Workspace members read project milestones" on public.jec_project_milestones;
create policy "Workspace members read project milestones"
on public.jec_project_milestones for select to authenticated
using (
  private.is_jec_admin()
  or private.is_jec_workspace_member(workspace_id)
);

drop policy if exists "Project managers create milestones" on public.jec_project_milestones;
create policy "Project managers create milestones"
on public.jec_project_milestones for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(workspace_id)
  and private.can_manage_jec_workspace(workspace_id)
  and exists (
    select 1 from public.jec_projects p
    where p.id=project_id and p.workspace_id=workspace_id
  )
  and (owner_id is null or private.is_jec_workspace_member(workspace_id,owner_id))
);

drop policy if exists "Project owners and managers update milestones" on public.jec_project_milestones;
create policy "Project owners and managers update milestones"
on public.jec_project_milestones for update to authenticated
using (
  private.is_jec_workspace_member(workspace_id)
  and (
    private.can_manage_jec_workspace(workspace_id)
    or exists (
      select 1 from public.jec_projects p
      where p.id=project_id and p.owner_id=(select auth.uid())
    )
  )
)
with check (
  private.is_jec_workspace_member(workspace_id)
  and (
    private.can_manage_jec_workspace(workspace_id)
    or exists (
      select 1 from public.jec_projects p
      where p.id=project_id and p.owner_id=(select auth.uid())
    )
  )
  and exists (
    select 1 from public.jec_projects p
    where p.id=project_id and p.workspace_id=workspace_id
  )
  and (owner_id is null or private.is_jec_workspace_member(workspace_id,owner_id))
);

drop policy if exists "Project managers delete milestones" on public.jec_project_milestones;
create policy "Project managers delete milestones"
on public.jec_project_milestones for delete to authenticated
using (private.can_manage_jec_workspace(workspace_id));

-- Task discussion
alter table public.jec_task_comments enable row level security;
revoke all on public.jec_task_comments from anon;
grant select,insert,update,delete on public.jec_task_comments to authenticated;

drop policy if exists "Workspace members read task comments" on public.jec_task_comments;
create policy "Workspace members read task comments"
on public.jec_task_comments for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace members write task comments" on public.jec_task_comments;
create policy "Workspace members write task comments"
on public.jec_task_comments for insert to authenticated
with check (
  author_id=(select auth.uid())
  and private.is_jec_workspace_member(workspace_id)
  and exists (
    select 1 from public.jec_workspace_tasks t
    where t.id=task_id and t.workspace_id=workspace_id
  )
);

drop policy if exists "Authors and managers update task comments" on public.jec_task_comments;
create policy "Authors and managers update task comments"
on public.jec_task_comments for update to authenticated
using (
  private.is_jec_workspace_member(workspace_id)
  and (author_id=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
)
with check (
  private.is_jec_workspace_member(workspace_id)
  and (author_id=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
);

drop policy if exists "Authors and managers delete task comments" on public.jec_task_comments;
create policy "Authors and managers delete task comments"
on public.jec_task_comments for delete to authenticated
using (
  private.is_jec_workspace_member(workspace_id)
  and (author_id=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
);

-- Structured agenda
alter table public.jec_meeting_agenda_items enable row level security;
revoke all on public.jec_meeting_agenda_items from anon;
grant select,insert,update,delete on public.jec_meeting_agenda_items to authenticated;

drop policy if exists "Meeting members read agenda items" on public.jec_meeting_agenda_items;
create policy "Meeting members read agenda items"
on public.jec_meeting_agenda_items for select to authenticated
using (private.can_access_jec_meeting(meeting_id));

drop policy if exists "Meeting managers create agenda items" on public.jec_meeting_agenda_items;
create policy "Meeting managers create agenda items"
on public.jec_meeting_agenda_items for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (
        mt.created_by=(select auth.uid())
        or private.can_manage_jec_workspace(workspace_id)
      )
  )
  and (presenter_id is null or private.is_jec_workspace_member(workspace_id,presenter_id))
);

drop policy if exists "Meeting managers update agenda items" on public.jec_meeting_agenda_items;
create policy "Meeting managers update agenda items"
on public.jec_meeting_agenda_items for update to authenticated
using (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
)
with check (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
  and (presenter_id is null or private.is_jec_workspace_member(workspace_id,presenter_id))
);

drop policy if exists "Meeting managers delete agenda items" on public.jec_meeting_agenda_items;
create policy "Meeting managers delete agenda items"
on public.jec_meeting_agenda_items for delete to authenticated
using (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
);

-- Decisions
alter table public.jec_meeting_decisions enable row level security;
revoke all on public.jec_meeting_decisions from anon;
grant select,insert,update,delete on public.jec_meeting_decisions to authenticated;

drop policy if exists "Meeting members read decisions" on public.jec_meeting_decisions;
create policy "Meeting members read decisions"
on public.jec_meeting_decisions for select to authenticated
using (private.can_access_jec_meeting(meeting_id));

drop policy if exists "Meeting managers create decisions" on public.jec_meeting_decisions;
create policy "Meeting managers create decisions"
on public.jec_meeting_decisions for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
);

drop policy if exists "Meeting managers update decisions" on public.jec_meeting_decisions;
create policy "Meeting managers update decisions"
on public.jec_meeting_decisions for update to authenticated
using (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
)
with check (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
);

drop policy if exists "Meeting managers delete decisions" on public.jec_meeting_decisions;
create policy "Meeting managers delete decisions"
on public.jec_meeting_decisions for delete to authenticated
using (
  exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  )
);

-- Minutes
alter table public.jec_meeting_minutes enable row level security;
revoke all on public.jec_meeting_minutes from anon;
grant select,insert,update,delete on public.jec_meeting_minutes to authenticated;

drop policy if exists "Meeting members read minutes" on public.jec_meeting_minutes;
create policy "Meeting members read minutes"
on public.jec_meeting_minutes for select to authenticated
using (private.can_access_jec_meeting(meeting_id));

drop policy if exists "Meeting members prepare minutes" on public.jec_meeting_minutes;
create policy "Meeting members prepare minutes"
on public.jec_meeting_minutes for insert to authenticated
with check (
  prepared_by=(select auth.uid())
  and minutes_status in ('draft','shared')
  and approved_by is null
  and approved_at is null
  and private.is_jec_workspace_member(workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
  )
);

drop policy if exists "Minutes preparers and managers update drafts" on public.jec_meeting_minutes;
create policy "Minutes preparers and managers update drafts"
on public.jec_meeting_minutes for update to authenticated
using (
  minutes_status<>'approved'
  and private.is_jec_workspace_member(workspace_id)
  and (prepared_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
)
with check (
  minutes_status in ('draft','shared')
  and approved_by is null
  and approved_at is null
  and private.is_jec_workspace_member(workspace_id)
  and (prepared_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
);

drop policy if exists "Workspace managers delete draft minutes" on public.jec_meeting_minutes;
create policy "Workspace managers delete draft minutes"
on public.jec_meeting_minutes for delete to authenticated
using (minutes_status<>'approved' and private.can_manage_jec_workspace(workspace_id));

create or replace function private.jec_approve_meeting_minutes(target_minutes_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_workspace_id uuid;
  target_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select workspace_id,minutes_status
  into target_workspace_id,target_status
  from public.jec_meeting_minutes
  where id=target_minutes_id
  for update;

  if target_workspace_id is null then
    raise exception 'Minutes not found' using errcode='P0002';
  end if;
  if not private.can_manage_jec_workspace(target_workspace_id) then
    raise exception 'Workspace manager access required to approve minutes' using errcode='42501';
  end if;
  if target_status='approved' then
    raise exception 'Minutes are already approved' using errcode='22023';
  end if;

  update public.jec_meeting_minutes
  set minutes_status='approved',approved_by=(select auth.uid()),approved_at=now(),updated_at=now()
  where id=target_minutes_id;
end;
$$;
revoke all on function private.jec_approve_meeting_minutes(uuid) from public,anon;
grant execute on function private.jec_approve_meeting_minutes(uuid) to authenticated;

create or replace function public.jec_approve_meeting_minutes(target_minutes_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.jec_approve_meeting_minutes(target_minutes_id);
$$;
revoke all on function public.jec_approve_meeting_minutes(uuid) from public,anon;
grant execute on function public.jec_approve_meeting_minutes(uuid) to authenticated;

-- Transcripts. The application stores recognized text only, never microphone audio.
alter table public.jec_meeting_transcripts enable row level security;
revoke all on public.jec_meeting_transcripts from anon;
grant select,insert,update,delete on public.jec_meeting_transcripts to authenticated;

drop policy if exists "Meeting members read transcripts" on public.jec_meeting_transcripts;
create policy "Meeting members read transcripts"
on public.jec_meeting_transcripts for select to authenticated
using (private.can_access_jec_meeting(meeting_id));

drop policy if exists "Meeting members save consented transcripts" on public.jec_meeting_transcripts;
create policy "Meeting members save consented transcripts"
on public.jec_meeting_transcripts for insert to authenticated
with check (
  created_by=(select auth.uid())
  and consent_confirmed=true
  and private.is_jec_workspace_member(workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=meeting_id and mt.workspace_id=workspace_id
  )
);

drop policy if exists "Transcript authors and managers update transcripts" on public.jec_meeting_transcripts;
create policy "Transcript authors and managers update transcripts"
on public.jec_meeting_transcripts for update to authenticated
using (
  private.is_jec_workspace_member(workspace_id)
  and (created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
)
with check (
  private.is_jec_workspace_member(workspace_id)
  and (created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
  and consent_confirmed=true
);

drop policy if exists "Transcript authors and managers delete transcripts" on public.jec_meeting_transcripts;
create policy "Transcript authors and managers delete transcripts"
on public.jec_meeting_transcripts for delete to authenticated
using (
  private.is_jec_workspace_member(workspace_id)
  and (created_by=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
);

-- Realtime Broadcast + Presence are authorized only for accepted meeting participants.
-- Topic format: jec-call:<meeting UUID>. The client must use config.private=true.
drop policy if exists "Accepted meeting participants receive private call signals" on realtime.messages;
create policy "Accepted meeting participants receive private call signals"
on realtime.messages for select to authenticated
using (
  extension in ('broadcast','presence')
  and case
    when realtime.topic() ~* '^jec-call:[0-9a-f-]{36}$'
    then private.can_join_jec_meeting_call(split_part(realtime.topic(),':',2)::uuid)
    else false
  end
);

drop policy if exists "Accepted meeting participants send private call signals" on realtime.messages;
create policy "Accepted meeting participants send private call signals"
on realtime.messages for insert to authenticated
with check (
  extension in ('broadcast','presence')
  and case
    when realtime.topic() ~* '^jec-call:[0-9a-f-]{36}$'
    then private.can_join_jec_meeting_call(split_part(realtime.topic(),':',2)::uuid)
    else false
  end
);

-- Indexes for the new workspace-scoped views.
create index if not exists idx_jec_milestones_project_due
  on public.jec_project_milestones(project_id,due_date);
create index if not exists idx_jec_task_comments_task_created
  on public.jec_task_comments(task_id,created_at);
create index if not exists idx_jec_tasks_meeting
  on public.jec_workspace_tasks(meeting_id) where meeting_id is not null;
create index if not exists idx_jec_agenda_meeting_order
  on public.jec_meeting_agenda_items(meeting_id,sort_order);
create index if not exists idx_jec_decisions_meeting
  on public.jec_meeting_decisions(meeting_id,created_at);
create index if not exists idx_jec_transcripts_meeting
  on public.jec_meeting_transcripts(meeting_id,created_at desc);

comment on table public.jec_project_milestones is
  'Private workspace project milestones, with status, due date and responsible member.';
comment on table public.jec_task_comments is
  'Private task discussion visible only to active members of the owning workspace.';
comment on table public.jec_meeting_minutes is
  'Structured meeting minutes; draft/shared versions can be edited, approved minutes are immutable.';
comment on table public.jec_meeting_transcripts is
  'Consent-confirmed transcript text. The application does not upload or persist raw microphone audio.';
