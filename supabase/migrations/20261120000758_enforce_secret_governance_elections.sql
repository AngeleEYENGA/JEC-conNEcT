-- Enforce secret elections and delayed results in the database, not only in the UI.
-- This protects the governance rules even when an authenticated client calls the RPC directly.

CREATE OR REPLACE FUNCTION private.jec_create_governance_ballot(p_workspace_id uuid, p_meeting_id uuid, p_ballot_type text, p_title text, p_description text, p_voting_mode text, p_is_anonymous boolean, p_eligibility_scope text, p_results_visibility text, p_quorum_percent integer, p_approval_rule text, p_opens_at timestamp with time zone, p_closes_at timestamp with time zone, p_options jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    p_voting_mode,
    case when p_ballot_type='election' then true else coalesce(p_is_anonymous,true) end,
    p_eligibility_scope,
    case when p_ballot_type='election' then 'after_close' else p_results_visibility end,
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
    select eligible.ballot_id,eligible.user_id
    from (
      select new_ballot_id as ballot_id,m.user_id
      from public.jec_memberships m
      where m.membership_status='verified'
      union
      select new_ballot_id as ballot_id,a.user_id
      from private.jec_admins a
    ) eligible
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
        select 1 from public.jec_workspace_members wm
        where wm.workspace_id=p_workspace_id
          and wm.user_id=o.candidate_user_id
          and wm.membership_status='active'
          and private.is_jec_verified_or_admin(wm.user_id)
      )
  ) then
    raise exception 'Every candidate must be an active verified member of this workspace' using errcode='22023';
  end if;

  return new_ballot_id;
end;
$function$


-- Defence in depth: reject any direct or future write that weakens election privacy.
do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jec_governance_election_privacy_check'
      and conrelid = 'public.jec_governance_ballots'::regclass
  ) then
    alter table public.jec_governance_ballots
      add constraint jec_governance_election_privacy_check
      check (
        ballot_type <> 'election'
        or (
          is_anonymous = true
          and results_visibility = 'after_close'
          and voting_mode = 'single'
        )
      );
  end if;
end
$migration$;

comment on constraint jec_governance_election_privacy_check
on public.jec_governance_ballots is
  'Elections must use single-choice secret ballots with results hidden until closing.';
