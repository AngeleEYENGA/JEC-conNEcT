-- Allow AAC/ADTS files reported by browsers as audio/vnd.dna.adts.
-- Preserve every MIME type already allowed on the shared JEC music bucket.
update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct mime_type order by mime_type)
  from unnest(
    coalesce(allowed_mime_types, array[]::text[])
    || array['audio/vnd.dna.adts']::text[]
  ) as allowed(mime_type)
)
where id = 'jec-audio';
