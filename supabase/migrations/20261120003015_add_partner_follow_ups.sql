-- Add date-driven partner follow-ups with the same partner-scoped access model.
-- All rows remain private to an authorised partner team; no synthetic records are seeded.

create table if not exists public.jec_partner_follow_ups (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.jec_partners(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 220),
  details text check (details is null or char_length(details) <= 8000),
  due_at timestamptz not null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done','cancelled')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_partner_follow_ups_completed_at_check
    check ((status = 'done' and completed_at is not null) or (status <> 'done'))
);

create index if not exists idx_jec_partner_follow_ups_partner_due
  on public.jec_partner_follow_ups(partner_id, status, due_at);
create index if not exists idx_jec_partner_follow_ups_assignee_due
  on public.jec_partner_follow_ups(assigned_to, status, due_at);

alter table public.jec_partner_follow_ups enable row level security;

revoke all privileges on public.jec_partner_follow_ups from anon, public;
grant select, insert, update, delete on public.jec_partner_follow_ups to authenticated;

drop policy if exists "Partner teams read follow-ups" on public.jec_partner_follow_ups;
create policy "Partner teams read follow-ups"
on public.jec_partner_follow_ups for select to authenticated
using (private.can_view_jec_partner_private(partner_id));

drop policy if exists "Partner editors create follow-ups" on public.jec_partner_follow_ups;
create policy "Partner editors create follow-ups"
on public.jec_partner_follow_ups for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.can_manage_jec_partner(partner_id)
  and (assigned_to is null or assigned_to = (select auth.uid()))
);

drop policy if exists "Partner editors update follow-ups" on public.jec_partner_follow_ups;
create policy "Partner editors update follow-ups"
on public.jec_partner_follow_ups for update to authenticated
using (private.can_manage_jec_partner(partner_id))
with check (
  private.can_manage_jec_partner(partner_id)
  and (assigned_to is null or assigned_to = (select auth.uid()))
);

drop policy if exists "Partner managers delete follow-ups" on public.jec_partner_follow_ups;
create policy "Partner managers delete follow-ups"
on public.jec_partner_follow_ups for delete to authenticated
using (
  private.is_jec_admin()
  or private.jec_has_partner_access(partner_id, array['manager']::text[])
);

drop trigger if exists trg_jec_partner_follow_up_activity on public.jec_partner_follow_ups;
create trigger trg_jec_partner_follow_up_activity
after insert or update or delete on public.jec_partner_follow_ups
for each row execute function private.jec_log_partner_activity();

-- Uploads are stored under partner_id/user_id/random-file-name.
-- This allows an editor to clean up their own orphaned upload if metadata creation fails,
-- without granting editors permission to delete another coordinator's private documents.
drop policy if exists "Partner editors remove their own private uploads" on storage.objects;
create policy "Partner editors remove their own private uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'jec-partner-documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and private.can_manage_jec_partner(((storage.foldername(name))[1])::uuid)
);

comment on table public.jec_partner_follow_ups is
  'Private date-driven partner follow-up tasks, visible only to authorised partner coordinators.';
