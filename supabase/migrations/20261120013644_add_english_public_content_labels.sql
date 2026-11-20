alter table public.jec_public_content
  add column if not exists date_label_en text check (date_label_en is null or char_length(date_label_en) <= 100),
  add column if not exists source_label_en text check (source_label_en is null or char_length(source_label_en) <= 300);
