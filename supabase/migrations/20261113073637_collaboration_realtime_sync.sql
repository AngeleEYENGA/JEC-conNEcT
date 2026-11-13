-- Publish meeting and project collaboration records for RLS-authorized Postgres Changes.
do $$
declare table_name text;
tables_to_publish text[] := array[
  'jec_projects','jec_workspace_tasks','jec_project_milestones','jec_task_comments',
  'jec_meetings','jec_meeting_participants','jec_meeting_agenda_items',
  'jec_meeting_decisions','jec_meeting_minutes','jec_meeting_transcripts'
];
begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then return; end if;
  foreach table_name in array tables_to_publish loop
    if to_regclass('public.'||table_name) is not null and not exists (
      select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name
    ) then execute format('alter publication supabase_realtime add table public.%I',table_name); end if;
  end loop;
end;
$$;
