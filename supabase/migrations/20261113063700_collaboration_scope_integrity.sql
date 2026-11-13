-- Phase 2.1: enforce workspace consistency for all collaboration references
-- and qualify policy predicates to prevent cross-workspace references.

create or replace function private.enforce_jec_collaboration_scope()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  related_workspace_id uuid;
begin
  if tg_table_name='jec_project_milestones' then
    select p.workspace_id into related_workspace_id
    from public.jec_projects p where p.id=new.project_id;
    if related_workspace_id is null or related_workspace_id<>new.workspace_id then
      raise exception 'Milestone project must belong to the same workspace' using errcode='23514';
    end if;

  elsif tg_table_name='jec_task_comments' then
    select t.workspace_id into related_workspace_id
    from public.jec_workspace_tasks t where t.id=new.task_id;
    if related_workspace_id is null or related_workspace_id<>new.workspace_id then
      raise exception 'Task comment must belong to the task workspace' using errcode='23514';
    end if;

  elsif tg_table_name in ('jec_meeting_agenda_items','jec_meeting_decisions','jec_meeting_minutes','jec_meeting_transcripts') then
    select mt.workspace_id into related_workspace_id
    from public.jec_meetings mt where mt.id=new.meeting_id;
    if related_workspace_id is null or related_workspace_id<>new.workspace_id then
      raise exception 'Meeting record must belong to the meeting workspace' using errcode='23514';
    end if;

  elsif tg_table_name='jec_workspace_tasks' then
    if new.project_id is not null then
      select p.workspace_id into related_workspace_id
      from public.jec_projects p where p.id=new.project_id;
      if related_workspace_id is null or related_workspace_id<>new.workspace_id then
        raise exception 'Task project must belong to the task workspace' using errcode='23514';
      end if;
    end if;
    if new.meeting_id is not null then
      select mt.workspace_id into related_workspace_id
      from public.jec_meetings mt where mt.id=new.meeting_id;
      if related_workspace_id is null or related_workspace_id<>new.workspace_id then
        raise exception 'Task meeting must belong to the task workspace' using errcode='23514';
      end if;
      if new.project_id is not null and not exists (
        select 1 from public.jec_meetings mt
        join public.jec_projects p on p.id=new.project_id
        where mt.id=new.meeting_id and mt.project_id is not distinct from p.id
      ) then
        raise exception 'Task project and meeting must be linked consistently' using errcode='23514';
      end if;
    end if;

  elsif tg_table_name='jec_documents' then
    if new.project_id is not null then
      select p.workspace_id into related_workspace_id
      from public.jec_projects p where p.id=new.project_id;
      if related_workspace_id is null or related_workspace_id<>new.workspace_id then
        raise exception 'Document project must belong to the document workspace' using errcode='23514';
      end if;
    end if;
    if new.meeting_id is not null then
      select mt.workspace_id into related_workspace_id
      from public.jec_meetings mt where mt.id=new.meeting_id;
      if related_workspace_id is null or related_workspace_id<>new.workspace_id then
        raise exception 'Document meeting must belong to the document workspace' using errcode='23514';
      end if;
      if new.project_id is not null and not exists (
        select 1 from public.jec_meetings mt
        where mt.id=new.meeting_id and mt.project_id=new.project_id
      ) then
        raise exception 'Document project must match the linked meeting project' using errcode='23514';
      end if;
    end if;

  elsif tg_table_name='jec_meetings' then
    if new.project_id is not null then
      select p.workspace_id into related_workspace_id
      from public.jec_projects p where p.id=new.project_id;
      if related_workspace_id is null or related_workspace_id<>new.workspace_id then
        raise exception 'Meeting project must belong to the meeting workspace' using errcode='23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_jec_collaboration_scope() from public,anon,authenticated;

drop trigger if exists enforce_jec_milestone_scope on public.jec_project_milestones;
create trigger enforce_jec_milestone_scope before insert or update on public.jec_project_milestones
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_task_comment_scope on public.jec_task_comments;
create trigger enforce_jec_task_comment_scope before insert or update on public.jec_task_comments
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_agenda_scope on public.jec_meeting_agenda_items;
create trigger enforce_jec_agenda_scope before insert or update on public.jec_meeting_agenda_items
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_decision_scope on public.jec_meeting_decisions;
create trigger enforce_jec_decision_scope before insert or update on public.jec_meeting_decisions
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_minutes_scope on public.jec_meeting_minutes;
create trigger enforce_jec_minutes_scope before insert or update on public.jec_meeting_minutes
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_transcript_scope on public.jec_meeting_transcripts;
create trigger enforce_jec_transcript_scope before insert or update on public.jec_meeting_transcripts
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_workspace_task_scope on public.jec_workspace_tasks;
create trigger enforce_jec_workspace_task_scope before insert or update on public.jec_workspace_tasks
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_document_scope on public.jec_documents;
create trigger enforce_jec_document_scope before insert or update on public.jec_documents
for each row execute function private.enforce_jec_collaboration_scope();

