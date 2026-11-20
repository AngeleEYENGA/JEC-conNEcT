
create table if not exists public.jec_photo_rights (
  photo_id uuid primary key references public.jec_photo_assets(id) on delete cascade,
  rights_evidence text,
  rights_notes text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.jec_photo_rights (photo_id, rights_evidence, rights_notes, approved_by, approved_at)
select id, rights_evidence, rights_notes, approved_by, approved_at
from public.jec_photo_assets
where rights_evidence is not null or rights_notes is not null or approved_by is not null
on conflict (photo_id) do update set
  rights_evidence = excluded.rights_evidence,
  rights_notes = excluded.rights_notes,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  updated_at = now();

alter table public.jec_photo_assets
  drop column if exists rights_evidence,
  drop column if exists rights_notes,
  drop column if exists approved_by,
  drop column if exists approved_at,
  drop column if exists created_by;

alter table public.jec_photo_rights enable row level security;
revoke all on public.jec_photo_rights from anon;
grant select, insert, update, delete on public.jec_photo_rights to authenticated;

drop policy if exists "JEC administrators read photo rights evidence" on public.jec_photo_rights;
create policy "JEC administrators read photo rights evidence"
  on public.jec_photo_rights for select to authenticated
  using (private.is_jec_admin());

drop policy if exists "JEC administrators insert photo rights evidence" on public.jec_photo_rights;
create policy "JEC administrators insert photo rights evidence"
  on public.jec_photo_rights for insert to authenticated
  with check (private.is_jec_admin());

drop policy if exists "JEC administrators update photo rights evidence" on public.jec_photo_rights;
create policy "JEC administrators update photo rights evidence"
  on public.jec_photo_rights for update to authenticated
  using (private.is_jec_admin())
  with check (private.is_jec_admin());

drop policy if exists "JEC administrators delete photo rights evidence" on public.jec_photo_rights;
create policy "JEC administrators delete photo rights evidence"
  on public.jec_photo_rights for delete to authenticated
  using (private.is_jec_admin());

create or replace function public.ensure_jec_photo_rights_before_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published then
    if new.rights_status <> 'approved'
      or new.rights_confirmed is not true
      or new.subject_consent_status not in ('confirmed','not_applicable') then
      raise exception 'Photo rights and subject consent must be approved before publication.';
    end if;

    if not exists (
      select 1
      from public.jec_photo_rights r
      where r.photo_id = new.id
        and nullif(btrim(r.rights_evidence), '') is not null
    ) then
      raise exception 'Written rights evidence is required before publication.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_jec_photo_rights_before_publish on public.jec_photo_assets;
create trigger ensure_jec_photo_rights_before_publish
before insert or update of is_published, rights_status, rights_confirmed, subject_consent_status
on public.jec_photo_assets
for each row execute function public.ensure_jec_photo_rights_before_publish();
