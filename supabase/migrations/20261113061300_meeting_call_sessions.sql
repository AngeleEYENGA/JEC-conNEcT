-- Private meeting call session lifecycle.
create table if not exists public.jec_meeting_call_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  meeting_id uuid not null references public.jec_meetings(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check(status in ('active','ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status='active' and ended_at is null) or (status='ended' and ended_at is not null))
);

create unique index if not exists idx_jec_one_active_call_per_meeting
  on public.jec_meeting_call_sessions(meeting_id) where status='active';

create table if not exists public.jec_meeting_call_participants (
  session_id uuid not null references public.jec_meeting_call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key(session_id,user_id)
);

alter table public.jec_meeting_call_sessions enable row level security;
alter table public.jec_meeting_call_participants enable row level security;
revoke all on public.jec_meeting_call_sessions,public.jec_meeting_call_participants from anon;
grant select,insert,update on public.jec_meeting_call_sessions to authenticated;
grant select,insert,update on public.jec_meeting_call_participants to authenticated;

drop policy if exists "Accepted participants read call sessions" on public.jec_meeting_call_sessions;
create policy "Accepted participants read call sessions"
on public.jec_meeting_call_sessions for select to authenticated
using (private.can_join_jec_meeting_call(meeting_id));

drop policy if exists "Accepted participants read call roster" on public.jec_meeting_call_participants;
create policy "Accepted participants read call roster"
on public.jec_meeting_call_participants for select to authenticated
using (
  exists (
    select 1 from public.jec_meeting_call_sessions s
    where s.id=session_id and private.can_join_jec_meeting_call(s.meeting_id)
  )
);

create or replace function private.jec_join_meeting_call(target_meeting_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_workspace_id uuid;
  current_session_id uuid;
begin
  if current_user_id is null or not private.can_join_jec_meeting_call(target_meeting_id) then
    raise exception 'Accepted meeting participant access required' using errcode='42501';
  end if;

  select workspace_id into target_workspace_id
  from public.jec_meetings where id=target_meeting_id;

  select id into current_session_id
  from public.jec_meeting_call_sessions
  where meeting_id=target_meeting_id and status='active'
  for update;

  if current_session_id is null then
    insert into public.jec_meeting_call_sessions(workspace_id,meeting_id,host_id)
    values(target_workspace_id,target_meeting_id,current_user_id)
    on conflict do nothing
    returning id into current_session_id;

    if current_session_id is null then
      select id into current_session_id
      from public.jec_meeting_call_sessions
      where meeting_id=target_meeting_id and status='active';
    end if;
  end if;

  if current_session_id is null then
    raise exception 'Unable to create or join meeting call' using errcode='P0001';
  end if;

  insert into public.jec_meeting_call_participants(session_id,user_id)
  values(current_session_id,current_user_id)
  on conflict(session_id,user_id) do update set joined_at=now(),left_at=null;

  return current_session_id;
end;
$$;
revoke all on function private.jec_join_meeting_call(uuid) from public,anon;
grant execute on function private.jec_join_meeting_call(uuid) to authenticated;

create or replace function public.jec_join_meeting_call(target_meeting_id uuid)
returns uuid
language sql
security invoker
set search_path=''
as $$ select private.jec_join_meeting_call(target_meeting_id); $$;
revoke all on function public.jec_join_meeting_call(uuid) from public,anon;
grant execute on function public.jec_join_meeting_call(uuid) to authenticated;

create or replace function private.jec_leave_meeting_call(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  update public.jec_meeting_call_participants cp
  set left_at=now()
  from public.jec_meeting_call_sessions s
  where cp.session_id=target_session_id
    and cp.session_id=s.id
    and cp.user_id=(select auth.uid())
    and cp.left_at is null
    and s.status='active'
    and private.can_join_jec_meeting_call(s.meeting_id);

  if not found then
    raise exception 'Active call participation not found' using errcode='P0002';
  end if;
end;
$$;
revoke all on function private.jec_leave_meeting_call(uuid) from public,anon;
grant execute on function private.jec_leave_meeting_call(uuid) to authenticated;

create or replace function public.jec_leave_meeting_call(target_session_id uuid)
returns void
language sql
security invoker
set search_path=''
as $$ select private.jec_leave_meeting_call(target_session_id); $$;
revoke all on function public.jec_leave_meeting_call(uuid) from public,anon;
grant execute on function public.jec_leave_meeting_call(uuid) to authenticated;

create or replace function private.jec_end_meeting_call(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  target_workspace_id uuid;
  target_meeting_id uuid;
  target_host_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select workspace_id,meeting_id,host_id
  into target_workspace_id,target_meeting_id,target_host_id
  from public.jec_meeting_call_sessions
  where id=target_session_id and status='active'
  for update;

  if target_meeting_id is null then
    raise exception 'Active call session not found' using errcode='P0002';
  end if;
  if target_host_id<>(select auth.uid())
     and not private.can_manage_jec_workspace(target_workspace_id) then
    raise exception 'Only the call host or workspace manager can end the call' using errcode='42501';
  end if;

  update public.jec_meeting_call_sessions
  set status='ended',ended_at=now()
  where id=target_session_id;

  update public.jec_meeting_call_participants
  set left_at=coalesce(left_at,now())
  where session_id=target_session_id;
end;
$$;
revoke all on function private.jec_end_meeting_call(uuid) from public,anon;
grant execute on function private.jec_end_meeting_call(uuid) to authenticated;

create or replace function public.jec_end_meeting_call(target_session_id uuid)
returns void
language sql
security invoker
set search_path=''
as $$ select private.jec_end_meeting_call(target_session_id); $$;
revoke all on function public.jec_end_meeting_call(uuid) from public,anon;
grant execute on function public.jec_end_meeting_call(uuid) to authenticated;

drop policy if exists "Accepted participants update call sessions through host controls" on public.jec_meeting_call_sessions;
create policy "Accepted participants update call sessions through host controls"
on public.jec_meeting_call_sessions for update to authenticated
using (
  private.can_join_jec_meeting_call(meeting_id)
  and (host_id=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
)
with check (
  private.can_join_jec_meeting_call(meeting_id)
  and (host_id=(select auth.uid()) or private.can_manage_jec_workspace(workspace_id))
);

comment on table public.jec_meeting_call_sessions is
  'Call lifecycle metadata only. No audio or video is recorded or stored by this application.';
comment on table public.jec_meeting_call_participants is
  'Private attendance presence for a live meeting call.';
