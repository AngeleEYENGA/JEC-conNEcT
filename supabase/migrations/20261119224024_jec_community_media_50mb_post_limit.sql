-- Enforce the 50 MiB total media budget per community post.
-- Position constraints already cap the number of attachments at five (0..4).
create or replace function private.jec_enforce_community_media_post_size_limit()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  existing_count integer;
  existing_size bigint;
begin
  perform pg_advisory_xact_lock(hashtext('jec-community-media'),hashtext(new.post_id::text));

  select count(*),coalesce(sum(file_size),0)
    into existing_count,existing_size
  from public.jec_community_media
  where post_id=new.post_id;

  if existing_count >= 5 then
    raise exception 'A community post can contain at most five media files'
      using errcode='check_violation';
  end if;

  if existing_size + new.file_size > 52428800 then
    raise exception 'The total media size for a community post cannot exceed 50 MiB'
      using errcode='check_violation';
  end if;

  return new;
end;
$$;

revoke all on function private.jec_enforce_community_media_post_size_limit() from public,anon,authenticated;

drop trigger if exists trg_jec_community_media_post_size_limit on public.jec_community_media;
create trigger trg_jec_community_media_post_size_limit
before insert on public.jec_community_media
for each row execute function private.jec_enforce_community_media_post_size_limit();
