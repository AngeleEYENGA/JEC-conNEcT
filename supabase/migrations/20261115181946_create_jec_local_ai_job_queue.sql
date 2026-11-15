create table if not exists public.jec_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  messages jsonb not null,
  language text not null default 'fr',
  source_context jsonb not null default '[]'::jsonb,
  status text not null default 'queued',
  response_text text,
  source_references jsonb not null default '[]'::jsonb,
  last_error text,
  attempts integer not null default 0,
  claimed_by text,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_ai_jobs_language_check check (language in ('fr','en')),
  constraint jec_ai_jobs_status_check check (status in ('queued','processing','succeeded','failed')),
  constraint jec_ai_jobs_messages_check check (
    jsonb_typeof(messages) = 'array'
    and jsonb_array_length(messages) between 1 and 8
  ),
  constraint jec_ai_jobs_sources_check check (jsonb_typeof(source_context) = 'array'),
  constraint jec_ai_jobs_refs_check check (jsonb_typeof(source_references) = 'array'),
  constraint jec_ai_jobs_attempts_check check (attempts between 0 and 5)
);

create index if not exists jec_ai_jobs_status_created_idx
  on public.jec_ai_jobs (status, created_at);

create index if not exists jec_ai_jobs_user_created_idx
  on public.jec_ai_jobs (user_id, created_at desc);

alter table public.jec_ai_jobs enable row level security;
revoke all on table public.jec_ai_jobs from anon, authenticated;
grant select, insert on table public.jec_ai_jobs to authenticated;

drop policy if exists "Members can read their own JEC AI jobs" on public.jec_ai_jobs;
create policy "Members can read their own JEC AI jobs"
  on public.jec_ai_jobs for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can enqueue their own JEC AI jobs" on public.jec_ai_jobs;
create policy "Members can enqueue their own JEC AI jobs"
  on public.jec_ai_jobs for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'queued'
    and response_text is null
    and source_references = '[]'::jsonb
    and last_error is null
    and attempts = 0
    and claimed_by is null
    and claimed_at is null
    and completed_at is null
  );

comment on table public.jec_ai_jobs is
  'Private user-scoped queue for local JEC AI tasks. Users can enqueue and read only their own tasks; the local worker uses a server-side Edge Function credential.';

create or replace function public.jec_ai_claim_next_job(p_agent_id text)
returns setof public.jec_ai_jobs
language plpgsql
security definer
set search_path to ''
as $function$
declare
  claimed_job public.jec_ai_jobs;
begin
  if p_agent_id is null or length(trim(p_agent_id)) < 3 or length(p_agent_id) > 80 then
    return;
  end if;

  update public.jec_ai_jobs as jobs
  set status = 'processing',
      claimed_by = p_agent_id,
      claimed_at = now(),
      attempts = jobs.attempts + 1,
      updated_at = now(),
      last_error = null
  where jobs.id = (
    select queued.id
    from public.jec_ai_jobs as queued
    where queued.status = 'queued'
       or (
         queued.status = 'processing'
         and queued.claimed_at < now() - interval '10 minutes'
         and queued.attempts < 3
       )
    order by queued.created_at
    for update skip locked
    limit 1
  )
  returning jobs.* into claimed_job;

  if found then
    return next claimed_job;
  end if;
  return;
end;
$function$;

revoke all on function public.jec_ai_claim_next_job(text) from public, anon, authenticated;
grant execute on function public.jec_ai_claim_next_job(text) to service_role;
