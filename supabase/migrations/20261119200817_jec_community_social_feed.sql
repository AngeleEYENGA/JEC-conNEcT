-- JEC Connect — global member community feed
-- Separate from private workspace feeds. Verified JEC members only.

create table if not exists public.jec_community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  mood text,
  status text not null default 'published'
    check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_community_posts_body_length check (char_length(trim(body)) between 1 and 5000),
  constraint jec_community_posts_mood_allowed check (
    mood is null or mood in ('joyful','grateful','hopeful','thoughtful','tired','concerned','motivated','celebrating')
  )
);

create table if not exists public.jec_community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.jec_community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  status text not null default 'published'
    check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_community_comments_body_length check (char_length(trim(body)) between 1 and 2000)
);

create table if not exists public.jec_community_reactions (
  post_id uuid not null references public.jec_community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null
    check (reaction_type in ('like','love','support','celebrate','pray')),
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);

create table if not exists public.jec_community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.jec_community_posts(id) on delete cascade,
  comment_id uuid references public.jec_community_comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null
    check (reason in ('spam','harassment','inappropriate','misinformation','privacy','other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'pending'
    check (status in ('pending','in_review','resolved','dismissed')),
  moderator_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint jec_community_reports_one_target check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create index if not exists idx_jec_community_posts_feed
  on public.jec_community_posts(status,created_at desc);
create index if not exists idx_jec_community_posts_author
  on public.jec_community_posts(author_id,created_at desc);
create index if not exists idx_jec_community_comments_post
  on public.jec_community_comments(post_id,created_at asc)
  where status='published';
create index if not exists idx_jec_community_reactions_post
  on public.jec_community_reactions(post_id,reaction_type);
create index if not exists idx_jec_community_reports_queue
  on public.jec_community_reports(status,created_at desc);

alter table public.jec_community_posts enable row level security;
alter table public.jec_community_comments enable row level security;
alter table public.jec_community_reactions enable row level security;
alter table public.jec_community_reports enable row level security;

revoke all on public.jec_community_posts from public,anon,authenticated;
revoke all on public.jec_community_comments from public,anon,authenticated;
revoke all on public.jec_community_reactions from public,anon,authenticated;
revoke all on public.jec_community_reports from public,anon,authenticated;

grant select,insert,delete on public.jec_community_posts to authenticated;
grant update(body,mood,status) on public.jec_community_posts to authenticated;
grant select,insert,delete on public.jec_community_comments to authenticated;
grant update(status) on public.jec_community_comments to authenticated;
grant select,insert,update(reaction_type),delete on public.jec_community_reactions to authenticated;
grant select,insert,update(status,moderator_id,reviewed_at) on public.jec_community_reports to authenticated;

-- Posts are available only to verified members and administrators.
drop policy if exists "Verified members read community posts" on public.jec_community_posts;
create policy "Verified members read community posts"
on public.jec_community_posts for select to authenticated
using (
  private.is_jec_admin()
  or (private.is_verified_jec_member() and status='published')
  or (author_id=(select auth.uid()) and private.is_verified_jec_member())
);

drop policy if exists "Verified members create community posts" on public.jec_community_posts;
create policy "Verified members create community posts"
on public.jec_community_posts for insert to authenticated
with check (
  author_id=(select auth.uid())
  and status='published'
  and private.is_verified_jec_member()
);

drop policy if exists "Authors edit their published community posts" on public.jec_community_posts;
create policy "Authors edit their published community posts"
on public.jec_community_posts for update to authenticated
using (
  author_id=(select auth.uid())
  and status='published'
  and private.is_verified_jec_member()
)
with check (
  author_id=(select auth.uid())
  and status='published'
  and private.is_verified_jec_member()
);

drop policy if exists "JEC admins moderate community posts" on public.jec_community_posts;
create policy "JEC admins moderate community posts"
on public.jec_community_posts for update to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

drop policy if exists "Authors or admins delete community posts" on public.jec_community_posts;
create policy "Authors or admins delete community posts"
on public.jec_community_posts for delete to authenticated
using (author_id=(select auth.uid()) or private.is_jec_admin());

-- Comments inherit the visibility of their parent post.
drop policy if exists "Verified members read published community comments" on public.jec_community_comments;
create policy "Verified members read published community comments"
on public.jec_community_comments for select to authenticated
using (
  private.is_jec_admin()
  or (
    status='published'
    and private.is_verified_jec_member()
    and exists (
      select 1 from public.jec_community_posts p
      where p.id=post_id and p.status='published'
    )
  )
);

drop policy if exists "Verified members comment on published community posts" on public.jec_community_comments;
create policy "Verified members comment on published community posts"
on public.jec_community_comments for insert to authenticated
with check (
  author_id=(select auth.uid())
  and status='published'
  and private.is_verified_jec_member()
  and exists (
    select 1 from public.jec_community_posts p
    where p.id=post_id and p.status='published'
  )
);

drop policy if exists "JEC admins moderate community comments" on public.jec_community_comments;
create policy "JEC admins moderate community comments"
on public.jec_community_comments for update to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

drop policy if exists "Authors or admins delete community comments" on public.jec_community_comments;
create policy "Authors or admins delete community comments"
on public.jec_community_comments for delete to authenticated
using (author_id=(select auth.uid()) or private.is_jec_admin());

-- A member may maintain one reaction per post. Upsert changes their reaction type.
drop policy if exists "Verified members read community reactions" on public.jec_community_reactions;
create policy "Verified members read community reactions"
on public.jec_community_reactions for select to authenticated
using (
  private.is_verified_jec_member()
  and exists (
    select 1 from public.jec_community_posts p
    where p.id=post_id and (p.status='published' or p.author_id=(select auth.uid()) or private.is_jec_admin())
  )
);

drop policy if exists "Verified members react to published community posts" on public.jec_community_reactions;
create policy "Verified members react to published community posts"
on public.jec_community_reactions for insert to authenticated
with check (
  user_id=(select auth.uid())
  and private.is_verified_jec_member()
  and exists (
    select 1 from public.jec_community_posts p
    where p.id=post_id and p.status='published'
  )
);

drop policy if exists "Members update their own community reaction" on public.jec_community_reactions;
create policy "Members update their own community reaction"
on public.jec_community_reactions for update to authenticated
using (user_id=(select auth.uid()) and private.is_verified_jec_member())
with check (user_id=(select auth.uid()) and private.is_verified_jec_member());

drop policy if exists "Members remove their own community reaction" on public.jec_community_reactions;
create policy "Members remove their own community reaction"
on public.jec_community_reactions for delete to authenticated
using (user_id=(select auth.uid()) or private.is_jec_admin());

-- Reports can be filed by verified members; only the reporter and JEC admins can read them.
drop policy if exists "Reporters and admins read community reports" on public.jec_community_reports;
create policy "Reporters and admins read community reports"
on public.jec_community_reports for select to authenticated
using (reporter_id=(select auth.uid()) or private.is_jec_admin());

drop policy if exists "Verified members report community content" on public.jec_community_reports;
create policy "Verified members report community content"
on public.jec_community_reports for insert to authenticated
with check (
  reporter_id=(select auth.uid())
  and status='pending'
  and moderator_id is null
  and reviewed_at is null
  and private.is_verified_jec_member()
  and (
    (post_id is not null and exists (
      select 1 from public.jec_community_posts p
      where p.id=post_id and p.status='published'
    ))
    or
    (comment_id is not null and exists (
      select 1 from public.jec_community_comments c
      join public.jec_community_posts p on p.id=c.post_id
      where c.id=comment_id and c.status='published' and p.status='published'
    ))
  )
);

drop policy if exists "JEC admins review community reports" on public.jec_community_reports;
create policy "JEC admins review community reports"
on public.jec_community_reports for update to authenticated
using (private.is_jec_admin())
with check (private.is_jec_admin());

-- Profiles are visible to verified community members only when a member has posted/commented.
drop policy if exists "Verified members view community author profiles" on public.jec_profiles;
create policy "Verified members view community author profiles"
on public.jec_profiles for select to authenticated
using (
  private.is_verified_jec_member()
  and (
    exists (
      select 1 from public.jec_community_posts p
      where p.author_id=jec_profiles.user_id
        and (p.status='published' or p.author_id=(select auth.uid()) or private.is_jec_admin())
    )
    or exists (
      select 1 from public.jec_community_comments c
      join public.jec_community_posts p on p.id=c.post_id
      where c.author_id=jec_profiles.user_id
        and c.status='published'
        and p.status='published'
    )
  )
);

-- Extend the existing in-app notification type constraint for community events.
alter table public.jec_user_notifications
  drop constraint if exists jec_user_notifications_entity_type_check;
alter table public.jec_user_notifications
  add constraint jec_user_notifications_entity_type_check
  check (entity_type in ('task','meeting','message','task_comment','community_post','community_comment'));

create or replace function private.jec_notify_community_comment()
returns trigger language plpgsql security definer set search_path='' as $$
declare post_owner uuid;
begin
  select author_id into post_owner
  from public.jec_community_posts
  where id=new.post_id and status='published';
  if post_owner is not null and post_owner<>new.author_id then
    perform private.jec_insert_notification(
      post_owner,new.author_id,null,'community_comment','community_comment',new.id,
      'Nouveau commentaire sur ta publication','New comment on your post',
      'Un membre a commenté ta publication.','A member commented on your post.',
      '/communaute?post='||new.post_id::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.jec_notify_community_comment() from public,anon,authenticated;
drop trigger if exists trg_jec_notify_community_comment on public.jec_community_comments;
create trigger trg_jec_notify_community_comment
after insert on public.jec_community_comments
for each row execute function private.jec_notify_community_comment();

create or replace function private.jec_notify_community_reaction()
returns trigger language plpgsql security definer set search_path='' as $$
declare post_owner uuid;
begin
  select author_id into post_owner
  from public.jec_community_posts
  where id=new.post_id and status='published';
  if post_owner is not null and post_owner<>new.user_id then
    perform private.jec_insert_notification(
      post_owner,new.user_id,null,'community_reaction','community_post',new.post_id,
      'Nouvelle réaction à ta publication','New reaction to your post',
      'Un membre a réagi à ta publication.','A member reacted to your post.',
      '/communaute?post='||new.post_id::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.jec_notify_community_reaction() from public,anon,authenticated;
drop trigger if exists trg_jec_notify_community_reaction on public.jec_community_reactions;
create trigger trg_jec_notify_community_reaction
after insert on public.jec_community_reactions
for each row execute function private.jec_notify_community_reaction();

-- Publish inserts to Realtime so members can see new posts and interactions while online.
do $$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='jec_community_posts') then
      execute 'alter publication supabase_realtime add table public.jec_community_posts';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='jec_community_comments') then
      execute 'alter publication supabase_realtime add table public.jec_community_comments';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='jec_community_reactions') then
      execute 'alter publication supabase_realtime add table public.jec_community_reactions';
    end if;
  end if;
end;
$$;

comment on table public.jec_community_posts is 'Global JEC community feed; accessible only to verified members and platform administrators.';
comment on table public.jec_community_comments is 'Comments on global JEC community posts.';
comment on table public.jec_community_reactions is 'One reaction per member per community post.';
comment on table public.jec_community_reports is 'Moderation reports for community posts and comments; visible only to reporter and JEC administrators.';
