-- JEC-conNEcT decision-making: consultations, formal votes and elections.
-- Eligibility is snapshotted when a poll opens. Participation is stored separately
-- from the ballot so that voter identity is not attached to the selected options.

create table if not exists public.jec_decision_polls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 180),
  description text,
  decision_type text not null check (decision_type in ('poll','vote','election')),
  selection_mode text not null default 'single' check (selection_mode in ('single','multiple')),
  results_visibility text not null default 'after_close' check (results_visibility in ('after_close','immediate')),
  approval_rule text not null default 'plurality' check (approval_rule in ('plurality','simple_majority','absolute_majority','two_thirds')),
  quorum_percent numeric(5,2) not null default 0 check (quorum_percent >= 0 and quorum_percent <= 100),
  allow_abstention boolean not null default true,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (decision_type <> 'election' or (selection_mode = 'single' and results_visibility = 'after_close'))
);

create table if not exists public.jec_decision_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.jec_decision_polls(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 180),
  detail text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_jec_decision_options_unique_label
  on public.jec_decision_options(poll_id, lower(btrim(label)));
create index if not exists idx_jec_decision_polls_workspace_status
  on public.jec_decision_polls(workspace_id,status,ends_at desc);

create table if not exists public.jec_decision_eligible_voters (
  poll_id uuid not null references public.jec_decision_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (poll_id,user_id)
);

-- This table records who has participated, but not what they selected.
create table if not exists public.jec_decision_voter_participation (
  poll_id uuid not null references public.jec_decision_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cast_at timestamptz not null default now(),
  primary key (poll_id,user_id)
);

-- Ballots deliberately contain no voter/user identifier.
create table if not exists public.jec_decision_ballots (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.jec_decision_polls(id) on delete cascade,
  -- No voter ID or timestamp is stored on a ballot; only aggregate results are exposed.
  poll_id uuid not null references public.jec_decision_polls(id) on delete cascade
);

create table if not exists public.jec_decision_ballot_selections (
  ballot_id uuid not null references public.jec_decision_ballots(id) on delete cascade,
  option_id uuid not null references public.jec_decision_options(id) on delete restrict,
  primary key (ballot_id,option_id)
);

create index if not exists idx_jec_decision_ballots_poll
  on public.jec_decision_ballots(poll_id);
create index if not exists idx_jec_decision_participation_poll
  on public.jec_decision_voter_participation(poll_id,cast_at);

alter table public.jec_decision_polls enable row level security;
alter table public.jec_decision_options enable row level security;
alter table public.jec_decision_eligible_voters enable row level security;
alter table public.jec_decision_voter_participation enable row level security;
alter table public.jec_decision_ballots enable row level security;
alter table public.jec_decision_ballot_selections enable row level security;

revoke all on public.jec_decision_polls, public.jec_decision_options,
  public.jec_decision_eligible_voters, public.jec_decision_voter_participation,
  public.jec_decision_ballots, public.jec_decision_ballot_selections from anon;

grant select on public.jec_decision_polls, public.jec_decision_options,
  public.jec_decision_eligible_voters, public.jec_decision_voter_participation
  to authenticated;
revoke insert, update, delete on public.jec_decision_polls, public.jec_decision_options,
  public.jec_decision_eligible_voters, public.jec_decision_voter_participation,
  public.jec_decision_ballots, public.jec_decision_ballot_selections from authenticated;

drop policy if exists "Workspace members read decision polls" on public.jec_decision_polls;
create policy "Workspace members read decision polls"
on public.jec_decision_polls for select to authenticated
using (private.is_jec_admin() or private.is_jec_workspace_member(workspace_id));

drop policy if exists "Workspace members read decision options" on public.jec_decision_options;
create policy "Workspace members read decision options"
on public.jec_decision_options for select to authenticated
using (
  exists (
    select 1 from public.jec_decision_polls p
    where p.id=poll_id
      and (private.is_jec_admin() or private.is_jec_workspace_member(p.workspace_id))
  )
);

drop policy if exists "Voters read own eligibility" on public.jec_decision_eligible_voters;
create policy "Voters read own eligibility"
on public.jec_decision_eligible_voters for select to authenticated
using (user_id=(select auth.uid()));

