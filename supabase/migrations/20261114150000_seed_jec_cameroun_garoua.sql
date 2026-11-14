-- JEC Cameroun and the Garoua host sector, based on the user-provided National Camp booklet.
-- Their connection to JEC France is deliberately left "to_confirm" pending confirmation from both movements.
insert into public.jec_partners (
  legal_name,display_name,slug,partner_types,geographic_scope,country_code,country_name,city,
  relationship_status,verification_status,visibility,evidence_label,evidence_summary,evidence_checked_at,created_by
)
select
  'Jeunesse Étudiante Chrétienne du Cameroun — Bureau National',
  'JEC Cameroun — Bureau national',
  'jec-cameroun-bureau-national',
  array['youth_movement','faith_based','international_network'],
  'national','CM','Cameroun','Yaoundé',
  'to_confirm','pending','internal',
  'Livret du Camp National Universitaire Garoua 2026',
  'Le document transmis porte l’en-tête de la Jeunesse Étudiante Chrétienne du Cameroun, Bureau National, avec une adresse BP 540 Yaoundé et une adresse électronique de contact. La relation institutionnelle avec la JEC France reste à confirmer.',
  now(),a.user_id
from private.jec_admins a
order by a.user_id limit 1
on conflict(slug) do nothing;

insert into public.jec_partners (
  legal_name,display_name,slug,partner_types,geographic_scope,country_code,country_name,city,
  relationship_status,verification_status,visibility,evidence_label,evidence_summary,evidence_checked_at,created_by
)
select
  'JEC Garoua — secteur hôte du Camp National Universitaire 2026 (dénomination officielle à confirmer)',
  'JEC Garoua — secteur hôte (à confirmer)',
  'jec-garoua-secteur-hote',
  array['youth_movement','faith_based'],
  'local','CM','Cameroun','Garoua',
  'to_confirm','pending','internal',
  'Livret du Camp National Universitaire Garoua 2026',
  'Le livret désigne un « secteur hôte » et situe le camp au Centre Jeunesse Lumière de Ngalbidjie, à Garoua. Il ne donne pas la dénomination administrative exacte du secteur ni les coordonnées de ses responsables. Fiche en attente de confirmation.',
  now(),a.user_id
from private.jec_admins a
order by a.user_id limit 1
on conflict(slug) do nothing;

insert into public.jec_partner_engagements (
  partner_id,title,engagement_type,support_kind,engagement_status,summary,starts_on,ends_on,created_by
)
select
  p.id,
  'Accueil du Camp National Universitaire Garoua 2026',
  'event','non_financial','completed',
  'Le livret du Bureau National mentionne le Centre Jeunesse Lumière de Ngalbidjie à Garoua et le secteur hôte dans l’organisation du camp. La fonction précise de chaque structure locale devra être confirmée par la JEC Cameroun.',
  '2026-07-26','2026-08-02',a.user_id
from public.jec_partners p
cross join lateral (select user_id from private.jec_admins order by user_id limit 1) a
where p.slug='jec-garoua-secteur-hote'
and not exists (
  select 1 from public.jec_partner_engagements e
  where e.partner_id=p.id and e.title='Accueil du Camp National Universitaire Garoua 2026'
);

insert into public.jec_partner_notes(partner_id,note_type,content,created_by)
select p.id,'other',
'Source : livret du Camp National Universitaire Garoua 2026 transmis dans la conversation. Le document identifie le Bureau National de la JEC du Cameroun, le Centre Jeunesse Lumière de Ngalbidjie et un « secteur hôte ». À confirmer avec les responsables : nom officiel du secteur, coordonnées, personnes référentes, statut et nature de la relation avec la JEC France.',
a.user_id
from public.jec_partners p
cross join lateral (select user_id from private.jec_admins order by user_id limit 1) a
where p.slug='jec-garoua-secteur-hote'
and not exists (select 1 from public.jec_partner_notes n where n.partner_id=p.id and n.content like 'Source : livret du Camp National Universitaire Garoua 2026%');

comment on table public.jec_partners is 'Partner records include documented JEC Cameroon and Garoua host-sector references; their relationship to JEC France remains pending confirmation.';
