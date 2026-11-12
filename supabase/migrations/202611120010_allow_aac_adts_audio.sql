-- Add browser-reported AAC/ADTS and standard AAC MIME types to the public JEC music library.
update storage.buckets
set allowed_mime_types = array[
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/vnd.dna.adts',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/x-m4a'
]::text[]
where id = 'jec-audio';
