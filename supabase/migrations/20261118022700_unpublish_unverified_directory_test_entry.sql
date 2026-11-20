-- Remove explicitly identified test content from the public JEC institutional directory.
-- Keep the row for administrative audit; only remove it from public display.
-- Safe to re-run: already unpublished rows are left unchanged.

update public.jec_directory_entries
set is_published = false,
    updated_at = now()
where is_published = true
  and visibility = 'public'
  and category = 'bureau_national'
  and description ilike '%fins de test%';
