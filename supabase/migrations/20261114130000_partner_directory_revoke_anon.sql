-- Defense in depth: partner directory is for authenticated, verified JEC members only.
-- RLS remains enabled and is the row-level authorization layer.
revoke all privileges on table public.jec_partners from anon;
grant select,insert,update,delete on table public.jec_partners to authenticated;
