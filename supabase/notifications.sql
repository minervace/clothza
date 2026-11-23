-- ============================================================
-- Clothza — order notifications (WhatsApp to the seller)
-- Run in Supabase → SQL Editor after schema.sql.
-- Safe to re-run.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notify_channel') then
    create type notify_channel as enum ('whatsapp', 'sms', 'email');
  end if;
  if not exists (select 1 from pg_type where typname = 'notify_status') then
    create type notify_status as enum ('queued', 'sent', 'failed', 'skipped');
  end if;
end $$;

create table if not exists public.order_notifications (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  channel     notify_channel not null default 'whatsapp',
  recipient   text,
  payload     jsonb not null default '{}'::jsonb,
  status      notify_status not null default 'queued',
  error       text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists order_notify_status_idx on public.order_notifications(status, created_at);
create index if not exists order_notify_order_idx  on public.order_notifications(order_id);

alter table public.order_notifications enable row level security;

drop policy if exists order_notify_read on public.order_notifications;
create policy order_notify_read on public.order_notifications
  for select using (public.is_store_owner(store_id) or public.is_admin());

-- ── Queue a WhatsApp message when an order is inserted ───────
create or replace function public.queue_seller_order_notification()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_store text;
  v_items int;
begin
  select s.whatsapp, s.name into v_phone, v_store
    from public.stores s where s.id = new.store_id;

  -- No number on the shop: nothing to send, but record the attempt so the
  -- seller can see the order arrived untracked.
  select coalesce(jsonb_array_length(new.items), 0) into v_items;

  insert into public.order_notifications (order_id, store_id, channel, recipient, payload, status)
  values (
    new.id,
    new.store_id,
    'whatsapp',
    v_phone,
    jsonb_build_object(
      'store',      v_store,
      'tracking',   new.tracking_id,
      'total',      new.total,
      'items',      v_items,
      'customer',   new.delivery_address->>'fullName',
      'city',       new.delivery_address->>'city',
      'method',     new.payment_method
    ),
    case when v_phone is null or length(trim(v_phone)) = 0 then 'skipped' else 'queued' end
  );

  return new;
end $$;

drop trigger if exists orders_notify_seller on public.orders;
create trigger orders_notify_seller
  after insert on public.orders
  for each row execute function public.queue_seller_order_notification();

-- ── On status change, queue an update for the customer ──────
create or replace function public.queue_customer_status_update()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select p.phone into v_phone from public.profiles p where p.id = new.user_id;

  insert into public.order_notifications (order_id, store_id, channel, recipient, payload, status)
  values (
    new.id, new.store_id, 'whatsapp', v_phone,
    jsonb_build_object('tracking', new.tracking_id, 'status', new.status, 'audience', 'customer'),
    case when v_phone is null or length(trim(v_phone)) = 0 then 'skipped' else 'queued' end
  );

  return new;
end $$;

drop trigger if exists orders_notify_customer on public.orders;
create trigger orders_notify_customer
  after update on public.orders
  for each row execute function public.queue_customer_status_update();

-- Customers need a phone column for those updates
alter table public.profiles add column if not exists phone text;

-- ── What the seller sees in the dashboard ───────────────────
-- select o.tracking_id, n.status, n.recipient, n.payload
--   from order_notifications n join orders o on o.id = n.order_id
--  order by n.created_at desc limit 20;
