create table if not exists public.jec_notification_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.jec_messages(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0
    check (attempts >= 0),
  attempted_at timestamptz,
  sent_at timestamptz,
  error_code text
    check (error_code is null or char_length(error_code) <= 120),
  created_at timestamptz not null default now(),
  constraint jec_notification_email_deliveries_message_recipient_key
    unique (message_id, recipient_id)
);

create index if not exists jec_notification_email_deliveries_pending_idx
  on public.jec_notification_email_deliveries (status, created_at)
  where status in ('pending', 'failed');

alter table public.jec_notification_email_deliveries enable row level security;

revoke all on table public.jec_notification_email_deliveries from public, anon, authenticated;
grant all on table public.jec_notification_email_deliveries to service_role;

comment on table public.jec_notification_email_deliveries is
  'Private server-side delivery log for transactional message notification emails. No message body or recipient email is stored; access is restricted to service_role.';
