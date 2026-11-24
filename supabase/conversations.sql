-- ============================================================
-- Clothza — threaded conversations between customers and shops
-- Run after schema.sql. Safe to re-run.
--
-- Replaces the flat messages table with conversations + messages.
-- The old table is kept so no data is lost; the app uses the new one.
-- ============================================================

create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null default '',
  last_message text,
  last_at      timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (store_id, customer_id)
);

create index if not exists conversations_store_idx on public.conversations(store_id, last_at desc);
create index if not exists conversations_customer_idx on public.conversations(customer_id, last_at desc);

create table if not exists public.conversation_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null check (length(body) between 1 and 2000),
  created_at       timestamptz not null default now()
);

create index if not exists conv_messages_idx on public.conversation_messages(conversation_id, created_at);

alter table public.conversations         enable row level security;
alter table public.conversation_messages enable row level security;

-- ── Access: the customer on the thread, or the shop's owner ──
drop policy if exists conversations_read   on public.conversations;
drop policy if exists conversations_insert on public.conversations;
drop policy if exists conv_messages_read   on public.conversation_messages;
drop policy if exists conv_messages_insert on public.conversation_messages;

create policy conversations_read on public.conversations
  for select using (customer_id = auth.uid() or public.is_store_owner(store_id) or public.is_admin());

create policy conversations_insert on public.conversations
  for insert with check (customer_id = auth.uid());

create policy conv_messages_read on public.conversation_messages
  for select using (
    exists (
      select 1 from public.conversations c
       where c.id = conversation_id
         and (c.customer_id = auth.uid() or public.is_store_owner(c.store_id) or public.is_admin())
    )
  );

create policy conv_messages_insert on public.conversation_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
       where c.id = conversation_id
         and (c.customer_id = auth.uid() or public.is_store_owner(c.store_id))
    )
  );

-- ── Open (or reuse) a thread and post the first message ─────
create or replace function public.start_conversation(p_store uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_name text;
begin
  if auth.uid() is null then raise exception 'Sign in to message a boutique'; end if;

  select coalesce(name, '') into v_name from profiles where id = auth.uid();

  insert into conversations (store_id, customer_id, customer_name, last_message, last_at)
  values (p_store, auth.uid(), v_name, p_body, now())
  on conflict (store_id, customer_id) do update
    set last_message = excluded.last_message, last_at = now()
  returning id into v_id;

  insert into conversation_messages (conversation_id, sender_id, body)
  values (v_id, auth.uid(), p_body);

  return v_id;
end $$;

-- ── Reply to an existing thread (either side) ───────────────
create or replace function public.reply_to_conversation(p_conversation uuid, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_store uuid;
  v_customer uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;

  select store_id, customer_id into v_store, v_customer
    from conversations where id = p_conversation;

  if not (v_customer = auth.uid() or public.is_store_owner(v_store)) then
    raise exception 'Not part of this conversation';
  end if;

  insert into conversation_messages (conversation_id, sender_id, body)
  values (p_conversation, auth.uid(), p_body);

  update conversations set last_message = p_body, last_at = now() where id = p_conversation;
end $$;