drop policy if exists "Voters read own participation" on public.jec_decision_voter_participation;
create policy "Voters read own participation"
on public.jec_decision_voter_participation for select to authenticated
using (user_id=(select auth.uid()));

-- No direct policy is created for ballots or selections: ballot content is
-- accessible only through the aggregate results function below.

-- The invoker wrappers below are callable by authenticated members only.
-- Their private implementations perform the controlled writes and checks.
grant usage on schema private to authenticated;

create or replace function private.jec_create_decision_poll_impl(
  target_workspace_id uuid,
  target_title text,
  target_description text,
  target_decision_type text,
  target_selection_mode text,
  target_results_visibility text,
  target_ends_at timestamptz,
  target_quorum_percent numeric,
  target_approval_rule text,
  target_allow_abstention boolean,
  target_options jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_poll_id uuid;
  option_record jsonb;
  option_label text;
  option_detail text;
  option_count integer := 0;
  eligible_count integer := 0;
  effective_mode text := target_selection_mode;
  effective_visibility text := target_results_visibility;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if not private.can_manage_jec_workspace(target_workspace_id)
     and not private.is_jec_admin() then
    raise exception 'Workspace manager access required' using errcode='42501';
  end if;
  if target_decision_type not in ('poll','vote','election')
     or target_selection_mode not in ('single','multiple')
     or target_results_visibility not in ('after_close','immediate')
     or target_approval_rule not in ('plurality','simple_majority','absolute_majority','two_thirds')
     or target_quorum_percent < 0 or target_quorum_percent > 100 then
    raise exception 'Invalid decision settings' using errcode='22023';
  end if;
  if target_decision_type='election' then
    effective_mode := 'single';
    effective_visibility := 'after_close';
  end if;
  if target_approval_rule <> 'plurality' and effective_mode <> 'single' then
    raise exception 'Majority thresholds require single-choice voting' using errcode='22023';
  end if;
  if target_ends_at is null or target_ends_at <= now() then
    raise exception 'The closing date must be in the future' using errcode='22023';
  end if;
  if target_options is null or jsonb_typeof(target_options) is distinct from 'array'
     or jsonb_array_length(target_options) < 2
     or jsonb_array_length(target_options) > 20 then
    raise exception 'A decision must contain between 2 and 20 options or candidates' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(target_title,''))) < 3 then
    raise exception 'The title is too short' using errcode='22023';
  end if;

  insert into public.jec_decision_polls(
    workspace_id,title,description,decision_type,selection_mode,
    results_visibility,approval_rule,quorum_percent,allow_abstention,
    status,starts_at,ends_at,opened_at,created_by
  ) values (
    target_workspace_id,btrim(target_title),nullif(btrim(coalesce(target_description,'')),''),
    target_decision_type,effective_mode,effective_visibility,target_approval_rule,
    target_quorum_percent,coalesce(target_allow_abstention,true),
    'open',now(),target_ends_at,now(),current_user_id
  ) returning id into new_poll_id;

  for option_record in
    select value from jsonb_array_elements(target_options)
  loop
    option_label := btrim(coalesce(option_record->>'label',''));
    option_detail := nullif(btrim(coalesce(option_record->>'detail','')),'');
    if char_length(option_label)=0 or char_length(option_label)>180 then
      raise exception 'Each option must have a label of 1 to 180 characters' using errcode='22023';
    end if;
    insert into public.jec_decision_options(poll_id,label,detail,sort_order)
    values(new_poll_id,option_label,option_detail,option_count);
    option_count := option_count + 1;
  end loop;

  insert into public.jec_decision_eligible_voters(poll_id,user_id)
  select new_poll_id,m.user_id
  from public.jec_workspace_members m
  where m.workspace_id=target_workspace_id
    and m.membership_status='active';

  get diagnostics eligible_count = row_count;
  if eligible_count < 1 then
    raise exception 'No active workspace member is eligible to vote' using errcode='22023';
  end if;

  return new_poll_id;
end;
$$;
revoke all on function private.jec_create_decision_poll_impl(uuid,text,text,text,text,text,timestamptz,numeric,text,boolean,jsonb) from public,anon;
grant execute on function private.jec_create_decision_poll_impl(uuid,text,text,text,text,text,timestamptz,numeric,text,boolean,jsonb) to authenticated;

