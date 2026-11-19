-- Enforce the same 20 MiB per-file limit at the Storage service and metadata layers.
update storage.buckets
set file_size_limit=20971520
where id='jec-community-media';

alter table public.jec_community_media
  drop constraint if exists jec_community_media_file_size_check;

alter table public.jec_community_media
  add constraint jec_community_media_file_size_check
  check (file_size between 1 and 20971520);
