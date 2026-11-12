-- Enable Supabase Realtime INSERT events for private messages; RLS still scopes delivery to authorized subscribers.
alter publication supabase_realtime add table public.jec_messages;
