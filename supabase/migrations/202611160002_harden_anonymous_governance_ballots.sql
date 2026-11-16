-- Harden the secret-ballot path in the existing JEC governance module.
-- The named submission register prevents duplicate voting, while anonymous
-- choices are grouped with a random receipt that has no relationship to auth.users.

alter table public.jec_governance_vote_choices
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists anonymous_vote_id uuid;

alter table public.jec_governance_vote_choices
  drop constraint if exists jec_governance_vote_choices_pkey;

alter table public.jec_governance_vote_choices
  alter column id set not null,
  alter column voter_id drop not null;

alter table public.jec_governance_vote_choices
  add constraint jec_governance_vote_choices_pkey primary key (id);

alter table public.jec_governance_vote_choices
  drop constraint if exists jec_governance_vote_choices_identity_check;

alter table public.jec_governance_vote_choices
  add constraint jec_governance_vote_choices_identity_check
  check (
    (voter_id is not null and anonymous_vote_id is null)
    or
    (voter_id is null and anonymous_vote_id is not null)
  );

create unique index if not exists idx_jec_governance_choices_named_unique
  on public.jec_governance_vote_choices(ballot_id, voter_id, option_id)
  where voter_id is not null;

create unique index if not exists idx_jec_governance_choices_anonymous_unique
  on public.jec_governance_vote_choices(ballot_id, anonymous_vote_id, option_id)
  where anonymous_vote_id is not null;

create index if not exists idx_jec_governance_choices_named_voter
  on public.jec_governance_vote_choices(ballot_id, voter_id)
  where voter_id is not null;

create or replace function private.jec_cast_governance_vote(
  target_ballot_id uuid,
  selected_option_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := (select auth.uid());
  b public.jec_governance_ballots%rowtype;
  selected_count integer;
  unique_count integer;
  anonymous_receipt uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select * into b
  from public.jec_governance_ballots
  where id=target_ballot_id;

  if b.id is null then
    raise exception 'Ballot not found' using errcode='P0002';
  end if;

  if b.status<>'open' or b.opens_at>now() or b.closes_at<=now() then
    raise exception 'This ballot is not currently open' using errcode='22023';
  end if;

  if not exists (
    select 1 from public.jec_governance_eligible_voters e
    where e.ballot_id=target_ballot_id and e.user_id=current_user_id
  ) then
    raise exception 'You are not eligible to vote in this ballot' using errcode='42501';
  end if;

  if selected_option_ids is null then
    raise exception 'Select at least one option' using errcode='22023';
  end if;

  selected_count:=cardinality(selected_option_ids);
  select count(distinct x) into unique_count
  from unnest(selected_option_ids) as selected(x);

  if selected_count<1 or unique_count<>selected_count then
    raise exception 'Invalid or duplicate selections' using errcode='22023';
  end if;

  if b.voting_mode='single' and selected_count<>1 then
    raise exception 'This ballot accepts exactly one choice' using errcode='22023';
  end if;

  if selected_count>10 then
    raise exception 'You can select at most ten options' using errcode='22023';
  end if;

  if exists (
    select 1
    from unnest(selected_option_ids) as selected(x)
    where not exists (
      select 1 from public.jec_governance_options o
      where o.id=selected.x and o.ballot_id=target_ballot_id
    )
  ) then
    raise exception 'An option does not belong to this ballot' using errcode='22023';
  end if;

  -- The unique (ballot_id, voter_id) key in submissions is the authoritative
  -- anti-double-vote control. It does not reference anonymous choices.
  insert into public.jec_governance_vote_submissions(ballot_id,voter_id)
  values(target_ballot_id,current_user_id);

  if b.is_anonymous then
    anonymous_receipt := gen_random_uuid();
    insert into public.jec_governance_vote_choices(
      ballot_id,voter_id,anonymous_vote_id,option_id
    )
    select target_ballot_id,null,anonymous_receipt,selected.x
    from unnest(selected_option_ids) as selected(x);
  else
    insert into public.jec_governance_vote_choices(
      ballot_id,voter_id,anonymous_vote_id,option_id
    )
    select target_ballot_id,current_user_id,null,selected.x
    from unnest(selected_option_ids) as selected(x);
  end if;
end;
$function$;

revoke all on function private.jec_cast_governance_vote(uuid,uuid[]) from public,anon;
grant execute on function private.jec_cast_governance_vote(uuid,uuid[]) to authenticated;

comment on column public.jec_governance_vote_choices.anonymous_vote_id is
  'Random per-ballot receipt used only to group choices within one anonymous ballot; never linked to an account.';
comment on column public.jec_governance_vote_choices.voter_id is
  'Set only for explicitly non-anonymous ballots; null for secret ballots.';
comment on table public.jec_governance_eligible_voters is
  'RLS intentionally denies direct client reads; eligibility is returned only through the protected ballot RPC.';
comment on table public.jec_governance_vote_submissions is
  'Named participation register used to enforce one submission per eligible voter.';
comment on table public.jec_governance_vote_choices is
  'RLS intentionally denies direct client reads; secret choices have no voter identifier and are exposed only as aggregates.';
