-- Remove inherited table-level privileges that bypass RLS or are not needed
-- by the member-facing governance interface. Only SELECT is required for ballot
-- metadata/options; all writes go through authenticated SECURITY INVOKER wrappers
-- into the protected private SECURITY DEFINER functions.

revoke all privileges on table
  public.jec_governance_ballots,
  public.jec_governance_options,
  public.jec_governance_eligible_voters,
  public.jec_governance_vote_submissions,
  public.jec_governance_vote_choices
from anon, authenticated;

grant select on table
  public.jec_governance_ballots,
  public.jec_governance_options
to authenticated;

revoke all on function public.jec_create_governance_ballot(
  uuid,uuid,text,text,text,text,boolean,text,text,integer,text,timestamptz,timestamptz,jsonb
) from public, anon;
revoke all on function public.jec_open_governance_ballot(uuid) from public, anon;
revoke all on function public.jec_cast_governance_vote(uuid,uuid[]) from public, anon;
revoke all on function public.jec_close_governance_ballot(uuid) from public, anon;
revoke all on function public.jec_governance_ballot_results(uuid) from public, anon;

grant execute on function public.jec_create_governance_ballot(
  uuid,uuid,text,text,text,text,boolean,text,text,integer,text,timestamptz,timestamptz,jsonb
) to authenticated;
grant execute on function public.jec_open_governance_ballot(uuid) to authenticated;
grant execute on function public.jec_cast_governance_vote(uuid,uuid[]) to authenticated;
grant execute on function public.jec_close_governance_ballot(uuid) to authenticated;
grant execute on function public.jec_governance_ballot_results(uuid) to authenticated;

comment on table public.jec_governance_vote_choices is
  'Direct authenticated and anonymous table access is revoked; ballots are submitted through RPCs and results are aggregate-only.';
