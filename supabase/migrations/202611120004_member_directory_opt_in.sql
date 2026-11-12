-- Allow a verified member to opt in to the members-only directory.
alter table public.jec_profiles
  add column if not exists show_in_directory boolean not null default false;

drop policy if exists "Verified members can view opted-in JEC profiles" on public.jec_profiles;
create policy "Verified members can view opted-in JEC profiles"
on public.jec_profiles for select to authenticated
using (
  show_in_directory = true
  and private.is_verified_jec_member()
);

grant update (first_name, last_name, display_name, avatar_url, show_in_directory)
on public.jec_profiles to authenticated;
