-- ============================================================
-- Clothza — seller subscriptions
-- Run in Supabase → SQL Editor AFTER schema.sql + roles.sql.
-- Safe to re-run.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'seller_plan') then
    create type seller_plan as enum ('monthly', 'yearly');
  end if;
  if not exists (select 1 from pg_type where typname = 'seller_status') then
    create type seller_status as enum ('pending', 'active', 'expired', 'cancelled');
  end if;
end $$;

create table if not exists public.seller_subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  plan           seller_plan not null,
  tier           sub_tier not null default 'bronze',
  amount         numeric(12,2) not null default 0,
  status         seller_status not null default 'pending',
  payment_method payment_method,
  payment_ref    text,
  started_at     timestamptz,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists seller_subs_user_idx   on public.seller_subscriptions(user_id, created_at desc);
create index if not exists seller_subs_status_idx on public.seller_subscriptions(status);

alter table public.seller_subscriptions enable row level security;

drop policy if exists seller_subs_read_own   on public.seller_subscriptions;
drop policy if exists seller_subs_read_admin on public.seller_subscriptions;

create policy seller_subs_read_own on public.seller_subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- ── A user applies for a plan (no privilege change yet) ──────
create or replace function public.apply_for_seller_subscription(
  p_plan   seller_plan,
  p_tier   sub_tier default 'bronze',
  p_method payment_method default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  if exists (
    select 1 from seller_subscriptions
     where user_id = auth.uid() and status in ('pending','active')
  ) then
    raise exception 'You already have a pending or active subscription';
  end if;

  insert into seller_subscriptions (user_id, plan, tier, payment_method)
  values (auth.uid(), p_plan, p_tier, p_method)
  returning id into v_id;

  return v_id;
end $$;

-- ── Admin approves: grants the role and the expiry date ──────
create or replace function public.activate_seller_subscription(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s seller_subscriptions;
  v_role user_role;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can activate a subscription';
  end if;

  select * into s from seller_subscriptions where id = p_id;
  if s.id is null then raise exception 'Subscription not found'; end if;

  update seller_subscriptions
     set status     = 'active',
         started_at = now(),
         expires_at = now() + case when s.plan = 'monthly'
                                    then interval '1 month'
                                    else interval '1 year' end
   where id = p_id;

  -- Seller role and the plan travel together
  select role into v_role from profiles where id = s.user_id;
  if v_role = 'customer' then
    update profiles set role = 'seller' where id = s.user_id;
  end if;

  update profiles
     set subscription_tier       = s.tier,
         subscription_expires_at = (select expires_at from seller_subscriptions where id = p_id)
   where id = s.user_id;
end $$;

-- ── Admin rejects / a user cancels ───────────────────────────
create or replace function public.cancel_seller_subscription(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare s seller_subscriptions;
begin
  select * into s from seller_subscriptions where id = p_id;
  if s.id is null then raise exception 'Subscription not found'; end if;
  if not (public.is_admin() or s.user_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;

  update seller_subscriptions set status = 'cancelled' where id = p_id;
end $$;

-- ── Sweep: expire lapsed subscriptions and demote ─────────────
create or replace function public.expire_seller_subscriptions()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select id, user_id from seller_subscriptions
     where status = 'active' and expires_at < now()
  loop
    update seller_subscriptions set status = 'expired' where id = r.id;

    -- Keep their shop, but they can no longer list or edit until renewed
    update profiles
       set role = 'customer', subscription_tier = 'free'
     where id = r.user_id;

    n := n + 1;
  end loop;
  return n;
end $$;

-- Call this from a scheduled job (pg_cron) if you enable it:
--   select cron.schedule('expire-sellers', '0 3 * * *',
--     $$select public.expire_seller_subscriptions()$$);

-- ── Handy: who is subscribed ─────────────────────────────────
-- select p.email, s.plan, s.tier, s.status, s.expires_at
--   from seller_subscriptions s join profiles p on p.id = s.user_id
--  order by s.created_at desc;
