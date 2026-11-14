-- Invite all active workspace members from an AFTER INSERT trigger.
-- The trigger receives the inserted meeting row directly, avoiding a SELECT/RLS
-- visibility check against that row while it is being created.
drop policy if exists "Meeting creators invite active workspace members" on public.jec_meeting_participants;

create or replace function private.invite_active_workspace_members_after_meeting()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.jec_meeting_participants(
    meeting_id,user_id,attendance_status,responded_at
  )
  select
    new.id,
    wm.user_id,
    case when wm.user_id=new.created_by then 'accepted' else 'invited' end,
    case when wm.user_id=new.created_by then now() else null end
  from public.jec_workspace_members wm
  where wm.workspace_id=new.workspace_id
    and wm.membership_status='active';

  if not exists (
    select 1 from public.jec_meeting_participants p
    where p.meeting_id=new.id and p.user_id=new.created_by
  ) then
    insert into public.jec_meeting_participants(
      meeting_id,user_id,attendance_status,responded_at
    ) values(new.id,new.created_by,'accepted',now());
  end if;

  return new;
end;
$$;

revoke all on function private.invite_active_workspace_members_after_meeting() from public,anon,authenticated;

drop trigger if exists jec_invite_active_workspace_members_after_meeting on public.jec_meetings;
create trigger jec_invite_active_workspace_members_after_meeting
after insert on public.jec_meetings
for each row
execute function private.invite_active_workspace_members_after_meeting();

-- Keep the RPC invoker-scoped: RLS on jec_meetings authorises the creator,
-- while the AFTER INSERT trigger writes the invitation rows atomically.
create or replace function public.jec_create_workspace_meeting(
  target_workspace_id uuid,
  target_project_id uuid,
  target_title text,
  target_agenda text,
  target_starts_at timestamptz,
  target_ends_at timestamptz default null,
  target_location text default null,
  target_meeting_url text default null
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_meeting_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  if not private.is_jec_admin()
     and not private.is_jec_workspace_member(target_workspace_id,current_user_id) then
    raise exception 'Active workspace membership required to create a meeting' using errcode='42501';
  end if;

  if nullif(btrim(coalesce(target_title,'')),'') is null then
    raise exception 'Meeting title is required' using errcode='22023';
  end if;

  if target_starts_at is null then
    raise exception 'Meeting start date is required' using errcode='22023';
  end if;

  if target_ends_at is not null and target_ends_at < target_starts_at then
    raise exception 'Meeting end must be after its start' using errcode='22023';
  end if;

  if target_project_id is not null and not exists (
    select 1 from public.jec_projects p
    where p.id=target_project_id and p.workspace_id=target_workspace_id
  ) then
    raise exception 'The selected project does not belong to this workspace' using errcode='22023';
  end if;

  insert into public.jec_meetings (
    workspace_id,project_id,title,agenda,starts_at,ends_at,location,meeting_url,meeting_status,created_by
  )
  values (
    target_workspace_id,target_project_id,btrim(target_title),
    nullif(btrim(coalesce(target_agenda,'')),''),
    target_starts_at,target_ends_at,
    nullif(btrim(coalesce(target_location,'')),''),
    nullif(btrim(coalesce(target_meeting_url,'')),''),
    'scheduled',current_user_id
  )
  returning id into new_meeting_id;

  return new_meeting_id;
end;
$$;

revoke all on function public.jec_create_workspace_meeting(uuid,uuid,text,text,timestamptz,timestamptz,text,text) from public,anon;
grant execute on function public.jec_create_workspace_meeting(uuid,uuid,text,text,timestamptz,timestamptz,text,text) to authenticated;

comment on function private.invite_active_workspace_members_after_meeting()
is 'After a meeting is created, creates accepted attendance for the creator and invitations for all active workspace members.';
