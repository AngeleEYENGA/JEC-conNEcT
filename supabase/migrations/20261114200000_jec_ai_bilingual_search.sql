alter table public.jec_ai_sources drop column if exists search_vector;
alter table public.jec_ai_sources
  add column search_vector tsvector generated always as (
    setweight(
      to_tsvector('french'::regconfig, coalesce(title,'') || ' ' || coalesce(publisher,'') || ' ' || coalesce(evidence_label,'')),
      'A'
    ) ||
    setweight(
      to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(publisher,'') || ' ' || coalesce(evidence_label,'')),
      'A'
    ) ||
    setweight(
      to_tsvector('french'::regconfig, coalesce(content_text,'')),
      'C'
    ) ||
    setweight(
      to_tsvector('english'::regconfig, coalesce(content_text,'')),
      'C'
    )
  ) stored;

drop index if exists public.jec_ai_sources_search_idx;
create index jec_ai_sources_search_idx on public.jec_ai_sources using gin(search_vector);

drop function if exists public.jec_ai_search_sources(text,integer);
create or replace function public.jec_ai_search_sources(
  search_text text,
  result_limit integer default 8,
  search_language text default 'fr'
)
returns table (
  id uuid,
  source_key text,
  title text,
  publisher text,
  source_type text,
  language text,
  publication_date date,
  source_url text,
  evidence_label text,
  content_text text,
  score real
)
language sql
stable
security invoker
set search_path=''
as $$
  with search_query as (
    select case
      when lower(coalesce(search_language,'fr')) like 'en%' then
        websearch_to_tsquery('english'::regconfig,search_text)
      else
        websearch_to_tsquery('french'::regconfig,search_text)
    end as query
  )
  select
    s.id,s.source_key,s.title,s.publisher,s.source_type,s.language,
    s.publication_date,s.source_url,s.evidence_label,s.content_text,
    ts_rank(s.search_vector,q.query) as score
  from public.jec_ai_sources s
  cross join search_query q
  where s.source_status='approved'
    and numnode(q.query)>0
    and s.search_vector @@ q.query
  order by score desc,s.evidence_checked_at desc nulls last
  limit greatest(1,least(coalesce(result_limit,8),12));
$$;
revoke all on function public.jec_ai_search_sources(text,integer,text) from public;
grant execute on function public.jec_ai_search_sources(text,integer,text) to anon,authenticated;
comment on column public.jec_ai_sources.search_vector is
  'Generated French and English search index. Queries select the appropriate language configuration.';
