insert into public.jec_partner_contacts (
  partner_id,full_name,role_title,email,phone,preferred_contact_method,is_primary,consent_status,notes,created_by
)
select
  p.id,
  'Bureau national de la JEC Cameroun',
  'Coordonnées institutionnelles figurant sur le livret du Camp national universitaire Garoua 2026',
  'jeccameroun@yahoo.fr',
  '+237 699 668 813 / +237 671 810 972',
  'email',
  true,
  'not_recorded',
  'Le livret indique également BP 540 Yaoundé. Coordonnées reprises du document transmis ; confirmer leur actualité avant tout usage.',
  a.user_id
from public.jec_partners p
cross join lateral (select user_id from private.jec_admins order by user_id limit 1) a
where p.slug='jec-cameroun-bureau-national'
and not exists (
  select 1 from public.jec_partner_contacts c
  where c.partner_id=p.id and c.email='jeccameroun@yahoo.fr'
);