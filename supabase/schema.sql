-- ============================================================
-- Clothza — Supabase schema (v1)
-- Paste into Supabase → SQL Editor → Run.
-- Mirrors src/context/MarketplaceContext.tsx types.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type user_role         as enum ('customer', 'seller', 'admin');
create type sub_tier          as enum ('free', 'bronze', 'silver', 'gold');
create type order_status      as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_method    as enum ('esewa', 'khalti', 'fonepay', 'card');
create type payment_status    as enum ('pending', 'paid', 'failed');
create type store_theme       as enum ('minimalist', 'streetwear', 'boho', 'luxury');
create type product_category  as enum ('Men', 'Women', 'Accessories', 'Footwear', 'Kids');
create type discount_type     as enum ('percentage', 'fixed');
create type admin_request     as enum ('pending', 'approved', 'rejected');

-- ── Profiles (1:1 with auth.users) ───────────────────────────
create table profiles (
  id                uuid primary key references auth.users on delete cascade,
  name              text not null default '',
  email             text,
  avatar_url        text,
  role              user_role not null default 'customer',
  store_id          uuid,
  subscription_tier sub_tier not null default 'free',
  total_spent       numeric(12,2) not null default 0,
  admin_request     admin_request,
  joined_at         timestamptz not null default now()
);

-- ── Stores ───────────────────────────────────────────────────
create table stores (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null references profiles(id) on delete cascade,
  name                    text not null,
  slug                    text not null unique,
  description             text not null default '',
  logo                    text not null default '',
  banner                  text not null default '',
  location                text not null default '',
  instagram               text,
  whatsapp                text,
  theme                   store_theme not null default 'minimalist',
  is_featured             boolean not null default false,
  is_sponsored            boolean not null default false,
  views                   integer not null default 0,
  clicks                  integer not null default 0,
  rating                  numeric(2,1) not null default 0,
  review_count            integer not null default 0,
  subscription_tier       sub_tier not null default 'free',
  subscription_expires_at timestamptz,
  created_at              timestamptz not null default now()
);
create index stores_owner_idx on stores(owner_id);

alter table profiles
  add constraint profiles_store_fk foreign key (store_id) references stores(id) on delete set null;

-- ── Products ─────────────────────────────────────────────────
create table products (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references stores(id) on delete cascade,
  name             text not null,
  description      text not null default '',
  price            numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  category         product_category not null,
  tags             text[] not null default '{}',
  images           text[] not null default '{}',
  variants         jsonb not null default '[]'::jsonb,
  is_best_seller   boolean not null default false,
  is_trending      boolean not null default false,
  is_sponsored     boolean not null default false,
  views            integer not null default 0,
  clicks           integer not null default 0,
  rating           numeric(2,1) not null default 0,
  review_count     integer not null default 0,
  created_at       timestamptz not null default now()
);
create index products_store_idx  on products(store_id);
create index products_cat_idx    on products(category);
create index products_search_idx on products using gin (to_tsvector('simple', name || ' ' || description));

-- ── Orders ───────────────────────────────────────────────────
create table orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete restrict,
  store_id         uuid not null references stores(id) on delete restrict,
  items            jsonb not null default '[]'::jsonb,
  subtotal         numeric(12,2) not null default 0,
  discount_amount  numeric(12,2) not null default 0,
  delivery_fee     numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  coupon_code      text,
  payment_method   payment_method not null,
  payment_status   payment_status not null default 'pending',
  delivery_address jsonb not null,
  status           order_status not null default 'pending',
  tracking_id      text not null unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_user_idx  on orders(user_id);
create index orders_store_idx on orders(store_id);

-- ── Reviews ──────────────────────────────────────────────────
create table reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  user_name  text not null default '',
  rating     smallint not null check (rating between 1 and 5),
  comment    text not null default '',
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on reviews(product_id);

-- ── Lookbooks ────────────────────────────────────────────────
create table lookbooks (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid references stores(id) on delete set null,
  creator_name text not null default '',
  name         text not null,
  description  text not null default '',
  cover_image  text,
  items        jsonb not null default '[]'::jsonb,
  is_official  boolean not null default false,
  likes        integer not null default 0,
  views        integer not null default 0,
  created_at   timestamptz not null default now()
);
create index lookbooks_store_idx on lookbooks(store_id);

