-- JEC-conNEcT private messaging: direct conversations, group chats and workspace conversations.
create table if not exists public.jec_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null check (conversation_type in ('direct','group','workspace')),
  title text,
  workspace_id uuid references public.jec_workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jec_conversations_workspace_type check (
    (conversation_type='workspace' and workspace_id is not null)
    or (conversation_type<>'workspace' and workspace_id is null)
  ),
  constraint jec_conversations_title_length check (title is null or char_length(title) between 2 and 160)
);

create table if not exists public.jec_conversation_members (
  conversation_id uuid not null references public.jec_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_role text not null default 'member' check (conversation_role in ('owner','member')),
  membership_status text not null default 'invited' check (membership_status in ('invited','active','left')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id,user_id)
);

create table if not exists public.jec_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.jec_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint jec_messages_body_length check (char_length(trim(body)) between 1 and 12000)
);

create index if not exists idx_jec_conversation_members_user_status
  on public.jec_conversation_members(user_id,membership_status);
create index if not exists idx_jec_messages_conversation_created
  on public.jec_messages(conversation_id,created_at desc);

create or replace function private.is_jec_conversation_member(
  target_conversation_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.jec_conversation_members cm
    where cm.conversation_id=target_conversation_id
      and cm.user_id=coalesce(target_user_id,(select auth.uid()))
      and cm.membership_status='active'
  );
$$;
revoke all on function private.is_jec_conversation_member(uuid,uuid) from public,anon;
grant execute on function private.is_jec_conversation_member(uuid,uuid) to authenticated;

create or replace function private.can_manage_jec_conversation(
  target_conversation_id uuid,
  target_user_id uuid default null
)
returns boolean
language sql stable security definer set search_path=''
as $$
  select
    (target_user_id is null and private.is_jec_admin())
    or exists (
      select 1 from private.jec_admins a
      where a.user_id=coalesce(target_user_id,(select auth.uid()))
    )
    or exists (
      select 1 from public.jec_conversation_members cm
      where cm.conversation_id=target_conversation_id
        and cm.user_id=coalesce(target_user_id,(select auth.uid()))
        and cm.membership_status='active'
        and cm.conversation_role='owner'
    );
$$;
revoke all on function private.can_manage_jec_conversation(uuid,uuid) from public,anon;
grant execute on function private.can_manage_jec_conversation(uuid,uuid) to authenticated;

alter table public.jec_conversations enable row level security;
alter table public.jec_conversation_members enable row level security;
alter table public.jec_messages enable row level security;

drop policy if exists "Participants read their conversations" on public.jec_conversations;
create policy "Participants read their conversations"
on public.jec_conversations for select to authenticated
using (
  private.is_jec_admin()
  or exists (
    select 1 from public.jec_conversation_members cm
    where cm.conversation_id=id and cm.user_id=(select auth.uid())
      and cm.membership_status in ('active','invited')
  )
);

drop policy if exists "Conversation owners update conversation details" on public.jec_conversations;
create policy "Conversation owners update conversation details"
on public.jec_conversations for update to authenticated
using (private.can_manage_jec_conversation(id))
with check (private.can_manage_jec_conversation(id));

drop policy if exists "Conversation owners delete conversations" on public.jec_conversations;
create policy "Conversation owners delete conversations"
on public.jec_conversations for delete to authenticated
using (private.can_manage_jec_conversation(id));

drop policy if exists "Participants read conversation roster" on public.jec_conversation_members;
create policy "Participants read conversation roster"
on public.jec_conversation_members for select to authenticated
using (
  user_id=(select auth.uid())
  or private.is_jec_admin()
  or private.is_jec_conversation_member(conversation_id)
);

drop policy if exists "Conversation owners manage membership" on public.jec_conversation_members;
create policy "Conversation owners manage membership"
on public.jec_conversation_members for all to authenticated
using (private.can_manage_jec_conversation(conversation_id))
with check (
  private.can_manage_jec_conversation(conversation_id)
  and private.is_jec_verified_or_admin(user_id)
  and conversation_role<>'owner'
);

drop policy if exists "Participants read messages" on public.jec_messages;
create policy "Participants read messages"
on public.jec_messages for select to authenticated
using (private.is_jec_admin() or private.is_jec_conversation_member(conversation_id));

drop policy if exists "Active participants send messages" on public.jec_messages;
create policy "Active participants send messages"
on public.jec_messages for insert to authenticated
with check (
  sender_id=(select auth.uid())
  and private.is_jec_conversation_member(conversation_id)
  and exists (
    select 1 from public.jec_conversations c
    where c.id=conversation_id
      and (c.workspace_id is null or private.is_jec_workspace_member(c.workspace_id))
  )
);

drop policy if exists "Authors edit their messages" on public.jec_messages;
create policy "Authors edit their messages"
on public.jec_messages for update to authenticated
using (sender_id=(select auth.uid()) and private.is_jec_conversation_member(conversation_id))
with check (sender_id=(select auth.uid()) and private.is_jec_conversation_member(conversation_id));

drop policy if exists "Authors and conversation owners delete messages" on public.jec_messages;
create policy "Authors and conversation owners delete messages"
on public.jec_messages for delete to authenticated
using (
  (sender_id=(select auth.uid()) and private.is_jec_conversation_member(conversation_id))
  or private.can_manage_jec_conversation(conversation_id)
);

grant select,insert,update,delete on public.jec_conversations to authenticated;
grant select,insert,update,delete on public.jec_conversation_members to authenticated;
grant select,insert,update,delete on public.jec_messages to authenticated;

