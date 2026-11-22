-- 4.7 Contact messages.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run. Safe to re-run.
--
-- RLS is on with NO policies: the anon / publishable key can't read or write anything here.
-- The server writes through submit_contact_message() with the secret (service-role) key.
-- Keep the length limits in step with lib/contact/validate.ts.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  topic       text not null check (topic in ('project', 'collab', 'hi')),
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null check (char_length(email) between 3 and 254),
  message     text not null check (char_length(message) between 1 and 2000),
  -- A salted SHA-256 of the sender's IP (hex), for the rate limit. Never the IP itself.
  ip_hash     text not null check (char_length(ip_hash) = 64)
);

create index if not exists contact_messages_ip_time
  on public.contact_messages (ip_hash, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

-- Count and insert in one transaction, under a per-IP advisory lock, so ten posts fired at the
-- same moment can't all slip under the limit. Returns false when the IP has sent 5 messages in
-- the last hour (the API answers 429), true when the message was stored.
create or replace function public.submit_contact_message(
  p_topic text,
  p_name text,
  p_email text,
  p_message text,
  p_ip_hash text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  perform pg_advisory_xact_lock(hashtext('contact:' || p_ip_hash));
  select count(*) into recent
    from public.contact_messages
   where ip_hash = p_ip_hash
     and created_at > now() - interval '1 hour';
  if recent >= 5 then
    return false;
  end if;
  insert into public.contact_messages (topic, name, email, message, ip_hash)
  values (p_topic, p_name, p_email, p_message, p_ip_hash);
  return true;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_contact_message(text, text, text, text, text)
  to service_role;
