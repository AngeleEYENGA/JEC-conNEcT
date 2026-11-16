-- JEC-conNEcT collective consultations, decisions and elections.
-- Ballots are private to their workspace/eligible voters. Individual ballot records
-- are never exposed to the client; only aggregate results are returned by an RPC.

create table if not exists public.jec_governance_ballots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.jec_workspaces(id) on delete cascade,
  meeting_id uuid references public.jec_meetings(id) on delete set null,
  ballot_type text not null check (ballot_type in ('consultation','decision','election')),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  description text,
  voting_mode text not null default 'single' check (voting_mode in ('single','multiple')),
  is_anonymous boolean not null default true,
  eligibility_scope text not null default 'workspace_members'
    check (eligibility_scope in ('workspace_members','meeting_participants','verified_members')),
  results_visibility text not null default 'after_close'
    check (results_visibility in ('live','after_close')),
  quorum_percent integer not null default 0 check (quorum_percent between 0 and 100),
  approval_rule text not null default 'plurality'
    check (approval_rule in ('plurality','simple_majority','absolute_majority','two_thirds')),
  status text not null default 'draft' check (status in ('draft','open','closed','cancelled')),
  opens_at timestamptz not null default now(),
  closes_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_governance_closes_after_open check (closes_at > opens_at),
  constraint jec_governance_multiple_not_election check (ballot_type <> 'election' or voting_mode = 'single')
);

