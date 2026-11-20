-- Dynamic public news and event publishing, separate from private workspaces and meeting calendars.
create table if not exists public.jec_public_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('news','event')),
  title text not null check (char_length(btrim(title)) between 3 and 200),
  title_en text check (title_en is null or char_length(title_en) <= 200),
  summary text not null check (char_length(btrim(summary)) between 5 and 6000),
  summary_en text check (summary_en is null or char_length(summary_en) <= 6000),
  category text check (category is null or char_length(category) <= 100),
  category_en text check (category_en is null or char_length(category_en) <= 100),
  content_date date not null,
  date_label text check (date_label is null or char_length(date_label) <= 100),
  starts_on date,
  ends_on date,
  source_name text not null check (char_length(btrim(source_name)) between 2 and 200),
  source_label text not null check (char_length(btrim(source_label)) between 2 and 300),
  source_kind text not null default 'article'
    check (source_kind in ('article','booklet','official_notice','event_page','partner_release','other')),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  image_url text check (
    image_url is null or image_url ~* '^https?://'
    or (image_url like '/%' and image_url not like '//%')
  ),
  detail_path text check (detail_path is null or (detail_path like '/%' and detail_path not like '//%')),
  is_published boolean not null default false,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_public_content_event_dates_check check (
    (content_type = 'news' and starts_on is null and ends_on is null)
    or (content_type = 'event' and starts_on is not null and (ends_on is null or ends_on >= starts_on))
  )
);

create index if not exists idx_jec_public_content_news
  on public.jec_public_content(content_date desc)
  where is_published = true and content_type = 'news';
create index if not exists idx_jec_public_content_events
  on public.jec_public_content(starts_on asc)
  where is_published = true and content_type = 'event';

alter table public.jec_public_content enable row level security;
revoke all privileges on public.jec_public_content from public, anon, authenticated;
grant select on public.jec_public_content to anon, authenticated;
grant insert, update, delete on public.jec_public_content to authenticated;

drop policy if exists "Anyone can read published JEC public content" on public.jec_public_content;
create policy "Anyone can read published JEC public content"
on public.jec_public_content for select to anon, authenticated
using (is_published = true);

drop policy if exists "JEC administrators manage public content" on public.jec_public_content;
create policy "JEC administrators manage public content"
on public.jec_public_content for all to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

comment on table public.jec_public_content is
  'Editorially managed public JEC news and event listings. Public users can read published rows; only JEC administrators can manage content.';

insert into public.jec_public_content
  (content_type,title,title_en,summary,summary_en,category,category_en,content_date,date_label,
   source_name,source_label,source_kind,source_url,image_url,detail_path,is_published,published_at)
values
  ('news','3 vidéos pour un mieux-être et un mieux-vivre ensemble !','Three videos for well-being and living better together',
   'La JEC France présente trois vidéos consacrées à la santé mentale et aux compétences psychosociales, issues d''un travail mené au sein du mouvement.',
   'JEC France presents three videos about mental health and psychosocial skills, produced as part of the movement’s work.',
   'Santé et mieux-vivre','Health & well-being','2026-04-13','13 avril 2026','JEC France','Publication officielle JEC France','article',
   'https://jecfrance.org/3-videos-pour-un-mieux-etre-et-un-mieux-vivre-ensemble/','/images/news-wellbeing.svg',null,true,now()),
  ('news','Un jeu pour découvrir l’utilisation des compétences psychosociales','A game to discover psychosocial skills',
   'Un outil conçu dans le cadre d''un partenariat avec la JEC du Liban, pour sensibiliser les jeunes aux différentes situations de crise.',
   'A tool developed with JEC Lebanon to help young people understand and respond to different crisis situations.',
   'Ressources pédagogiques','Learning resources','2026-04-07','7 avril 2026','JEC France','Publication officielle JEC France','article',
   'https://jecfrance.org/un-jeu-pour-decouvrir-lutilisation-des-competences-psycho-sociales/','/images/news-learning.svg',null,true,now()),
  ('news','Les responsables se rencontrent et se forment !','JEC leaders meet and learn together',
   'La JEC France revient sur une rencontre de responsables d''équipes organisée le 21 février à Chevilly-Larue, autour de sujets liés à leur engagement et à leur rôle.',
   'JEC France reports on a team leaders’ gathering held on 21 February in Chevilly-Larue, focusing on their commitment and responsibilities.',
   'Vie du mouvement','Movement life','2026-04-07','7 avril 2026','JEC France','Publication officielle JEC France','article',
   'https://jecfrance.org/les-responsables-se-rencontrent-et-se-forment/','/images/news-leaders.svg',null,true,now()),
  ('news','Camp National Universitaire de Garoua 2026 : spiritualité active et citoyenneté responsable','Garoua 2026 National University Camp: active spirituality and responsible citizenship',
   'Le livret du camp présente huit journées de formation, de prière, de débats, de compétitions et d’activités culturelles au Centre Jeunesse Lumière de Ngalbidjie. Le thème reliait spiritualité active, citoyenneté responsable, numérique et développement durable au Cameroun.',
   'The camp booklet documents eight days of formation, prayer, discussions, competitions and cultural activities at the Centre Jeunesse Lumière de Ngalbidjie. Its theme connected active spirituality, responsible citizenship, digital technology and sustainable development in Cameroon.',
   'Vie du mouvement · Cameroun','Movement life · Cameroon','2026-07-26','26 juillet – 2 août 2026','JEC Cameroun — Bureau national','Source : livret du campiste transmis par la JEC du Cameroun','booklet',
   null,'/images/jec-community-illustration.svg','/actualites/camp-garoua-2026',true,now());

insert into public.jec_public_content
  (content_type,title,title_en,summary,summary_en,category,category_en,content_date,starts_on,ends_on,
   source_name,source_label,source_kind,source_url,detail_path,is_published,published_at)
values
  ('event','Camp National Universitaire de Garoua 2026','Garoua 2026 National University Camp',
   'Huit journées de formation, spiritualité, citoyenneté, vie culturelle et engagement au Centre Jeunesse Lumière de Ngalbidjie. Le livret du camp est désormais conservé dans la mémoire publique de JEC-conNEcT.',
   'Eight days of formation, spirituality, citizenship, cultural life and commitment at the Centre Jeunesse Lumière de Ngalbidjie. The camp booklet is now preserved in JEC-conNEcT’s public memory.',
   'Événement passé · Rétrospective','Past event · Recap','2026-07-26','2026-07-26','2026-08-02',
   'JEC Cameroun — Bureau national','Source : livret du campiste transmis par la JEC du Cameroun','booklet',null,
   '/actualites/camp-garoua-2026',true,now()),
  ('event','Journées Mondiales de la Jeunesse — Séoul 2027','World Youth Day — Seoul 2027',
   'Le site JMJ 2027 en France annonce le rendez-vous du 29 juillet au 8 août 2027 à Séoul, en Corée du Sud. Aucune participation de la JEC France n''est présumée.',
   'The French WYD 2027 website lists the event from 29 July to 8 August 2027 in Seoul, South Korea. No participation by JEC France is implied.',
   'Événement international · Source externe','International event · External source','2027-07-29','2027-07-29','2027-08-08',
   'JMJ 2027 France','Site officiel JMJ 2027 France','event_page','https://www.jmj2027.fr/',null,true,now());
