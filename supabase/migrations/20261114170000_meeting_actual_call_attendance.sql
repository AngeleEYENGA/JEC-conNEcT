-- Capture real call attendance in the meeting roster and keep the join
-- timestamps available to the minutes builder.

alter table public.jec_meeting_participants
  add column if not exists attended_at timestamptz;

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

  -- The call admission check already requires an accepted meeting invitation.
  -- Preserve responded_at (the invitation decision time) and store call entry
  -- in its own attended_at field.
  update public.jec_meeting_participants
  set attendance_status='attended',
      attended_at=coalesce(attended_at,now())
  where meeting_id=target_meeting_id
    and user_id=current_user_id
    and attendance_status in ('accepted','attended');

  return current_session_id;
end;
$$;
revoke all on function private.jec_join_meeting_call(uuid) from public,anon;
grant execute on function private.jec_join_meeting_call(uuid) to authenticated;

-- Backfill actual attendance for calls already recorded in the call roster.
with actual_attendance as (
  select s.meeting_id,cp.user_id,min(cp.joined_at) as first_joined_at
  from public.jec_meeting_call_sessions s
  join public.jec_meeting_call_participants cp on cp.session_id=s.id
  group by s.meeting_id,cp.user_id
)
update public.jec_meeting_participants mp
set attendance_status='attended',
    attended_at=coalesce(mp.attended_at,a.first_joined_at)
from actual_attendance a
where mp.meeting_id=a.meeting_id
  and mp.user_id=a.user_id
  and mp.attendance_status in ('accepted','attended');

comment on column public.jec_meeting_participants.attended_at is
  'First timestamp at which the participant actually joined the audio/video call.';
