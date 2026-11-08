-- ============================================================
-- Clothza — roles (customer / seller / admin)
-- Run in Supabase → SQL Editor AFTER schema.sql.
-- Safe to re-run.
-- ============================================================

-- ── Signup: role comes from user metadata, customer/seller only ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  safe_role user_role;
begin
  -- Only allow self-service roles; admin is never assigned here
  safe_role := case when requested = 'seller' then 'seller'::user_role else 'customer'::user_role end;

  insert into public.profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email, safe_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ── Block privilege escalation on the profiles table ─────────────────
-- RLS lets users update their own row, so without this a customer could
-- simply write role = 'admin' through the API.
create or replace function public.prevent_profile_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an admin can change roles';
    end if;
    if new.subscription_tier is distinct from old.subscription_tier then
      raise exception 'Only an admin can change subscription tiers';
    end if;
    if new.store_id is distinct from old.store_id then
      raise exception 'Only an admin can reassign stores';
    end if;
    if new.total_spent is distinct from old.total_spent then
      new.total_spent := old.total_spent;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_escalation on public.profiles;
create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_escalation();

-- ── Promote yourself to admin ────────────────────────────────────────
-- Run this once with your own email, then sign out and back in:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- Nobody can do this from the app: role changes are rejected unless the
-- caller is already an admin.

-- ── Handy check ──────────────────────────────────────────────────────
-- select email, role, store_id from public.profiles order by joined_at;
