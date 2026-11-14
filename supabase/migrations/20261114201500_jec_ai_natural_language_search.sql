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
language plpgsql
stable
security invoker
set search_path=''
as $$
declare
  selected_config regconfig;
  token text;
  token_query tsquery;
  combined_query tsquery := ''::tsquery;
  ignored_tokens text[];
begin
  selected_config := case
    when lower(coalesce(search_language,'fr')) like 'en%' then 'english'::regconfig
    else 'french'::regconfig
  end;

  ignored_tokens := case
    when lower(coalesce(search_language,'fr')) like 'en%' then
      array['the','and','for','with','from','that','this','what','when','where','who','why','how','can','could','would','should','you','your','me','my','please','tell','show','find','give','give','about','into','are','was','were','has','have','had','does','did','its','their','they','them','our','ours','but','not','get','all','any','one','two','three','more','most']
    else
      array['les','des','du','de','la','le','un','une','et','ou','est','sont','dans','sur','pour','par','avec','ce','ces','cet','cette','qui','que','quoi','quels','quelles','quel','quelle','comment','pourquoi','peux','peut','tu','vous','me','moi','mon','ma','mes','ton','ta','tes','notre','nos','votre','vos','leur','leurs','elle','elles','ils','il','on','au','aux','en','y','mais','donne','donner','retrouve','retrouver','trouve','trouver','explique','expliquer','résume','resumer','faire','fait','fais','est-ce','pas','plus','tout','tous','toutes']
  end;

  for token in
    select distinct lower(part)
    from regexp_split_to_table(coalesce(search_text,''),'[^[:alnum:]_]+') as words(part)
    where length(lower(part)) >= 3
      and lower(part) <> all(ignored_tokens)
  loop
    token_query := plainto_tsquery(selected_config, token);
    if numnode(token_query) > 0 then
      combined_query := combined_query || token_query;
    end if;
  end loop;

  if numnode(combined_query) = 0 then
    return;
  end if;

  return query
  select
    s.id,s.source_key,s.title,s.publisher,s.source_type,s.language,
    s.publication_date,s.source_url,s.evidence_label,s.content_text,
    ts_rank(s.search_vector,combined_query) as score
  from public.jec_ai_sources s
  where s.source_status='approved'
    and s.search_vector @@ combined_query
  order by score desc,s.evidence_checked_at desc nulls last
  limit greatest(1,least(coalesce(result_limit,8),12));
end;
$$;
revoke all on function public.jec_ai_search_sources(text,integer,text) from public;
grant execute on function public.jec_ai_search_sources(text,integer,text) to anon,authenticated;
