create table if not exists public.jec_ai_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  title text not null,
  publisher text not null default 'JEC France',
  source_type text not null default 'official_page',
  language text not null default 'fr',
  publication_date date,
  source_url text,
  evidence_label text not null,
  content_text text not null,
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public','members','workspace')),
  workspace_id uuid references public.jec_workspaces(id) on delete cascade,
  source_status text not null default 'draft'
    check (source_status in ('draft','approved','archived')),
  evidence_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(publisher,'')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(evidence_label,'')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(content_text,'')), 'C')
  ) stored,
  constraint jec_ai_workspace_scope_check
    check ((visibility_scope='workspace' and workspace_id is not null) or (visibility_scope<>'workspace' and workspace_id is null))
);

create index if not exists jec_ai_sources_search_idx
  on public.jec_ai_sources using gin(search_vector);
create index if not exists jec_ai_sources_status_scope_idx
  on public.jec_ai_sources(source_status,visibility_scope);

alter table public.jec_ai_sources enable row level security;
revoke all on public.jec_ai_sources from anon, authenticated;
grant select on public.jec_ai_sources to anon, authenticated;
grant insert, update, delete on public.jec_ai_sources to authenticated;

drop policy if exists "Public JEC AI sources are readable" on public.jec_ai_sources;
create policy "Public JEC AI sources are readable"
on public.jec_ai_sources for select to anon, authenticated
using (source_status='approved' and visibility_scope='public');

drop policy if exists "Verified members read member JEC AI sources" on public.jec_ai_sources;
create policy "Verified members read member JEC AI sources"
on public.jec_ai_sources for select to authenticated
using (
  source_status='approved'
  and visibility_scope='members'
  and private.is_jec_verified_or_admin((select auth.uid()))
);

drop policy if exists "Workspace members read workspace JEC AI sources" on public.jec_ai_sources;
create policy "Workspace members read workspace JEC AI sources"
on public.jec_ai_sources for select to authenticated
using (
  source_status='approved'
  and visibility_scope='workspace'
  and private.is_jec_workspace_member(workspace_id)
);

drop policy if exists "JEC admins manage JEC AI sources" on public.jec_ai_sources;
create policy "JEC admins manage JEC AI sources"
on public.jec_ai_sources for all to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

create or replace function public.jec_ai_search_sources(search_text text, result_limit integer default 8)
returns table (
  id uuid,
  source_key text,
  title text,
  publisher text,
  source_type text,
  language text,
  publication_date date,
  source_url text,
  evidence_label text,
  content_text text,
  score real
)
language sql
stable
security invoker
set search_path=''
as $$
  select
    s.id,s.source_key,s.title,s.publisher,s.source_type,s.language,
    s.publication_date,s.source_url,s.evidence_label,s.content_text,
    ts_rank(s.search_vector,websearch_to_tsquery('simple'::regconfig,search_text)) as score
  from public.jec_ai_sources s
  where s.source_status='approved'
    and s.search_vector @@ websearch_to_tsquery('simple'::regconfig,search_text)
  order by score desc,s.evidence_checked_at desc nulls last
  limit greatest(1,least(coalesce(result_limit,8),12));
$$;
revoke all on function public.jec_ai_search_sources(text,integer) from public;
grant execute on function public.jec_ai_search_sources(text,integer) to anon,authenticated;

comment on table public.jec_ai_sources is
  'Validated, source-attributed knowledge available to JEC AI. RLS filters public, verified-member and workspace scopes.';
comment on function public.jec_ai_search_sources(text,integer) is
  'Source-grounded full-text search. SECURITY INVOKER means the caller RLS applies before records are returned.';

