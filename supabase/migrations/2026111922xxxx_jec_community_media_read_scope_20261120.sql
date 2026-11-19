-- Tighten community media reads: Storage signed URLs require an attached, visible feed post.
drop policy if exists "Verified members read community media objects" on storage.objects;
create policy "Verified members read community media objects"
on storage.objects for select to authenticated
using (
  bucket_id='jec-community-media'
  and private.is_verified_jec_member()
  and exists (
    select 1
    from public.jec_community_media media
    join public.jec_community_posts post on post.id=media.post_id
    where media.storage_path=storage.objects.name
      and (
        post.status='published'
        or post.author_id=(select auth.uid())
        or private.is_jec_admin()
      )
  )
);