create or replace function private.jec_create_conversation(
  target_type text,
  target_title text,
  target_workspace_id uuid,
  target_member_emails text[]
)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  conversation_id uuid;
  target_email text;
  target_user_id uuid;
  invited_count integer:=0;
begin
  if (select auth.uid()) is null or not private.is_jec_verified_or_admin((select auth.uid())) then
    raise exception 'Verified JEC membership is required' using errcode='42501';
  end if;
  if target_type not in ('direct','group','workspace') then
    raise exception 'Invalid conversation type' using errcode='22023';
  end if;

  if target_type='workspace' then
    if target_workspace_id is null or not (
      private.is_jec_admin() or private.is_jec_workspace_member(target_workspace_id)
    ) then
      raise exception 'Active workspace membership is required' using errcode='42501';
    end if;
    insert into public.jec_conversations(conversation_type,title,workspace_id,created_by)
    values('workspace',coalesce(nullif(trim(target_title),''),'Conversation de l’espace'),target_workspace_id,(select auth.uid()))
    returning id into conversation_id;
    insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,joined_at)
    values(conversation_id,(select auth.uid()),'owner','active',now());
    insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,invited_by,joined_at)
    select conversation_id,wm.user_id,'member','active',(select auth.uid()),now()
    from public.jec_workspace_members wm
    where wm.workspace_id=target_workspace_id
      and wm.membership_status='active'
      and wm.user_id<>(select auth.uid())
    on conflict(conversation_id,user_id) do nothing;
    return conversation_id;
  end if;

  if coalesce(array_length(target_member_emails,1),0)=0 then
    raise exception 'Add at least one participant email' using errcode='22023';
  end if;
  if target_type='direct' and array_length(target_member_emails,1)<>1 then
    raise exception 'A direct conversation requires exactly one other participant' using errcode='22023';
  end if;
  if array_length(target_member_emails,1)>30 then
    raise exception 'A group is limited to 30 invited members' using errcode='22023';
  end if;

  insert into public.jec_conversations(conversation_type,title,workspace_id,created_by)
  values(target_type,nullif(trim(coalesce(target_title,'')),''),null,(select auth.uid()))
  returning id into conversation_id;

  insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,joined_at)
  values(conversation_id,(select auth.uid()),'owner','active',now());

  foreach target_email in array target_member_emails loop
    select u.id into target_user_id
    from auth.users u
    where lower(u.email)=lower(trim(target_email))
    limit 1;
    if target_user_id is null then
      raise exception 'No JEC-conNEcT account found for %',target_email using errcode='P0002';
    end if;
    if target_user_id=(select auth.uid()) then
      raise exception 'You cannot invite yourself' using errcode='22023';
    end if;
    if not private.is_jec_verified_or_admin(target_user_id) then
      raise exception 'Only verified JEC members can be invited' using errcode='42501';
    end if;
    insert into public.jec_conversation_members(conversation_id,user_id,conversation_role,membership_status,invited_by)
    values(conversation_id,target_user_id,'member','invited',(select auth.uid()))
    on conflict(conversation_id,user_id) do nothing;
    invited_count:=invited_count+1;
  end loop;

  if invited_count=0 then
    raise exception 'No participants were added' using errcode='22023';
  end if;
  return conversation_id;
end;
$$;
revoke all on function private.jec_create_conversation(text,text,uuid,text[]) from public,anon;
grant execute on function private.jec_create_conversation(text,text,uuid,text[]) to authenticated;

create or replace function public.jec_create_conversation(
  target_type text,
  target_title text default null,
  target_workspace_id uuid default null,
  target_member_emails text[] default '{}'::text[]
)
returns uuid
language sql security invoker set search_path=''
as $$
  select private.jec_create_conversation(target_type,target_title,target_workspace_id,target_member_emails);
$$;
revoke all on function public.jec_create_conversation(text,text,uuid,text[]) from public,anon;
grant execute on function public.jec_create_conversation(text,text,uuid,text[]) to authenticated;

create or replace function private.jec_accept_conversation_invitation(target_conversation_id uuid)
returns void
language plpgsql security definer set search_path=''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  update public.jec_conversation_members
  set membership_status='active',joined_at=now()
  where conversation_id=target_conversation_id
    and user_id=(select auth.uid())
    and membership_status='invited';
  if not found then
    raise exception 'No pending invitation was found' using errcode='P0002';
  end if;
end;
$$;
revoke all on function private.jec_accept_conversation_invitation(uuid) from public,anon;
grant execute on function private.jec_accept_conversation_invitation(uuid) to authenticated;

create or replace function public.jec_accept_conversation_invitation(target_conversation_id uuid)
returns void language sql security invoker set search_path=''
as $$ select private.jec_accept_conversation_invitation(target_conversation_id); $$;
revoke all on function public.jec_accept_conversation_invitation(uuid) from public,anon;
grant execute on function public.jec_accept_conversation_invitation(uuid) to authenticated;

drop policy if exists "Conversation participants can view each other's profile basics" on public.jec_profiles;
create policy "Conversation participants can view each other's profile basics"
on public.jec_profiles for select to authenticated
using (
  exists (
    select 1
    from public.jec_conversation_members mine
    join public.jec_conversation_members other
      on other.conversation_id=mine.conversation_id
    where mine.user_id=(select auth.uid())
      and mine.membership_status='active'
      and other.user_id=jec_profiles.user_id
      and other.membership_status='active'
  )
);