insert into public.jec_ai_sources
(source_key,title,publisher,source_type,language,source_url,evidence_label,content_text,visibility_scope,source_status,evidence_checked_at)
values
('jec-history-france','Histoire de la JEC France depuis 1929','JEC France','official_page','fr','https://jecfrance.org/notre-histoire/','JEC France — Notre histoire',
'La JEC France situe ses origines en 1929. En mai 1929, jour de la fête de Jeanne d’Arc, les premiers jécistes reçurent des jocistes leurs insignes, semblables à ceux de la JOC mais de couleur bleue. La même année, Louis Chaudron et Paul Vignaux rédigèrent la brochure intitulée « La JEC, esquisse d’un programme général ». Une première édition de cette brochure est signalée en juillet 1929 dans le registre chronologique de JEC-conNEcT. En 1930, le mouvement lança « L’Appel », son organe mensuel. En 1968, la JEC accompagna les jeunes dans les turbulences de Mai 68 ; la source ne précise pas un événement ponctuel. Ces jalons concernent la JEC France.',
'public','approved',now()),
('jec-history-international','Repères historiques de la JECI / IYCS','Dicastère pour les Laïcs, la Famille et la Vie','official_page','fr','https://www.laityfamilylife.va/content/laityfamilylife/fr/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html','Dicastère — notice institutionnelle JECI/IYCS',
'La coordination internationale du mouvement étudiant chrétien JECI / IYCS est fondée en 1946. Le 25 mars 2009, l’IYCS est reconnue comme association internationale de fidèles par le Conseil pontifical pour les laïcs. Ces repères concernent le niveau international et ne doivent pas être confondus avec la fondation de la JEC France.',
'public','approved',now()),
('jec-approach-see-judge-act','La démarche Voir, Juger, Agir de la JEC','JEC France','official_page','fr','https://jecfrance.org/notre-demarche/','JEC France — Notre démarche',
'La pédagogie de la JEC est le Voir, Juger, Agir (VJA). Voir : regarder le monde autour de soi, dans son milieu d’étude et dans la société, et relever ce qui semble important, notamment les injustices et les signes d’espérance. Juger : comprendre ce qui se passe à partir des connaissances scientifiques, des expériences de vie et des valeurs humanistes et chrétiennes, puis discerner ce qui peut aller dans le sens souhaité. Agir : mener individuellement ou collectivement des actions concrètes à court, moyen ou long terme. L’évaluation est utile à chaque étape et plus explicitement après l’action. Le VJA est un outil d’accompagnement, pas un carcan.',
'public','approved',now()),
('jec-pillars','Les cinq piliers présentés par la JEC France','JEC France','official_page','fr','https://jecfrance.org/les-piliers-de-la-jec/','JEC France — Les piliers de la JEC',
'La page JEC France présente cinq piliers : École / Université, Église, Société, International et Environnement. École / Université : le milieu scolaire et universitaire est le terrain immédiat de la vie quotidienne et de l’action du mouvement ; la JEC cherche à rendre l’école plus démocratique, plus juste et plus ouverte. Église : un cadre pour se questionner sur ce qu’est être chrétien aujourd’hui et sur la manière de faire Église. Société : relier la vie lycéenne et étudiante aux enjeux sociaux, politiques et aux gestions de crise. International : penser global et agir localement, échanger avec des jeunes du monde entier via le réseau international. Environnement : la crise environnementale est considérée comme un enjeu d’avenir et l’écologie comme un sujet de réflexion et d’action.',
'public','approved',now()),
('jec-orientations-2021-2026','Orientations de la JEC France 2021–2026','JEC France','official_page','fr','https://jecfrance.org/nos-orientations/','JEC France — Nos orientations',
'Les orientations de la JEC France abordent plusieurs domaines. Vie du mouvement : renforcer les équipes existantes, développer de nouvelles équipes et mieux associer les anciens. Écoles et universités : créer des espaces de discussion pour que collégiens, lycéens et étudiants réfléchissent à leurs réalités et deviennent acteurs de leurs établissements ; renforcer la formation par l’éducation populaire ; contribuer à l’accueil des étudiants étrangers. Église : réserver une place aux temps spirituels, lectures bibliques et prières, tout en permettant aux jeunes de partager et échanger ; faire le lien entre les jeunes et l’Église ; renforcer le dialogue œcuménique et interreligieux. Société : participer au développement de la société et encourager l’engagement concret. International : communiquer avec les autres mouvements JEC et construire des projets communs. Environnement : approfondir l’écologie intégrale, la paix et l’avenir de la planète, et faire évoluer les pratiques associatives. Il s’agit des orientations publiées sur la page consultée ; vérifier leur période de validité avant de les présenter comme les orientations actuelles.',
'public','approved',now()),
('jec-camp-garoua-2026','Programme publié du Camp National Universitaire de Garoua 2026','JEC Cameroun — Bureau national','source_document','fr',null,'Livret du campiste de Garoua 2026 transmis à JEC-conNEcT',
'Le livret du campiste transmis à JEC-conNEcT porte l’en-tête du Bureau national de la Jeunesse Étudiante Chrétienne du Cameroun. Il présente un programme du 26 juillet au 2 août 2026 au Centre Jeunesse Lumière de Ngalbidjie, à Garoua. Il précise que le programme peut être modifié ; cette source décrit le programme publié et ne prouve pas que chaque activité a eu lieu exactement comme prévue. 26 juillet : accueil, installation et lancement. 27 juillet : spiritualité JEC, démarche Voir–Juger–Agir, économie bleue durable, bassin de la Bénoué et lac de Lagdo. 28 juillet : Bible, discernement et intelligence artificielle, dignité humaine et discernement chrétien à l’université. 29 juillet : planification des activités annuelles, rédaction d’un rapport JEC, concours de chant et de génie théâtral. 30 juillet : valeurs chrétiennes et sociales, leadership féminin et prise de responsabilités. 31 juillet : marche pour la paix et célébration des 72 ans de la JEC au Cameroun, selon le livret. 1er août : journée culturelle et entrepreneuriat numérique. 2 août : messe, cérémonie d’engagement, évaluation et clôture. Le livret cite notamment Père Alain Tega, Tchopwe Damou Ezechiel Arnaud, Abbé Jules Badawe Komo, Abbé Didier Gueneyora, Ndiba Ahmadou Patrick, Nodém Paul Valdès, Doudou Françoise, Dr Vandou Richard et l’association VISANTE.',
'public','approved',now()),
('jec-rally-fr','Chant de ralliement JEC — paroles françaises','JEC — document source transmis','song_lyrics','fr',null,'Chant_de_ralliement_JEC_avec_logo.docx',
'CHANT DE RALLIEMENT

1. Nous irons jusqu’au bout du monde, la JEC ne périra pas (2x)

Refrain :
La J.E.C., oui, oui, oui !
La J.E.C., oui, c’est vrai !
La J.E.C. ne périra pas (2x)

2. Tous ensemble, il faut qu’on s’imprègne de l’idéal de la J.E.C. (2x)

Refrain :
De l’idéal, oui, oui, oui !
De l’idéal, oui, c’est vrai !
De l’idéal de la J.E.C. (2x)

3. Travaillons avec tous nos frères à rendre meilleur le monde étudiant (2x)

Refrain :
À rendre meilleur, oui, oui, oui !
À rendre meilleur, oui, c’est vrai !
À rendre meilleur le monde étudiant (2x)

4. Par l’action et par la prière, nous serons forts pour changer les cœurs (2x)

Refrain :
Par l’action, oui, oui, oui !
Par la prière, oui, c’est vrai !
Nous serons forts pour changer les cœurs (2x)

5. Si je meurs, il faut qu’on m’enterre à la centrale de la J.E.C. (2x)

Refrain :
À la centrale, oui, oui, oui !
À la centrale, oui, c’est vrai !
À la centrale de la J.E.C. (2x)

6. Ce jour-là, il faut qu’on invite les aumôniers de la JEC (2x)

Refrain :
Les aumôniers, oui, oui, oui !
Les aumôniers, oui, c’est vrai !
Les aumôniers de la J.E.C. (2x)

7. Sur ma tombe, il faut qu’on inscrive les initiales de la J.E.C. (2x)

Refrain :
Les initiales, oui, oui, oui !
Les initiales, oui, c’est vrai !
Les initiales de la J.E.C. (2x)',
'public','approved',now()),
('jec-rally-en','YCS Rallying Song — English lyrics','JEC — source document supplied','song_lyrics','en',null,'YCS_Rallying_Chant_EN.docx',
'SONG OF RALLIEMENT — ENGLISH VERSION

1. We shall go to the ends of the world and the YCS shall never perish (twice).

Refrain:
The YCS, yes, yes, yes!
The YCS, yes, it’s true!
The YCS shall never perish (twice).

2. Together, we have to be filled with the ideal of the YCS (twice).

Refrain:
The ideal, yes, yes, yes!
The ideal, yes, it’s true!
The ideal of the YCS (twice).

3. Let us work with all our brothers to make the student world a better place (twice).

Refrain:
To make it better, yes, yes, yes!
To make it better, yes, it’s true!
To make the student world better (twice).

4. By action and prayer, we shall be strong enough to change hearts (twice).

Refrain:
By action, yes, yes, yes!
By prayer, yes, it’s true!
We shall be strong enough to change hearts (twice).

5. If I die, I shall be buried at the centre of the YCS (twice).

Refrain:
At the centre, yes, yes, yes!
At the centre, yes, it’s true!
At the centre of the YCS (twice).

6. On that day, we must invite the YCS chaplains (twice).

Refrain:
The chaplains, yes, yes, yes!
The chaplains, yes, it’s true!
The chaplains of the YCS (twice).

7. On my tomb, the initials of the YCS must be written (twice).

Refrain:
The initials, yes, yes, yes!
The initials, yes, it’s true!
The initials of the YCS (twice).',
'public','approved',now()),
('jec-anthem-fr','Hymne de la JEC — paroles françaises','JEC — document source transmis','song_lyrics','fr',null,'Hymne_principal_JEC.docx',
'HYMNE DE LA JEC — FRANÇAIS

REFRAIN
Chantons amis, la vie est belle,
Pour nos cœurs joyeux et fervents ;
Jécistes, le Christ nous appelle (2x)
Vers l’avenir, en avant (2x).

COUPLET
Nous sommes la jeunesse ardente,
Phalanges sans regret ni peur,
Et dans nos poitrines vibrantes
Bat le cœur du Christ Rédempteur.

Portons à travers les écoles
Son nom, sa loi, sa charité ;
Que tous entendent ses paroles,
Qu’ils naissent à la vérité.',
'public','approved',now()),
('jec-anthem-en','YCS Hymn — English lyrics','JEC — source document supplied','song_lyrics','en',null,'YCS_Main_Hymn_EN.docx',
'YCS HYMN — ENGLISH VERSION

CHORUS
Let us sing, friends, life is beautiful,
For our joyful and fervent hearts;
Young Christian Students, Christ calls us (twice),
Towards the future, forward (twice).

STANZA
We are the fiery youth,
Phalanxes without regret or fear,
And in our vibrant hearts
Beats the heart of Christ the Redeemer.

Let us carry through the schools
His name, His law, His charity;
May everyone hear His words,
And be born into the truth.',
'public','approved',now()),
('jec-news-wellbeing','Trois vidéos pour un mieux-être et un mieux-vivre ensemble','JEC France','official_article','fr','https://jecfrance.org/3-videos-pour-un-mieux-etre-et-un-mieux-vivre-ensemble/','Publication JEC France — 13 avril 2026',
'La publication JEC France du 13 avril 2026 présente trois vidéos consacrées à la santé mentale et aux compétences psychosociales, issues d’un travail mené au sein du mouvement.',
'public','approved',now()),
('jec-news-psychosocial-game','Jeu sur les compétences psychosociales — projet avec la JEC du Liban','JEC France','official_article','fr','https://jecfrance.org/un-jeu-pour-decouvrir-lutilisation-des-competences-psycho-sociales/','Publication JEC France — 7 avril 2026',
'La publication JEC France du 7 avril 2026 décrit un outil pédagogique conçu dans le cadre d’un partenariat avec la JEC du Liban, pour sensibiliser les jeunes aux différentes situations de crise. La même publication remercie le dispositif Initiative pour la Solidarité Internationale pour son soutien au projet. Ne pas présenter cela comme une convention permanente sans autre preuve.',
'public','approved',now()),
('jec-news-team-leaders','Rencontre et formation des responsables d’équipes','JEC France','official_article','fr','https://jecfrance.org/les-responsables-se-rencontrent-et-se-forment/','Publication JEC France — 7 avril 2026',
'La publication JEC France du 7 avril 2026 revient sur une rencontre de responsables d’équipes organisée le 21 février à Chevilly-Larue, autour de leur engagement et de leur rôle.',
'public','approved',now())
on conflict (source_key) do update set
  title=excluded.title,
  publisher=excluded.publisher,
  source_type=excluded.source_type,
  language=excluded.language,
  publication_date=excluded.publication_date,
  source_url=excluded.source_url,
  evidence_label=excluded.evidence_label,
  content_text=excluded.content_text,
  visibility_scope=excluded.visibility_scope,
  source_status=excluded.source_status,
  evidence_checked_at=excluded.evidence_checked_at,
  updated_at=now();
