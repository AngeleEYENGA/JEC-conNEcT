-- Every active workspace member can create a meeting.
-- A meeting and its invitations are inserted by one authenticated, RLS-governed RPC.
drop policy if exists "Workspace managers create meetings" on public.jec_meetings;
create policy "Workspace members create meetings"
on public.jec_meetings for insert to authenticated
with check (
  created_by=(select auth.uid())
  and (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id))
);

drop policy if exists "Meeting creators invite active workspace members" on public.jec_meeting_participants;
create policy "Meeting creators invite active workspace members"
on public.jec_meeting_participants for insert to authenticated
with check (
  exists (
    select 1
    from public.jec_meetings mt
    where mt.id=meeting_id
      and mt.created_by=(select auth.uid())
      and (
        user_id=(select auth.uid())
        or exists (
          select 1 from public.jec_workspace_members wm
          where wm.workspace_id=mt.workspace_id
            and wm.user_id=jec_meeting_participants.user_id
            and wm.membership_status='active'
        )
      )
  )
);

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

  -- Invite every active workspace member; creator is marked as accepted.
  insert into public.jec_meeting_participants (
    meeting_id,user_id,attendance_status,responded_at
  )
  select
    new_meeting_id,m.user_id,
    case when m.user_id=current_user_id then 'accepted' else 'invited' end,
    case when m.user_id=current_user_id then now() else null end
  from public.jec_workspace_members m
  where m.workspace_id=target_workspace_id
    and m.membership_status='active';

  -- Admins may create a meeting in a workspace they do not belong to.
  -- Keep the creator in its participant list as well.
  insert into public.jec_meeting_participants (
    meeting_id,user_id,attendance_status,responded_at
  )
  select new_meeting_id,current_user_id,'accepted',now()
  where not exists (
    select 1 from public.jec_meeting_participants p
    where p.meeting_id=new_meeting_id and p.user_id=current_user_id
  );

  return new_meeting_id;
end;
$$;

revoke all on function public.jec_create_workspace_meeting(uuid,uuid,text,text,timestamptz,timestamptz,text,text) from public,anon;
grant execute on function public.jec_create_workspace_meeting(uuid,uuid,text,text,timestamptz,timestamptz,text,text) to authenticated;

-- Repair existing scheduled meetings that were created before all workspace members were invited.
insert into public.jec_meeting_participants(meeting_id,user_id,attendance_status,responded_at)
select
  mt.id,wm.user_id,
  case when wm.user_id=mt.created_by then 'accepted' else 'invited' end,
  case when wm.user_id=mt.created_by then mt.created_at else null end
from public.jec_meetings mt
join public.jec_workspace_members wm
  on wm.workspace_id=mt.workspace_id and wm.membership_status='active'
where mt.meeting_status='scheduled'
  and not exists (
    select 1 from public.jec_meeting_participants mp
    where mp.meeting_id=mt.id and mp.user_id=wm.user_id
  );

comment on function public.jec_create_workspace_meeting(uuid,uuid,text,text,timestamptz,timestamptz,text,text)
is 'Creates a meeting for any active workspace member and atomically invites every active member of that workspace.';
