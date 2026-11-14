alter table public.jec_ai_sources
  add column if not exists search_aliases text not null default '';

alter table public.jec_ai_sources drop column if exists search_vector;
alter table public.jec_ai_sources
  add column search_vector tsvector generated always as (
    setweight(
      to_tsvector('french'::regconfig, coalesce(title,'') || ' ' || coalesce(publisher,'') || ' ' || coalesce(evidence_label,'')),
      'A'
    ) ||
    setweight(
      to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(publisher,'') || ' ' || coalesce(evidence_label,'')),
      'A'
    ) ||
    setweight(
      to_tsvector('french'::regconfig, coalesce(search_aliases,'')),
      'B'
    ) ||
    setweight(
      to_tsvector('english'::regconfig, coalesce(search_aliases,'')),
      'B'
    ) ||
    setweight(
      to_tsvector('french'::regconfig, coalesce(content_text,'')),
      'C'
    ) ||
    setweight(
      to_tsvector('english'::regconfig, coalesce(content_text,'')),
      'C'
    )
  ) stored;

drop index if exists public.jec_ai_sources_search_idx;
create index jec_ai_sources_search_idx on public.jec_ai_sources using gin(search_vector);

update public.jec_ai_sources set search_aliases=
'JEC histoire histoire de la JEC France origines chronologie frise timeline YCS France origins of JEC France 1929 1930 Mai 68 1946 IYCS JECI MIEC'
where source_key='jec-history-france';

update public.jec_ai_sources set search_aliases=
'histoire JEC internationale coordination internationale 1946 reconnaissance 2009 JECI IYCS MIEC international history recognition'
where source_key='jec-history-international';

update public.jec_ai_sources set search_aliases=
'Voir Juger Agir Voir-Juger-Agir VJA pédagogie méthode démarche de la JEC See Judge Act See-Judge-Act SJA YCS method approach'
where source_key='jec-approach-see-judge-act';

update public.jec_ai_sources set search_aliases=
'cinq piliers de la JEC France cinq piliers école université église société international environnement five pillars of JEC France school university church society international environment'
where source_key='jec-pillars';

update public.jec_ai_sources set search_aliases=
'orientations JEC France rapport orientations 2021 2026 vie du mouvement école université église société international environnement YCS orientations strategy 2021 2026'
where source_key='jec-orientations-2021-2026';

update public.jec_ai_sources set search_aliases=
'Camp National Universitaire de Garoua 2026 programme campiste Garoua Cameroun 26 juillet 2 août Centre Jeunesse Lumière Ngalbidjie Garoua camp programme Cameroon YCS University Camp July August 2026'
where source_key='jec-camp-garoua-2026';

update public.jec_ai_sources set search_aliases=
'chant de ralliement paroles du chant de ralliement JEC version française chant rallying song French lyrics'
where source_key='jec-rally-fr';

update public.jec_ai_sources set search_aliases=
'chant de ralliement anglais paroles du chant de ralliement en anglais version anglaise du chant de ralliement YCS rallying song English rally song English lyrics'
where source_key='jec-rally-en';

update public.jec_ai_sources set search_aliases=
'hymne JEC hymne principal JEC Chantons amis la vie est belle paroles hymne français JEC anthem hymn in French'
where source_key='jec-anthem-fr';

update public.jec_ai_sources set search_aliases=
'hymne JEC en anglais paroles de l hymne principal JEC en anglais version anglaise hymne JEC YCS hymn English lyrics'
where source_key='jec-anthem-en';

update public.jec_ai_sources set search_aliases=
'santé mentale bien être mieux vivre ensemble compétences psychosociales vidéos mental health well-being psychosocial skills videos JEC France'
where source_key='jec-news-wellbeing';

update public.jec_ai_sources set search_aliases=
'jeu compétences psychosociales JEC Liban partenariat projet outil pédagogique situations de crise psychosocial skills game Lebanon YCS project'
where source_key='jec-news-psychosocial-game';

update public.jec_ai_sources set search_aliases=
'rencontre responsables équipe formation Chevilly Larue 21 février team leaders meeting training JEC France'
where source_key='jec-news-team-leaders';

comment on column public.jec_ai_sources.search_aliases is
  'Bilingual search-only synonyms. Never included in the source content sent to the model.';