create or replace function private.jec_cast_decision_ballot_impl(
  target_poll_id uuid,
  target_option_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  poll_row public.jec_decision_polls%rowtype;
  chosen_ids uuid[] := coalesce(target_option_ids,array[]::uuid[]);
  chosen_count integer := coalesce(cardinality(target_option_ids),0);
  distinct_count integer := 0;
  valid_count integer := 0;
  new_ballot_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select * into poll_row
  from public.jec_decision_polls p
  where p.id=target_poll_id;

  if not found then
    raise exception 'Decision not found' using errcode='P0002';
  end if;
  if poll_row.status <> 'open' or now() < poll_row.starts_at or now() >= poll_row.ends_at then
    raise exception 'This vote is not currently open' using errcode='P0001';
  end if;
  if not exists (
    select 1 from public.jec_decision_eligible_voters ev
    where ev.poll_id=target_poll_id and ev.user_id=current_user_id
  ) then
    raise exception 'You are not on the eligible voter list for this decision' using errcode='42501';
  end if;

  select count(distinct choice_id) into distinct_count
  from unnest(chosen_ids) as selected(choice_id);
  if distinct_count <> chosen_count then
    raise exception 'Duplicate options are not allowed' using errcode='22023';
  end if;
  if chosen_count=0 and not poll_row.allow_abstention then
    raise exception 'Choose at least one option' using errcode='22023';
  end if;
  if poll_row.selection_mode='single' and chosen_count>1 then
    raise exception 'Only one option may be selected' using errcode='22023';
  end if;

  select count(*) into valid_count
  from public.jec_decision_options o
  where o.poll_id=target_poll_id and o.id=any(chosen_ids);
  if valid_count <> chosen_count then
    raise exception 'One or more selected options do not belong to this decision' using errcode='22023';
  end if;

  insert into public.jec_decision_voter_participation(poll_id,user_id)
  values(target_poll_id,current_user_id);

  insert into public.jec_decision_ballots(poll_id)
  values(target_poll_id)
  returning id into new_ballot_id;

  insert into public.jec_decision_ballot_selections(ballot_id,option_id)
  select new_ballot_id,selected.choice_id from unnest(chosen_ids) as selected(choice_id);
end;
$$;
revoke all on function private.jec_cast_decision_ballot_impl(uuid,uuid[]) from public,anon;
grant execute on function private.jec_cast_decision_ballot_impl(uuid,uuid[]) to authenticated;

create or replace function private.jec_close_decision_poll_impl(target_poll_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_workspace_id uuid;
begin
  select workspace_id into target_workspace_id
  from public.jec_decision_polls
  where id=target_poll_id and status='open'
  for update;
  if target_workspace_id is null then
    raise exception 'Open decision not found' using errcode='P0002';
  end if;
  if not private.can_manage_jec_workspace(target_workspace_id)
     and not private.is_jec_admin() then
    raise exception 'Workspace manager access required' using errcode='42501';
  end if;
  update public.jec_decision_polls
  set status='closed',closed_at=now(),updated_at=now()
  where id=target_poll_id and status='open';
end;
$$;
revoke all on function private.jec_close_decision_poll_impl(uuid) from public,anon;
grant execute on function private.jec_close_decision_poll_impl(uuid) to authenticated;

create or replace function private.jec_get_decision_poll_results_impl(target_poll_id uuid)
returns table (
  option_id uuid,
  option_label text,
  option_detail text,
  vote_count bigint,
  participant_count bigint,
  eligible_count bigint,
  turnout_percent numeric,
  quorum_met boolean,
  abstention_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  poll_row public.jec_decision_polls%rowtype;
  total_participants bigint;
  total_eligible bigint;
  total_abstentions bigint;
  quorum_ok boolean;
begin
  select * into poll_row from public.jec_decision_polls p where p.id=target_poll_id;
  if not found then
    raise exception 'Decision not found' using errcode='P0002';
  end if;
  if not private.is_jec_admin() and not private.is_jec_workspace_member(poll_row.workspace_id) then
    raise exception 'Workspace member access required' using errcode='42501';
  end if;
  if poll_row.results_visibility='after_close'
     and poll_row.status<>'closed'
     and poll_row.ends_at>now() then
    raise exception 'Results are hidden until the vote closes' using errcode='42501';
  end if;

  select count(*) into total_participants
  from public.jec_decision_voter_participation v where v.poll_id=target_poll_id;
  select count(*) into total_eligible
  from public.jec_decision_eligible_voters v where v.poll_id=target_poll_id;
  select count(*) into total_abstentions
  from public.jec_decision_ballots b
  where b.poll_id=target_poll_id
    and not exists (
      select 1 from public.jec_decision_ballot_selections s where s.ballot_id=b.id
    );
  quorum_ok := total_eligible=0 or total_participants >= ceil(total_eligible * poll_row.quorum_percent / 100.0);

  return query
  select
    o.id,
    o.label,
    o.detail,
    count(b.id)::bigint,
    total_participants,
    total_eligible,
    case when total_eligible=0 then 0::numeric
      else round(total_participants::numeric * 100 / total_eligible,1) end,
    quorum_ok,
    total_abstentions
  from public.jec_decision_options o
  left join public.jec_decision_ballot_selections s on s.option_id=o.id
  left join public.jec_decision_ballots b on b.id=s.ballot_id and b.poll_id=target_poll_id
  where o.poll_id=target_poll_id
  group by o.id,o.label,o.detail,o.sort_order,o.created_at
  order by o.sort_order,o.created_at;
end;
$$;
revoke all on function private.jec_get_decision_poll_results_impl(uuid) from public,anon;
grant execute on function private.jec_get_decision_poll_results_impl(uuid) to authenticated;


create or replace function public.jec_create_decision_poll(target_workspace_id uuid, target_title text, target_description text, target_decision_type text, target_selection_mode text, target_results_visibility text, target_ends_at timestamptz, target_quorum_percent numeric, target_approval_rule text, target_allow_abstention boolean, target_options jsonb)
returns uuid
language sql
security invoker
set search_path = ''
as $ select private.jec_create_decision_poll_impl(target_workspace_id,target_title,target_description,target_decision_type,target_selection_mode,target_results_visibility,target_ends_at,target_quorum_percent,target_approval_rule,target_allow_abstention,target_options); $;
revoke all on function public.jec_create_decision_poll(uuid,text,text,text,text,text,timestamptz,numeric,text,boolean,jsonb) from public,anon;
grant execute on function public.jec_create_decision_poll(uuid,text,text,text,text,text,timestamptz,numeric,text,boolean,jsonb) to authenticated;


create or replace function public.jec_cast_decision_ballot(target_poll_id uuid, target_option_ids uuid[] default array[]::uuid[])
returns void
language sql
security invoker
set search_path = ''
as $ select private.jec_cast_decision_ballot_impl(target_poll_id,target_option_ids); $;
revoke all on function public.jec_cast_decision_ballot(uuid,uuid[]) from public,anon;
grant execute on function public.jec_cast_decision_ballot(uuid,uuid[]) to authenticated;


create or replace function public.jec_close_decision_poll(target_poll_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $ select private.jec_close_decision_poll_impl(target_poll_id); $;
revoke all on function public.jec_close_decision_poll(uuid) from public,anon;
grant execute on function public.jec_close_decision_poll(uuid) to authenticated;


create or replace function public.jec_get_decision_poll_results(target_poll_id uuid)
returns table (option_id uuid, option_label text, option_detail text, vote_count bigint, participant_count bigint, eligible_count bigint, turnout_percent numeric, quorum_met boolean, abstention_count bigint)
language sql
security invoker
set search_path = ''
as $ select * from private.jec_get_decision_poll_results_impl(target_poll_id); $;
revoke all on function public.jec_get_decision_poll_results(uuid) from public,anon;
grant execute on function public.jec_get_decision_poll_results(uuid) to authenticated;

comment on table public.jec_decision_polls is
  'Member consultations, formal votes and elections scoped to a JEC workspace.';
comment on table public.jec_decision_eligible_voters is
  'Immutable eligibility snapshot created when a decision is launched.';
comment on table public.jec_decision_voter_participation is
  'Named participation register. It does not contain ballot selections.';
comment on table public.jec_decision_ballots is
  'Ballots without a voter identifier; results are exposed only as aggregates.';
