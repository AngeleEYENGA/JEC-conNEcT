-- JEC Connect — community media uploads and post reshares
-- All community media stays in a private Storage bucket.
-- Access is granted only to authenticated, verified JEC members and platform admins.

alter table public.jec_community_posts
  add column if not exists shared_post_id uuid
  references public.jec_community_posts(id) on delete cascade;

alter table public.jec_community_posts
  drop constraint if exists jec_community_posts_body_length;

alter table public.jec_community_posts
  add constraint jec_community_posts_body_length
  check (char_length(trim(body)) between 0 and 5000);

alter table public.jec_community_posts
  drop constraint if exists jec_community_posts_not_self_shared;

alter table public.jec_community_posts
  add constraint jec_community_posts_not_self_shared
  check (shared_post_id is null or shared_post_id <> id);

create index if not exists idx_jec_community_posts_shared
  on public.jec_community_posts(shared_post_id,created_at desc)
  where shared_post_id is not null;

-- Upload limits are deliberately conservative for the current project plan:
-- up to 50 MB per object, with client-side limits of 5 files / 50 MB per post.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'jec-community-media',
  'jec-community-media',
  false,
  52428800,
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm',
    'audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/ogg','audio/webm'
  ]
)
on conflict (id) do update set
  name=excluded.name,
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.jec_community_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.jec_community_posts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in (
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm',
    'audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/ogg','audio/webm'
  )),
  file_size bigint not null check (file_size between 1 and 52428800),
  position integer not null default 0 check (position between 0 and 4),
  created_at timestamptz not null default now(),
  constraint jec_community_media_path_owner_post check (
    storage_path like owner_id::text || '/' || post_id::text || '/%'
  ),
  constraint jec_community_media_unique_position unique (post_id,position)
);

create index if not exists idx_jec_community_media_post
  on public.jec_community_media(post_id,position);

alter table public.jec_community_media enable row level security;
revoke all on public.jec_community_media from public,anon,authenticated;
grant select,insert,delete on public.jec_community_media to authenticated;

drop policy if exists "Verified members read community media metadata" on public.jec_community_media;
create policy "Verified members read community media metadata"
on public.jec_community_media for select to authenticated
using (
  private.is_jec_admin()
  or (
    private.is_verified_jec_member()
    and exists (
      select 1
      from public.jec_community_posts p
      where p.id=post_id
        and (p.status='published' or p.author_id=(select auth.uid()))
    )
  )
);

drop policy if exists "Verified members attach media to their own posts" on public.jec_community_media;
create policy "Verified members attach media to their own posts"
on public.jec_community_media for insert to authenticated
with check (
  owner_id=(select auth.uid())
  and private.is_verified_jec_member()
  and storage_path like (select auth.uid())::text || '/' || post_id::text || '/%'
  and exists (
    select 1
    from public.jec_community_posts p
    where p.id=post_id
      and p.author_id=(select auth.uid())
      and p.status='published'
  )
);

drop policy if exists "Media owners or admins delete community media metadata" on public.jec_community_media;
create policy "Media owners or admins delete community media metadata"
on public.jec_community_media for delete to authenticated
using (owner_id=(select auth.uid()) or private.is_jec_admin());

-- Private Storage objects: verified members can read; uploads are isolated in the
-- uploader's UUID folder. There is no UPDATE policy (uploads never use upsert).
drop policy if exists "Verified members read community media objects" on storage.objects;
create policy "Verified members read community media objects"
on storage.objects for select to authenticated
using (
  bucket_id='jec-community-media'
  and private.is_verified_jec_member()
);

drop policy if exists "Verified members upload to their own community media folder" on storage.objects;
create policy "Verified members upload to their own community media folder"
on storage.objects for insert to authenticated
with check (
  bucket_id='jec-community-media'
  and private.is_verified_jec_member()
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
);

drop policy if exists "Owners or admins delete community media objects" on storage.objects;
create policy "Owners or admins delete community media objects"
on storage.objects for delete to authenticated
using (
  bucket_id='jec-community-media'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or private.is_jec_admin()
  )
);

-- A reshare is a new feed item which points to the original published post.
-- Keep the original itself at the root so the feed renderer never nests shares.
drop policy if exists "Verified members create community posts" on public.jec_community_posts;
create policy "Verified members create community posts"
on public.jec_community_posts for insert to authenticated
with check (
  author_id=(select auth.uid())
  and status='published'
  and private.is_verified_jec_member()
  and (
    shared_post_id is null
    or exists (
      select 1
      from public.jec_community_posts original
      where original.id=shared_post_id
        and original.status='published'
        and original.shared_post_id is null
    )
  )
);

-- Extend internal notifications for reshares without exposing post content.
alter table public.jec_user_notifications
  drop constraint if exists jec_user_notifications_entity_type_check;
alter table public.jec_user_notifications
  add constraint jec_user_notifications_entity_type_check
  check (entity_type in (
    'task','meeting','message','task_comment',
    'community_post','community_comment','community_share'
  ));

create or replace function private.jec_notify_community_share()
returns trigger language plpgsql security definer set search_path='' as $$
declare original_owner uuid;
begin
  if new.shared_post_id is null then return new; end if;

  select author_id into original_owner
  from public.jec_community_posts
  where id=new.shared_post_id and status='published';

  if original_owner is not null and original_owner<>new.author_id then
    perform private.jec_insert_notification(
      original_owner,new.author_id,null,'community_share','community_share',new.id,
      'Ta publication a été repartagée','Your post was reshared',
      'Un membre a repartagé ta publication.','A member reshared your post.',
      '/communaute?post='||new.shared_post_id::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.jec_notify_community_share() from public,anon,authenticated;
drop trigger if exists trg_jec_notify_community_share on public.jec_community_posts;
create trigger trg_jec_notify_community_share
after insert on public.jec_community_posts
for each row when (new.shared_post_id is not null)
execute function private.jec_notify_community_share();

-- Media metadata is also published so feed clients refresh when attachments are added.
do $$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public'
        and tablename='jec_community_media'
    ) then
      execute 'alter publication supabase_realtime add table public.jec_community_media';
    end if;
  end if;
end;
$$;

comment on table public.jec_community_media is
  'Private images, videos and audio attached to JEC community posts. Access is limited to verified JEC members.';