drop trigger if exists enforce_jec_meeting_scope on public.jec_meetings;
create trigger enforce_jec_meeting_scope before insert or update on public.jec_meetings
for each row execute function private.enforce_jec_collaboration_scope();

-- Recreate the cross-reference RLS policies with explicit outer-table qualification.
drop policy if exists "Project managers create milestones" on public.jec_project_milestones;
create policy "Project managers create milestones"
on public.jec_project_milestones for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(jec_project_milestones.workspace_id)
  and private.can_manage_jec_workspace(jec_project_milestones.workspace_id)
  and exists (
    select 1 from public.jec_projects p
    where p.id=jec_project_milestones.project_id
      and p.workspace_id=jec_project_milestones.workspace_id
  )
  and (owner_id is null or private.is_jec_workspace_member(jec_project_milestones.workspace_id,owner_id))
);

drop policy if exists "Project owners and managers update milestones" on public.jec_project_milestones;
create policy "Project owners and managers update milestones"
on public.jec_project_milestones for update to authenticated
using (
  private.is_jec_workspace_member(jec_project_milestones.workspace_id)
  and (
    private.can_manage_jec_workspace(jec_project_milestones.workspace_id)
    or exists (
      select 1 from public.jec_projects p
      where p.id=jec_project_milestones.project_id and p.owner_id=(select auth.uid())
        and p.workspace_id=jec_project_milestones.workspace_id
    )
  )
)
with check (
  private.is_jec_workspace_member(jec_project_milestones.workspace_id)
  and (
    private.can_manage_jec_workspace(jec_project_milestones.workspace_id)
    or exists (
      select 1 from public.jec_projects p
      where p.id=jec_project_milestones.project_id and p.owner_id=(select auth.uid())
        and p.workspace_id=jec_project_milestones.workspace_id
    )
  )
  and (owner_id is null or private.is_jec_workspace_member(jec_project_milestones.workspace_id,owner_id))
);

drop policy if exists "Workspace members write task comments" on public.jec_task_comments;
create policy "Workspace members write task comments"
on public.jec_task_comments for insert to authenticated
with check (
  author_id=(select auth.uid())
  and private.is_jec_workspace_member(jec_task_comments.workspace_id)
  and exists (
    select 1 from public.jec_workspace_tasks t
    where t.id=jec_task_comments.task_id
      and t.workspace_id=jec_task_comments.workspace_id
  )
);

drop policy if exists "Meeting managers create agenda items" on public.jec_meeting_agenda_items;
create policy "Meeting managers create agenda items"
on public.jec_meeting_agenda_items for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(jec_meeting_agenda_items.workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=jec_meeting_agenda_items.meeting_id
      and mt.workspace_id=jec_meeting_agenda_items.workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(mt.workspace_id))
  )
  and (presenter_id is null or private.is_jec_workspace_member(jec_meeting_agenda_items.workspace_id,presenter_id))
);

drop policy if exists "Meeting managers create decisions" on public.jec_meeting_decisions;
create policy "Meeting managers create decisions"
on public.jec_meeting_decisions for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(jec_meeting_decisions.workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=jec_meeting_decisions.meeting_id
      and mt.workspace_id=jec_meeting_decisions.workspace_id
      and (mt.created_by=(select auth.uid()) or private.can_manage_jec_workspace(mt.workspace_id))
  )
);

drop policy if exists "Meeting members prepare minutes" on public.jec_meeting_minutes;
create policy "Meeting members prepare minutes"
on public.jec_meeting_minutes for insert to authenticated
with check (
  prepared_by=(select auth.uid())
  and minutes_status in ('draft','shared')
  and approved_by is null
  and approved_at is null
  and private.is_jec_workspace_member(jec_meeting_minutes.workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=jec_meeting_minutes.meeting_id
      and mt.workspace_id=jec_meeting_minutes.workspace_id
  )
);

drop policy if exists "Meeting members save consented transcripts" on public.jec_meeting_transcripts;
create policy "Meeting members save consented transcripts"
on public.jec_meeting_transcripts for insert to authenticated
with check (
  created_by=(select auth.uid())
  and consent_confirmed=true
  and private.is_jec_workspace_member(jec_meeting_transcripts.workspace_id)
  and exists (
    select 1 from public.jec_meetings mt
    where mt.id=jec_meeting_transcripts.meeting_id
      and mt.workspace_id=jec_meeting_transcripts.workspace_id
  )
);

drop policy if exists "Workspace members create tasks" on public.jec_workspace_tasks;
create policy "Workspace members create tasks"
on public.jec_workspace_tasks for insert to authenticated
with check (
  created_by=(select auth.uid())
  and private.is_jec_workspace_member(jec_workspace_tasks.workspace_id)
  and (assigned_to is null or private.is_jec_workspace_member(jec_workspace_tasks.workspace_id,assigned_to))
);