create table lookbook_likes (
  lookbook_id uuid not null references lookbooks(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (lookbook_id, user_id)
);

-- ── Messages (per store conversation) ────────────────────────
create table messages (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  customer_id   uuid not null references profiles(id) on delete cascade,
  customer_name text not null default '',
  sender_id     uuid not null references profiles(id) on delete cascade,
  content       text not null check (length(content) between 1 and 2000),
  created_at    timestamptz not null default now()
);
create index messages_store_idx on messages(store_id, created_at desc);

-- ── Coupons ──────────────────────────────────────────────────
create table coupons (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id) on delete cascade,
  code           text not null,
  discount_type  discount_type not null,
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) not null default 0,
  max_uses       integer not null default 100,
  usage_count    integer not null default 0,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  unique (store_id, code)
);

-- ── Favorites ────────────────────────────────────────────────
create table favorite_products (
  user_id    uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table favorite_stores (
  user_id    uuid not null references profiles(id) on delete cascade,
  store_id   uuid not null references stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

-- ── Helpers ──────────────────────────────────────────────────
create or replace function is_store_owner(p_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from stores s where s.id = p_store and s.owner_id = auth.uid());
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- Keep profile row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Row Level Security ───────────────────────────────────────
alter table profiles          enable row level security;
alter table stores            enable row level security;
alter table products          enable row level security;
alter table orders            enable row level security;
alter table reviews           enable row level security;
alter table lookbooks         enable row level security;
alter table lookbook_likes    enable row level security;
alter table messages          enable row level security;
alter table coupons           enable row level security;
alter table favorite_products enable row level security;
alter table favorite_stores   enable row level security;

-- profiles
create policy profiles_read on profiles for select using (true);
create policy profiles_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- stores: public read, owner writes
create policy stores_read on stores for select using (true);
create policy stores_insert_own on stores for insert with check (owner_id = auth.uid());
create policy stores_update_own on stores for update using (owner_id = auth.uid() or is_admin()) with check (owner_id = auth.uid() or is_admin());
create policy stores_delete_own on stores for delete using (owner_id = auth.uid() or is_admin());

-- products: public read, owning store writes
create policy products_read on products for select using (true);
create policy products_insert_own on products for insert with check (is_store_owner(store_id));
create policy products_update_own on products for update using (is_store_owner(store_id) or is_admin()) with check (is_store_owner(store_id) or is_admin());
create policy products_delete_own on products for delete using (is_store_owner(store_id) or is_admin());

-- orders: buyer + store owner
create policy orders_read on orders for select using (user_id = auth.uid() or is_store_owner(store_id) or is_admin());
create policy orders_insert_own on orders for insert with check (user_id = auth.uid());
create policy orders_update on orders for update using (user_id = auth.uid() or is_store_owner(store_id) or is_admin()) with check (user_id = auth.uid() or is_store_owner(store_id) or is_admin());

-- reviews: public read, author writes
create policy reviews_read on reviews for select using (true);
create policy reviews_insert_own on reviews for insert with check (user_id = auth.uid());
create policy reviews_update_own on reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_delete_own on reviews for delete using (user_id = auth.uid() or is_admin());

-- lookbooks: public read, creator writes or store owner
create policy lookbooks_read on lookbooks for select using (true);
create policy lookbooks_write on lookbooks for insert with check (auth.uid() is not null);
create policy lookbooks_update on lookbooks for update using (is_store_owner(store_id) or is_admin()) with check (is_store_owner(store_id) or is_admin());
create policy lookbooks_delete on lookbooks for delete using (is_store_owner(store_id) or is_admin());

-- lookbook likes
create policy likes_read on lookbook_likes for select using (true);
create policy likes_insert_own on lookbook_likes for insert with check (user_id = auth.uid());
create policy likes_delete_own on lookbook_likes for delete using (user_id = auth.uid());

-- messages: participants + store owner
create policy messages_read on messages for select using (customer_id = auth.uid() or sender_id = auth.uid() or is_store_owner(store_id) or is_admin());
create policy messages_insert on messages for insert with check (sender_id = auth.uid() and (customer_id = auth.uid() or is_store_owner(store_id)));

-- coupons: public read of active ones, store owner writes
create policy coupons_read_active on coupons for select using (is_active or is_store_owner(store_id) or is_admin());
create policy coupons_write on coupons for all using (is_store_owner(store_id) or is_admin()) with check (is_store_owner(store_id) or is_admin());

-- favorites: self only
create policy fav_products_all on favorite_products for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fav_stores_all   on favorite_stores   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
