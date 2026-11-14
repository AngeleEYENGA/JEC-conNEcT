-- Verified JEC members can consult internal partner entries even while their facts await validation.
-- Restricted partner records remain limited to assigned teams and JEC administrators.
create or replace function private.can_access_jec_partner(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select (select auth.uid()) is not null and (
    private.is_jec_admin()
    or private.jec_has_partner_access(target_partner_id,array['manager','editor','viewer']::text[])
    or exists (
      select 1 from public.jec_partners p
      where p.id=target_partner_id
        and p.visibility in ('public','internal')
        and private.is_jec_verified_or_admin((select auth.uid()))
    )
  );
$$;
revoke all on function private.can_access_jec_partner(uuid) from public,anon,authenticated;
grant execute on function private.can_access_jec_partner(uuid) to authenticated;

-- The national office identity is explicitly named by the booklet.
-- The Garoua local-sector identity stays pending because the booklet only says "host sector".
update public.jec_partners
set verification_status='verified', updated_at=now()
where slug='jec-cameroun-bureau-national';

update public.jec_partners
set verification_status='pending', relationship_status='to_confirm', updated_at=now()
where slug='jec-garoua-secteur-hote';
