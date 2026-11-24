-- ============================================================
-- Clothza — account upgrades
-- Run after schema.sql / roles.sql. Safe to re-run.
-- ============================================================

-- ── Saved delivery addresses ────────────────────────────────
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  label       text not null default 'Home',
  full_name   text not null,
  phone       text not null,
  address     text not null,
  city        text not null,
  province    text not null default '',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id, created_at desc);

alter table public.addresses enable row level security;

drop policy if exists addresses_all on public.addresses;
create policy addresses_all on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Only one default per user
create or replace function public.single_default_address()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_default then
    update public.addresses set is_default = false
     where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end $$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default
  before insert or update of is_default on public.addresses
  for each row execute function public.single_default_address();

-- ── Save the profile phone the account page edits ───────────
create or replace function public.set_my_phone(p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  update public.profiles set phone = nullif(trim(p_phone), '') where id = auth.uid();
end $$;

-- ── Order stats for the account header ──────────────────────
create or replace function public.my_order_stats()
returns table(orders bigint, spent numeric, last_order timestamptz)
language sql security definer set search_path = public as $$
  select count(*),
         coalesce(sum(total) filter (where payment_status = 'paid'), 0),
         max(created_at)
    from public.orders
   where user_id = auth.uid();
$$;

-- ── Delete my account (data only; auth user removed separately) ──
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sign in first'; end if;

  -- Block deletion while the shop has open orders
  if exists (
    select 1 from public.orders o
     join public.stores s on s.id = o.store_id
     where s.owner_id = v_uid
       and o.status in ('pending', 'processing', 'shipped')
  ) then
    raise exception 'You have open orders in your shop. Fulfil or cancel them first.';
  end if;

  delete from public.profiles where id = v_uid;  -- cascades to addresses, favourites, reviews
end $$;