create table if not exists public.jec_governance_options (
  id uuid primary key default gen_random_uuid(),
  ballot_id uuid not null references public.jec_governance_ballots(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 160),
  description text,
  candidate_user_id uuid references auth.users(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (ballot_id,id)
);

create unique index if not exists idx_jec_governance_unique_candidate
  on public.jec_governance_options(ballot_id,candidate_user_id)
  where candidate_user_id is not null;

-- Frozen voter eligibility list: the electorate is fixed when the ballot is created.
create table if not exists public.jec_governance_eligible_voters (
  ballot_id uuid not null references public.jec_governance_ballots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (ballot_id,user_id)
);

-- One submission per eligible member; choices are stored separately for multi-choice ballots.
create table if not exists public.jec_governance_vote_submissions (
  ballot_id uuid not null references public.jec_governance_ballots(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  primary key (ballot_id,voter_id)
);

create table if not exists public.jec_governance_vote_choices (
  ballot_id uuid not null,
  voter_id uuid not null,
  option_id uuid not null,
  primary key (ballot_id,voter_id,option_id),
  foreign key (ballot_id,voter_id)
    references public.jec_governance_vote_submissions(ballot_id,voter_id) on delete cascade,
  foreign key (ballot_id,option_id)
    references public.jec_governance_options(ballot_id,id) on delete cascade
);

create index if not exists idx_jec_governance_ballots_workspace
  on public.jec_governance_ballots(workspace_id,status,closes_at desc);
create index if not exists idx_jec_governance_ballots_meeting
  on public.jec_governance_ballots(meeting_id) where meeting_id is not null;
create index if not exists idx_jec_governance_eligible_user
  on public.jec_governance_eligible_voters(user_id,ballot_id);

alter table public.jec_governance_ballots enable row level security;
alter table public.jec_governance_options enable row level security;
alter table public.jec_governance_eligible_voters enable row level security;
alter table public.jec_governance_vote_submissions enable row level security;
alter table public.jec_governance_vote_choices enable row level security;

revoke all on public.jec_governance_ballots, public.jec_governance_options,
  public.jec_governance_eligible_voters, public.jec_governance_vote_submissions,
  public.jec_governance_vote_choices from anon;

grant select on public.jec_governance_ballots, public.jec_governance_options to authenticated;
revoke insert,update,delete on public.jec_governance_ballots,public.jec_governance_options
  from authenticated;
revoke all on public.jec_governance_eligible_voters,public.jec_governance_vote_submissions,
  public.jec_governance_vote_choices from authenticated;

create or replace function private.can_view_jec_governance_ballot(target_ballot_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1
    from public.jec_governance_ballots b
    where b.id=target_ballot_id
      and (
        private.is_jec_admin()
        or private.is_jec_workspace_member(b.workspace_id)
        or exists (
          select 1 from public.jec_governance_eligible_voters e
          where e.ballot_id=b.id and e.user_id=(select auth.uid())
        )
      )
  );
$$;

revoke all on function private.can_view_jec_governance_ballot(uuid) from public,anon;
grant execute on function private.can_view_jec_governance_ballot(uuid) to authenticated;

drop policy if exists "JEC members read governance ballots" on public.jec_governance_ballots;
create policy "JEC members read governance ballots"
on public.jec_governance_ballots for select to authenticated
using (private.can_view_jec_governance_ballot(id));

drop policy if exists "JEC members read governance ballot options" on public.jec_governance_options;
create policy "JEC members read governance ballot options"
on public.jec_governance_options for select to authenticated
using (private.can_view_jec_governance_ballot(ballot_id));

create or replace function private.jec_create_governance_ballot(
  p_workspace_id uuid,
  p_meeting_id uuid,
  p_ballot_type text,
  p_title text,
  p_description text,
  p_voting_mode text,
  p_is_anonymous boolean,
  p_eligibility_scope text,
  p_results_visibility text,
  p_quorum_percent integer,
  p_approval_rule text,
  p_opens_at timestamptz,
  p_closes_at timestamptz,
  p_options jsonb
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_ballot_id uuid;
  option_count integer;
  eligible_count integer;
  item record;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if not private.can_manage_jec_workspace(p_workspace_id) then
    raise exception 'Only workspace managers can create a ballot' using errcode='42501';
  end if;
  if p_ballot_type not in ('consultation','decision','election') then
    raise exception 'Unsupported ballot type' using errcode='22023';
  end if;
  if p_voting_mode not in ('single','multiple') or (p_ballot_type='election' and p_voting_mode<>'single') then
    raise exception 'Invalid voting mode for this ballot' using errcode='22023';
  end if;
  if p_eligibility_scope not in ('workspace_members','meeting_participants','verified_members') then
    raise exception 'Unsupported voter eligibility scope' using errcode='22023';
  end if;
  if p_results_visibility not in ('live','after_close')
     or p_quorum_percent < 0 or p_quorum_percent > 100
     or p_approval_rule not in ('plurality','simple_majority','absolute_majority','two_thirds') then
    raise exception 'Invalid ballot settings' using errcode='22023';
  end if;
  if p_closes_at is null or p_opens_at is null or p_closes_at<=p_opens_at then
    raise exception 'The closing time must be after the opening time' using errcode='22023';
  end if;
  if p_eligibility_scope='meeting_participants' and p_meeting_id is null then
    raise exception 'A meeting must be selected for meeting-participant voting' using errcode='22023';
  end if;
  if p_meeting_id is not null and not exists (
    select 1 from public.jec_meetings m
    where m.id=p_meeting_id and m.workspace_id=p_workspace_id
  ) then
    raise exception 'The selected meeting does not belong to this workspace' using errcode='22023';
  end if;
  if jsonb_typeof(p_options)<>'array' then
    raise exception 'At least two ballot options are required' using errcode='22023';
  end if;
  select count(*) into option_count from jsonb_array_elements(p_options) x;
  if option_count<2 or option_count>50 then
    raise exception 'A ballot must contain between 2 and 50 options' using errcode='22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_options) x
    where nullif(btrim(x.value->>'label'),'') is null
  ) then
    raise exception 'Every option must have a label' using errcode='22023';
  end if;
  if p_ballot_type='election' and exists (
    select 1 from jsonb_array_elements(p_options) x
    where nullif(x.value->>'candidate_user_id','') is null
  ) then
    raise exception 'Every election option must identify a candidate account' using errcode='22023';
  end if;
  if p_ballot_type<>'election' and exists (
    select 1 from jsonb_array_elements(p_options) x
    where nullif(x.value->>'candidate_user_id','') is not null
  ) then
    raise exception 'Candidate accounts are only allowed for elections' using errcode='22023';
  end if;

  insert into public.jec_governance_ballots(
    workspace_id,meeting_id,ballot_type,title,description,voting_mode,is_anonymous,
    eligibility_scope,results_visibility,quorum_percent,approval_rule,status,
    opens_at,closes_at,created_by
  ) values (
    p_workspace_id,p_meeting_id,p_ballot_type,btrim(p_title),nullif(btrim(p_description),''),
    p_voting_mode,coalesce(p_is_anonymous,true),p_eligibility_scope,p_results_visibility,
    p_quorum_percent,p_approval_rule,
    case when p_opens_at<=now() and p_closes_at>now() then 'open' else 'draft' end,
    p_opens_at,p_closes_at,current_user_id
  ) returning id into new_ballot_id;

  insert into public.jec_governance_options(ballot_id,label,description,candidate_user_id,sort_order)
  select new_ballot_id,btrim(x.value->>'label'),nullif(btrim(x.value->>'description'),''),
    nullif(x.value->>'candidate_user_id','')::uuid,(x.ordinality-1)::integer
  from jsonb_array_elements(p_options) with ordinality as x(value,ordinality);

  if p_eligibility_scope='workspace_members' then
    insert into public.jec_governance_eligible_voters(ballot_id,user_id)
    select new_ballot_id,m.user_id
    from public.jec_workspace_members m
    where m.workspace_id=p_workspace_id and m.membership_status='active'
      and private.is_jec_verified_or_admin(m.user_id)
    on conflict do nothing;
  elsif p_eligibility_scope='meeting_participants' then
    insert into public.jec_governance_eligible_voters(ballot_id,user_id)
    select new_ballot_id,p.user_id
    from public.jec_meeting_participants p
    where p.meeting_id=p_meeting_id and p.attendance_status in ('accepted','attended')
      and private.is_jec_verified_or_admin(p.user_id)
    on conflict do nothing;
  else
    insert into public.jec_governance_eligible_voters(ballot_id,user_id)
    select new_ballot_id,m.user_id from public.jec_memberships m
    where m.membership_status='verified'
    on conflict do nothing;
  end if;

  select count(*) into eligible_count
  from public.jec_governance_eligible_voters e where e.ballot_id=new_ballot_id;
  if eligible_count=0 then
    raise exception 'No eligible voter was found for this ballot' using errcode='22023';
  end if;

  if p_ballot_type='election' and exists (
    select 1
    from public.jec_governance_options o
    where o.ballot_id=new_ballot_id
      and not exists (
        select 1 from public.jec_governance_eligible_voters e
        where e.ballot_id=new_ballot_id and e.user_id=o.candidate_user_id
      )
  ) then
    raise exception 'Every candidate must belong to the selected electorate' using errcode='22023';
  end if;

  return new_ballot_id;
end;
$$;

revoke all on function private.jec_create_governance_ballot(uuid,uuid,text,text,text,text,boolean,text,text,integer,text,timestamptz,timestamptz,jsonb) from public,anon;
grant execute on function private.jec_create_governance_ballot(uuid,uuid,text,text,text,text,boolean,text,text,integer,text,timestamptz,timestamptz,jsonb) to authenticated;

create or replace function public.jec_create_governance_ballot(
  p_workspace_id uuid,
  p_meeting_id uuid,
  p_ballot_type text,
  p_title text,
  p_description text,
  p_voting_mode text,
  p_is_anonymous boolean,
  p_eligibility_scope text,
  p_results_visibility text,
  p_quorum_percent integer,
  p_approval_rule text,
  p_opens_at timestamptz,
  p_closes_at timestamptz,
  p_options jsonb
)
returns uuid language sql security invoker set search_path=''
as $$
  select private.jec_create_governance_ballot(
    p_workspace_id,p_meeting_id,p_ballot_type,p_title,p_description,p_voting_mode,
    p_is_anonymous,p_eligibility_scope,p_results_visibility,p_quorum_percent,
    p_approval_rule,p_opens_at,p_closes_at,p_options
  );
$$;
revoke all on function public.jec_create_governance_ballot(uuid,uuid,text,text,text,text,boolean,text,text,integer,text,timestamptz,timestamptz,jsonb) from public,anon;
grant execute on function public.jec_create_governance_ballot(uuid,uuid,text,text,text,text,boolean,text,text,integer,text,timestamptz,timestamptz,jsonb) to authenticated;

create or replace function private.jec_open_governance_ballot(target_ballot_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare b public.jec_governance_ballots%rowtype;
begin
  select * into b from public.jec_governance_ballots where id=target_ballot_id for update;
  if b.id is null then raise exception 'Ballot not found' using errcode='P0002'; end if;
  if not private.can_manage_jec_workspace(b.workspace_id) then
    raise exception 'Only workspace managers can open this ballot' using errcode='42501';
  end if;
  if b.status<>'draft' or b.opens_at>now() or b.closes_at<=now() then
    raise exception 'This ballot cannot be opened at this time' using errcode='22023';
  end if;
  update public.jec_governance_ballots set status='open',updated_at=now() where id=target_ballot_id;
end;
$$;
revoke all on function private.jec_open_governance_ballot(uuid) from public,anon;
grant execute on function private.jec_open_governance_ballot(uuid) to authenticated;
create or replace function public.jec_open_governance_ballot(target_ballot_id uuid)
returns void language sql security invoker set search_path=''
as $$ select private.jec_open_governance_ballot(target_ballot_id); $$;
revoke all on function public.jec_open_governance_ballot(uuid) from public,anon;
grant execute on function public.jec_open_governance_ballot(uuid) to authenticated;

create or replace function private.jec_close_governance_ballot(target_ballot_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare b public.jec_governance_ballots%rowtype;
begin
  select * into b from public.jec_governance_ballots where id=target_ballot_id for update;
  if b.id is null then raise exception 'Ballot not found' using errcode='P0002'; end if;
  if not private.can_manage_jec_workspace(b.workspace_id) then
    raise exception 'Only workspace managers can close this ballot' using errcode='42501';
  end if;
  if b.status<>'open' then raise exception 'This ballot is not open' using errcode='22023'; end if;
  update public.jec_governance_ballots set status='closed',updated_at=now() where id=target_ballot_id;
end;
$$;
revoke all on function private.jec_close_governance_ballot(uuid) from public,anon;
grant execute on function private.jec_close_governance_ballot(uuid) to authenticated;
create or replace function public.jec_close_governance_ballot(target_ballot_id uuid)
returns void language sql security invoker set search_path=''
as $$ select private.jec_close_governance_ballot(target_ballot_id); $$;
revoke all on function public.jec_close_governance_ballot(uuid) from public,anon;
grant execute on function public.jec_close_governance_ballot(uuid) to authenticated;

create or replace function private.jec_cast_governance_vote(
  target_ballot_id uuid,
  selected_option_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  current_user_id uuid := (select auth.uid());
  b public.jec_governance_ballots%rowtype;
  selected_count integer;
  unique_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into b from public.jec_governance_ballots where id=target_ballot_id;
  if b.id is null then raise exception 'Ballot not found' using errcode='P0002'; end if;
  if b.status<>'open' or b.opens_at>now() or b.closes_at<=now() then
    raise exception 'This ballot is not currently open' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.jec_governance_eligible_voters e
    where e.ballot_id=target_ballot_id and e.user_id=current_user_id
  ) then raise exception 'You are not eligible to vote in this ballot' using errcode='42501'; end if;
  if selected_option_ids is null then
    raise exception 'Select at least one option' using errcode='22023';
  end if;
  selected_count:=cardinality(selected_option_ids);
  select count(distinct x) into unique_count from unnest(selected_option_ids) x;
  if selected_count<1 or unique_count<>selected_count then
    raise exception 'Invalid or duplicate selections' using errcode='22023';
  end if;
  if b.voting_mode='single' and selected_count<>1 then
    raise exception 'This ballot accepts exactly one choice' using errcode='22023';
  end if;
  if selected_count>10 then raise exception 'You can select at most ten options' using errcode='22023'; end if;
  if exists (
    select 1 from unnest(selected_option_ids) x
    where not exists (
      select 1 from public.jec_governance_options o
      where o.id=x and o.ballot_id=target_ballot_id
    )
  ) then raise exception 'An option does not belong to this ballot' using errcode='22023'; end if;
  if exists (
    select 1 from public.jec_governance_vote_submissions s
    where s.ballot_id=target_ballot_id and s.voter_id=current_user_id
  ) then raise exception 'Your vote has already been recorded' using errcode='23505'; end if;

  insert into public.jec_governance_vote_submissions(ballot_id,voter_id)
  values(target_ballot_id,current_user_id);
  insert into public.jec_governance_vote_choices(ballot_id,voter_id,option_id)
  select target_ballot_id,current_user_id,x from unnest(selected_option_ids) x;
end;
$$;
revoke all on function private.jec_cast_governance_vote(uuid,uuid[]) from public,anon;
grant execute on function private.jec_cast_governance_vote(uuid,uuid[]) to authenticated;
create or replace function public.jec_cast_governance_vote(target_ballot_id uuid,selected_option_ids uuid[])
returns void language sql security invoker set search_path=''
as $$ select private.jec_cast_governance_vote(target_ballot_id,selected_option_ids); $$;
revoke all on function public.jec_cast_governance_vote(uuid,uuid[]) from public,anon;
grant execute on function public.jec_cast_governance_vote(uuid,uuid[]) to authenticated;

create or replace function private.jec_governance_ballot_results(target_ballot_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  b public.jec_governance_ballots%rowtype;
  result_visible boolean;
  eligible_count integer;
  voter_count integer;
  option_results jsonb;
begin
  select * into b from public.jec_governance_ballots where id=target_ballot_id;
  if b.id is null then raise exception 'Ballot not found' using errcode='P0002'; end if;
  if not private.can_view_jec_governance_ballot(target_ballot_id) then
    raise exception 'You cannot view this ballot' using errcode='42501';
  end if;
  result_visible := b.results_visibility='live' or b.status in ('closed','cancelled') or b.closes_at<=now();

  select count(*) into eligible_count from public.jec_governance_eligible_voters e
  where e.ballot_id=target_ballot_id;
  select count(*) into voter_count from public.jec_governance_vote_submissions s
  where s.ballot_id=target_ballot_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',o.id,
      'label',o.label,
      'description',o.description,
      'candidate_user_id',o.candidate_user_id,
      'votes',case when result_visible then coalesce(v.vote_count,0) else null end
    ) order by o.sort_order
  ),'[]'::jsonb)
  into option_results
  from public.jec_governance_options o
  left join (
    select c.option_id,count(*)::integer as vote_count
    from public.jec_governance_vote_choices c
    where c.ballot_id=target_ballot_id
    group by c.option_id
  ) v on v.option_id=o.id
  where o.ballot_id=target_ballot_id;

  return jsonb_build_object(
    'ballot_id',target_ballot_id,
    'status',case when b.status='open' and b.closes_at<=now() then 'closed' else b.status end,
    'eligible_count',eligible_count,
    'voter_count',case when result_visible then voter_count else null end,
    'is_eligible',exists (
      select 1 from public.jec_governance_eligible_voters e
      where e.ballot_id=target_ballot_id and e.user_id=(select auth.uid())
    ),
    'has_voted',exists (
      select 1 from public.jec_governance_vote_submissions s
      where s.ballot_id=target_ballot_id and s.voter_id=(select auth.uid())
    ),
    'results_visible',result_visible,
    'quorum_reached',case when result_visible then
      (b.quorum_percent=0 or voter_count*100>=eligible_count*b.quorum_percent)
      else null end,
    'options',option_results
  );
end;
$$;
revoke all on function private.jec_governance_ballot_results(uuid) from public,anon;
grant execute on function private.jec_governance_ballot_results(uuid) to authenticated;
create or replace function public.jec_governance_ballot_results(target_ballot_id uuid)
returns jsonb language sql stable security invoker set search_path=''
as $$ select private.jec_governance_ballot_results(target_ballot_id); $$;
revoke all on function public.jec_governance_ballot_results(uuid) from public,anon;
grant execute on function public.jec_governance_ballot_results(uuid) to authenticated;

comment on table public.jec_governance_ballots is
  'JEC collective consultations, formal decision votes and internal elections, scoped to a workspace and optional meeting.';
comment on table public.jec_governance_eligible_voters is
  'Frozen eligibility snapshot per governance ballot; never directly exposed to client roles.';
comment on table public.jec_governance_vote_submissions is
  'Private one-per-voter submission register used to prevent duplicate ballots; individual identities are not readable by client roles.';
comment on table public.jec_governance_vote_choices is
  'Private ballot selections; clients receive aggregate option counts only through a guarded RPC.';
